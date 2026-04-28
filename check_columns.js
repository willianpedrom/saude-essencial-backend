require('dotenv').config();
const pool = require('./src/db/pool');

async function check() {
    try {
        const { rows } = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'planos'
        `);
        console.log('Colunas na tabela planos:');
        rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
        process.exit(0);
    } catch (err) {
        console.error('Erro ao verificar colunas:', err.message);
        process.exit(1);
    }
}

check();
