require('dotenv').config();
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { runMigrations } = require('./db/migrationRunner');

// ─── Validação de variáveis de ambiente obrigatórias ──────────────────────────
// Em produção, o servidor aborta imediatamente se JWT_SECRET não estiver definido.
// Isso evita tokens assinados com 'dev_secret' chegarem em produção.
const REQUIRED_ENVS = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENVS.filter(k => !process.env[k]);
if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`❌ FATAL: Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
    console.error('   Configure essas variáveis no Railway/Heroku antes de iniciar.');
    process.exit(1);
}
if (missing.length > 0) {
    console.warn(`⚠️  [DEV] Variáveis ausentes: ${missing.join(', ')} — usando fallbacks de desenvolvimento.`);
}

const app = express();
app.use(compression());
const PORT = process.env.PORT || 3001;
const VERSION = '1.8';

// ─── Security ───
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",          // inline scripts (nosso snippet do pixel)
                "https://connect.facebook.net",
                "https://www.googletagmanager.com",
                "https://www.google-analytics.com",
                "https://www.clarity.ms",
                "https://cdn.clarity.ms",
            ],
            scriptSrcAttr: ["'unsafe-inline'"],   // allow onclick="..." in templates
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                // Tracking pixels
                "https://www.facebook.com",
                "https://*.fbcdn.net",
                "https://www.google-analytics.com",
                // Avatar / profile photo CDNs
                "https://*.googleusercontent.com",
                "https://*.gravatar.com",
                "https://res.cloudinary.com",       // Cloudinary
                "https://*.supabase.co",            // Supabase Storage
                "https://i.ibb.co",                 // imgBB
                "https://*.railway.app",            // Railway static
                "https://*.githubusercontent.com",  // GitHub avatars
                // NOTE: wildcard (*) removed — add new CDN domains explicitly as needed
            ],
            connectSrc: [
                "'self'",
                "https://www.facebook.com",         // fbevents tracking requests
                "https://connect.facebook.net",
                "https://www.google-analytics.com",
                "https://analytics.google.com",
                "https://www.clarity.ms",
                "https://*.clarity.ms",
                "https://stats.g.doubleclick.net",
            ],
            frameSrc: [
                "'self'",
                "https://www.googletagmanager.com",
                "https://www.youtube.com",
                "https://player.vimeo.com",
            ],
        },
    },
    // Helmet default é "no-referrer" — isso impede o Meta Pixel de verificar
    // o domínio de origem e bloqueia o disparo de eventos.
    // strict-origin-when-cross-origin envia a origem (domínio) em requests cross-origin.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS — Whitelist de origens ─────────────────────────────────────────────
// Em produção: somente os domínios da plataforma são aceitos.
// Configure ALLOWED_ORIGINS no Railway como lista separada por vírgula.
// Ex: ALLOWED_ORIGINS=https://gotaessencial.com.br,https://app.gotaessencial.com.br
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Permite requisições sem origin (ex: apps mobile, curl, Postman em dev)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origem não permitida — ${origin}`));
        }
    },
    credentials: true,
}));


// ─── Rate Limiting ───────────────────────────────────────────────────────────
// General API limit: 100 requests per minute per IP
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,          // 1 minute
    max: 100,
    standardHeaders: true,         // Return RateLimit-* headers
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em um momento.' },
    skip: (req) => req.path === '/health', // never limit health checks
});

// Strict limit for auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,     // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);


// Force Referrer-Policy to allow Meta Pixel domain verification.
// Helmet defaults to "no-referrer" which blocks fbq from verifying the origin domain.
app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});


// Health check (no DB, never fails)
app.get('/health', (req, res) => res.json({
    status: 'ok', version: VERSION, ts: new Date(),
    db: !!process.env.DATABASE_URL, env: process.env.NODE_ENV,
}));



// Stripe webhook — raw body BEFORE json parser
app.use('/api/assinatura/webhook',
    express.raw({ type: 'application/json' }),
    require('./routes/assinatura')
);

