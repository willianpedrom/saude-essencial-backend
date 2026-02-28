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

        // Create trial subscription (7 days)
        await pool.query(
            `INSERT INTO assinaturas (consultora_id, plano, status, trial_fim) VALUES ($1, 'starter', 'trial', NOW() + INTERVAL '7 days')`,
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

// PATCH /api/auth/slug — personalizar link da página pública
router.patch('/slug', authMiddleware, async (req, res) => {
    let { slug } = req.body;
    if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'Informe o novo slug.' });
    }

    // Normalizar: minúsculas, remover acentos, trocar espaços por hífen
    slug = slug.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (slug.length < 3) {
        return res.status(400).json({ error: 'O link precisa ter pelo menos 3 caracteres.' });
    }
    if (slug.length > 60) {
        return res.status(400).json({ error: 'O link pode ter no máximo 60 caracteres.' });
    }

    // Palavras reservadas
    const reserved = ['admin', 'api', 'login', 'register', 'reset', 'profile', 'dashboard', 'app', 'www', 'gota', 'essencial'];
    if (reserved.includes(slug)) {
        return res.status(400).json({ error: 'Esse link não está disponível.' });
    }

    try {
        // Verificar se já está em uso por outro usuário
        const { rows: existing } = await pool.query(
            'SELECT id FROM consultoras WHERE slug = $1 AND id != $2',
            [slug, req.consultora.id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Esse link já está em uso. Escolha outro.' });
        }

        const { rows } = await pool.query(
            `UPDATE consultoras SET slug=$1, atualizado_em=NOW() WHERE id=$2 RETURNING slug`,
            [slug, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada.' });

        // Atualizar sessionStorage no frontend
        res.json({ success: true, slug: rows[0].slug });
    } catch (err) {
        console.error('Erro ao atualizar slug:', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Esse link já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar link.' });
    }
});

// POST /api/auth/forgot-password — gera token e envia email de recuperação
router.post('/forgot-password', async (req, res, next) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o e-mail.' });

    try {
        const { rows } = await pool.query('SELECT id, nome FROM consultoras WHERE email = $1', [email.trim().toLowerCase()]);
        // Resposta genérica independente de achar ou não (evita enumeração de emails)
        if (rows.length === 0) {
            return res.json({ success: true, message: 'Se este e-mail existir, você receberá as instruções.' });
        }
        const { id, nome } = rows[0];

        // Generate token — using crypto (built-in Node.js)
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await pool.query(
            'UPDATE consultoras SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3',
            [token, expiry, id]
        );

        const PLATFORM_URL = process.env.PLATFORM_URL || 'https://gotaessencial.com.br';
        const resetUrl = `${PLATFORM_URL}/#/reset-password?token=${token}`;

        // Send email via Brevo or SMTP
        const { isConfigured } = require('../lib/mailer');
        if (isConfigured()) {
            const mailer = require('../lib/mailer');
            if (mailer.isBrevoConfigured()) {
                const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
                const body = {
                    sender: { email: fromEmail, name: 'Gota Essencial' },
                    to: [{ email: email.trim(), name: nome }],
                    subject: '🔐 Recuperação de Senha — Gota Essencial',
                    htmlContent: `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#0a4a2a,#1a7a45);padding:36px 32px;text-align:center">
    <div style="font-size:2rem">💧</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:1.4rem">Gota Essencial</h1>
  </div>
  <div style="padding:36px 32px">
    <h2 style="color:#1a2e1a;font-size:1.1rem;margin:0 0 16px">Olá, ${nome}!</h2>
    <p style="color:#4a5568;line-height:1.7;margin:0 0 12px">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
    <p style="color:#4a5568;line-height:1.7;margin:0 0 24px">Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#0a4a2a,#1a7a45);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem">🔐 Redefinir minha senha</a>
    </div>
    <p style="font-size:0.83rem;color:#94a3b8;margin-top:24px">Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
    <p style="font-size:0.8rem;color:#94a3b8">Ou copie este link: <a href="${resetUrl}" style="color:#0a4a2a;word-break:break-all">${resetUrl}</a></p>
  </div>
  <div style="background:#f8fafb;padding:16px 32px;text-align:center;font-size:0.77rem;color:#94a3b8;border-top:1px solid #e2e8f0">
    Gota Essencial • E-mail automático, não responda.
  </div>
</div></body></html>`,
                    textContent: `Olá ${nome},\n\nClique no link para redefinir sua senha (válido por 1 hora):\n${resetUrl}\n\nSe você não solicitou, ignore este e-mail.`,
                };
                await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
                    body: JSON.stringify(body),
                });
            }
        }
        console.log(`[Auth] 🔐 Reset token gerado para ${email}`);
        return res.json({ success: true, message: 'Se este e-mail existir, você receberá as instruções.' });
    } catch (err) {
        return next(err);
    }
});

// POST /api/auth/reset-password — valida token e define nova senha
router.post('/reset-password', async (req, res, next) => {
    const { token, novaSenha, confirmarSenha } = req.body;
    if (!token || !novaSenha || !confirmarSenha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }
    if (novaSenha.length < 8) {
        return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres.' });
    }
    if (novaSenha !== confirmarSenha) {
        return res.status(400).json({ error: 'As senhas não coincidem.' });
    }
    try {
        const { rows } = await pool.query(
            'SELECT id FROM consultoras WHERE reset_token=$1 AND reset_token_expiry > NOW()',
            [token]
        );
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo link de recuperação.' });
        }
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(novaSenha, 10);
        await pool.query(
            'UPDATE consultoras SET senha_hash=$1, reset_token=NULL, reset_token_expiry=NULL, atualizado_em=NOW() WHERE id=$2',
            [hash, rows[0].id]
        );
        console.log(`[Auth] ✅ Senha redefinida via reset token para consultora ${rows[0].id}`);
        return res.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' });
    } catch (err) {
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

