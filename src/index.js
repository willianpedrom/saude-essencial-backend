require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

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
const jwt = require('jsonwebtoken'); // Para o parser de segurança
const { csrfCheck } = require('./middleware/csrf');

// Parser leve de JWT apenas para propósitos de segurança (CSRF/Limites)
// O middleware 'auth' completo nos routers fará a validação de banco de dados
app.use('/api', (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.consultora = jwt.verify(token, process.env.JWT_SECRET, { 
                issuer: 'gota-app', audience: 'gota-app-api' 
            });
        } catch (e) {
            // Se o token for inválido, req.consultora continuará undefined
            // O middleware auth detalhado lidará com isso mais tarde
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
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin-notifications', require('./routes/admin_notifications'));
app.use('/api/compras', require('./routes/compras'));

// Rota pública raiz para SEO / Open Graph (Prévias de Link)
app.use('/convite', require('./routes/share'));

// Serve frontend static files
// Cache: 7d for immutable assets (CSS, images, fonts)
//        no-cache for HTML/JS (SPA code that changes frequently)
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
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
        await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS subheadline_1 VARCHAR(255) DEFAULT NULL`);
        await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS subheadline_2 VARCHAR(255) DEFAULT NULL`);
        await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS termos_aceitos BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMPTZ`);
        
        await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT`);
        await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_subscription_id TEXT`);
        await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT 'hotmart'`);

        await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS recrutamento_stage VARCHAR(40)`);
        await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS recrutamento_notas TEXT`);
        await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS motivo_perda_recrutamento TEXT`);
        await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_cadastro VARCHAR(30)`);
        await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS protocolo_mensagem TEXT`);
        await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS indicado_por_id UUID REFERENCES clientes(id) ON DELETE SET NULL`);

        await pool.query(`ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS protocolo_customizado JSONB`);
        await pool.query(`ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS hash_laudo VARCHAR(20) UNIQUE`);

        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco_semestral DECIMAL(10,2) DEFAULT NULL`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco_anual DECIMAL(10,2) DEFAULT NULL`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS dias_trial INTEGER DEFAULT 0`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_pagina_pessoal BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_raiox BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_minhas_vendas BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_radar BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_agenda BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_links BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_anamneses BOOLEAN DEFAULT TRUE`);
        await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_clientes BOOLEAN DEFAULT TRUE`);

        // System settings table (key-value store for admin-configurable settings)
        await pool.query(`CREATE TABLE IF NOT EXISTS configuracoes (
            chave VARCHAR(100) PRIMARY KEY,
            valor TEXT,
            atualizado_em TIMESTAMPTZ DEFAULT NOW()
        )`);

        // Prospecting table
        await pool.query(`CREATE TABLE IF NOT EXISTS prospects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            consultora_id UUID REFERENCES consultoras(id) ON DELETE CASCADE,
            nome VARCHAR(255) NOT NULL,
            place_id VARCHAR(255),
            endereco TEXT,
            telefone VARCHAR(50),
            website TEXT,
            nicho VARCHAR(100),
            instagram TEXT,
            facebook TEXT,
            email TEXT,
            status VARCHAR(50) DEFAULT 'prospectado', 
            notas TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_prospects_consultora ON prospects(consultora_id)`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS historico JSONB DEFAULT '[]'`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS instagram TEXT`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS facebook TEXT`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS email TEXT`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS nicho VARCHAR(100)`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS telefone VARCHAR(50)`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS website TEXT`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1)`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS user_ratings_total INTEGER`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8)`);
        await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8)`);

        // Push Notifications Subscriptions table
        await pool.query(`CREATE TABLE IF NOT EXISTS push_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
            endpoint TEXT UNIQUE NOT NULL,
            expiration_time TIMESTAMPTZ,
            keys JSONB NOT NULL,
            browser_name VARCHAR(100),
            device_type VARCHAR(50),
            criado_em TIMESTAMPTZ DEFAULT NOW(),
            atualizado_em TIMESTAMPTZ DEFAULT NOW()
        )`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_consultora ON push_subscriptions(consultora_id)`);
        // Promoting admin if ADMIN_EMAIL is set
        if (process.env.ADMIN_EMAIL) {
            await pool.query(
                "UPDATE consultoras SET role = 'admin' WHERE email = $1",
                [process.env.ADMIN_EMAIL]
            );
            console.log(`👑 Admin Promoted: ${process.env.ADMIN_EMAIL}`);
        }

        // ── Admin Notifications Tables ──
        await pool.query(`CREATE TABLE IF NOT EXISTS admin_incentive_pool (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            titulo VARCHAR(255) DEFAULT 'Incentivo',
            mensagem TEXT NOT NULL,
            ativo BOOLEAN DEFAULT TRUE,
            criado_em TIMESTAMPTZ DEFAULT NOW(),
            atualizado_em TIMESTAMPTZ DEFAULT NOW()
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_broadcasts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            admin_id UUID REFERENCES consultoras(id) ON DELETE SET NULL,
            titulo VARCHAR(255) NOT NULL,
            mensagem TEXT NOT NULL,
            tipo VARCHAR(50) DEFAULT 'manual',
            destinatarios_qtd INT DEFAULT 0,
            cliques_qtd INT DEFAULT 0,
            criado_em TIMESTAMPTZ DEFAULT NOW()
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS notification_clicks (
            broadcast_id UUID NOT NULL REFERENCES notification_broadcasts(id) ON DELETE CASCADE,
            consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
            clicado_em TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (broadcast_id, consultora_id)
        )`);

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_broadcast_admin ON notification_broadcasts(admin_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_clicks_broadcast ON notification_clicks(broadcast_id)`);

        // Seed initial pool if empty
        const { rows: poolCount } = await pool.query('SELECT COUNT(*) FROM admin_incentive_pool');
        if (parseInt(poolCount[0].count) === 0) {
            await pool.query(`
                INSERT INTO admin_incentive_pool (titulo, mensagem) VALUES 
                ('Bom dia {nome}! ☀️', 'Que tal começar o dia revisando suas anamneses pendentes? Um bom acompanhamento é a chave do sucesso.'),
                ('Dica do Dia 💧', 'Olá {nome}, você já conferiu os novos protocolos de óleos essenciais? Conhecimento ajuda a vender mais!'),
                ('Sua Página Pessoal 🚀', 'Oi {nome}, já configurou seu link de divulgação hoje? Sua vitrine digital é seu melhor cartão de visitas.'),
                ('Acompanhamento 📝', 'Olá {nome}, lembrou de fazer o follow-up com seus clientes de ontem? A atenção aos detalhes fideliza!'),
                ('Meta de Hoje ✅', 'Vamos pra cima, {nome}! Qual é a sua meta de atendimentos para hoje? O sistema está pronto para te ajudar.')
            `);
            console.log('[Migration] Pool de incentivos populado com frases iniciais.');
        }

        console.log('[Migration] Tabelas de notificação verificadas!');

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
