const { Pool } = require('pg');
const url = "postgresql://neondb_owner:npg_u5E2ZILGgcvM@ep-steep-feather-a8j8e0x3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        const { rows } = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful:', rows[0].now);
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

test();
