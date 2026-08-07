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
      `SELECT id_template, codi_template_srv, name_template_srv, id_tipo_srv 
       FROM tsrv_templates`
    );
    console.log("Tipos de servicio en tsrv_templates:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
