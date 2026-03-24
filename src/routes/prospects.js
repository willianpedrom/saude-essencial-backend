const express = require('express');
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// A API Key deve estar no .env como GOOGLE_MAPS_API_KEY ou GOOGLE_PLACES_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

// GET /api/prospects/search?q=nicho&location=local
router.get('/search', authenticateToken, async (req, res) => {
    const { q } = req.query;

    if (!GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'Configuração do Google Maps ausente no servidor.' });
    }

    if (!q) {
        return res.status(400).json({ error: 'Termo de busca é obrigatório.' });
    }

    try {
        const query = encodeURIComponent(q);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=pt-BR&key=${GOOGLE_API_KEY}`;
        
        const response = await axios.get(url);
        const data = response.data;

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('[Google API Error]', data);
            throw new Error(data.error_message || 'Erro na busca do Google.');
        }

        // Formata os resultados para o frontend
        const results = (data.results || []).map(place => ({
            place_id: place.place_id,
            nome: place.name,
            endereco: place.formatted_address,
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng
        }));

        res.json({ results });
    } catch (err) {
        console.error('[Prospects Search]', err);
        res.status(500).json({ error: 'Falha ao buscar locais no Google.' });
    }
});

// GET /api/prospects/details/:placeId - Busca dados de contato enriquecidos
router.get('/details/:placeId', authenticateToken, async (req, res) => {
    const { placeId } = req.params;
    if (!GOOGLE_API_KEY) return res.status(500).json({ error: 'API Key ausente.' });

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,international_phone_number&language=pt-BR&key=${GOOGLE_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.status !== 'OK') throw new Error(data.error_message || 'Erro nos detalhes do Google.');

        res.json({
            telefone: data.result.formatted_phone_number || data.result.international_phone_number || null,
            website: data.result.website || null
        });
    } catch (err) {
        console.error('[Prospects Details]', err);
        res.status(500).json({ error: 'Erro ao buscar detalhes do local.' });
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

router.post('/', authenticateToken, async (req, res) => {
    const { 
        place_id, nome, endereco, telefone, website, 
        instagram, facebook, email, nicho, rating, user_ratings_total,
        lat, lng 
    } = req.body;
    
    try {
        const { rows } = await pool.query(
            `INSERT INTO prospects 
            (consultora_id, place_id, nome, endereco, telefone, website, instagram, facebook, email, nicho, rating, user_ratings_total, lat, lng) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
            ON CONFLICT (consultora_id, place_id) DO UPDATE SET updated_at = NOW() 
            RETURNING *`,
            [
                req.consultora.id, place_id, nome, endereco, telefone, website, 
                instagram, facebook, email, nicho, rating || 0, user_ratings_total || 0,
                lat, lng
            ]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[Post Prospect Error]', err);
        res.status(500).json({ error: 'Erro ao salvar prospecção no banco de dados.' });
    }
});

// PATCH /api/prospects/:id - Atualiza status ou notas
router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, notas, instagram, facebook, email, telefone, website } = req.body;
    try {
        // Busca o estado atual para comparar
        const current = await pool.query('SELECT status, historico FROM prospects WHERE id = $1 AND consultora_id = $2', [id, req.consultora.id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Prospect não encontrado.' });
        
        const oldStatus = current.rows[0].status;
        const currentHistory = current.rows[0].historico || [];
        
        let newHistory = [...currentHistory];
        if (status && status !== oldStatus) {
            newHistory.push({
                tipo: 'status_change',
                de: oldStatus,
                para: status,
                data: new Date().toISOString()
            });
        }
        if (notas) {
            newHistory.push({
                tipo: 'nota',
                texto: notas,
                data: new Date().toISOString()
            });
        }

        const { rows } = await pool.query(
            `UPDATE prospects 
             SET status = COALESCE($1, status), 
                 notas = COALESCE($2, notas),
                 instagram = COALESCE($3, instagram),
                 facebook = COALESCE($4, facebook),
                 email = COALESCE($5, email),
                 telefone = COALESCE($6, telefone),
                 website = COALESCE($7, website),
                 historico = $8,
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $9 AND consultora_id = $10
             RETURNING *`,
            [
                status || null, 
                notas || null, 
                instagram || null, 
                facebook || null, 
                email || null, 
                telefone || null, 
                website || null, 
                JSON.stringify(newHistory), 
                id, 
                req.consultora.id
            ]
        );
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

// DDL operations for database schema updates (should ideally be in migration scripts)
// Added here based on user instruction to ensure columns and unique constraint exist.
(async () => {
    try {
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8)`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8)`);
        
        // Add unique constraint for ON CONFLICT support
        try {
            await pool.query(`ALTER TABLE prospects ADD CONSTRAINT prospects_consultora_place_unique UNIQUE (consultora_id, place_id)`);
        } catch (e) {
            // If constraint already exists or there's a data violation, log and ignore.
            // This is a common pattern when running DDL idempotently.
            if (!e.message.includes('already exists') && !e.message.includes('could not create unique index')) {
                console.error('Error adding unique constraint:', e.message);
            }
        }
    } catch (err) {
        console.error('Error during database schema setup:', err);
    }
})();

// GET /api/prospects/maps-config - Retorna a chave (publicamente no front restrito)
router.get('/maps-config', authenticateToken, (req, res) => {
    res.json({ apiKey: GOOGLE_API_KEY });
});

module.exports = router;
