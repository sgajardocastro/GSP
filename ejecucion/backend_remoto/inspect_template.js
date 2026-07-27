const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  try {
    const res = await pool.query('SELECT body_seed FROM tsrv_templates WHERE id_template = 80');
    console.log(JSON.stringify(res.rows[0].body_seed, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
