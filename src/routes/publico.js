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

        // Return public data (exclude private fields like CAPI token, internal id)
        const { rastreamento, id: _id, ...publicConsultor } = consultor;

        // Only expose browser-safe tracking IDs (never expose CAPI access token)
        const safeTracking = rastreamento ? {
            meta_pixel_id: rastreamento.meta_pixel_id || null,
            clarity_id: rastreamento.clarity_id || null,
            ga_id: rastreamento.ga_id || null,
            gtm_id: rastreamento.gtm_id || null,
            custom_script: rastreamento.custom_script || null,
        } : null;

        // 5. Fetch the consultant's public links (Linktree style)
        const { rows: linksPublicos } = await pool.query(
            `SELECT titulo, url, icone
             FROM etiquetas_links
             WHERE consultora_id = $1 AND tipo = 'link' AND is_public = TRUE
             ORDER BY criado_em ASC`,
            [consultor.id]
        );

        res.json({
            consultor: { ...publicConsultor, rastreamento: safeTracking },
            depoimentos,
            anamnese_token,
            links: linksPublicos
        });
    } catch (err) {
        console.error('[publico]', err);
        res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
});

// GET /api/publico/settings — public-safe settings (checkout_url, etc)
router.get('/settings', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT valor FROM configuracoes WHERE chave = 'checkout_url' LIMIT 1`
        );
        res.json({ checkout_url: rows[0]?.valor || null });
    } catch {
        res.json({ checkout_url: null });
    }
});

module.exports = router;
