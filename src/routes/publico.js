const express = require('express');
const pool = require('../db/pool');
const NodeCache = require('node-cache');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 180 }); // 3 minutos (Absorve dezenas de acessos em massa, sem engessar a edição)

// GET /api/publico/perfil/:slug
// Public consultant profile — no auth required
router.get('/perfil/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const cacheKey = `perfil_${slug}`;
        
        let responseData = cache.get(cacheKey);

        if (!responseData) {
            // 1. Fetch consultant's public data
        const { rows: consultorRows } = await pool.query(
            `SELECT id, nome, foto_url, bio, slug, telefone, genero,
              instagram, youtube, facebook, linkedin, doterra_nivel,
              rastreamento, tema_cor, video_apresentacao, video_cta_texto, video_cta_link
             FROM consultoras WHERE slug = $1`,
            [req.params.slug]
        );
        if (consultorRows.length === 0) {
            return res.status(404).json({ error: 'Consultor não encontrado.' });
        }
        const consultor = consultorRows[0];

        // 2. Fetch approved testimonials (max 12, most recent)
        const { rows: depoimentos } = await pool.query(
            `SELECT cliente_nome, texto, nota, criado_em, tipo
             FROM depoimentos
             WHERE consultora_id = $1 AND aprovado = TRUE
             ORDER BY criado_em DESC LIMIT 12`,
            [consultor.id]
        );

        // 3. Fetch the consultant's generic anamnesis token (for the CTA link)
        let { rows: anamneseRows } = await pool.query(
            `SELECT token_publico FROM anamneses
             WHERE consultora_id = $1 AND subtipo = 'generico'
             ORDER BY criado_em ASC LIMIT 1`,
            [consultor.id]
        );
        let anamnese_token = anamneseRows[0]?.token_publico || null;

        if (!anamnese_token) {
            const { rows: newAnamnese } = await pool.query(
                `INSERT INTO anamneses(consultora_id, tipo, subtipo, nome_link)
                 VALUES($1, 'adulto', 'generico', 'Link da Bio')
                 RETURNING token_publico`,
                [consultor.id]
            );
            anamnese_token = newAnamnese[0].token_publico;
        }

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
             FROM consultora_links
             WHERE consultora_id = $1 AND is_public = TRUE
             ORDER BY ordem ASC, criado_em DESC`,
            [consultor.id]
        );

        responseData = {
            consultor: { ...publicConsultor, rastreamento: safeTracking },
            depoimentos,
            anamnese_token,
            links: linksPublicos,
            _trackingOrig: rastreamento // Salva internamente para o metaCapi
        };

        // Salva no cache
        cache.set(cacheKey, responseData);
        } // End if (!responseData)

        // 6. Fire Meta CAPI ViewContent (always fire, even if data comes from cache)
        try {
            const tracking = responseData._trackingOrig || {};
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

        // Sanitize return (remove _trackingOrig)
        const { _trackingOrig, ...finalResponse } = responseData;
        res.json(finalResponse);
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

router.publicCache = cache;
module.exports = router;
