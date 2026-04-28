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
              rastreamento, tema_cor, video_apresentacao, video_headline, video_cta_texto, video_cta_link, perfil_cta_texto, perfil_cta_link, subheadline_1, subheadline_2
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

// POST /api/publico/express-protocol
// Generates a quick anamnesis and creates a lead
router.post('/express-protocol', async (req, res) => {
    try {
        const { slug, nome, email, telefone, idade, cidade, problema } = req.body;
        
        if (!slug || !nome || !telefone || !problema) {
            return res.status(400).json({ error: 'Campos obrigatórios: slug, nome, telefone e problema.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get consultora
            const { rows: cRows } = await client.query('SELECT id FROM consultoras WHERE slug = $1', [slug]);
            if (cRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Consultor(a) não encontrado.' });
            }
            const consultora_id = cRows[0].id;

            // 2. Check limits
            const { rows: limitRows } = await client.query(`
                SELECT p.clientes_max,
                (SELECT COUNT(*) FROM clientes WHERE consultora_id = $1 AND ativo = TRUE) as total_ativos
                FROM assinaturas a
                LEFT JOIN planos p ON p.slug = a.plano AND p.ativo = TRUE
                WHERE a.consultora_id = $1
                ORDER BY a.criado_em DESC LIMIT 1
            `, [consultora_id]);

            if (limitRows.length > 0) {
                const sub = limitRows[0];
                if (sub.clientes_max !== null && sub.clientes_max !== undefined) {
                    if (parseInt(sub.total_ativos || 0) >= sub.clientes_max) {
                        await client.query('ROLLBACK');
                        return res.status(403).json({ error: 'O consultor(a) atingiu o limite de atendimentos e não pode receber novos formulários.' });
                    }
                }
            }

            // 3. Upsert Client (similar logic to anamneses.js)
            let clienteId = null;
            let params = [consultora_id, telefone, nome.toLowerCase().trim()];
            const { rows: existing } = await client.query(`
                SELECT id FROM clientes
                WHERE consultora_id = $1 AND telefone = $2 AND LOWER(TRIM(nome)) LIKE ($3 || '%')
                LIMIT 1
            `, params);

            if (existing.length > 0) {
                clienteId = existing[0].id;
                await client.query(
                    'UPDATE clientes SET nome=COALESCE($1, nome), email=COALESCE($2, email), cidade=COALESCE($3, cidade), data_nascimento=COALESCE($4, data_nascimento) WHERE id=$5',
                    [nome, email || null, cidade || null, idade ? (new Date().getFullYear() - idade) + '-01-01' : null, clienteId]
                );
            } else {
                const { rows: insC } = await client.query(
                    `INSERT INTO clientes (consultora_id, nome, email, telefone, cidade, data_nascimento, pipeline_stage, status)
                     VALUES ($1, $2, $3, $4, $5, $6, 'lead_captado', 'lead') RETURNING id`,
                    [consultora_id, nome, email || null, telefone, cidade || null, idade ? (new Date().getFullYear() - idade) + '-01-01' : null]
                );
                clienteId = insC[0].id;
            }

            // 4. Create express anamnesis
            const dados = {
                personal: { full_name: nome, phone: telefone, email, age: idade, city: cidade },
                goals: [problema],
                is_express: true
            };

            const crypto = require('crypto');
            const hashLaudo = crypto.randomBytes(4).toString('hex');
            const tokenPublico = require('uuid').v4();

            const { rows: insA } = await client.query(
                `INSERT INTO anamneses (consultora_id, cliente_id, tipo, subtipo, dados, preenchido, token_publico, hash_laudo, nome_link)
                 VALUES ($1, $2, 'adulto', 'express', $3, TRUE, $4, $5, 'Protocolo Expresso') RETURNING id`,
                [consultora_id, clienteId, dados, tokenPublico, hashLaudo]
            );

            await client.query('COMMIT');

            // Fire Push (non-blocking)
            try {
                const { sendPushNotification } = require('../lib/push');
                sendPushNotification(consultora_id, {
                    title: `⚡ Lead Expresso: ${nome.split(' ')[0]}`,
                    body: `Gerou protocolo focado para: ${problema}`,
                    icon: '/icon-512.png',
                    data: { url: `/#/pipeline` }
                });
            } catch (e) {}

            res.json({ success: true, hash: hashLaudo });

        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('[express-protocol]', err);
        res.status(500).json({ error: 'Erro ao processar protocolo expresso.' });
    }
});

router.publicCache = cache;
module.exports = router;
