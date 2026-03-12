const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/saude_essencial' });

async function migrate() {
  await pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS link_afiliada TEXT;');
  await pool.query('ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS protocolo_customizado JSONB;');
  console.log('Migration done');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });

