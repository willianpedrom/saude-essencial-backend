const { Pool } = require('pg');

// Railway provides individual PG* variables — use them directly to avoid
// URL parsing issues with special characters in DATABASE_URL
const hasDB = !!(
  process.env.DATABASE_URL ||
  (process.env.PGHOST && process.env.PGDATABASE)
);

if (!hasDB) {
  console.warn('⚠️  Variáveis de banco de dados não configuradas!');
}

// pg library automatically reads PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// from environment — no need to manually parse DATABASE_URL
const pool = new Pool({
  // Use connectionString only if individual vars are not present
  ...(process.env.PGHOST
    ? {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    }
    : {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Pool PostgreSQL erro:', err.message);
});

module.exports = pool;
module.exports.hasDB = hasDB;
