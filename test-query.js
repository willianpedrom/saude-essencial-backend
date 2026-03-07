const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM planos").then(r => console.log(r.rows)).finally(() => pool.end());
