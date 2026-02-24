require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const anamnesesRoutes = require('./routes/anamneses');
const agendamentosRoutes = require('./routes/agendamentos');
const assinaturaRoutes = require('./routes/assinatura');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security middleware ───
app.use(helmet());
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:8080'],
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/assinatura/webhook', assinaturaRoutes);

// JSON body parser
app.use(express.json({ limit: '2mb' }));

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/anamneses', anamnesesRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/assinatura', assinaturaRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Saúde Essencial API rodando na porta ${PORT}`);
});

module.exports = app;
