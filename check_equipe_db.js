process.env.DATABASE_URL = "postgresql://neondb_owner:npg_u81wzWkEITpc@ep-late-water-a8p4yby6.eastus2.azure.neon.tech/neondb?sslmode=require";
require('dotenv').config();
const pool = require('./src/db/pool');

async function run() {
  try {
    console.log("=== RUNNING ADMIN EQUIPES QUERY ===");
    const query = `
            SELECT 
                e.id,
                e.nome_equipe,
                e.codigo_convite,
                e.criado_em,
                c_lider.nome AS lider_nome,
                c_lider.email AS lider_email,
                p.limite_membros_equipe,
                COALESCE(membros.qtd, 0) AS membros_qtd,
                COALESCE(pontos_coletivos.total_pontos, 0) AS pontos_mensal,
                COALESCE(desafios.qtd, 0) AS desafios_ativos,
                COALESCE(biblioteca.qtd, 0) AS biblioteca_items
            FROM equipes e
            JOIN consultoras c_lider ON e.lider_id = c_lider.id
            LEFT JOIN LATERAL (
                SELECT plano, status
                FROM assinaturas
                WHERE consultora_id = c_lider.id
                ORDER BY criado_em DESC
                LIMIT 1
            ) a ON TRUE
            LEFT JOIN planos p ON a.plano = p.slug AND p.ativo = TRUE
            LEFT JOIN (
                SELECT equipe_id, COUNT(*) AS qtd
                FROM consultoras
                GROUP BY equipe_id
            ) membros ON membros.equipe_id = e.id
            LEFT JOIN (
                SELECT equipe_id, COUNT(*) AS qtd
                FROM equipe_desafios
                WHERE data_fim >= CURRENT_DATE
                GROUP BY equipe_id
            ) desafios ON desafios.equipe_id = e.id
            LEFT JOIN (
                SELECT equipe_id, COUNT(*) AS qtd
                FROM equipe_biblioteca
                GROUP BY equipe_id
            ) biblioteca ON biblioteca.equipe_id = e.id
            LEFT JOIN (
                SELECT 
                    c.equipe_id,
                    SUM(
                        COALESCE(cl.qtd, 0) * 10 + 
                        COALESCE(an.qtd, 0) * 15 + 
                        COALESCE(vd.qtd, 0) * 20 + 
                        COALESCE(es.qtd, 0) * 5
                    ) AS total_pontos
                FROM consultoras c
                LEFT JOIN (
                    SELECT consultora_id, COUNT(*) as qtd 
                    FROM clientes 
                    WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                    GROUP BY consultora_id
                ) cl ON cl.consultora_id = c.id
                LEFT JOIN (
                    SELECT consultora_id, COUNT(*) as qtd 
                    FROM anamneses 
                    WHERE preenchido = TRUE AND criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                    GROUP BY consultora_id
                ) an ON an.consultora_id = c.id
                LEFT JOIN (
                    SELECT consultora_id, COUNT(*) as qtd 
                    FROM vendas 
                    WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                    GROUP BY consultora_id
                ) vd ON vd.consultora_id = c.id
                LEFT JOIN (
                    SELECT consultora_id, COUNT(*) as qtd 
                    FROM estoque 
                    WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                    GROUP BY consultora_id
                ) es ON es.consultora_id = c.id
                GROUP BY c.equipe_id
            ) pontos_coletivos ON pontos_coletivos.equipe_id = e.id
            ORDER BY e.criado_em DESC
    `;
    const { rows } = await pool.query(query);
    console.log("=== RESULTS ===");
    console.log(rows);
    
    console.log("=== RAW EQUIPES IN DB ===");
    const rawEq = await pool.query("SELECT * FROM equipes");
    console.log(rawEq.rows);
    
    console.log("=== CARLA IN DB ===");
    const carla = await pool.query("SELECT id, nome, email, equipe_id, role FROM consultoras WHERE nome ILIKE '%Carla%' OR email ILIKE '%carla%'");
    console.log(carla.rows);

  } catch (e) {
    console.error("Error executing query:", e);
  } finally {
    process.exit(0);
  }
}
run();
