/* ============================================================
   MAILER — Email transacional com dual-mode:
   1. BREVO_API_KEY → usa Brevo API HTTP (sem SMTP, funciona em qualquer host)
   2. SMTP_* → usa nodemailer SMTP (Gmail, SendGrid, etc.)
   ============================================================ */

const nodemailer = require('nodemailer');

// ── Configuração dinâmica (lida a cada chamada, não no boot) ──────────────

function getFrom() {
  return process.env.SMTP_FROM || `"Gota Essencial" <${process.env.SMTP_USER || process.env.BREVO_SENDER_EMAIL}>`;
}

function getPlatformUrl() {
  return process.env.PLATFORM_URL || 'https://gotaessencial.com.br';
}

function isBrevoConfigured() {
  return !!(process.env.BREVO_API_KEY);
}

function isSmtpConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function isConfigured() {
  return isBrevoConfigured() || isSmtpConfigured();
}

// ── Brevo HTTP API ────────────────────────────────────────────────────────

async function sendViaBrevo({ to, toName, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.BREVO_SENDER_NAME || 'Gota Essencial';

  const body = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to, name: toName || to }],
    subject,
    htmlContent: html,
    textContent: text,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Brevo API error ${response.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

// ── SMTP via nodemailer ───────────────────────────────────────────────────

function createSmtpTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE;

  if (service) {
    return nodemailer.createTransport({ service, auth: { user, pass } });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

// ── Verify connection (with timeout) ─────────────────────────────────────

async function verifyConnection() {
  if (!isConfigured()) {
    throw new Error('Nenhum provedor de email configurado. Configure BREVO_API_KEY ou SMTP_USER+SMTP_PASS.');
  }

  if (isBrevoConfigured()) {
    // Test Brevo API with a lightweight call
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY, 'accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Brevo: ${data.message || 'API key inválida'}`);
    return { method: 'brevo', account: data.email || 'OK' };
  }

  // SMTP verify with timeout
  const transporter = createSmtpTransport();
  await Promise.race([
    transporter.verify(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(
        'Timeout de 15s — Railway pode estar bloqueando a porta SMTP. ' +
        'Tente usar BREVO_API_KEY (grátis em brevo.com) para evitar SMTP.'
      )), 15000)
    ),
  ]);
  return { method: 'smtp', user: process.env.SMTP_USER };
}

// ── Unified send ──────────────────────────────────────────────────────────

async function sendEmail({ to, toName, subject, html, text, throwOnError = false }) {
  if (!isConfigured()) {
    const msg = 'Email não enviado: configure BREVO_API_KEY ou SMTP_USER+SMTP_PASS no Railway.';
    console.warn('[Mailer] ⚠️', msg);
    if (throwOnError) throw new Error(msg);
    return;
  }

  try {
    let info;
    if (isBrevoConfigured()) {
      info = await sendViaBrevo({ to, toName, subject, html, text });
      console.log(`[Mailer] ✅ Brevo enviou para ${to}:`, info.messageId || JSON.stringify(info));
    } else {
      const transporter = createSmtpTransport();
      info = await transporter.sendMail({ from: getFrom(), to, subject, html, text });
      console.log(`[Mailer] ✅ SMTP enviou para ${to}:`, info.messageId);
    }
    return info;
  } catch (err) {
    console.error(`[Mailer] ❌ Erro ao enviar para ${to}:`, err.message);
    if (throwOnError) throw new Error(`Falha ao enviar email: ${err.message}`);
  }
}

// ── Welcome email template ────────────────────────────────────────────────

