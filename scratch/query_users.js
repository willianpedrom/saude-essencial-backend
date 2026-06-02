const { Pool } = require('pg');
require('dotenv').config();

// Se não houver dotenv, usar do env (que não tem)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT id, email, nome, role, token_version FROM consultoras WHERE email = 'willian12comunixcomdeus@gmail.com'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
