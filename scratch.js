require('dotenv').config();
const pool = require('./src/db/pool.js');
async function check() {
  try {
    const res = await pool.query("SELECT id, nome, email, role, token_version FROM consultoras WHERE email = $1", [process.env.ADMIN_EMAIL]);
    console.log(res.rows[0]);
  } catch(e) { console.error(e); }
  pool.end();
}
check();
