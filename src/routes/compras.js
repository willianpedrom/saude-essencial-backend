const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// GET /api/compras — listar todas as vendas da consultora
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT v.*, c.nome AS cliente_nome
             FROM vendas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             WHERE v.consultora_id = $1
             ORDER BY v.data DESC, v.criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/compras/cliente/:clienteId — compras de um cliente específico
router.get('/cliente/:clienteId', authMiddleware, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT v.*, c.nome AS cliente_nome
             FROM vendas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             WHERE v.consultora_id = $1
               AND (v.cliente_id = $2 OR (
                 c.email IS NOT NULL AND c.email <> '' AND
                 c.email = (SELECT email FROM clientes WHERE id = $2 AND consultora_id = $1)
               ))
             ORDER BY v.data DESC, v.criado_em DESC`,
            [req.consultora.id, req.params.clienteId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// POST /api/compras — registrar nova compra
router.post('/', authMiddleware, async (req, res, next) => {
    const { cliente_id, produto, valor, data, observacao } = req.body;
    if (!produto) return res.status(400).json({ error: 'Produto é obrigatório.' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO vendas (consultora_id, cliente_id, produto, valor, data, observacao)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.consultora.id, cliente_id || null, produto, Number(valor) || 0,
             data || new Date().toISOString().slice(0, 10), observacao || null]
        );
        // Buscar nome do cliente para retorno completo
        let result = rows[0];
        if (result.cliente_id) {
            const c = await pool.query('SELECT nome FROM clientes WHERE id=$1', [result.cliente_id]);
            result.cliente_nome = c.rows[0]?.nome || null;
        }
        res.status(201).json(result);
    } catch (err) { next(err); }
});

// PUT /api/compras/:id — atualizar compra
router.put('/:id', authMiddleware, async (req, res, next) => {
    const { produto, valor, data, observacao } = req.body;
    if (!produto) return res.status(400).json({ error: 'Produto é obrigatório.' });
    try {
        const { rows } = await pool.query(
            `UPDATE vendas
             SET produto=$1, valor=$2, data=$3, observacao=$4
             WHERE id=$5 AND consultora_id=$6
             RETURNING *`,
            [produto, Number(valor) || 0, data || null, observacao || null,
             req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Compra não encontrada.' });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// DELETE /api/compras/:id — excluir compra
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const { rowCount } = await pool.query(
            'DELETE FROM vendas WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Compra não encontrada.' });
        res.json({ success: true });
    } catch (err) { next(err); }
});

module.exports = router;
