const { Pool } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/.env', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(["']?)(.*?)\1(\n|$)/);
let urlStr = dbUrlMatch[2].trim();
if (urlStr.includes('postgres://base')) {
    const matcher = urlStr.match(/(postgresql:\/\/[^@]+@[^\/]+\/[^\?]+)/);
    if(matcher) urlStr = matcher[1];
}

const pool = new Pool({
  connectionString: urlStr,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Adicionando colunas de termos...");
    await pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS termos_aceitos BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMPTZ;');
    console.log("Sucesso!");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
