const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /api/avisos/nao-lidos
// Retorna avisos que a consultora atual ainda não leu e que são para exibição "modal" ou "ambos"
router.get('/nao-lidos', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.titulo, a.mensagem, a.tipo, a.exibicao, a.criado_em 
             FROM avisos_sistema a
             LEFT JOIN avisos_lidos l ON a.id = l.aviso_id AND l.consultora_id = $1
             WHERE a.ativo = TRUE 
               AND (a.exibicao = 'modal' OR a.exibicao = 'ambos')
               AND l.id IS NULL
             ORDER BY a.criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar avisos não lidos.' });
    }
});

// GET /api/avisos/banner
// Retorna avisos ativos que são configurados como "banner" ou "ambos", lidos ou não.
router.get('/banner', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, titulo, mensagem, tipo, exibicao, criado_em 
             FROM avisos_sistema
             WHERE ativo = TRUE AND (exibicao = 'banner' OR exibicao = 'ambos')
             ORDER BY criado_em DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar avisos de banner.' });
    }
});

// POST /api/avisos/:id/lidos
// Marca um aviso como lido pela consultora logada
router.post('/:id/lido', async (req, res) => {
    const aviso_id = req.params.id;
    try {
        await pool.query(
            `INSERT INTO avisos_lidos (aviso_id, consultora_id) 
             VALUES ($1, $2) 
             ON CONFLICT (aviso_id, consultora_id) DO NOTHING`,
            [aviso_id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao marcar aviso como lido.' });
    }
});

module.exports = router;
