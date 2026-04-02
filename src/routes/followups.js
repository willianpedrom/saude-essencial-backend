const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();
router.use(auth, checkSub);

// GET /api/followups  — lista todos os follow-ups da consultora
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT f.id, f.nota, f.due_date_time, f.status, f.criado_em, f.atualizado_em,
                    f.cliente_id,
                    c.nome  AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    c.email AS cliente_email
             FROM followups f
             LEFT JOIN clientes c ON c.id = f.cliente_id
             WHERE f.consultora_id = $1
             ORDER BY
               CASE f.status WHEN 'pending' THEN 0 ELSE 1 END,
               f.due_date_time ASC NULLS LAST`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar follow-ups.' });
    }
});

// POST /api/followups  — criar novo follow-up
router.post('/', async (req, res) => {
    const { cliente_id, nota, due_date_time } = req.body;
    if (!nota || !nota.trim()) {
        return res.status(400).json({ error: 'Nota é obrigatória.' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO followups (consultora_id, cliente_id, nota, due_date_time)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.consultora.id, cliente_id || null, nota.trim(), due_date_time || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar follow-up.' });
    }
});
// PUT /api/followups/:id — atualizar follow-up completo
router.put('/:id', async (req, res) => {
    const { cliente_id, nota, due_date_time } = req.body;
    if (!nota || !nota.trim()) {
        return res.status(400).json({ error: 'Nota é obrigatória.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE followups
             SET cliente_id = $1, nota = $2, due_date_time = $3, atualizado_em = NOW()
             WHERE id = $4 AND consultora_id = $5
             RETURNING *`,
            [cliente_id || null, nota.trim(), due_date_time || null, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Follow-up não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar follow-up.' });
    }
});
// PATCH /api/followups/:id/status  — marcar como concluído ou reabrir
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!['pending', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use "pending" ou "done".' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE followups
             SET status = $1, atualizado_em = NOW()
             WHERE id = $2 AND consultora_id = $3
             RETURNING *`,
            [status, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Follow-up não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
});

// DELETE /api/followups/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM followups WHERE id = $1 AND consultora_id = $2',
            [req.params.id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover follow-up.' });
    }
});

module.exports = router;
