require('dotenv').config();
const pool = require('./src/db/pool');

async function migrate() {
    try {
        await pool.query('ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS consentimento BOOLEAN DEFAULT FALSE;');
        await pool.query('ALTER TABLE depoimentos ALTER COLUMN nota SET DEFAULT 10;');
        console.log("Migration successful");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
migrate();
