require('dotenv').config();
const pool = require('./src/db/pool');

pool.query("SELECT id, nome, slug FROM consultoras WHERE slug = 'oficial'", (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
