const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

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
router.post('/register', async (req, res, next) => {
    try {
        const { nome, email, senha, telefone } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
        }
        if (senha.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
        }

        // Check existing email
        const exists = await pool.query('SELECT id FROM consultoras WHERE email = $1', [email]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const slug = makeSlug(nome);

        // Insert consultora
        const { rows } = await pool.query(
            `INSERT INTO consultoras (nome, email, senha_hash, telefone, slug)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, slug`,
            [nome, email, senhaHash, telefone || null, slug]
        );
        const consultora = rows[0];

        // Create trial subscription
        await pool.query(
            `INSERT INTO assinaturas (consultora_id, plano, status) VALUES ($1, 'starter', 'trial')`,
            [consultora.id]
        );

        const token = jwt.sign(
            { id: consultora.id, email: consultora.email, nome: consultora.nome, role: consultora.role || 'user' },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '7d' }
        );

        return res.status(201).json({ token, consultora });
    } catch (err) {
        console.error('Erro no register:', err.message);
        return next(err);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }

        const { rows } = await pool.query(
            'SELECT id, nome, email, senha_hash, slug, role FROM consultoras WHERE email = $1',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const consultora = rows[0];
        const ok = await bcrypt.compare(senha, consultora.senha_hash);
        if (!ok) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const subResult = await pool.query(
            `SELECT plano, status, trial_fim, periodo_fim
       FROM assinaturas WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [consultora.id]
        );
        const sub = subResult.rows[0] || { plano: 'none', status: 'none' };

        const token = jwt.sign(
            { id: consultora.id, email: consultora.email, nome: consultora.nome, role: consultora.role || 'user' },
            process.env.JWT_SECRET || 'dev_secret',
            { expiresIn: '7d' }
        );

        const { senha_hash, ...consultoraData } = consultora;
        return res.json({ token, consultora: { ...consultoraData, assinatura: sub } });
    } catch (err) {
        console.error('Erro no login:', err.message);
        return next(err);
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, email, telefone, slug, foto_url,
              endereco, bio, instagram, youtube, facebook, linkedin, genero, criado_em
             FROM consultoras WHERE id = $1`,
            [req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });

        const subResult = await pool.query(
            `SELECT plano, status, trial_fim, periodo_fim
       FROM assinaturas WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [req.consultora.id]
        );

        return res.json({ ...rows[0], assinatura: subResult.rows[0] || null });
    } catch (err) {
        console.error('Erro no /me:', err.message);
        return next(err);
    }
});

// GET /api/auth/profile — same as /me but explicit
router.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, email, telefone, slug, foto_url,
              endereco, bio, instagram, youtube, facebook, linkedin, genero
             FROM consultoras WHERE id = $1`,
            [req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado.' });
        return res.json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

// PUT /api/auth/profile — update profile fields
router.put('/profile', authMiddleware, async (req, res, next) => {
    const { nome, telefone, endereco, bio, foto_url, instagram, youtube, facebook, linkedin, genero } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE consultoras
             SET nome=$1, telefone=$2, endereco=$3, bio=$4, foto_url=$5,
                 instagram=$6, youtube=$7, facebook=$8, linkedin=$9,
                 genero=$10, atualizado_em=NOW()
             WHERE id=$11
             RETURNING id, nome, email, telefone, slug, foto_url,
                       endereco, bio, instagram, youtube, facebook, linkedin, genero`,
            [nome, telefone || null, endereco || null, bio || null, foto_url || null,
                instagram || null, youtube || null, facebook || null, linkedin || null,
                genero || 'feminino', req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        return res.json({ success: true, consultora: rows[0] });
    } catch (err) {
        console.error('Erro no PUT /profile:', err.message);
        return next(err);
    }
});

module.exports = router;

