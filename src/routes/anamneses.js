const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');
const { validate, schemas } = require('../lib/validate');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ─── PUBLIC ROUTE: client opens the anamnesis form ─────────────────────────

// GET /api/anamneses/public/:token
router.get('/public/:token', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.tipo, a.dados, a.preenchido, a.subtipo, a.nome_link, a.acessos,
              c.nome AS consultora_nome, c.slug AS consultora_slug, c.genero AS consultora_genero,
              c.foto_url AS consultora_foto, c.telefone AS consultora_telefone,
              c.id AS consultora_id, c.rastreamento AS consultora_rastreamento,
              c.link_afiliada AS consultora_link_afiliada
       FROM anamneses a
       JOIN consultoras c ON c.id = a.consultora_id
       WHERE a.token_publico = $1`,
            [req.params.token]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Link não encontrado ou inválido.' });

        const anamnese = rows[0];

        // Personal links: block after first fill
        if (anamnese.subtipo !== 'generico' && anamnese.preenchido) {
            return res.status(409).json({ error: 'Este formulário já foi preenchido.' });
        }

        // Increment access counter (non-blocking, async)
        pool.query(
            'UPDATE anamneses SET acessos = acessos + 1 WHERE token_publico = $1',
            [req.params.token]
        ).catch(err => console.error('acessos update error:', err.message));

        // Only expose browser-safe tracking IDs (never expose CAPI access token)
        if (anamnese.consultora_rastreamento) {
            const r = anamnese.consultora_rastreamento;
            anamnese.consultora_rastreamento = {
                meta_pixel_id: r.meta_pixel_id || null,
                clarity_id: r.clarity_id || null,
                ga_id: r.ga_id || null,
                gtm_id: r.gtm_id || null,
                custom_script: r.custom_script || null,
            };
        }

        res.json(anamnese);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamnese.' });
    }
});

// POST /api/anamneses/public/:token/partial  (silent lead capture at step 1)
router.post('/public/:token/partial', async (req, res) => {
    try {
        const { dados } = req.body;
        if (!dados || (!dados.phone && !dados.full_name)) return res.json({ ok: false });

        // 1. Get consultora
        const { rows: tmpl } = await pool.query(
            `SELECT consultora_id FROM anamneses WHERE token_publico = $1`,
            [req.params.token]
        );
        if (tmpl.length === 0) return res.json({ ok: false });
        const consultora_id = tmpl[0].consultora_id;

        const nome = dados.full_name || dados.nome || 'Lead Incompleto';
        const telefone = dados.phone || dados.telefone || null;
        if (!telefone) return res.json({ ok: false });

        // 2. Check limits to avoid creating leads if blocked
        const { rows: limitRows } = await pool.query(`
            SELECT p.clientes_max,
            (SELECT COUNT(*) FROM clientes WHERE consultora_id = $1 AND ativo = TRUE) as total_ativos
            FROM assinaturas a
            LEFT JOIN planos p ON p.slug = a.plano AND p.ativo = TRUE
            WHERE a.consultora_id = $1
            ORDER BY a.criado_em DESC LIMIT 1
        `, [consultora_id]);
        
        let clientesMax = 50; 
        if (limitRows.length > 0 && limitRows[0].clientes_max) clientesMax = limitRows[0].clientes_max;
        const totalAtivos = limitRows[0]?.total_ativos || 0;

        // 3. Upsert client based on phone and name similarity
        let params = [consultora_id, telefone, nome.toLowerCase().trim()];
        const { rows: existing } = await pool.query(`
            SELECT id FROM clientes
            WHERE consultora_id = $1 AND telefone = $2 AND LOWER(TRIM(nome)) LIKE ($3 || '%')
            LIMIT 1
        `, params);

        if (existing.length > 0) {
            // Update existing slightly if needed or just do nothing, client exists
            await pool.query('UPDATE clientes SET nome=COALESCE($1, nome) WHERE id=$2', [nome, existing[0].id]);
        } else {
            // New Lead Capture
            if (totalAtivos >= clientesMax) return res.json({ ok: false, limit: true });
            
            await pool.query(
                `INSERT INTO clientes (consultora_id, nome, telefone, estagio_funil_id, tags)
                 VALUES ($1, $2, $3, 
                    (SELECT id FROM funil_estagios WHERE consultora_id = $1 AND tipo = 'vendas' ORDER BY ordem ASC LIMIT 1),
                    '{"Origem: Anamnese (Incompleta)"}'
                 )`,
                [consultora_id, nome, telefone]
            );
        }
        res.json({ ok: true });
    } catch (e) {
        console.error('Erro no partial save:', e);
        res.json({ ok: false });
    }
});

// PUT /api/anamneses/public/:token  (client submits the form)
router.put('/public/:token', validate(schemas.submitAnamnese), async (req, res) => {
    const { dados } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get the anamnesis template by token
        const { rows: tmpl } = await client.query(
            `SELECT id, consultora_id, tipo, subtipo FROM anamneses WHERE token_publico = $1`,
            [req.params.token]
        );
        if (tmpl.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Link não encontrado.' });
        }

        const template = tmpl[0];
        const { consultora_id, tipo, subtipo } = template;

        // Personal link: enforce single fill
        if (subtipo !== 'generico') {
            const { rows: check } = await client.query(
                'SELECT preenchido FROM anamneses WHERE id = $1', [template.id]
            );
            if (check[0]?.preenchido) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Formulário já foi preenchido.' });
            }
        }

        // 2. Create/update anamnesis record
        let anamnese_id;
        if (subtipo === 'generico') {
            // Generic: INSERT a fresh record, track which template it came from
            const { rows: ins } = await client.query(
                `INSERT INTO anamneses
                   (consultora_id, tipo, subtipo, dados, preenchido, nome_link, link_origem_id)
                 VALUES ($1, $2, 'generico', $3, TRUE,
                   (SELECT nome_link FROM anamneses WHERE token_publico = $4),
                   (SELECT id         FROM anamneses WHERE token_publico = $4))
                 RETURNING id`,
                [consultora_id, tipo, dados, req.params.token]
            );
            anamnese_id = ins[0].id;
        } else {
            // Personal: UPDATE the single record
            const { rows: upd } = await client.query(
                `UPDATE anamneses
                 SET dados = $1, preenchido = TRUE, atualizado_em = NOW()
                 WHERE token_publico = $2 AND preenchido = FALSE
                 RETURNING id`,
                [dados, req.params.token]
            );
            if (upd.length === 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Formulário já foi preenchido.' });
            }
            anamnese_id = upd[0].id;
        }

        // 3. Extract personal data
        const pData = dados.personal || dados || {}; // Fallback for old/flat structures
        const nome = pData.full_name || pData.nome || 'Cliente';
        const email = pData.email || null;
        const telefone = pData.phone || pData.telefone || null;
        const data_nasc = (pData.birthdate && pData.birthdate.length > 5) ? pData.birthdate : null;
        const cidade = pData.city || pData.cidade || null;
        const genero = pData.gender || pData.genero || 'feminino'; // 'masculino' or 'feminino' from the form

        // 4. Upsert client — match by name similarity + (email OR phone)
        // Using name matching prevents treating different people sharing the same
        // contact (e.g. a mother filling a form for her son) as duplicates.
        let clienteId = null;

        if (email || telefone) {
            let params = [consultora_id];
            let contactConds = [];
            if (email) {
                contactConds.push(`email = $${params.length + 1}`);
                params.push(email);
            }
            if (telefone) {
                contactConds.push(`telefone = $${params.length + 1}`);
                params.push(telefone);
            }
            // Also add the name for similarity check — normalize by lowercasing and trimming
            params.push(nome.toLowerCase().trim());
            const nameIdx = params.length;

            // Duplicate = same consultora + same contact + name starts with same first word
            // (handles "João Silva" vs "João" but distinguishes "Maria" from "Pedro")
            const queryStr = `
                SELECT id FROM clientes
                WHERE consultora_id = $1
                  AND (${contactConds.join(' OR ')})
                  AND LOWER(TRIM(nome)) LIKE ($${nameIdx} || '%')
                LIMIT 1`;

            const { rows: existing } = await client.query(queryStr, params);
            if (existing.length > 0) {
                clienteId = existing[0].id;
                // Update missing fields only (COALESCE keeps existing values)
                await client.query(
                    'UPDATE clientes SET nome=COALESCE($1, nome), telefone=COALESCE($2, telefone), email=COALESCE($3, email), data_nascimento=COALESCE($4, data_nascimento), cidade=COALESCE($5, cidade), genero=COALESCE($6, genero) WHERE id=$7',
                    [nome || null, telefone || null, email || null, data_nasc || null, cidade || null, genero || null, clienteId]
                );
            }
        }


        // If no client was found, create a new record
        if (!clienteId) {
            // Verify plan limit before adding new client
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
                    const totalAtivos = parseInt(sub.total_ativos || 0);
                    if (totalAtivos >= sub.clientes_max) {
                        await client.query('ROLLBACK');
                        return res.status(403).json({ error: 'O consultor(a) atingiu o limite de atendimentos e não pode receber novos formulários no momento.' });
                    }
                }
            }

            const { rows: cRows } = await client.query(
                `INSERT INTO clientes (consultora_id, nome, email, telefone, data_nascimento, cidade, genero, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'lead') RETURNING id`,
                [consultora_id, nome, email, telefone, data_nasc, cidade, genero || 'feminino']
            );
            clienteId = cRows[0].id;
        }

        // 5. Link anamnesis to client
        await client.query('UPDATE anamneses SET cliente_id = $1 WHERE id = $2', [clienteId, anamnese_id]);

        // 5.1 If this is a recruitment anamnesis, push client to the recruitment pipeline
        if (tipo === 'recrutamento') {
            await client.query(
                "UPDATE clientes " +
                "SET recrutamento_stage = COALESCE(recrutamento_stage, 'prospecto_negocio'), " +
                "    pipeline_stage = CASE WHEN pipeline_stage IS NULL OR pipeline_stage = 'lead_captado' THEN 'none' ELSE pipeline_stage END, " +
                "    status = 'lead' " +
                "WHERE id = $1",
                [clienteId]
            );
        } else {
            await client.query(
                "UPDATE clientes " +
                "SET pipeline_stage = CASE WHEN pipeline_stage IS NULL OR pipeline_stage = 'none' THEN 'lead_captado' ELSE pipeline_stage END, " +
                "    status = 'lead' " +
                "WHERE id = $1",
                [clienteId]
            );
        }

        await client.query('COMMIT');

        // 6. Fire Meta CAPI 'Lead' event (non-blocking — fire-and-forget)
        try {
            const { sendMetaEvent } = require('../lib/metaCapi');
            const trackRes = await pool.query(
                'SELECT rastreamento FROM consultoras WHERE id = $1', [consultora_id]
            );
            const tracking = trackRes.rows[0]?.rastreamento || {};
            if (tracking.meta_pixel_id && tracking.meta_pixel_token) {
                sendMetaEvent(
                    tracking.meta_pixel_id,
                    tracking.meta_pixel_token,
                    'Lead',
                    {
                        clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        pageUrl: req.headers.referer,
                    }
                ).catch(() => { }); // Never throw
            }
        } catch (capiErr) {
            console.warn('[CAPI] Could not fire Lead event:', capiErr.message);
        }

        res.json({ success: true, id: anamnese_id, cliente_id: clienteId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar anamnese.' });
    } finally {
        client.release();
    }
});


// GET /api/anamneses/laudo/public/:hash  (Public Laudo view)
router.get('/laudo/public/:hash', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.dados, a.protocolo_customizado, a.cliente_id,
              cli.nome AS cliente_nome,
              c.nome AS consultora_nome, c.genero AS consultora_genero,
              c.telefone AS consultora_telefone, c.link_afiliada AS consultora_link_afiliada,
              c.slug AS consultora_slug,
              COALESCE(
                 (SELECT token_publico FROM anamneses p WHERE p.consultora_id = c.id AND p.subtipo = 'pessoal' LIMIT 1),
                 (SELECT token_publico FROM anamneses p WHERE p.consultora_id = c.id AND p.subtipo = 'generico' ORDER BY criado_em DESC LIMIT 1)
              ) as consultora_token_anamnese
             FROM anamneses a
             JOIN consultoras c ON c.id = a.consultora_id
             LEFT JOIN clientes cli ON cli.id = a.cliente_id
             WHERE a.hash_laudo = $1`,
            [req.params.hash]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Laudo inexistente.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar laudo.' });
    }
});