async function sendWelcomeEmail({ nome, email, senhaProvisoria, plano, throwOnError = false }) {
  const loginUrl = getPlatformUrl(); // link para a raiz — o app redireciona para login automaticamente
  const planLabels = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
  const planNome = planLabels[plano] || plano || 'Starter';

  const credBlock = senhaProvisoria ? `
    <div class="credentials">
      <div class="cred-label">Seu E-mail de Acesso</div>
      <div class="cred-value">${email}</div>
      <div class="cred-label">Senha Provisória</div>
      <div class="cred-value">${senhaProvisoria}</div>
    </div>
    <div class="warning">⚠️ <strong>Por segurança, troque sua senha após o primeiro acesso.</strong> Vá em <em>Meu Perfil → Alterar Senha</em>.</div>
    ` : `
    <div class="credentials">
      <div class="cred-label">Seu E-mail de Acesso</div>
      <div class="cred-value">${email}</div>
    </div>
    <p class="text">Use sua senha atual para acessar.</p>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif}
  .container{max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#0a4a2a,#1a7a45);padding:40px 32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:1.5rem}
  .header p{color:rgba(255,255,255,.8);margin:6px 0 0;font-size:.9rem}
  .logo{font-size:2rem;margin-bottom:12px}
  .body{padding:36px 32px}
  .greeting{font-size:1.1rem;color:#1a2e1a;font-weight:600;margin-bottom:16px}
  .text{color:#4a5568;line-height:1.7;margin-bottom:16px;font-size:.95rem}
  .credentials{background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px 24px;margin:24px 0}
  .cred-label{font-size:.75rem;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .cred-value{font-size:1rem;font-weight:600;color:#0a2818;font-family:monospace;margin-bottom:12px;word-break:break-all}
  .cred-value:last-child{margin-bottom:0}
  .btn{display:inline-block;background:linear-gradient(135deg,#0a4a2a,#1a7a45);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:1rem;margin:8px 0}
  .warning{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:.83rem;color:#92400e;margin:16px 0}
  .step{display:flex;gap:12px;margin-bottom:16px;align-items:flex-start}
  .step-num{background:#0a4a2a;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0}
  .step-text{color:#4a5568;font-size:.9rem;line-height:1.5}
  .footer{background:#f8fafb;padding:20px 32px;text-align:center;font-size:.77rem;color:#94a3b8;border-top:1px solid #e2e8f0}
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
    <p class="text">${senhaProvisoria
      ? `Sua compra do plano <strong>${planNome}</strong> foi aprovada! Criamos sua conta automaticamente.`
      : `Seus dados de acesso foram atualizados.`}
    </p>
    <p class="text">Use as credenciais abaixo para acessar:</p>
    ${credBlock}
    <div style="text-align:center;margin:28px 0">
      <a class="btn" href="${loginUrl}">🚀 Acessar a Plataforma</a>
    </div>
    <div style="margin:24px 0">
      <p style="font-weight:700;color:#1a2e1a;margin-bottom:12px">📋 Primeiros passos:</p>
      <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Faça login</strong> com suas credenciais acima</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Complete seu perfil</strong> — ativa sua página pública</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Crie seu primeiro link de anamnese</strong></div></div>
      ${senhaProvisoria ? '<div class="step"><div class="step-num">4</div><div class="step-text"><strong>Troque a senha provisória</strong> em Meu Perfil → Segurança</div></div>' : ''}
    </div>
  </div>
  <div class="footer">Gota Essencial • E-mail automático, não responda.</div>
</div>
</body></html>`;

  return sendEmail({
    to: email,
    toName: nome,
    subject: senhaProvisoria
      ? `🎉 Bem-vindo(a) à Gota Essencial! Seus dados de acesso estão aqui`
      : `📧 Seus dados de acesso — Gota Essencial`,
    html,
    text: `Olá ${nome}!\n\nE-mail: ${email}${senhaProvisoria ? `\nSenha provisória: ${senhaProvisoria}` : ''}\n\nAcesse: ${loginUrl}`,
    throwOnError,
  });
}

async function sendCancellationEmail({ nome, email }) {
  const url = getPlatformUrl();
  return sendEmail({
    to: email,
    toName: nome,
    subject: `Sua assinatura Gota Essencial foi cancelada`,
    html: `<p>Olá ${nome},</p><p>Sua assinatura foi cancelada. Para reativar acesse <a href="${url}">${url}</a>.</p>`,
    text: `Olá ${nome},\n\nSua assinatura foi cancelada. Para reativar: ${url}`,
  });
}

module.exports = { sendWelcomeEmail, sendCancellationEmail, verifyConnection, isConfigured, isBrevoConfigured, isSmtpConfigured };
