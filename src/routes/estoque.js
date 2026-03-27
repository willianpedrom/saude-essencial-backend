const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Aplica autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/estoque - Retorna o estoque da consultora logada
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM estoque 
             WHERE consultora_id = $1 
             ORDER BY nome_produto ASC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[Estoque GET]', err);
        res.status(500).json({ error: 'Erro ao carregar estoque.' });
    }
});

// POST /api/estoque - Adiciona um novo produto ao estoque
router.post('/', async (req, res) => {
    const { nome_produto, categoria, quantidade, ml_tamanho, notas } = req.body;
    
    if (!nome_produto) {
        return res.status(400).json({ error: 'Nome do produto é obrigatório.' });
    }

    try {
        // Verifica se já existe o exato mesmo produto e tamanho no estoque da consultora
        const existing = await pool.query(
            `SELECT id, quantidade FROM estoque 
             WHERE consultora_id = $1 AND nome_produto = $2 AND COALESCE(ml_tamanho, '') = COALESCE($3, '')`,
            [req.consultora.id, nome_produto, ml_tamanho]
        );

        if (existing.rows.length > 0) {
            // Atualiza somando a quantidade
            const id = existing.rows[0].id;
            const newQtd = existing.rows[0].quantidade + (Number(quantidade) || 1);
            
            const updated = await pool.query(
                `UPDATE estoque 
                 SET quantidade = $1, notas = $2, atualizado_em = NOW() 
                 WHERE id = $3 RETURNING *`,
                [newQtd, notas, id]
            );
            return res.json(updated.rows[0]);
        }

        // Se não existir, insere novo registro
        const { rows } = await pool.query(
            `INSERT INTO estoque 
            (consultora_id, nome_produto, categoria, quantidade, ml_tamanho, notas)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [req.consultora.id, nome_produto, categoria || 'Óleo Essencial', Number(quantidade) || 0, ml_tamanho, notas]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[Estoque POST]', err);
        res.status(500).json({ error: 'Erro ao adicionar ao estoque.' });
    }
});

// PUT /api/estoque/:id - Atualiza especificamente a quantidade ou detalhes do estoque
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { quantidade, notas } = req.body;

    try {
        const { rows } = await pool.query(
            `UPDATE estoque 
             SET quantidade = COALESCE($1, quantidade), 
                 notas = COALESCE($2, notas),
                 atualizado_em = NOW()
             WHERE id = $3 AND consultora_id = $4
             RETURNING *`,
            [quantidade, notas, id, req.consultora.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado no estoque.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('[Estoque PUT]', err);
        res.status(500).json({ error: 'Erro ao atualizar produto do estoque.' });
    }
});

// DELETE /api/estoque/:id - Remove do estoque
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { rowCount } = await pool.query(
            `DELETE FROM estoque WHERE id = $1 AND consultora_id = $2`,
            [id, req.consultora.id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('[Estoque DELETE]', err);
        res.status(500).json({ error: 'Erro ao remover produto do estoque.' });
    }
});

module.exports = router;
