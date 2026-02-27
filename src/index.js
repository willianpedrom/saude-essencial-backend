require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
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
                "https://www.facebook.com",         // pixel noscript img
                "https://*.fbcdn.net",
                "https://www.google-analytics.com",
                "https://*.googleusercontent.com",
                "https://*.gravatar.com",
                "*",                                // fotos de perfil de URLs externas
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
            ],
        },
    },
    // Helmet default é "no-referrer" — isso impede o Meta Pixel de verificar
    // o domínio de origem e bloqueia o disparo de eventos.
    // strict-origin-when-cross-origin envia a origem (domínio) em requests cross-origin.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({ origin: true, credentials: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));


// Health check (no DB, never fails)
app.get('/health', (req, res) => res.json({
    status: 'ok', version: VERSION, ts: new Date(),
    db: !!process.env.DATABASE_URL, env: process.env.NODE_ENV,
}));

// DB diagnostic endpoint
app.get('/debug-db', async (req, res) => {
    const url = process.env.DATABASE_URL || '';
    const masked = url.replace(/:([^@]+)@/, ':***@');
    let testResult = 'not tested';
    try {
        const pool = require('./db/pool');
        await pool.query('SELECT 1 as ok');
        testResult = 'connection OK ✅';
    } catch (err) {
        testResult = err.message;
    }
    res.json({ url: masked, testResult });
});


// Stripe webhook — raw body BEFORE json parser
app.use('/api/assinatura/webhook',
    express.raw({ type: 'application/json' }),
    require('./routes/assinatura')
);

// Body parser
app.use(express.json({ limit: '2mb' }));

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

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});



// Central error handler — catches next(err) from async routes
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.', details: err.message });
});

// Auto-run schema migration
async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL não configurado.');
        return;
    }
    try {
        const pool = require('./db/pool');
        const sql = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf-8');
        await pool.query(sql);

        // Column migrations (idempotent - ADD COLUMN IF NOT EXISTS)
        await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS rastreamento JSONB DEFAULT NULL`);
        await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS doterra_nivel VARCHAR(60) DEFAULT NULL`);
        await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT`);
        await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_subscription_id TEXT`);
        await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT 'hotmart'`);

        // System settings table (key-value store for admin-configurable settings)
        await pool.query(`CREATE TABLE IF NOT EXISTS configuracoes (
            chave VARCHAR(100) PRIMARY KEY,
            valor TEXT,
            atualizado_em TIMESTAMPTZ DEFAULT NOW()
        )`);
        console.log('✅ Schema OK');
    } catch (err) {
        console.error('⚠️  Erro na migração (tabelas podem já existir):', err.message);
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 API v${VERSION} na porta ${PORT}`);
    console.log(`📦 DATABASE_URL: ${process.env.DATABASE_URL ? '✅' : '❌'}`);
    console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
    await runMigration();
});

module.exports = app;
