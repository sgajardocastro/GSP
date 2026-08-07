require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});
async function runCheck() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id_template, name_template_srv, body_seed FROM sch_leangsp.tsrv_templates WHERE id_template = 80 OR name_template_srv ILIKE '%visita%'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}
runCheck();
