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
        const { nome, email, senha, telefone, genero } = req.body;

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
            `INSERT INTO consultoras (nome, email, senha_hash, telefone, slug, genero)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, slug, genero`,
            [nome, email, senhaHash, telefone || null, slug, genero || 'feminino']
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
            'SELECT id, nome, email, senha_hash, slug, role, genero, telefone FROM consultoras WHERE email = $1',
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
            { id: consultora.id, email: consultora.email, nome: consultora.nome, role: consultora.role || 'user', genero: consultora.genero || 'feminino' },
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
              endereco, bio, instagram, youtube, facebook, linkedin, genero, rastreamento
             FROM consultoras WHERE id = $1`,
            [req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado.' });
        return res.json(rows[0]);
    } catch (err) {
        return next(err);
    }
});

// PUT /api/auth/tracking — consultora updates her own tracking scripts
router.put('/tracking', authMiddleware, async (req, res, next) => {
    const { meta_pixel_id, meta_pixel_token, clarity_id, ga_id, gtm_id, custom_script } = req.body;
    const rastreamento = {
        meta_pixel_id: meta_pixel_id || null,
        meta_pixel_token: meta_pixel_token || null,
        clarity_id: clarity_id || null,
        ga_id: ga_id || null,
        gtm_id: gtm_id || null,
        custom_script: custom_script || null,
    };
    try {
        await pool.query(
            `UPDATE consultoras SET rastreamento=$1, atualizado_em=NOW() WHERE id=$2`,
            [JSON.stringify(rastreamento), req.consultora.id]
        );
        return res.json({ success: true });
    } catch (err) {
        return next(err);
    }
});

// PUT /api/auth/profile — update profile fields
router.put('/profile', authMiddleware, async (req, res, next) => {
    const { nome, telefone, endereco, bio, foto_url, instagram, youtube, facebook, linkedin, genero, doterra_nivel } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE consultoras
             SET nome=$1, telefone=$2, endereco=$3, bio=$4, foto_url=$5,
                 instagram=$6, youtube=$7, facebook=$8, linkedin=$9,
                 genero=$10, doterra_nivel=$11, atualizado_em=NOW()
             WHERE id=$12
             RETURNING id, nome, email, telefone, slug, foto_url,
                       endereco, bio, instagram, youtube, facebook, linkedin, genero, doterra_nivel`,
            [nome, telefone || null, endereco || null, bio || null, foto_url || null,
                instagram || null, youtube || null, facebook || null, linkedin || null,
                genero || 'feminino', doterra_nivel || null, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Consultora não encontrada.' });
        return res.json({ success: true, consultora: rows[0] });
    } catch (err) {
        console.error('Erro no PUT /profile:', err.message);
        return next(err);
    }
});

// PUT /api/auth/change-password — user changes own password (requires current password)
router.put('/change-password', authMiddleware, async (req, res, next) => {
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    if (novaSenha.length < 8) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    }
    if (novaSenha !== confirmarSenha) {
        return res.status(400).json({ error: 'A nova senha e a confirmação não coincidem.' });
    }

    try {
        const bcrypt = require('bcryptjs');
        const { rows } = await pool.query(
            'SELECT senha_hash FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const match = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
        if (!match) return res.status(401).json({ error: 'Senha atual incorreta.' });

        const newHash = await bcrypt.hash(novaSenha, 10);
        await pool.query(
            'UPDATE consultoras SET senha_hash=$1, atualizado_em=NOW() WHERE id=$2',
            [newHash, req.consultora.id]
        );
        console.log(`[Auth] 🔐 Senha alterada para consultora ${req.consultora.id}`);
        return res.json({ success: true, message: 'Senha alterada com sucesso!' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;

