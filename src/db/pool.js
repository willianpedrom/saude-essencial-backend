const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL não configurado!');
}

const pool = new Pool({
  connectionString: connectionString || 'postgresql://localhost/dummy',
  // Always use SSL when DATABASE_URL is set (Railway requires it)
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err.message);
});

module.exports = pool;
