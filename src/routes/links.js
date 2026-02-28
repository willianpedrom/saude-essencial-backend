const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();

router.use(auth, checkSub);

// GET /api/links — listar links da consultora
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, titulo, url, icone, is_public, ordem, criado_em 
             FROM consultora_links 
             WHERE consultora_id = $1 
             ORDER BY ordem ASC, criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar links.' });
    }
});

// POST /api/links — criar novo link
router.post('/', async (req, res) => {
    const { titulo, url, icone, is_public = true } = req.body;
    if (!titulo || !url) {
        return res.status(400).json({ error: 'Título e URL são obrigatórios.' });
    }

    // Auto-fix missing protocol
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO consultora_links (consultora_id, titulo, url, icone, is_public)
             VALUES ($1, $2, $3, $4, COALESCE($5, TRUE))
             RETURNING id, titulo, url, icone, is_public, ordem, criado_em`,
            [req.consultora.id, titulo, finalUrl, icone || '🔗', is_public]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar link.' });
    }
});

// PUT /api/links/:id — atualizar link
router.put('/:id', async (req, res) => {
    const { titulo, url, icone, is_public } = req.body;

    let finalUrl = url;
    if (url && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }

    try {
        const { rows } = await pool.query(
            `UPDATE consultora_links 
             SET titulo=$1, url=$2, icone=$3, is_public=$4, atualizado_em=NOW()
             WHERE id=$5 AND consultora_id=$6
             RETURNING id, titulo, url, icone, is_public, ordem, criado_em`,
            [titulo, finalUrl, icone, is_public, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Link não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar link.' });
    }
});

// POST /api/links/reorder — atualizar ordem
router.post('/reorder', async (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Lista inválida.' });

    try {
        await pool.query('BEGIN');
        for (let i = 0; i < orderedIds.length; i++) {
            await pool.query(
                'UPDATE consultora_links SET ordem = $1 WHERE id = $2 AND consultora_id = $3',
                [i, orderedIds[i], req.consultora.id]
            );
        }
        await pool.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao reordenar links.' });
    }
});

// DELETE /api/links/:id
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM consultora_links WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Link não encontrado.' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir link.' });
    }
});

module.exports = router;
