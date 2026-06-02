// Script para verificar e corrigir role do admin no banco
const { Pool } = require('pg');

// Use a connectionString atual do Railway (verificar Railway dashboard)
// Por enquanto testamos com o .env
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // Verifica os usuários
    const { rows } = await pool.query(
      `SELECT id, nome, email, role, criado_em FROM consultoras ORDER BY criado_em ASC LIMIT 5`
    );
    console.log('Usuários no banco:');
    rows.forEach(r => console.log(`  id=${r.id} nome=${r.nome} email=${r.email} role=${r.role}`));

    // Garante que o primeiro usuário tem role=admin
    const first = rows[0];
    if (first && first.role !== 'admin') {
      console.log(`\nCorrigindo role do primeiro usuário (${first.email}) para admin...`);
      await pool.query(`UPDATE consultoras SET role = 'admin' WHERE id = $1`, [first.id]);
      console.log('Corrigido!');
    } else if (first) {
      console.log(`\nPrimeiro usuário já tem role='${first.role}' — OK`);
    }
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    process.exit(0);
  }
}
run();
