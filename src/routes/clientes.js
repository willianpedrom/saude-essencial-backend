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
        // Permite filtrar por status (?ativo=true ou ?ativo=false). Se não passar, retorna todos.
        let queryStr = `
            SELECT id, nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, ativo, status,
                   pipeline_stage, pipeline_notas, criado_em
            FROM clientes
            WHERE consultora_id = $1
        `;
        const queryParams = [req.consultora.id];
        
        if (req.query.ativo !== undefined) {
            queryStr += ` AND ativo = $2`;
            queryParams.push(req.query.ativo === 'true');
        }

        queryStr += ` ORDER BY nome ASC`;

        const { rows } = await pool.query(queryStr, queryParams);
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
    const { nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, status } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

    try {
        const { rows } = await pool.query(
            `INSERT INTO clientes (consultora_id, nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
            [req.consultora.id, nome, email, telefone, cpf, data_nascimento || null, genero, cidade, notas, status || 'active']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    const { nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, status } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE clientes
       SET nome=$1, email=$2, telefone=$3, cpf=$4, data_nascimento=$5,
           genero=$6, cidade=$7, notas=$8, status=$9, atualizado_em=NOW()
       WHERE id=$10 AND consultora_id=$11
       RETURNING *`,
            [nome, email, telefone, cpf, data_nascimento || null, genero, cidade, notas,
                status || 'active', req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
});

// PATCH /api/clientes/:id/stage
router.patch('/:id/stage', async (req, res) => {
    const { stage, notas } = req.body;
    const VALID_STAGES = ['lead_captado', 'primeiro_contato', 'interesse_confirmado',
        'protocolo_apresentado', 'proposta_enviada', 'negociando', 'primeira_compra', 'perdido'];
    if (!stage || !VALID_STAGES.includes(stage)) {
        return res.status(400).json({ error: 'Estágio inválido.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE clientes
         SET pipeline_stage=$1, pipeline_notas=COALESCE($2, pipeline_notas), atualizado_em=NOW()
         WHERE id=$3 AND consultora_id=$4
         RETURNING id, nome, pipeline_stage, pipeline_notas`,
            [stage, notas || null, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar estágio.' });
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
