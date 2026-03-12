const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/saude_essencial' });
pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS link_afiliada TEXT;')
  .then(() => { console.log("Migration done"); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
