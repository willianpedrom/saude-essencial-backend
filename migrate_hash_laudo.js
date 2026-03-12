require('dotenv').config();
const pool = require('./src/db/pool');

async function migrateHashLaudo() {
  console.log('Iniciando migração de banco para o Link Mágico (Hash Laudo)...');
  
  try {
    const result = await pool.query(`
      ALTER TABLE anamneses
      ADD COLUMN IF NOT EXISTS hash_laudo VARCHAR(20) UNIQUE;
    `);
    
    console.log('Migração concluída com sucesso!');
    console.log(result.command);
  } catch (error) {
    console.error('Falha ao rodar script de migração do banco de dados:', error);
  } finally {
    await pool.end();
  }
}

migrateHashLaudo();
