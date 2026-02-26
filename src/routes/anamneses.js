const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();

// ─── PUBLIC ROUTE: client opens the anamnesis form ─────────────────────────

// GET /api/anamneses/public/:token
router.get('/public/:token', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.tipo, a.dados, a.preenchido, a.subtipo, a.nome_link, a.acessos,
              c.nome AS consultora_nome, c.slug AS consultora_slug, c.genero AS consultora_genero
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

        res.json(anamnese);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamnese.' });
    }
});

// PUT /api/anamneses/public/:token  (client submits the form)
router.put('/public/:token', async (req, res) => {
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
        const nome = dados.full_name || dados.nome || 'Cliente';
        const email = dados.email || null;
        const telefone = dados.phone || dados.telefone || null;
        const data_nasc = (dados.birthdate && dados.birthdate.length > 5) ? dados.birthdate : null;
        const cidade = dados.city || dados.cidade || null;

        // 4. Upsert client
        let clienteId = null;
        // For personal links: upsert by email (same person)
        if (subtipo !== 'generico' && email) {
            const { rows: existing } = await client.query(
                'SELECT id FROM clientes WHERE email = $1 AND consultora_id = $2 LIMIT 1',
                [email, consultora_id]
            );
            if (existing.length > 0) {
                clienteId = existing[0].id;
                await client.query(
                    'UPDATE clientes SET nome=$1, telefone=$2, data_nascimento=$3, cidade=$4 WHERE id=$5',
                    [nome, telefone, data_nasc, cidade, clienteId]
                );
            }
        }
        // Generic always creates a new client record
        if (!clienteId) {
            const { rows: cRows } = await client.query(
                `INSERT INTO clientes (consultora_id, nome, email, telefone, data_nascimento, cidade, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'lead') RETURNING id`,
                [consultora_id, nome, email, telefone, data_nasc, cidade]
            );
            clienteId = cRows[0].id;
        }

        // 5. Link anamnesis to client
        await client.query('UPDATE anamneses SET cliente_id = $1 WHERE id = $2', [clienteId, anamnese_id]);

        await client.query('COMMIT');
        res.json({ success: true, id: anamnese_id, cliente_id: clienteId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar anamnese.' });
    } finally {
        client.release();
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
              a.token_publico, a.criado_em, a.acessos,
              a.cliente_id,
              cl.nome AS cliente_nome,
              -- For generic templates: count fills and visits from child records
              COALESCE(gen.preenchimentos, 0)  AS preenchimentos,
              COALESCE(gen.visitas,        0)  AS visitas
            FROM anamneses a
            LEFT JOIN clientes cl ON cl.id = a.cliente_id
            -- Aggregate stats for generic templates
            LEFT JOIN (
              SELECT link_origem_id,
                     COUNT(*)        AS preenchimentos,
                     SUM(acessos)    AS visitas
              FROM anamneses
              WHERE link_origem_id IS NOT NULL
              GROUP BY link_origem_id
            ) gen ON gen.link_origem_id = a.id
            WHERE a.consultora_id = $1
              AND a.link_origem_id IS NULL   -- only template records (not filled copies)
              AND (
                (a.subtipo = 'pessoal'  AND a.preenchido = FALSE)  -- pending personal links
                OR
                (a.subtipo = 'generico')                            -- all generic templates
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


// GET /api/anamneses/cliente/:clienteId  — all anamneses for a specific client
// IMPORTANT: must be registered BEFORE /:id to avoid route collision
router.get('/cliente/:clienteId', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, tipo, subtipo, dados, preenchido, criado_em, nome_link
             FROM anamneses
             WHERE cliente_id = $1 AND consultora_id = $2
               AND preenchido = TRUE
             ORDER BY criado_em DESC`,
            [req.params.clienteId, req.consultora.id]
        );
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
        const { rows } = await pool.query(
            `INSERT INTO anamneses (consultora_id, cliente_id, tipo, subtipo, nome_link)
       VALUES ($1, $2, $3, $4, $5)
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

module.exports = router;
