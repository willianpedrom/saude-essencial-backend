require('dotenv').config();
const pool = require('../src/db/pool');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, '../src/db/migrations/06_admin_notifications.sql'), 'utf8');
    console.log("Applying migration for admin notifications...");
    await pool.query(migrationSql);
    console.log("✅ Migration finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

run();