// ─── PRIVATE ROUTES ────────────────────────────────────────────────────────
router.use(auth, checkSub);
// GET /api/anamneses
// Returns: personal UNFILLED links + generic templates with stats
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
              a.id, a.tipo, a.subtipo, a.nome_link, a.preenchido,
                a.token_publico, a.criado_em,
                a.acessos                            AS visitas,
                a.cliente_id,
                cl.nome AS cliente_nome,
                --For generic templates: count fills from child records
              COALESCE(gen.preenchimentos, 0)      AS preenchimentos
            FROM anamneses a
            LEFT JOIN clientes cl ON cl.id = a.cliente_id
            --Count filled copies for each generic template
            LEFT JOIN(
                    SELECT link_origem_id,
                    COUNT(*) AS preenchimentos
              FROM anamneses
              WHERE link_origem_id IS NOT NULL
              GROUP BY link_origem_id
                ) gen ON gen.link_origem_id = a.id
            WHERE a.consultora_id = $1
              AND a.link_origem_id IS NULL-- only template records(not filled copies)
            AND(
                (a.subtipo = 'pessoal'  AND a.preenchido = FALSE)-- pending personal links
            OR
                (a.subtipo = 'generico')-- all generic templates
              )
            ORDER BY a.criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamneses.' });
    }
});

