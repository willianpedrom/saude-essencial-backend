require('dotenv').config();
const pool = require('./src/db/pool');

async function test() {
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, data_nascimento,
             (EXTRACT(DAY FROM data_nascimento) = EXTRACT(DAY FROM NOW()) AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM NOW())) as is_today
             FROM clientes
             WHERE ativo = TRUE
               AND data_nascimento IS NOT NULL
               AND (
                 (
                   to_char(NOW(), 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD') AND
                   to_char(data_nascimento, 'MM-DD') BETWEEN to_char(NOW(), 'MM-DD') AND to_char(NOW() + INTERVAL '7 days', 'MM-DD')
                 )
                 OR 
                 (
                   to_char(NOW(), 'MM-DD') > to_char(NOW() + INTERVAL '7 days', 'MM-DD') AND
                   (
                     to_char(data_nascimento, 'MM-DD') >= to_char(NOW(), 'MM-DD') OR
                     to_char(data_nascimento, 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD')
                   )
                 )
               )
             ORDER BY is_today DESC, to_char(data_nascimento, 'MM-DD') ASC LIMIT 5`
        );
        console.log("Result:", rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
