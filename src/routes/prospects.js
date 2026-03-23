const express = require('express');
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// A API Key deve estar no .env como GOOGLE_MAPS_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// GET /api/prospects/search?q=nicho&location=local
router.get('/search', authenticateToken, async (req, res) => {
    const { q, location } = req.query;

    if (!GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'Configuração do Google Maps ausente no servidor.' });
    }

    if (!q || !location) {
        return res.status(400).json({ error: 'Nicho e Localização são obrigatórios.' });
    }

    try {
        const query = encodeURIComponent(`${q} em ${location}`);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=pt-BR&key=${GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('[Google API Error]', data);
            throw new Error(data.error_message || 'Erro na busca do Google.');
        }

        // Formata os resultados para o frontend
        const results = (data.results || []).map(place => ({
            place_id: place.place_id,
            nome: place.name,
            endereco: place.formatted_address,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            // A API de TextSearch não traz telefone e website de cara, 
            // seria necessário um Place Details para cada, o que encarece. 
            // Vamos deixar o frontend pedir o detalhe se o usuário clicar.
        }));

        res.json({ results });
    } catch (err) {
        console.error('[Prospects Search]', err);
        res.status(500).json({ error: 'Falha ao buscar locais no Google.' });
    }
});

// GET /api/prospects - Lista prospecções salvas da consultora
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM prospects WHERE consultora_id = $1 ORDER BY criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[Get Prospects]', err);
        res.status(500).json({ error: 'Erro ao buscar sua lista de prospecção.' });
    }
});

// POST /api/prospects - Salva um novo prospect
router.post('/', authenticateToken, async (req, res) => {
    const { nome, place_id, endereco, telefone, website, nicho } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO prospects (consultora_id, nome, place_id, endereco, telefone, website, nicho)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [req.consultora.id, nome, place_id, endereco, telefone, website, nicho]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[Post Prospect]', err);
        res.status(500).json({ error: 'Erro ao salvar prospecção.' });
    }
});

// PATCH /api/prospects/:id - Atualiza status ou notas
router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, notas } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE prospects 
             SET status = COALESCE($1, status), 
                 notas = COALESCE($2, notas),
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $3 AND consultora_id = $4
             RETURNING *`,
            [status, notas, id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Prospect não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[Update Prospect]', err);
        res.status(500).json({ error: 'Erro ao atualizar prospecção.' });
    }
});

// DELETE /api/prospects/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            `DELETE FROM prospects WHERE id = $1 AND consultora_id = $2`,
            [id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[Delete Prospect]', err);
        res.status(500).json({ error: 'Erro ao remover prospecção.' });
    }
});

module.exports = router;
