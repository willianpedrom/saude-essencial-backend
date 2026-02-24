require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function setup() {
    console.log('🔧 Configurando banco de dados...');
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    try {
        await pool.query(sql);
        console.log('✅ Schema criado com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao criar schema:', err.message);
    } finally {
        await pool.end();
    }
}

setup();
