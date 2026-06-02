require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const email = 'willian12comunixcomdeus@gmail.com';
  console.log('ADMIN_EMAIL env:', process.env.ADMIN_EMAIL);
  
  const { rows } = await pool.query('SELECT id, nome, email, role FROM consultoras WHERE email = $1', [email]);
  console.log('User in DB:', rows[0]);
  
  pool.end();
}
run();
