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
    const res = await client.query("SELECT * FROM sch_leangsp.tsec_users LIMIT 1");
    console.log("COLUMNS tsec_users:", Object.keys(res.rows[0]));
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}
runCheck();
