require('dotenv').config();
const { pool } = require('./src/db/index');
async function run() {
  try {
    await pool.query(`ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'cliente'`);
    console.log("Migration finished.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
