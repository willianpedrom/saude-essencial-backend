const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();
router.use(auth, checkSub);

// GET /api/agendamentos
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.titulo, a.data_hora, a.tipo, a.status, a.notas,
              c.nome AS cliente_nome
       FROM agendamentos a
       LEFT JOIN clientes c ON c.id = a.cliente_id
       WHERE a.consultora_id = $1
       ORDER BY a.data_hora ASC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
});

// POST /api/agendamentos
router.post('/', async (req, res) => {
    const { cliente_id, titulo, data_hora, tipo, notas } = req.body;
    if (!data_hora) return res.status(400).json({ error: 'Data/hora é obrigatória.' });

    try {
        const { rows } = await pool.query(
            `INSERT INTO agendamentos (consultora_id, cliente_id, titulo, data_hora, tipo, notas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [req.consultora.id, cliente_id || null, titulo, data_hora, tipo || 'consulta', notas]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar agendamento.' });
    }
});

// PUT /api/agendamentos/:id
router.put('/:id', async (req, res) => {
    const { titulo, data_hora, tipo, status, notas } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE agendamentos
       SET titulo=$1, data_hora=$2, tipo=$3, status=$4, notas=$5
       WHERE id=$6 AND consultora_id=$7
       RETURNING *`,
            [titulo, data_hora, tipo, status, notas, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Agendamento não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar agendamento.' });
    }
});

// DELETE /api/agendamentos/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM agendamentos WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover agendamento.' });
    }
});

module.exports = router;
