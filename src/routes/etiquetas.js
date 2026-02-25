const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();
router.use(auth, checkSub);

// GET /api/etiquetas
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT e.id, e.nome, e.cor, e.criado_em,
                    COUNT(de.depoimento_id)::int AS total_depoimentos
             FROM etiquetas e
             LEFT JOIN depoimentos_etiquetas de ON de.etiqueta_id = e.id
             WHERE e.consultora_id = $1
             GROUP BY e.id
             ORDER BY e.nome ASC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/etiquetas
router.post('/', async (req, res) => {
    const { nome, cor } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO etiquetas (consultora_id, nome, cor) VALUES ($1, $2, $3) RETURNING *`,
            [req.consultora.id, nome.trim(), cor || '#3b82f6']
        );
        res.status(201).json({ ...rows[0], total_depoimentos: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/etiquetas/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM etiquetas WHERE id=$1 AND consultora_id=$2', [req.params.id, req.consultora.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
