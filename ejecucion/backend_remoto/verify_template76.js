require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO sch_leangsp, public");
    const res = await client.query(
      "SELECT id_template, codi_template_srv, name_template_srv, body_seed FROM tsrv_templates WHERE id_template = 76"
    );
    if (res.rows.length > 0) {
      const body = res.rows[0].body_seed;
      console.log("ID Template:", res.rows[0].id_template);
      console.log("Segmentos count:", body?.segmentos?.length);
      console.log("Segment 1 Label:", body?.segmentos?.[0]?.label);
      console.log("Segment 7 Label:", body?.segmentos?.[6]?.label);
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
