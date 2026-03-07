// migrate_add_protocol_message.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('Iniciando migração: Adicionando coluna protocolo_mensagem...');

        // Adiciona a nova coluna na tabela clientes
        await pool.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS protocolo_mensagem TEXT;
    `);

        console.log('✅ Coluna protocolo_mensagem adicionada com sucesso (ou já existia)!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro na migração:', err.message);
        process.exit(1);
    }
}

migrate();
