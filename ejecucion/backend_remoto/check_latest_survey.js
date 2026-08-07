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
    const res = await client.query("SELECT id_survey, body_exec FROM sch_leangsp.tsrv_survey ORDER BY id_survey DESC LIMIT 1");
    const segs = res.rows[0].body_exec?.segmentos || [];
    const s9 = segs.find(s => s.label && s.label.includes('9.'));
    (s9?.attributes || []).forEach(a => console.log(a.type, "->", a.label));
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}
runCheck();
