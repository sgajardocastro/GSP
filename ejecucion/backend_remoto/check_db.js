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
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name = 'tpry_proyecto';
    `);
    console.log('--- EN QUÉ ESQUEMA ESTÁ tpry_proyecto? ---');
    console.table(res.rows);

    const cols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tpry_proyecto' AND column_name LIKE '%visita%';
    `);
    console.log('--- COLUMNAS CON visita ---');
    console.table(cols.rows);

    // Get all columns of the table in the current search path just in case
    const allCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tpry_proyecto';
    `);
    console.log('TOTAL COLUMNS in tpry_proyecto:', allCols.rowCount);
    
  } catch (err) {
    console.error('❌ Error en consulta:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runCheck();