// GET /api/anamneses/insights  — Raio-X Genético (Inteligência de Vendas)
// IMPORTANT: must be registered BEFORE /:id to avoid route collision
router.get('/insights', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT a.dados, c.nome, c.telefone, c.id AS cliente_id
            FROM anamneses a
            JOIN clientes c ON c.id = a.cliente_id
            WHERE a.consultora_id = $1 AND a.preenchido = TRUE AND a.dados IS NOT NULL
        `, [req.consultora.id]);

        // Dicionário Sintoma -> Óleo
        const mapping = [
            { id: 'lavanda', nome: 'Lavanda / Serenity', categoria: 'Emocional', ticket: 130, rgb: '139, 92, 246', sintomas: ['Ansiedade', 'Insônia', 'Estresse', 'Agitação', 'Dificuldade para dormir', 'Nervosismo'] },
            { id: 'peppermint', nome: 'Peppermint / PastTense', categoria: 'Energia & Foco', ticket: 145, rgb: '34, 197, 94', sintomas: ['Dor de cabeça', 'Enxaqueca', 'Falta de energia', 'Fadiga', 'Dores musculares', 'Falta de foco'] },
            { id: 'balance', nome: 'Balance / Adaptiv', categoria: 'Emocional', ticket: 160, rgb: '14, 165, 233', sintomas: ['Mudanças de humor', 'Sobrecarga Emocional', 'Traumas', 'Luto', 'Tensão'] },
            { id: 'onguard', nome: 'On Guard / Copaíba', categoria: 'Imunidade', ticket: 180, rgb: '245, 158, 11', sintomas: ['Baixa imunidade', 'Infecções frequentes', 'Problemas respiratórios', 'Alergias', 'Rinite', 'Dor nas articulações'] },
            { id: 'zengest', nome: 'ZenGest / Lemon', categoria: 'Digestivo', ticket: 110, rgb: '234, 179, 8', sintomas: ['Azia', 'Refluxo', 'Má digestão', 'Intestino preso', 'Gases', 'Retenção de líquido'] }
        ];

        // buckets
        const buckets = mapping.map(m => ({ ...m, clientes: [], valor_estimado: 0 }));

        for (const row of rows) {
            if (!row.dados) continue;
            const d = row.dados;
            let clienteSintomas = [];
            
            const chavesDeSintomas = [
                'general_symptoms', 'digestive_symptoms', 'hormonal_female', 'chronic_conditions',
                'emotional_symptoms', 'sleep_symptoms', 'low_energy_symptoms',
                'skin_symptoms', 'hair_symptoms', 'sintomas_emocionais', 'sintomas_fisicos'
            ];

            for (const ch of chavesDeSintomas) {
                if (Array.isArray(d[ch])) {
                    clienteSintomas.push(...d[ch]);
                } else if (d[ch] && typeof d[ch] === 'object') {
                    clienteSintomas.push(...Object.keys(d[ch]).filter(k => d[ch][k]));
                }
            }

            clienteSintomas = clienteSintomas.map(s => String(s).trim().toLowerCase());
            if (clienteSintomas.length === 0) continue;

            const adicionadoEm = new Set();

            for (const s of clienteSintomas) {
                for (const b of buckets) {
                    if (adicionadoEm.has(b.id)) continue;
                    
                    const match = b.sintomas.some(ms => ms.toLowerCase() === s || s.includes(ms.toLowerCase()));
                    if (match) {
                        b.clientes.push({
                            id: row.cliente_id,
                            nome: row.nome,
                            telefone: row.telefone,
                            // Capitalize first letter of matched symptom for UI elegance
                            match_sintoma: s.charAt(0).toUpperCase() + s.slice(1)
                        });
                        b.valor_estimado += b.ticket;
                        adicionadoEm.add(b.id);
                    }
                }
            }
        }

        const finalBuckets = buckets.filter(b => b.clientes.length > 0).sort((a, b) => b.valor_estimado - a.valor_estimado);
        res.json(finalBuckets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar insights.' });
    }
});

// GET /api/anamneses/diagnostico/:clienteId  — DEBUG: show raw DB state for a client
// IMPORTANT: must be registered BEFORE /:id
router.get('/diagnostico/:clienteId', async (req, res) => {
    try {
        // 1. The target client
        const { rows: client } = await pool.query(
            `SELECT id, nome, email, telefone FROM clientes WHERE id = $1 AND consultora_id = $2`,
            [req.params.clienteId, req.consultora.id]
        );
        if (!client.length) return res.status(404).json({ error: 'Cliente não encontrado.' });

        const { email, telefone, nome } = client[0];

        // 2. Anamneses directly linked
        const { rows: direct } = await pool.query(
            `SELECT id, preenchido, subtipo, link_origem_id, cliente_id, criado_em FROM anamneses WHERE cliente_id = $1`,
            [req.params.clienteId]
        );

        // 3. Other clients in this consultora with same email or phone
        const { rows: sibling_clients } = await pool.query(
            `SELECT id, nome, email, telefone FROM clientes
             WHERE consultora_id = $1 AND id != $2
               AND (
                 (email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(TRIM($3)))
                 OR (telefone IS NOT NULL AND REGEXP_REPLACE(telefone,'[^0-9]','','g') = REGEXP_REPLACE($4,'[^0-9]','','g'))
               )`,
            [req.consultora.id, req.params.clienteId, email || '', telefone || '']
        );

        // 4. Anamneses linked to those sibling clients
        let sibling_anamneses = [];
        for (const s of sibling_clients) {
            const { rows: sa } = await pool.query(
                `SELECT id, preenchido, subtipo, link_origem_id, cliente_id, criado_em FROM anamneses WHERE cliente_id = $1`,
                [s.id]
            );
            sibling_anamneses.push({ sibling: s, anamneses: sa });
        }

        // 5. Anamneses matching by JSONB email
        const { rows: jsonb_matches } = await pool.query(
            `SELECT id, preenchido, subtipo, cliente_id, criado_em,
                    dados->'personal'->>'email' as jsonb_email,
                    dados->'personal'->>'full_name' as jsonb_nome
             FROM anamneses
             WHERE consultora_id = $1
               AND preenchido = TRUE
               AND LOWER(TRIM(dados->'personal'->>'email')) = LOWER(TRIM($2))`,
            [req.consultora.id, email || '']
        );

        res.json({ client: client[0], direct, sibling_clients, sibling_anamneses, jsonb_matches });
    } catch (err) {
        console.error('[diagnostico]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/anamneses/relink-orphaned
// Recupera anamneses sem cliente vinculado usando nome + email como chave.
// Se o usuário logado for admin: roda para TODAS as consultoras do sistema.
// Se for consultora comum: roda apenas para a própria conta.
// IMPORTANT: must be registered BEFORE /:id
router.post('/relink-orphaned', async (req, res) => {
    const fixed = [];
    const skipped = [];

    try {
        // Verifica se o usuário logado tem role admin
        const { rows: roleRows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        const isAdmin = roleRows[0]?.role === 'admin';

        // Se admin: processa TODAS as anamneses órfãs. Se não: apenas as da própria conta.
        const { rows: orphans } = await pool.query(`
            SELECT a.id, a.consultora_id, a.dados
            FROM anamneses a
            WHERE a.preenchido = TRUE
              AND ($1 = TRUE OR a.consultora_id = $2)
              AND (
                a.cliente_id IS NULL
                OR NOT EXISTS (SELECT 1 FROM clientes c WHERE c.id = a.cliente_id AND c.consultora_id = a.consultora_id)
              )
            ORDER BY a.criado_em ASC
        `, [isAdmin, req.consultora.id]);

        for (const anamnese of orphans) {
            const pData = anamnese.dados?.personal || anamnese.dados || {};
            const email = (pData.email || '').trim().toLowerCase();
            const nome = (pData.full_name || pData.nome || '').trim().toLowerCase();

            if (!email || !nome) { skipped.push({ id: anamnese.id, reason: 'sem nome ou email' }); continue; }

            const primeiroNome = nome.split(' ')[0];
            const { rows: matches } = await pool.query(
                `SELECT id, nome FROM clientes
                 WHERE consultora_id = $1
                   AND LOWER(TRIM(email)) = $2
                   AND LOWER(TRIM(nome)) LIKE $3
                 ORDER BY criado_em ASC LIMIT 1`,
                [anamnese.consultora_id, email, primeiroNome + '%']
            );

            if (!matches.length) { skipped.push({ id: anamnese.id, reason: 'cliente não encontrado', nome, email }); continue; }

            await pool.query('UPDATE anamneses SET cliente_id = $1 WHERE id = $2', [matches[0].id, anamnese.id]);
            fixed.push({ anamnese_id: anamnese.id, cliente: matches[0].nome });
        }

        res.json({ success: true, is_admin_run: isAdmin, fixed_count: fixed.length, skipped_count: skipped.length, fixed, skipped });
    } catch (err) {
        console.error('[relink-orphaned]', err);
        res.status(500).json({ error: err.message });
    }
});


// GET /api/anamneses/cliente/:clienteId  — all anamneses for a specific client
// IMPORTANT: must be registered BEFORE /:id to avoid route collision
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        // Get this client's email, phone and name to find duplicate records safely
        const { rows: clientRows } = await pool.query(
            'SELECT email, telefone, nome FROM clientes WHERE id = $1 AND consultora_id = $2',
            [req.params.clienteId, req.consultora.id]
        );
        const clientEmail = clientRows[0]?.email || null;
        const clientTelefone = clientRows[0]?.telefone || null;
        const clientNome = clientRows[0]?.nome || null;
        const primeiroNome = clientNome ? clientNome.trim().split(' ')[0].toLowerCase() : null;

        // Primary: anamneses directly linked to this client
        // Secondary: anamneses in a DUPLICATE client record matching:
        //   - same email + same first name (OR)
        //   - same phone + same first name
        // Requires name similarity to avoid merging family members sharing email/phone
        const { rows } = await pool.query(`
            SELECT DISTINCT a.id, a.tipo, a.subtipo, a.dados, a.preenchido,
                   a.criado_em, a.nome_link, a.protocolo_customizado
            FROM anamneses a
            WHERE a.consultora_id = $1
              AND a.preenchido = TRUE
              AND (
                a.cliente_id = $2
                OR (
                  $5::text IS NOT NULL
                  AND a.cliente_id IN (
                    SELECT c2.id FROM clientes c2
                    WHERE c2.consultora_id = $1
                      AND c2.id != $2
                      AND LOWER(TRIM(c2.nome)) LIKE $5 || '%'
                      AND (
                        ($3::text IS NOT NULL AND LOWER(TRIM(c2.email)) = LOWER(TRIM($3)))
                        OR
                        ($4::text IS NOT NULL AND REGEXP_REPLACE(c2.telefone, '[^0-9]', '', 'g') = REGEXP_REPLACE($4, '[^0-9]', '', 'g'))
                      )
                  )
                )
              )
            ORDER BY a.criado_em DESC
        `, [req.consultora.id, req.params.clienteId, clientEmail, clientTelefone, primeiroNome]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamneses do cliente.' });
    }
});


// GET /api/anamneses/:id  (full record including dados)
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM anamneses WHERE id = $1 AND consultora_id = $2',
            [req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Anamnese não encontrada.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamnese.' });
    }
});





// POST /api/anamneses  (consultora creates a link)
router.post('/', async (req, res) => {
    const { cliente_id, tipo, subtipo, nome_link } = req.body;
    try {
        // ── Limit enforcement ───────────────────────────────────────────
        const limites = req.consultora.limites || {};
        if (limites.anamneses_mes_max !== null && limites.anamneses_mes_max !== undefined) {
            const inicioMes = new Date();
            inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
            const { rows: [{ count }] } = await pool.query(
                `SELECT COUNT(*) FROM anamneses
                 WHERE consultora_id = $1 AND criado_em >= $2 AND link_origem_id IS NULL`,
                [req.consultora.id, inicioMes]
            );
            const total = parseInt(count);
            if (total >= limites.anamneses_mes_max) {
                return res.status(403).json({
                    error: `Você atingiu o limite de ${limites.anamneses_mes_max} anamneses por mês do seu plano.Faça upgrade para continuar.`,
                    code: 'LIMIT_REACHED',
                    limit: limites.anamneses_mes_max,
                    current: total,
                    resource: 'anamneses_mes',
                });
            }
        }

        const { rows } = await pool.query(
            `INSERT INTO anamneses(consultora_id, cliente_id, tipo, subtipo, nome_link)
VALUES($1, $2, $3, $4, $5)
       RETURNING id, token_publico, tipo, subtipo, nome_link`,
            [req.consultora.id, cliente_id || null, tipo || 'adulto',
            subtipo || 'pessoal', nome_link || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar anamnese.' });
    }
});


// DELETE /api/anamneses/:id  (also deletes child records for generic)
router.delete('/:id', async (req, res) => {
    try {
        // Safety guard: never allow deletion of a filled anamnese (preenchido=TRUE)
        // Only link templates (preenchido=FALSE) can be deleted.
        const { rows: check } = await pool.query(
            'SELECT preenchido FROM anamneses WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        if (!check.length) return res.status(404).json({ error: 'Anamnese não encontrada.' });
        if (check[0].preenchido) {
            return res.status(403).json({ error: 'Não é possível excluir um formulário já preenchido por um cliente. Para remover, desvincule o cliente antes.' });
        }

        // First nullify link_origem_id refs then delete template
        await pool.query(
            'UPDATE anamneses SET link_origem_id = NULL WHERE link_origem_id = $1',
            [req.params.id]
        );
        await pool.query(
            'DELETE FROM anamneses WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover anamnese.' });
    }
});

// PUT /api/anamneses/:id/protocolo  (save consultant's custom protocol)
router.put('/:id/protocolo', auth, async (req, res) => {
    try {
        const { protocolo_customizado } = req.body;
        if (!protocolo_customizado || typeof protocolo_customizado !== 'object') {
            return res.status(400).json({ error: 'Protocolo inválido.' });
        }
        const { rows } = await pool.query(
            `UPDATE anamneses SET protocolo_customizado = $1
             WHERE id = $2 AND consultora_id = $3
             RETURNING id`,
            [JSON.stringify(protocolo_customizado), req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Anamnese não encontrada.' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar protocolo.' });
    }
});

// POST /api/anamneses/:id/hash  (Generate or return magic link hash)
router.post('/:id/hash', auth, async (req, res) => {
    try {
        const crypto = require('crypto');
        
        // 1. Check if anamnese exists and belongs to consultora
        const { rows: check } = await pool.query(
            'SELECT id, hash_laudo FROM anamneses WHERE id = $1 AND consultora_id = $2',
            [req.params.id, req.consultora.id]
        );
        if (check.length === 0) return res.status(404).json({ error: 'Anamnese não encontrada.' });
        
        // 2. Return existing hash if already created
        if (check[0].hash_laudo) {
            return res.json({ hash: check[0].hash_laudo });
        }
        
        // 3. Generate new hash and save
        const newHash = crypto.randomBytes(4).toString('hex');
        const { rows } = await pool.query(
            'UPDATE anamneses SET hash_laudo = $1 WHERE id = $2 RETURNING hash_laudo',
            [newHash, req.params.id]
        );
        res.json({ hash: rows[0].hash_laudo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar link de laudo.' });
    }
});

module.exports = router;
