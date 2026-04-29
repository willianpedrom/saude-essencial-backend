const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL não configurado!');
}

let pool;

try {
  const { parse } = require('pg-connection-string');
  const config = parse(databaseUrl || '');

  console.log(`🔌 DB host: ${config.host}, database: ${config.database}`);

  pool = new Pool({
    host: config.host,
    port: parseInt(config.port || '5432'),
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: { rejectUnauthorized: false },

    // ── Performance tuning ────────────────────────────────────────────────
    // Mais conexões simultâneas para absorver picos de tráfego
    max: 20,
    // Tempo máximo para obter conexão do pool (era 10s → reduzido para 5s)
    connectionTimeoutMillis: 5000,
    // Conexões idle ficam 60s antes de fechar (evita reconexão frequente)
    idleTimeoutMillis: 60000,
    // Keep-alive para manter conexões quentes e evitar timeouts do firewall
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Statement timeout: queries não devem demorar mais que 15s
    statement_timeout: 15000,
  });

  // ── Warm-up: abre 2 conexões no start para evitar cold-start no primeiro request ──
  pool.query('SELECT 1').catch(() => {});
  pool.query('SELECT 1').catch(() => {});

} catch (err) {
  console.error('❌ Erro ao configurar pool:', err.message);
  pool = new Pool({ connectionTimeoutMillis: 5000 });
}

pool.on('error', (err) => {
  console.error('Pool PostgreSQL erro:', err.message);
});

module.exports = pool;
