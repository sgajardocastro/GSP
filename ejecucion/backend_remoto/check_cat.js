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
    const res = await client.query(`
      SELECT * FROM tequ_categoria WHERE nombre_categoria IN ('OTROS', 'PERSONAL CERTIFICADO');
    `);
    console.log('--- CATEGORIAS INSERTADAS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('❌ Error en consulta:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runCheck();
