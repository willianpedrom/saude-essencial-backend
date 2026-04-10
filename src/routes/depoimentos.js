const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');
const publicoRouter = require('./publico');

const router = express.Router();

// ── Public routes (no auth) ───────────────────────────────────

// ── EXECUTOR DE MIGRAÇÃO REMOTA (Temporário) ──
router.get('/public-fix-db', async (req, res) => {
    try {
        let logs = [];
        
        // 1. ADD MISSING COLUMN (THE CORE FIX!)
        await pool.query('ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();');
        await pool.query('ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT \'cliente\';');
        await pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS video_apresentacao TEXT;');
        await pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS video_cta_texto VARCHAR(100);');
        await pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS video_cta_link TEXT;');
        logs.push('Colunas iterativas do video adicionadas com sucesso.');
        
        // 2. FIX DUPLICATE SLUGS
        const { rows } = await pool.query(`SELECT slug, COUNT(*) FROM consultoras GROUP BY slug HAVING COUNT(*) > 1`);
        for (const row of rows) {
            const { rows: cons } = await pool.query('SELECT id, nome, email FROM consultoras WHERE slug = $1 ORDER BY criado_em ASC', [row.slug]);
            for (let i = 1; i < cons.length; i++) {
                const c = cons[i];
                const newSlug = `${row.slug}-${Date.now().toString(36)}`;
                await pool.query('UPDATE consultoras SET slug = $1 WHERE id = $2', [newSlug, c.id]);
                logs.push(`Slug de ${c.email} alterado para ${newSlug} para evitar conflito com ${row.slug}`);
            }
        }
        
        // 3. SET UNIQUE CONSTRAINT ON SLUGS
        try {
            await pool.query('ALTER TABLE consultoras ADD CONSTRAINT consultoras_slug_key UNIQUE (slug);');
            logs.push('Constraint UNIQUE adicionada em consultoras.slug');
        } catch (e) {
            logs.push('A Constraint UNIQUE já existia ou houve erro: ' + e.message);
        }

        res.json({ success: true, logs });
    } catch(err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// GET /api/depoimentos/public/:slug — consultant info for public form
router.get('/public/:slug', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, foto_url, slug, genero, rastreamento FROM consultoras WHERE slug = $1`,
            [req.params.slug]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        const row = rows[0];
        // Only expose browser-safe tracking IDs (never expose CAPI access token)
        if (row.rastreamento) {
            const r = row.rastreamento;
            row.rastreamento = {
                meta_pixel_id: r.meta_pixel_id || null,
                clarity_id: r.clarity_id || null,
                ga_id: r.ga_id || null,
                gtm_id: r.gtm_id || null,
                custom_script: r.custom_script || null,
            };
        }
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/depoimentos/public/:slug/lista — public listing of approved testimonials
router.get('/public/:slug/lista', async (req, res) => {
    try {
        const { rows: consultoras } = await pool.query(
            'SELECT id FROM consultoras WHERE slug = $1', [req.params.slug]
        );
        if (consultoras.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        const { rows } = await pool.query(
            `SELECT cliente_nome, texto, nota, criado_em,
                    COALESCE(json_agg(json_build_object('id', e.id, 'nome', e.nome, 'cor', e.cor))
                        FILTER (WHERE e.id IS NOT NULL), '[]') AS etiquetas
             FROM depoimentos d
             LEFT JOIN depoimentos_etiquetas de ON de.depoimento_id = d.id
             LEFT JOIN etiquetas e ON e.id = de.etiqueta_id
             WHERE d.consultora_id = $1 AND d.aprovado = TRUE AND d.consentimento = TRUE
             GROUP BY d.id
             ORDER BY d.criado_em DESC`,
            [consultoras[0].id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/depoimentos/public/:slug — client submits testimonial
router.post('/public/:slug', async (req, res) => {
    const { cliente_nome, cliente_email, cliente_telefone, texto, nota, consentimento } = req.body;
    if (!cliente_nome || !texto || !cliente_email || !cliente_telefone) return res.status(400).json({ error: 'Nome, E-mail, Telefone e Depoimento são obrigatórios.' });
    if (!consentimento) return res.status(400).json({ error: 'É necessário concordar com os termos para enviar o depoimento.' });

    try {
        const { rows: consultoras } = await pool.query(
            'SELECT id, rastreamento FROM consultoras WHERE slug = $1', [req.params.slug]
        );
        if (consultoras.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        const { id: consultora_id, rastreamento } = consultoras[0];
        const { rows } = await pool.query(
            `INSERT INTO depoimentos (consultora_id, cliente_nome, cliente_email, cliente_telefone, texto, nota, aprovado, consentimento, origem, tipo)
             VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, 'link', 'cliente') RETURNING id`,
            [consultora_id, cliente_nome, cliente_email, cliente_telefone, texto, Math.min(10, Math.max(0, parseInt(nota) || 10)), !!consentimento]
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
                    d.tipo,
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
    const { cliente_nome, cliente_email, cliente_telefone, texto, nota, consentimento } = req.body;
    if (!cliente_nome || !texto) return res.status(400).json({ error: 'Nome e depoimento são obrigatórios.' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO depoimentos (consultora_id, cliente_nome, cliente_email, cliente_telefone, texto, nota, aprovado, consentimento, origem, tipo)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, 'manual', 'cliente') RETURNING *`,
            [req.consultora.id, cliente_nome, cliente_email || null, cliente_telefone || null, texto, Math.min(10, Math.max(0, parseInt(nota) || 10)), !!consentimento]
        );
        if (publicoRouter.publicCache) publicoRouter.publicCache.flushAll(); // Limpa cache para refletir imediatamente
        res.status(201).json({ ...rows[0], etiquetas: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/depoimentos/:id/aprovar — approve or reject
router.patch('/:id/aprovar', async (req, res) => {
    const { aprovado } = req.body;
    try {
        console.log(`[DEBUG] Tentando aprovar depoimento ID: ${req.params.id} para consultora: ${req.consultora.id}`);
        // Verifica oq tem no banco primeiro
        const check = await pool.query('SELECT consultora_id, origem FROM depoimentos WHERE id=$1', [req.params.id]);
        console.log(`[DEBUG] No banco, o depoimento tem:`, check.rows[0]);

        const { rows } = await pool.query(
            `UPDATE depoimentos SET aprovado=$1 WHERE id=$2 AND consultora_id=$3 RETURNING id, aprovado`,
            [!!aprovado, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) {
            console.log(`[DEBUG] Falhou ao atualizar. affectedRows = 0`);
            return res.status(404).json({ error: 'Depoimento não encontrado ou não pertence a você.' });
        }
        if (publicoRouter.publicCache) publicoRouter.publicCache.flushAll();
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/depoimentos/:id/tipo — change category
router.patch('/:id/tipo', async (req, res) => {
    const { tipo } = req.body;
    if (!['cliente', 'lideranca'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido.' });
    
    try {
        const { rows } = await pool.query(
            `UPDATE depoimentos SET tipo=$1 WHERE id=$2 AND consultora_id=$3 RETURNING id, tipo`,
            [tipo, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Depoimento não encontrado.' });
        if (publicoRouter.publicCache) publicoRouter.publicCache.flushAll();
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
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
        if (publicoRouter.publicCache) publicoRouter.publicCache.flushAll();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
