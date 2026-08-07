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
    const cols = await client.query(`
      SELECT table_schema, table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name LIKE '%visita%';
    `);
    console.log('--- COLUMNAS CON visita ---');
    console.table(cols.rows);
    
    // Alse check current search path
    const sp = await client.query('SHOW search_path;');
    console.log('--- SEARCH PATH ---', sp.rows);

  } catch (err) {
    console.error('❌ Error en consulta:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runCheck();
