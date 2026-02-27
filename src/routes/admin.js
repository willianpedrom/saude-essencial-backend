const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// ── Admin guard middleware ──────────────────────────────────────
router.use(auth, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        if (!rows[0] || rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Acesso restrito a administradores.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Erro de autenticação.' });
    }
});

// GET /api/admin/users — list all consultoras with subscription info
router.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.id, c.nome, c.email, c.telefone, c.role, c.foto_url,
              c.criado_em, c.atualizado_em,
              a.plano, a.status AS plano_status, a.trial_fim, a.periodo_fim,
              (SELECT COUNT(*) FROM clientes cl WHERE cl.consultora_id = c.id)  AS total_clientes,
              (SELECT COUNT(*) FROM anamneses an WHERE an.consultora_id = c.id) AS total_anamneses
              FROM consultoras c
              LEFT JOIN assinaturas a ON a.consultora_id = c.id
                AND a.criado_em = (SELECT MAX(criado_em) FROM assinaturas WHERE consultora_id = c.id)
              ORDER BY c.criado_em ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

// PUT /api/admin/users/:id — edit consultora data + role
router.put('/users/:id', async (req, res) => {
    const { nome, email, telefone, role } = req.body;
    // Prevent removing own admin role
    if (req.params.id === req.consultora.id && role !== 'admin') {
        return res.status(400).json({ error: 'Você não pode remover seu próprio acesso de administrador.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE consultoras SET nome=$1, email=$2, telefone=$3, role=$4, atualizado_em=NOW()
             WHERE id=$5
             RETURNING id, nome, email, telefone, role`,
            [nome, email, telefone || null, role || 'user', req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true, consultora: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// PUT /api/admin/users/:id/password — admin changes user password
router.put('/users/:id/password', async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    try {
        const bcrypt = require('bcryptjs');
        const senhaHash = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `UPDATE consultoras SET senha_hash=$1, atualizado_em=NOW() WHERE id=$2 RETURNING id`,
            [senhaHash, req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar senha do usuário.' });
    }
});

// PUT /api/admin/users/:id/plan — update subscription plan
router.put('/users/:id/plan', async (req, res) => {
    const { plano, status } = req.body;
    try {
        // Upsert: update most recent subscription or insert new one
        const existing = await pool.query(
            'SELECT id FROM assinaturas WHERE consultora_id=$1 ORDER BY criado_em DESC LIMIT 1',
            [req.params.id]
        );
        if (existing.rows.length > 0) {
            await pool.query(
                'UPDATE assinaturas SET plano=$1, status=$2 WHERE id=$3',
                [plano, status, existing.rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO assinaturas (consultora_id, plano, status) VALUES ($1, $2, $3)',
                [req.params.id, plano, status]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
});

// DELETE /api/admin/users/:id — delete consultora + all their data
router.delete('/users/:id', async (req, res) => {
    if (req.params.id === req.consultora.id) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }
    try {
        await pool.query('DELETE FROM consultoras WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

// GET /api/admin/users/:id/tracking — get a user's tracking config
router.get('/users/:id/tracking', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT rastreamento FROM consultoras WHERE id = $1', [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ rastreamento: rows[0].rastreamento || {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar configurações de rastreamento.' });
    }
});

// PUT /api/admin/users/:id/tracking — update a user's tracking config
router.put('/users/:id/tracking', async (req, res) => {
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
        const { rows } = await pool.query(
            `UPDATE consultoras SET rastreamento=$1, atualizado_em=NOW() WHERE id=$2 RETURNING id`,
            [JSON.stringify(rastreamento), req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar configurações de rastreamento.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  PLANOS (CRUD)
// ══════════════════════════════════════════════════════════════

// GET /api/admin/planos
router.get('/planos', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM planos ORDER BY preco_mensal ASC`);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar planos.' });
    }
});

// POST /api/admin/planos
router.post('/planos', async (req, res) => {
    const { slug, nome, preco_mensal, clientes_max, anamneses_mes_max,
        tem_integracoes, tem_pipeline, tem_multiusuario, tem_relatorios, hotmart_offer_id } = req.body;
    if (!slug || !nome) return res.status(400).json({ error: 'slug e nome são obrigatórios.' });
    try {
        const { rows } = await pool.query(
            `INSERT INTO planos (slug, nome, preco_mensal, clientes_max, anamneses_mes_max,
               tem_integracoes, tem_pipeline, tem_multiusuario, tem_relatorios, hotmart_offer_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [slug, nome, preco_mensal || 0,
                clientes_max || null, anamneses_mes_max || null,
                !!tem_integracoes, tem_pipeline !== false,
                !!tem_multiusuario, tem_relatorios !== false,
                hotmart_offer_id || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Já existe um plano com esse slug.' });
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar plano.' });
    }
});

// PUT /api/admin/planos/:id
router.put('/planos/:id', async (req, res) => {
    const { nome, preco_mensal, clientes_max, anamneses_mes_max,
        tem_integracoes, tem_pipeline, tem_multiusuario, tem_relatorios,
        hotmart_offer_id, ativo } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE planos SET
               nome=$1, preco_mensal=$2, clientes_max=$3, anamneses_mes_max=$4,
               tem_integracoes=$5, tem_pipeline=$6, tem_multiusuario=$7, tem_relatorios=$8,
               hotmart_offer_id=$9, ativo=$10, atualizado_em=NOW()
             WHERE id=$11 RETURNING *`,
            [nome, preco_mensal || 0,
                clientes_max || null, anamneses_mes_max || null,
                !!tem_integracoes, tem_pipeline !== false,
                !!tem_multiusuario, tem_relatorios !== false,
                hotmart_offer_id || null, ativo !== false,
                req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Plano não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
});

// DELETE /api/admin/planos/:id
router.delete('/planos/:id', async (req, res) => {
    try {
        const { rows: inUse } = await pool.query(
            `SELECT COUNT(*) FROM assinaturas a
             JOIN planos p ON p.slug = a.plano AND p.id = $1
             WHERE a.status IN ('active','trial')`,
            [req.params.id]
        );
        if (parseInt(inUse[0].count) > 0) {
            return res.status(409).json({ error: 'Existem assinaturas ativas usando este plano. Desative-o em vez de excluir.' });
        }
        await pool.query('DELETE FROM planos WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir plano.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  USO & CORTESIA
// ══════════════════════════════════════════════════════════════

// GET /api/admin/users/:id/uso — uso atual do membro vs. limites do plano
router.get('/users/:id/uso', async (req, res) => {
    try {
        const { rows: subRows } = await pool.query(
            `SELECT a.plano, a.status, a.trial_fim, a.periodo_fim,
                    p.clientes_max, p.anamneses_mes_max, p.tem_integracoes,
                    p.tem_pipeline, p.tem_multiusuario
             FROM assinaturas a
             LEFT JOIN planos p ON p.slug = a.plano
             WHERE a.consultora_id=$1
             ORDER BY a.criado_em DESC LIMIT 1`,
            [req.params.id]
        );
        const sub = subRows[0] || {};

        const [{ count: totalClientes }] = (await pool.query(
            'SELECT COUNT(*) FROM clientes WHERE consultora_id=$1 AND ativo=TRUE', [req.params.id]
        )).rows;

        const inicio = new Date();
        inicio.setDate(1); inicio.setHours(0, 0, 0, 0);
        const [{ count: anamnesesMes }] = (await pool.query(
            'SELECT COUNT(*) FROM anamneses WHERE consultora_id=$1 AND criado_em >= $2 AND link_origem_id IS NULL',
            [req.params.id, inicio]
        )).rows;

        res.json({
            plano: sub.plano || 'starter',
            status: sub.status || 'trial',
            trial_fim: sub.trial_fim,
            periodo_fim: sub.periodo_fim,
            clientes_max: sub.clientes_max,
            anamneses_mes_max: sub.anamneses_mes_max,
            tem_integracoes: sub.tem_integracoes,
            tem_pipeline: sub.tem_pipeline,
            tem_multiusuario: sub.tem_multiusuario,
            uso: {
                clientes: parseInt(totalClientes),
                anamneses_mes: parseInt(anamnesesMes),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar uso.' });
    }
});

// POST /api/admin/users/:id/cortesia — estender trial por N dias
router.post('/users/:id/cortesia', async (req, res) => {
    const { dias, observacao } = req.body;
    if (!dias || dias < 1 || dias > 365) {
        return res.status(400).json({ error: 'Informe um número de dias entre 1 e 365.' });
    }
    try {
        const { rows: existing } = await pool.query(
            'SELECT id, trial_fim, periodo_fim, status FROM assinaturas WHERE consultora_id=$1 ORDER BY criado_em DESC LIMIT 1',
            [req.params.id]
        );
        const base = existing[0];
        const now = new Date();

        if (base) {
            // Extend from current trial_fim or now, whichever is later
            const currentFim = base.trial_fim ? new Date(base.trial_fim) : now;
            const newFim = new Date(Math.max(currentFim, now));
            newFim.setDate(newFim.getDate() + parseInt(dias));
            await pool.query(
                `UPDATE assinaturas SET trial_fim=$1, trial_fim_estendido=$1, status='trial',
                  observacoes=COALESCE(observacoes||E'\n', '') || $2, atualizado_em=NOW()
                 WHERE id=$3`,
                [newFim, `[${now.toISOString().split('T')[0]}] Cortesia +${dias}d: ${observacao || '—'}`, base.id]
            );
        } else {
            const newFim = new Date(now);
            newFim.setDate(newFim.getDate() + parseInt(dias));
            await pool.query(
                `INSERT INTO assinaturas (consultora_id, plano, status, trial_fim, observacoes)
                 VALUES ($1, 'starter', 'trial', $2, $3)`,
                [req.params.id, newFim, `Cortesia inicial +${dias}d: ${observacao || '—'}`]
            );
        }
        res.json({ success: true, dias_concedidos: parseInt(dias) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao conceder cortesia.' });
    }
});

// GET /api/admin/users/:id/pagamentos — histórico de eventos Hotmart
router.get('/users/:id/pagamentos', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, gateway, evento, transaction_id, plano, valor, status, criado_em
             FROM pagamentos WHERE consultora_id=$1 ORDER BY criado_em DESC LIMIT 50`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
});

// POST /api/admin/users/:id/reenviar-acesso — gera nova senha temp e reenvia email de boas-vindas
router.post('/users/:id/reenviar-acesso', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.nome, c.email, a.plano
             FROM consultoras c
             LEFT JOIN assinaturas a ON a.consultora_id = c.id
             WHERE c.id = $1
             ORDER BY a.criado_em DESC LIMIT 1`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const { nome, email, plano } = rows[0];

        // Generate and save new temp password
        const bcrypt = require('bcryptjs');
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
        const tempPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const hash = await bcrypt.hash(tempPassword, 10);
        await pool.query(
            'UPDATE consultoras SET senha_hash=$1, atualizado_em=NOW() WHERE id=$2',
            [hash, req.params.id]
        );

        // Send welcome email — throwOnError:true so the admin sees real SMTP errors
        const { sendWelcomeEmail } = require('../lib/mailer');
        await sendWelcomeEmail({ nome, email, senhaProvisoria: tempPassword, plano, throwOnError: true });

        console.log(`[Admin] 📧 Acesso reenviado para ${email} por ${req.consultora.email}`);
        res.json({ success: true, email, message: 'Email de acesso reenviado com nova senha temporária.' });
    } catch (err) {
        console.error('[Admin] reenviar-acesso error:', err.message);
        res.status(500).json({ error: 'Erro ao reenviar acesso: ' + err.message });
    }
});

// POST /api/admin/send-test-email — envia email de teste real para o admin logado
router.post('/send-test-email', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT nome, email FROM consultoras WHERE id=$1', [req.consultora.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Admin não encontrado.' });
        const { nome, email } = rows[0];

        const { sendEmail } = require('../lib/mailer');
        // sendEmail não é exportado diretamente, usamos sendWelcomeEmail como proxy
        const { isConfigured } = require('../lib/mailer');
        if (!isConfigured()) {
            return res.status(400).json({ error: 'Nenhum provedor de email configurado. Configure BREVO_API_KEY ou SMTP_USER+SMTP_PASS.' });
        }

        // Envio direto via Brevo ou SMTP
        const mailer = require('../lib/mailer');
        const isBrevo = mailer.isBrevoConfigured();

        if (isBrevo) {
            const apiKey = process.env.BREVO_API_KEY;
            const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
            const body = {
                sender: { email: fromEmail, name: 'Gota Essencial' },
                to: [{ email, name: nome }],
                subject: '🧪 Teste de Email — Gota Essencial',
                htmlContent: `<div style="font-family:sans-serif;padding:24px;max-width:500px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px">
                  <h2 style="color:#0a4a2a">✅ Email de Teste</h2>
                  <p>Olá <strong>${nome}</strong>,</p>
                  <p>Este é um teste de envio de email da plataforma <strong>Gota Essencial</strong>.</p>
                  <p>Se você recebeu esta mensagem, a configuração de email está funcionando corretamente! 🎉</p>
                  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
                  <small style="color:#94a3b8">Enviado por: ${fromEmail}</small>
                </div>`,
                textContent: `Olá ${nome}, este é um teste de email da Gota Essencial. Se você recebeu, está funcionando!`,
            };

            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'accept': 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) {
                return res.status(500).json({
                    error: `Brevo recusou o envio: ${data.message || JSON.stringify(data)}`,
                    detail: data,
                });
            }
            console.log(`[Admin] 🧪 Email de teste enviado para ${email} via Brevo:`, data.messageId);
            return res.json({ success: true, sentTo: email, method: 'brevo', messageId: data.messageId });
        } else {
            // SMTP fallback
            const nodemailer = require('nodemailer');
            const transport = nodemailer.createTransport({
                service: process.env.SMTP_SERVICE,
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });
            const info = await transport.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: '🧪 Teste de Email — Gota Essencial',
                text: `Olá ${nome}, este é um teste de email da Gota Essencial. Funcionou!`,
            });
            console.log(`[Admin] 🧪 Email de teste enviado para ${email} via SMTP:`, info.messageId);
            return res.json({ success: true, sentTo: email, method: 'smtp', messageId: info.messageId });
        }
    } catch (err) {
        console.error('[Admin] send-test-email error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/test-email — testa conexão de email (Brevo ou SMTP)
router.get('/test-smtp', async (req, res) => {
    const { verifyConnection, isConfigured, isBrevoConfigured, isSmtpConfigured } = require('../lib/mailer');

    const config = {
        modo: isBrevoConfigured() ? 'Brevo API (HTTP)' : isSmtpConfigured() ? 'SMTP (nodemailer)' : 'Nenhum configurado',
        BREVO_API_KEY: process.env.BREVO_API_KEY ? '*** configurado ***' : '(não definido)',
        BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || '(não definido)',
        SMTP_SERVICE: process.env.SMTP_SERVICE || '(não definido)',
        SMTP_HOST: process.env.SMTP_HOST || '(não definido)',
        SMTP_PORT: process.env.SMTP_PORT || '(não definido)',
        SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : '(não definido)',
        SMTP_PASS: process.env.SMTP_PASS ? '*** configurado ***' : '(não definido)',
        PLATFORM_URL: process.env.PLATFORM_URL || '(não definido)',
        configured: isConfigured(),
    };

    if (!config.configured) {
        return res.status(400).json({
            success: false,
            error: 'Nenhum provedor de email configurado.',
            config,
            dicas: [
                'OPÇÃO 1 (Recomendada para Railway): Crie conta grátis em brevo.com, gere uma API Key e configure BREVO_API_KEY + BREVO_SENDER_EMAIL no Railway.',
                'OPÇÃO 2 (SMTP): Configure SMTP_SERVICE=gmail + SMTP_USER + SMTP_PASS (senha de app) — pode não funcionar se Railway bloquear a porta.',
            ],
        });
    }

    try {
        const result = await verifyConnection();
        res.json({
            success: true,
            message: `✅ Conexão verificada via ${result.method === 'brevo' ? 'Brevo API' : 'SMTP'}`,
            detail: result,
            config,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            config,
            dicas: isBrevoConfigured() ? [
                'Verifique se a BREVO_API_KEY está correta (copie do painel Brevo → SMTP & API → API Keys).',
                'Verifique se o BREVO_SENDER_EMAIL é um remetente verificado no Brevo.',
            ] : [
                'Railway frequentemente bloqueia portas SMTP (587, 465). Use Brevo API em vez de SMTP.',
                'Para criar conta Brevo grátis: brevo.com → Sign up → SMTP & API → API Keys.',
            ],
        });
    }
});

// ══════════════════════════════════════════════════════════════
//  SYSTEM SETTINGS (payment gateway, etc.)
// ══════════════════════════════════════════════════════════════

// GET /api/admin/settings — get all system settings
router.get('/settings', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT chave, valor FROM configuracoes`);
        const settings = {};
        rows.forEach(r => { settings[r.chave] = r.valor; });
        // Mask sensitive tokens for display
        if (settings.hotmart_hottok) {
            const tok = settings.hotmart_hottok;
            settings.hotmart_hottok_masked = tok.length > 8
                ? tok.slice(0, 4) + '••••' + tok.slice(-4)
                : '••••••••';
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar configurações.' });
    }
});

// PUT /api/admin/settings — update system settings (upsert)
router.put('/settings', async (req, res) => {
    const allowed = [
        'hotmart_hottok', 'hotmart_product_id', 'hotmart_plano_map',
        'gateway_ativo', 'checkout_url'
    ];
    try {
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                await pool.query(
                    `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
                     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
                    [key, req.body[key] || null]
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
});

module.exports = router;
