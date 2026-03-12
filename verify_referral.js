require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_u81wzWkEITpc@ep-late-water-a8p4yby6.eastus2.azure.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clientes' AND column_name = 'indicado_por_id';
    `);
    console.log("Verificação do campo indicado_por_id na tabela clientes:");
    console.log(res.rows);
  } catch(e) {
    console.error("Erro na verificação:", e);
  } finally {
    await pool.end();
  }
}

run();
