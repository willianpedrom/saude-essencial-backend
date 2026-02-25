const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// ── Admin guard middleware ──────────────────────────────────────
router.use(auth, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        if (!rows[0] || rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Acesso restrito a administradores.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Erro de autenticação.' });
    }
});

// GET /api/admin/users — list all consultoras with subscription info
router.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.id, c.nome, c.email, c.telefone, c.role, c.foto_url,
              c.criado_em, c.atualizado_em,
              a.plano, a.status AS plano_status, a.trial_fim, a.periodo_fim,
              (SELECT COUNT(*) FROM clientes cl WHERE cl.consultora_id = c.id)  AS total_clientes,
              (SELECT COUNT(*) FROM anamneses an WHERE an.consultora_id = c.id) AS total_anamneses
              FROM consultoras c
              LEFT JOIN assinaturas a ON a.consultora_id = c.id
                AND a.criado_em = (SELECT MAX(criado_em) FROM assinaturas WHERE consultora_id = c.id)
              ORDER BY c.criado_em ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

// PUT /api/admin/users/:id — edit consultora data + role
router.put('/users/:id', async (req, res) => {
    const { nome, email, telefone, role } = req.body;
    // Prevent removing own admin role
    if (req.params.id === req.consultora.id && role !== 'admin') {
        return res.status(400).json({ error: 'Você não pode remover seu próprio acesso de administrador.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE consultoras SET nome=$1, email=$2, telefone=$3, role=$4, atualizado_em=NOW()
             WHERE id=$5
             RETURNING id, nome, email, telefone, role`,
            [nome, email, telefone || null, role || 'user', req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true, consultora: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// PUT /api/admin/users/:id/plan — update subscription plan
router.put('/users/:id/plan', async (req, res) => {
    const { plano, status } = req.body;
    try {
        // Upsert: update most recent subscription or insert new one
        const existing = await pool.query(
            'SELECT id FROM assinaturas WHERE consultora_id=$1 ORDER BY criado_em DESC LIMIT 1',
            [req.params.id]
        );
        if (existing.rows.length > 0) {
            await pool.query(
                'UPDATE assinaturas SET plano=$1, status=$2 WHERE id=$3',
                [plano, status, existing.rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO assinaturas (consultora_id, plano, status) VALUES ($1, $2, $3)',
                [req.params.id, plano, status]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
});

// DELETE /api/admin/users/:id — delete consultora + all their data
router.delete('/users/:id', async (req, res) => {
    if (req.params.id === req.consultora.id) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }
    try {
        await pool.query('DELETE FROM consultoras WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

module.exports = router;
