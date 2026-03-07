require('dotenv').config();
const pool = require('./src/db/pool');

async function test() {
    try {
        const slug = '702b6611-6ad8-4040-9d7a-cd07ff44226c';
        console.log("Testing consultoras...");
        let res = await pool.query("SELECT nome, avatar_url FROM consultoras WHERE slug = $1 LIMIT 1", [slug]);
        console.log("Res:", res.rows);

        console.log("Testing anamneses...");
        res = await pool.query("SELECT c.nome, c.avatar_url FROM anamneses a JOIN consultoras c ON a.consultora_id = c.id WHERE a.token_publico = $1 LIMIT 1", [slug]);
        console.log("Res:", res.rows);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}
test();
