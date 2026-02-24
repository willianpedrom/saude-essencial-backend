require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ───
app.use(helmet());

// CORS – allow all origins in development, restrict in production
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:8080',
    'http://localhost:3000',
    'https://web-production-9eaa6.up.railway.app',
].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return cb(null, true);
        }
        cb(new Error('CORS not allowed for: ' + origin));
    },
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

// Health check (before any other middleware, never crashes)
app.get('/health', (req, res) => res.json({
    status: 'ok',
    ts: new Date(),
    db: !!process.env.DATABASE_URL,
    env: process.env.NODE_ENV,
}));

// Stripe webhook needs raw body — mount BEFORE express.json()
const assinaturaRoutes = require('./routes/assinatura');
app.use('/api/assinatura/webhook', assinaturaRoutes);

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Saúde Essencial API rodando na porta ${PORT}`);
    console.log(`📦 DATABASE_URL: ${process.env.DATABASE_URL ? 'configurado ✅' : 'NÃO configurado ❌'}`);
    console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'configurado ✅' : 'NÃO configurado ❌'}`);
});

module.exports = app;
