require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const VERSION = '1.5';

// ─── Security ───
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/anamneses', require('./routes/anamneses'));
app.use('/api/agendamentos', require('./routes/agendamentos'));
app.use('/api/assinatura', require('./routes/assinatura'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

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
