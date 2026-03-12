process.env.DATABASE_URL = "postgresql://neondb_owner:npg_u5E2ZILGgcvM@ep-steep-feather-a8j8e0x3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
const pool = require('./src/db/pool');

async function run() {
    try {
        console.log("Adicionando coluna indicado_por_id na tabela clientes...");
        await pool.query(`
            ALTER TABLE clientes 
            ADD COLUMN IF NOT EXISTS indicado_por_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
        `);
        console.log("Coluna adicionada com sucesso!");
    } catch (err) {
        console.error("Erro ao alterar tabela:", err);
    } finally {
        process.exit(0);
    }
}

run();
