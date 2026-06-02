const { Pool } = require('pg');
const connectionString = "postgresql://neondb_owner:npg_u5E2ZILGgcvM@ep-steep-feather-a8j8e0x3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("=== CLIENTES ===");
    const { rows: clientes } = await pool.query(
      "SELECT id, consultora_id, nome, email, telefone, data_nascimento, pipeline_stage, status, recrutamento_stage, criado_em FROM clientes WHERE nome ILIKE '%Paulo%' OR telefone LIKE '%81996413535%' OR telefone LIKE '%81996413535'"
    );
    console.log(JSON.stringify(clientes, null, 2));

    console.log("=== ANAMNESES ===");
    const { rows: anamneses } = await pool.query(
      "SELECT id, consultora_id, cliente_id, tipo, subtipo, token_publico, preenchido, hash_laudo, criado_em, dados IS NOT NULL as tem_dados FROM anamneses WHERE token_publico = 'c5bde98a-189c-46e6-a6e6-f8393602d402' OR cliente_id IN (SELECT id FROM clientes WHERE nome ILIKE '%Paulo%' OR telefone LIKE '%81996413535%')"
    );
    console.log(JSON.stringify(anamneses, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
