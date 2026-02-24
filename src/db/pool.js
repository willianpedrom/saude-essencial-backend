const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não configurado! Defina essa variável no Railway.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/dummy',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err.message);
  // DO NOT crash the process — let individual requests handle the error
});

module.exports = pool;