// Body parser
app.use(express.json({ limit: '2mb' }));

// ─── CSRF Protection ───
// Valida X-CSRF-Token em requisições que modificam dados (POST/PUT/DELETE).
// Pula automaticamente se não há Authorization header (rota pública)
// ou se é um método seguro (GET/HEAD/OPTIONS).
const { csrfCheck } = require('./middleware/csrf');

// Pre-parser leve: decodifica o JWT sem verificar (apenas para o csrfCheck
// detectar se há usuário autenticado). O middleware auth.js nos routers
// faz a verificação completa e segura.
const jwt = require('jsonwebtoken');
app.use('/api', (req, res, next) => {
    if (!req.consultora) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // decode sem verificar assinatura — apenas para popular req.consultora
            // para que csrfCheck saiba se a rota é autenticada
            req.consultora = jwt.decode(authHeader.split(' ')[1]) || undefined;
        }
    }
    next();
});

app.use('/api', csrfCheck);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/anamneses', require('./routes/anamneses'));
app.use('/api/agendamentos', require('./routes/agendamentos'));
app.use('/api/assinatura', require('./routes/assinatura'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/depoimentos', require('./routes/depoimentos'));
app.use('/api/etiquetas', require('./routes/etiquetas'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/publico', require('./routes/publico'));
app.use('/api/hotmart', require('./routes/hotmart'));
app.use('/api/links', require('./routes/links'));
app.use('/api/avisos', require('./routes/avisos'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/prospects', require('./routes/prospects'));
app.use('/api/estoque', require('./routes/estoque'));
app.use('/api/aulas', require('./routes/aulas'));

app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin-notifications', require('./routes/admin_notifications'));
app.use('/api/compras', require('./routes/compras'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/equipe', require('./routes/equipe'));

// Rota pública raiz para SEO / Open Graph (Prévias de Link)
app.use('/convite', require('./routes/share'));

// Serve frontend static files
// Cache: 7d for immutable assets (CSS, images, fonts)
//        no-cache for HTML/JS (SPA code that changes frequently)
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
        // HTML, JS and JSON should always be fresh
        if (filePath.endsWith('.html') || filePath.endsWith('.json') || filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            // CSS, JS, Images, Fonts — allow long term cache
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
    }
}));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});



// Central error handler — catches next(err) from async routes
app.use((err, req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    // Sempre loga no servidor (invisível ao usuário)
    console.error('❌ Erro:', err.stack || err.message);
    // Em produção: nunca expõe détalhes técnicos ao cliente
    res.status(err.status || 500).json({
        error: isProd ? 'Erro interno do servidor.' : (err.message || 'Erro interno.'),
        ...(isProd ? {} : { stack: err.stack }),
    });
});

// ── Auto-run schema migrations (incremental — só roda o que ainda não foi aplicado) ──
async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL não configurado — migrations ignoradas.');
        return;
    }
    const pool = require('./db/pool');
    try {
        await runMigrations(pool);
    } catch (err) {
        // Migrations falhando não devem parar o servidor em produção;
        // apenas loga para que o time investigue via Railway logs.
        console.error('⚠️  Erro nas migrations (servidor continua):', err.message);
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 API v${VERSION} na porta ${PORT}`);
    console.log(`📦 DATABASE_URL: ${process.env.DATABASE_URL ? '✅' : '❌'}`);
    console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
    await runMigration();

    // ── DB Keepalive: mantém conexões quentes a cada 4 min ─────────────────
    // Evita que o PostgreSQL no Railway feche conexões idle e cause
    // latência alta nos primeiros requests após períodos de inatividade.
    const pool = require('./db/pool');
    setInterval(async () => {
        try {
            await pool.query('SELECT 1');
            console.log('[keepalive] DB ping OK');
        } catch (e) {
            console.warn('[keepalive] DB ping failed:', e.message);
        }
    }, 4 * 60 * 1000); // 4 minutos
});

module.exports = app;
