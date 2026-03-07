const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query('ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco_semestral DECIMAL(10,2) DEFAULT NULL;');
    await pool.query('ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco_anual DECIMAL(10,2) DEFAULT NULL;');
    await pool.query('ALTER TABLE planos ADD COLUMN IF NOT EXISTS dias_trial INTEGER DEFAULT 0;');
    console.log('SQL updated successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
