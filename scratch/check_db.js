const { Pool } = require('pg');
const connectionString = "postgresql://neondb_owner:npg_u5E2ZILGgcvM@ep-steep-feather-a8j8e0x3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("=== EQUIPES ===");
    const { rows: equipes } = await pool.query(
      "SELECT id, nome_equipe, lider_id, codigo_convite, criado_em FROM equipes"
    );
    console.log(JSON.stringify(equipes, null, 2));

    console.log("=== CARLA IN DB ===");
    const { rows: carla } = await pool.query(
      "SELECT id, nome, email, equipe_id, role FROM consultoras WHERE nome ILIKE '%Carla%' OR email ILIKE '%carla%'"
    );
    console.log(JSON.stringify(carla, null, 2));

    console.log("=== EQUIPE POR CONVITE ===");
    const { rows: eqConvite } = await pool.query(
      "SELECT * FROM equipes WHERE codigo_convite = 'LIDER-GOTA-4266'"
    );
    console.log(JSON.stringify(eqConvite, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
