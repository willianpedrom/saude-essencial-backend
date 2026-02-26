const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();

// ── Public routes (no auth) ───────────────────────────────────

// GET /api/depoimentos/public/:slug — consultant info for public form
router.get('/public/:slug', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, foto_url, slug, genero, rastreamento FROM consultoras WHERE slug = $1`,
            [req.params.slug]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/depoimentos/public/:slug — client submits testimonial
router.post('/public/:slug', async (req, res) => {
    const { cliente_nome, cliente_email, texto, nota, consentimento } = req.body;
    if (!cliente_nome || !texto) return res.status(400).json({ error: 'Nome e depoimento são obrigatórios.' });
    if (!consentimento) return res.status(400).json({ error: 'É necessário concordar com os termos para enviar o depoimento.' });

    try {
        const { rows: consultoras } = await pool.query(
            'SELECT id, rastreamento FROM consultoras WHERE slug = $1', [req.params.slug]
        );
        if (consultoras.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        const { id: consultora_id, rastreamento } = consultoras[0];
        const { rows } = await pool.query(
            `INSERT INTO depoimentos (consultora_id, cliente_nome, cliente_email, texto, nota, aprovado, consentimento, origem)
             VALUES ($1, $2, $3, $4, $5, FALSE, $6, 'link') RETURNING id`,
            [consultora_id, cliente_nome, cliente_email || null, texto, Math.min(10, Math.max(0, parseInt(nota) || 10)), !!consentimento]
        );

        // Fire Meta CAPI 'CompleteRegistration' (non-blocking)
        try {
            const tracking = rastreamento || {};
            if (tracking.meta_pixel_id && tracking.meta_pixel_token) {
                const { sendMetaEvent } = require('../lib/metaCapi');
                sendMetaEvent(
                    tracking.meta_pixel_id,
                    tracking.meta_pixel_token,
                    'CompleteRegistration',
                    {
                        clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'],
                    }
                ).catch(() => { });
            }
        } catch { /* CAPI failure never blocks the response */ }

        res.status(201).json({ success: true, id: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Authenticated routes ──────────────────────────────────────
router.use(auth, checkSub);

// GET /api/depoimentos — list with tags
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT d.*, 
                    COALESCE(
                        json_agg(json_build_object('id', e.id, 'nome', e.nome, 'cor', e.cor))
                        FILTER (WHERE e.id IS NOT NULL), '[]'
                    ) AS etiquetas
             FROM depoimentos d
             LEFT JOIN depoimentos_etiquetas de ON de.depoimento_id = d.id
             LEFT JOIN etiquetas e ON e.id = de.etiqueta_id
             WHERE d.consultora_id = $1
             GROUP BY d.id
             ORDER BY d.criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/depoimentos/link — returns consultant's public link info
router.get('/link', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT slug FROM consultoras WHERE id = $1', [req.consultora.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        res.json({ slug: rows[0].slug });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/depoimentos — create manually
router.post('/', async (req, res) => {
    const { cliente_nome, cliente_email, texto, nota, consentimento } = req.body;
    if (!cliente_nome || !texto) return res.status(400).json({ error: 'Nome e depoimento são obrigatórios.' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO depoimentos (consultora_id, cliente_nome, cliente_email, texto, nota, aprovado, consentimento, origem)
             VALUES ($1, $2, $3, $4, $5, TRUE, $6, 'manual') RETURNING *`,
            [req.consultora.id, cliente_nome, cliente_email || null, texto, Math.min(10, Math.max(0, parseInt(nota) || 10)), !!consentimento]
        );
        res.status(201).json({ ...rows[0], etiquetas: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/depoimentos/:id/aprovar — approve or reject
router.patch('/:id/aprovar', async (req, res) => {
    const { aprovado } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE depoimentos SET aprovado=$1 WHERE id=$2 AND consultora_id=$3 RETURNING id, aprovado`,
            [!!aprovado, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Depoimento não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/depoimentos/:id/etiquetas — set tags for a testimonial
router.patch('/:id/etiquetas', async (req, res) => {
    const { etiqueta_ids = [] } = req.body;
    try {
        // Verify ownership
        const { rows: dep } = await pool.query(
            'SELECT id FROM depoimentos WHERE id=$1 AND consultora_id=$2', [req.params.id, req.consultora.id]
        );
        if (dep.length === 0) return res.status(404).json({ error: 'Depoimento não encontrado.' });

        // Replace all tags
        await pool.query('DELETE FROM depoimentos_etiquetas WHERE depoimento_id=$1', [req.params.id]);
        if (etiqueta_ids.length > 0) {
            const values = etiqueta_ids.map((eid, i) => `($1, $${i + 2})`).join(',');
            await pool.query(
                `INSERT INTO depoimentos_etiquetas (depoimento_id, etiqueta_id) VALUES ${values}`,
                [req.params.id, ...etiqueta_ids]
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/depoimentos/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM depoimentos WHERE id=$1 AND consultora_id=$2', [req.params.id, req.consultora.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
