const fs = require('fs');
const pool = require('./src/db/pool');

async function migrate() {
    try {
        const sql = fs.readFileSync('./src/db/schema.sql', 'utf8');
        await pool.query(sql);
        console.log('✅ Migrations ran successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}
migrate();
