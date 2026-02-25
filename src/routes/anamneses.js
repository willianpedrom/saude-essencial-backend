const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();

// ─── PUBLIC ROUTE: client fills out anamnesis form via token ───────────────

// GET /api/anamneses/public/:token
router.get('/public/:token', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.tipo, a.dados, a.preenchido, a.subtipo, a.nome_link,
              c.nome AS consultora_nome, c.slug AS consultora_slug
       FROM anamneses a
       JOIN consultoras c ON c.id = a.consultora_id
       WHERE a.token_publico = $1`,
            [req.params.token]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Link não encontrado ou inválido.' });

        const anamnese = rows[0];

        // Generic links: always available (never blocked by preenchido)
        // Personal links: blocked after first fill
        if (anamnese.subtipo !== 'generico' && anamnese.preenchido) {
            return res.status(409).json({ error: 'Este formulário já foi preenchido.' });
        }

        res.json(anamnese);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamnese.' });
    }
});

// PUT /api/anamneses/public/:token  (client submits form)
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

        // Personal link: block if already filled
        if (subtipo !== 'generico') {
            const { rows: check } = await client.query(
                `SELECT preenchido FROM anamneses WHERE id = $1`, [template.id]
            );
            if (check[0]?.preenchido) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Formulário já foi preenchido.' });
            }
        }

        // 2. Create anamnesis record (update for personal, insert new for generic)
        let anamnese_id;
        if (subtipo === 'generico') {
            // Generic: INSERT a fresh record linked to this consultora
            const { rows: ins } = await client.query(
                `INSERT INTO anamneses (consultora_id, tipo, subtipo, dados, preenchido, nome_link)
                 VALUES ($1, $2, 'generico', $3, TRUE, (SELECT nome_link FROM anamneses WHERE token_publico = $4))
                 RETURNING id`,
                [consultora_id, tipo, dados, req.params.token]
            );
            anamnese_id = ins[0].id;
        } else {
            // Personal: UPDATE the existing record
            const { rows: upd } = await client.query(
                `UPDATE anamneses
                 SET dados = $1, preenchido = TRUE, atualizado_em = NOW()
                 WHERE token_publico = $2 AND preenchido = FALSE
                 RETURNING id`,
                [dados, req.params.token]
            );
            if (upd.length === 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Formulário já foi preenchido ou não encontrado.' });
            }
            anamnese_id = upd[0].id;
        }

        // 3. Extract personal data from form answers
        const nome = dados.full_name || dados.nome || 'Cliente';
        const email = dados.email || null;
        const telefone = dados.phone || dados.telefone || null;
        const data_nasc = (dados.birthdate && dados.birthdate.length > 5) ? dados.birthdate : null;
        const cidade = dados.city || dados.cidade || null;

        // 4. Upsert client (for generic: always create new client; for personal: upsert by email)
        let clienteId = null;
        if (subtipo !== 'generico' && email) {
            const { rows: existing } = await client.query(
                `SELECT id FROM clientes WHERE email = $1 AND consultora_id = $2 LIMIT 1`,
                [email, consultora_id]
            );
            if (existing.length > 0) {
                clienteId = existing[0].id;
                await client.query(
                    `UPDATE clientes SET nome=$1, telefone=$2, data_nascimento=$3, cidade=$4
                     WHERE id=$5`,
                    [nome, telefone, data_nasc, cidade, clienteId]
                );
            }
        }
        if (!clienteId) {
            const { rows: cRows } = await client.query(
                `INSERT INTO clientes (consultora_id, nome, email, telefone, data_nascimento, cidade, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'lead')
                 RETURNING id`,
                [consultora_id, nome, email, telefone, data_nasc, cidade]
            );
            clienteId = cRows[0].id;
        }

        // 5. Link anamnesis to the client
        await client.query(
            `UPDATE anamneses SET cliente_id = $1 WHERE id = $2`,
            [clienteId, anamnese_id]
        );

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


// ─── PRIVATE ROUTES (auth + subscription required) ────────────────────────
router.use(auth, checkSub);

// GET /api/anamneses  (list — shows persona links + completed generic ones)
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.tipo, a.subtipo, a.nome_link, a.preenchido,
              a.token_publico, a.criado_em, a.cliente_id, c.nome AS cliente_nome
       FROM anamneses a
       LEFT JOIN clientes c ON c.id = a.cliente_id
       WHERE a.consultora_id = $1
         AND (a.subtipo != 'generico' OR a.preenchido = TRUE OR a.cliente_id IS NULL)
       ORDER BY a.criado_em DESC`,
            [req.consultora.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar anamneses.' });
    }
});


// GET /api/anamneses/:id
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
        const anamnese = rows[0];
        res.status(201).json(anamnese);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar anamnese.' });
    }
});

// DELETE /api/anamneses/:id
router.delete('/:id', async (req, res) => {
    try {
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
