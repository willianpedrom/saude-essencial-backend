const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();

// All routes require auth + active subscription
router.use(auth, checkSub);

// GET /api/clientes
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, ativo, criado_em
       FROM clientes
       WHERE consultora_id = $1 AND ativo = TRUE
       ORDER BY nome ASC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM clientes WHERE id = $1 AND consultora_id = $2',
            [req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
});

// POST /api/clientes
router.post('/', async (req, res) => {
    const { nome, email, telefone, cpf, data_nascimento, genero, cidade, notas } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

    try {
        const { rows } = await pool.query(
            `INSERT INTO clientes (consultora_id, nome, email, telefone, cpf, data_nascimento, genero, cidade, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [req.consultora.id, nome, email, telefone, cpf, data_nascimento || null, genero, cidade, notas]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    const { nome, email, telefone, cpf, data_nascimento, genero, cidade, notas } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE clientes
       SET nome=$1, email=$2, telefone=$3, cpf=$4, data_nascimento=$5,
           genero=$6, cidade=$7, notas=$8, atualizado_em=NOW()
       WHERE id=$9 AND consultora_id=$10
       RETURNING *`,
            [nome, email, telefone, cpf, data_nascimento || null, genero, cidade, notas, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
});

// DELETE /api/clientes/:id (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await pool.query(
            'UPDATE clientes SET ativo=FALSE, atualizado_em=NOW() WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover cliente.' });
    }
});

module.exports = router;
