/* ============================================================
   MAILER — Sends transactional emails via SMTP (nodemailer)
   Configure via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
   Supports Gmail, SendGrid, Brevo, Zoho, etc.
   ============================================================ */

const nodemailer = require('nodemailer');

function createTransport() {
    // Support pre-built service shortcuts (e.g. SMTP_SERVICE=gmail)
    if (process.env.SMTP_SERVICE) {
        return nodemailer.createTransport({
            service: process.env.SMTP_SERVICE,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

const FROM = process.env.SMTP_FROM || `"Gota Essencial" <${process.env.SMTP_USER}>`;
const PLATFORM_URL = process.env.PLATFORM_URL || 'https://gotaessencial.com.br';

/**
 * Send welcome email to a new member with temporary password.
 */
async function sendWelcomeEmail({ nome, email, senhaProvisoria, plano }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[Mailer] ⚠️ SMTP não configurado. Email de boas-vindas não enviado para:', email);
        return;
    }

    const transporter = createTransport();
    const loginUrl = `${PLATFORM_URL}/#/login`;

    const planLabels = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
    const planNome = planLabels[plano] || plano || 'Starter';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif; }
  .container { max-width:580px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.08); }
  .header { background:linear-gradient(135deg,#0a4a2a,#1a7a45); padding:40px 32px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:1.5rem; }
  .header p { color:rgba(255,255,255,.8); margin:6px 0 0; font-size:0.9rem; }
  .logo { font-size:2rem; margin-bottom:12px; }
  .body { padding:36px 32px; }
  .greeting { font-size:1.1rem; color:#1a2e1a; font-weight:600; margin-bottom:16px; }
  .text { color:#4a5568; line-height:1.7; margin-bottom:16px; font-size:0.95rem; }
  .credentials { background:#f0fdf4; border:2px solid #86efac; border-radius:12px; padding:20px 24px; margin:24px 0; }
  .cred-label { font-size:0.75rem; color:#16a34a; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
  .cred-value { font-size:1rem; font-weight:600; color:#0a2818; font-family:monospace; margin-bottom:12px; word-break:break-all; }
  .cred-value:last-child { margin-bottom:0; }
  .btn { display:inline-block; background:linear-gradient(135deg,#0a4a2a,#1a7a45); color:#fff; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:700; font-size:1rem; margin:8px 0; }
  .warning { background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:12px 16px; font-size:0.83rem; color:#92400e; margin:16px 0; }
  .steps { margin:24px 0; }
  .step { display:flex; gap:12px; margin-bottom:16px; align-items:flex-start; }
  .step-num { background:#0a4a2a; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; }
  .step-text { color:#4a5568; font-size:0.9rem; line-height:1.5; }
  .footer { background:#f8fafb; padding:20px 32px; text-align:center; font-size:0.77rem; color:#94a3b8; border-top:1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">💧</div>
    <h1>Gota Essencial</h1>
    <p>Plataforma para Consultoras de Bem-Estar</p>
  </div>
  <div class="body">
    <div class="greeting">Olá, ${nome}! 🎉</div>
    <p class="text">
      Sua compra do plano <strong>${planNome}</strong> foi aprovada com sucesso!
      Criamos sua conta na plataforma <strong>Gota Essencial</strong> automaticamente.
    </p>
    <p class="text">Use as credenciais abaixo para fazer seu primeiro acesso:</p>

    <div class="credentials">
      <div class="cred-label">Seu E-mail de Acesso</div>
      <div class="cred-value">${email}</div>
      <div class="cred-label">Senha Provisória</div>
      <div class="cred-value">${senhaProvisoria}</div>
    </div>

    <div style="text-align:center;margin:28px 0">
      <a class="btn" href="${loginUrl}">🚀 Acessar a Plataforma</a>
    </div>

    <div class="warning">
      ⚠️ <strong>Por segurança, troque sua senha após o primeiro acesso.</strong>
      Vá em <em>Meu Perfil → Alterar Senha</em>.
    </div>

    <div class="steps">
      <p style="font-weight:700;color:#1a2e1a;margin-bottom:12px">📋 Primeiros passos recomendados:</p>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Faça login</strong> com suas credenciais acima</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Complete seu perfil</strong> (foto, bio, redes sociais) — isso ativa sua página pública</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Crie seu primeiro link de anamnese</strong> e compartilhe com seus clientes</div>
      </div>
      <div class="step">
        <div class="step-num">4</div>
        <div class="step-text"><strong>Troque a senha provisória</strong> em Meu Perfil → Segurança</div>
      </div>
    </div>
  </div>
  <div class="footer">
    Gota Essencial • Este é um e-mail automático, não responda.<br>
    En caso de dúvidas, entre em contato com o suporte.
  </div>
</div>
</body>
</html>`;

    try {
        const info = await transporter.sendMail({
            from: FROM,
            to: email,
            subject: `🎉 Bem-vindo(a) à Gota Essencial! Seus dados de acesso estão aqui`,
            html,
            text: `Olá ${nome}!\n\nSua conta na Gota Essencial foi criada.\n\nE-mail: ${email}\nSenha provisória: ${senhaProvisoria}\n\nAcesse: ${loginUrl}\n\nTroque sua senha após o primeiro login.`,
        });
        console.log(`[Mailer] ✅ Email de boas-vindas enviado para ${email}:`, info.messageId);
        return info;
    } catch (err) {
        console.error(`[Mailer] ❌ Erro ao enviar email para ${email}:`, err.message);
        // Never throw — email failure shouldn't block the webhook response
    }
}

/**
 * Send cancellation notification email.
 */
async function sendCancellationEmail({ nome, email }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
    const transporter = createTransport();
    try {
        await transporter.sendMail({
            from: FROM,
            to: email,
            subject: `Sua assinatura Gota Essencial foi cancelada`,
            html: `<p>Olá ${nome},</p><p>Sua assinatura foi cancelada. Caso queira reativar, acesse <a href="${PLATFORM_URL}">${PLATFORM_URL}</a>.</p>`,
            text: `Olá ${nome},\n\nSua assinatura foi cancelada. Para reativar: ${PLATFORM_URL}`,
        });
    } catch (err) {
        console.error('[Mailer] Erro ao enviar email de cancelamento:', err.message);
    }
}

module.exports = { sendWelcomeEmail, sendCancellationEmail };
