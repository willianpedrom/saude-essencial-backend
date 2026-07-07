const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /api/aulas
// Retorna todos os módulos com suas respectivas aulas para a consultora autenticada
router.get('/', async (req, res) => {
    try {
        const { rows: modulos } = await pool.query(
            'SELECT id, titulo, ordem FROM aulas_modulos ORDER BY ordem ASC, criado_em ASC'
        );
        const { rows: aulas } = await pool.query(
            'SELECT id, modulo_id, titulo, descricao, video_url, duracao, ordem FROM aulas_conteudo ORDER BY ordem ASC, criado_em ASC'
        );
        
        // Mapear as aulas para seus respectivos módulos
        const result = modulos.map(m => ({
            ...m,
            aulas: aulas.filter(a => a.modulo_id === m.id)
        }));
        
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar aulas e estratégias.' });
    }
});

module.exports = router;
