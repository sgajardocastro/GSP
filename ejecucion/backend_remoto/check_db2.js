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
    const res = await client.query("SELECT * FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 28 OR id_proyecto IS NOT NULL LIMIT 1");
    console.log("COLUMNS tpry_proyecto:", Object.keys(res.rows[0]));
    console.log("JSON_FIELD:", JSON.stringify(res.rows[0].json_field, null, 2));
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runCheck();
