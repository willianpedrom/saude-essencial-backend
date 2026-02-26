const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/publico/perfil/:slug
// Public consultant profile — no auth required
router.get('/perfil/:slug', async (req, res) => {
    try {
        // 1. Fetch consultant's public data
        const { rows: consultorRows } = await pool.query(
            `SELECT id, nome, foto_url, bio, slug, telefone, genero,
              instagram, youtube, facebook, linkedin, doterra_nivel,
              rastreamento
             FROM consultoras WHERE slug = $1`,
            [req.params.slug]
        );
        if (consultorRows.length === 0) {
            return res.status(404).json({ error: 'Consultor não encontrado.' });
        }
        const consultor = consultorRows[0];

        // 2. Fetch approved testimonials (max 12, most recent)
        const { rows: depoimentos } = await pool.query(
            `SELECT cliente_nome, texto, nota, criado_em
             FROM depoimentos
             WHERE consultora_id = $1 AND aprovado = TRUE
             ORDER BY criado_em DESC LIMIT 12`,
            [consultor.id]
        );

        // 3. Fetch the consultant's generic anamnesis token (for the CTA link)
        const { rows: anamneseRows } = await pool.query(
            `SELECT token_publico FROM anamneses
             WHERE consultora_id = $1 AND subtipo = 'generico' AND preenchido = FALSE
             ORDER BY criado_em DESC LIMIT 1`,
            [consultor.id]
        );
        const anamnese_token = anamneseRows[0]?.token_publico || null;

        // 4. Fire Meta CAPI ViewContent (page view on public profile - non-blocking)
        try {
            const tracking = consultor.rastreamento || {};
            if (tracking.meta_pixel_id && tracking.meta_pixel_token) {
                const { sendMetaEvent } = require('../lib/metaCapi');
                sendMetaEvent(
                    tracking.meta_pixel_id,
                    tracking.meta_pixel_token,
                    'ViewContent',
                    {
                        clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        pageUrl: req.headers.referer,
                    }
                ).catch(() => { });
            }
        } catch { /* never block */ }

        // Return public data (exclude private fields like rastreamento token, id)
        const { rastreamento: _r, id: _id, ...publicConsultor } = consultor;

        res.json({
            consultor: publicConsultor,
            depoimentos,
            anamnese_token,
        });
    } catch (err) {
        console.error('[publico]', err);
        res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
});

module.exports = router;
