const pool = require('./src/db/pool');

async function testSubmit() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: tmpl } = await client.query(`SELECT id, consultora_id, tipo, subtipo FROM anamneses LIMIT 1`);
    if(tmpl.length === 0) return console.log('nada');
    
    // Testa direto a inserção do cliente na unha pra ver qual campo a DB cospe erro
    await client.query(
      `INSERT INTO clientes (consultora_id, nome, email, telefone, status, indicado_por_id, tipo_cadastro) VALUES ($1, $2, $3, $4, 'lead', $5, 'lead') RETURNING id`,
      [tmpl[0].consultora_id, 'Will Teste DB', 'fail@db.co', '119999999', null]
    );
    await client.query('ROLLBACK');
    console.log("DB INSERÇÃO OK!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("ERRO PG:", err);
  } finally {
    client.release();
    pool.end();
  }
}
testSubmit();
