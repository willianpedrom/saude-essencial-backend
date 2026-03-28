const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/estoque
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM estoque WHERE consultora_id = $1 ORDER BY nome_produto ASC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[Estoque GET]', err);
        res.status(500).json({ error: 'Erro ao carregar estoque.' });
    }
});

// POST /api/estoque
router.post('/', async (req, res) => {
    const { nome_produto, categoria, quantidade, ml_tamanho, notas, validade, preco_custo, uso_tipo } = req.body;
    if (!nome_produto) return res.status(400).json({ error: 'Nome do produto é obrigatório.' });

    try {
        // Se o mesmo produto+tamanho+validade+uso já existir, soma a quantidade
        const existing = await pool.query(
            `SELECT id, quantidade FROM estoque 
             WHERE consultora_id = $1 
               AND nome_produto = $2 
               AND COALESCE(ml_tamanho,'') = COALESCE($3,'')
               AND COALESCE(validade::text,'') = COALESCE($4::text,'')
               AND COALESCE(uso_tipo,'venda') = COALESCE($5,'venda')`,
            [req.consultora.id, nome_produto, ml_tamanho, validade || null, uso_tipo || 'venda']
        );

        if (existing.rows.length > 0) {
            const id = existing.rows[0].id;
            const newQtd = existing.rows[0].quantidade + (Number(quantidade) || 1);
            const updated = await pool.query(
                `UPDATE estoque 
                 SET quantidade=$1, notas=COALESCE($2, notas), preco_custo=COALESCE($3, preco_custo), atualizado_em=NOW()
                 WHERE id=$4 RETURNING *`,
                [newQtd, notas, preco_custo || null, id]
            );
            return res.json(updated.rows[0]);
        }

        const { rows } = await pool.query(
            `INSERT INTO estoque (consultora_id, nome_produto, categoria, quantidade, ml_tamanho, notas, validade, preco_custo, uso_tipo)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [req.consultora.id, nome_produto, categoria || 'Óleo Essencial',
             Number(quantidade) || 0, ml_tamanho, notas,
             validade || null, preco_custo || null, uso_tipo || 'venda']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[Estoque POST]', err);
        res.status(500).json({ error: 'Erro ao salvar no estoque.' });
    }
});

// PUT /api/estoque/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { quantidade, notas, validade, preco_custo, uso_tipo, nome_produto, categoria, ml_tamanho } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE estoque SET
               quantidade  = COALESCE($1, quantidade),
               notas       = COALESCE($2, notas),
               validade    = COALESCE($3, validade),
               preco_custo = COALESCE($4, preco_custo),
               uso_tipo    = COALESCE($5, uso_tipo),
               nome_produto= COALESCE($6, nome_produto),
               categoria   = COALESCE($7, categoria),
               ml_tamanho  = COALESCE($8, ml_tamanho),
               atualizado_em = NOW()
             WHERE id=$9 AND consultora_id=$10 RETURNING *`,
            [quantidade, notas, validade || null, preco_custo || null, uso_tipo,
             nome_produto, categoria, ml_tamanho, id, req.consultora.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[Estoque PUT]', err);
        res.status(500).json({ error: 'Erro ao atualizar estoque.' });
    }
});

// DELETE /api/estoque/:id
router.delete('/:id', async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            `DELETE FROM estoque WHERE id=$1 AND consultora_id=$2`,
            [req.params.id, req.consultora.id]
        );
        if (!rowCount) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json({ success: true });
    } catch (err) {
        console.error('[Estoque DELETE]', err);
        res.status(500).json({ error: 'Erro ao apagar produto.' });
    }
});

module.exports = router;
