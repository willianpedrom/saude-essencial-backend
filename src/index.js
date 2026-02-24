require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ───
app.use(helmet());

// CORS – permissivo para facilitar desenvolvimento
app.use(cors({
    origin: true, // aceita qualquer origem
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

// Health check (nunca crasha)
app.get('/health', (req, res) => res.json({
    status: 'ok',
    ts: new Date(),
    db: !!process.env.DATABASE_URL,
    env: process.env.NODE_ENV,
}));

// Stripe webhook – precisa do raw body ANTES do express.json()
const assinaturaRoutes = require('./routes/assinatura');
app.use('/api/assinatura/webhook', express.raw({ type: 'application/json' }), assinaturaRoutes);

// JSON body parser
app.use(express.json({ limit: '2mb' }));

// ─── Routes ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/anamneses', require('./routes/anamneses'));
app.use('/api/agendamentos', require('./routes/agendamentos'));
app.use('/api/assinatura', assinaturaRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.', message: err.message });
});

// ─── Auto-migration: cria tabelas se não existirem ───
async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL não configurado. Banco de dados desativado.');
        return;
    }
    try {
        const pool = require('./db/pool');
        const sql = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf-8');
        await pool.query(sql);
        console.log('✅ Schema do banco de dados verificado/criado com sucesso!');
    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
    }
}

// ─── Start ───
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Saúde Essencial API rodando na porta ${PORT}`);
    console.log(`📦 DATABASE_URL: ${process.env.DATABASE_URL ? 'configurado ✅' : 'NÃO configurado ❌'}`);
    console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'configurado ✅' : 'NÃO configurado ❌'}`);
    await runMigration();
});

module.exports = app;
