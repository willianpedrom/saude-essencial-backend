const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL não configurado!');
}

let pool;

try {
  // Use pg-connection-string which handles all postgresql URL formats robustly
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
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
} catch (err) {
  console.error('❌ Erro ao configurar pool:', err.message);
  // Fallback pool (all queries will fail gracefully via error handler)
  pool = new Pool({ connectionTimeoutMillis: 5000 });
}

pool.on('error', (err) => {
  console.error('Pool PostgreSQL erro:', err.message);
});

module.exports = pool;
