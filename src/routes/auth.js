const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: generate slug from name
function makeSlug(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (senha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check existing email
        const exists = await client.query('SELECT id FROM consultoras WHERE email = $1', [email]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 12);
        const slug = makeSlug(nome);

        const { rows } = await client.query(
            `INSERT INTO consultoras (nome, email, senha_hash, telefone, slug)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, slug`,
            [nome, email, senhaHash, telefone || null, slug]
        );
        const consultora = rows[0];

        // Create trial subscription
        await client.query(
            `INSERT INTO assinaturas (consultora_id, plano, status)
       VALUES ($1, 'starter', 'trial')`,
            [consultora.id]
        );

        await client.query('COMMIT');

        const token = jwt.sign(
            { id: consultora.id, email: consultora.email, nome: consultora.nome },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, consultora });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar conta.' });
    } finally {
        client.release();
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const { rows } = await pool.query(
            'SELECT id, nome, email, senha_hash, slug FROM consultoras WHERE email = $1',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const consultora = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, consultora.senha_hash);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        // Get subscription status
        const subResult = await pool.query(
            `SELECT plano, status, trial_fim, periodo_fim
       FROM assinaturas WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [consultora.id]
        );

        const sub = subResult.rows[0] || { plano: 'none', status: 'none' };

        const token = jwt.sign(
            { id: consultora.id, email: consultora.email, nome: consultora.nome },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { senha_hash, ...consultoraData } = consultora;
        res.json({ token, consultora: { ...consultoraData, assinatura: sub } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, nome, email, telefone, slug, foto_url, criado_em FROM consultoras WHERE id = $1',
            [req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });

        const subResult = await pool.query(
            `SELECT plano, status, trial_fim, periodo_fim
       FROM assinaturas WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [req.consultora.id]
        );

        res.json({ ...rows[0], assinatura: subResult.rows[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

module.exports = router;
