const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration27() {
  const client = await pool.connect();
  try {
    console.log(`Connecting to database at ${process.env.DB_HOST}...`);
    const sqlFilePath = path.join(__dirname, '20260810_tedp_reportes_edp_costos.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, { encoding: 'utf8' });

    await client.query(sqlQuery);
    console.log('✅ Migration 27 executed successfully!');

    // Verify created tables
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'sch_leangsp' AND table_name LIKE 't%';
    `);
    console.log('--- TABLES IN sch_leangsp ---');
    console.table(checkTables.rows.map(r => r.table_name));

  } catch (err) {
    console.error('❌ Error executing migration 27:', err);
  } finally {
    client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
}

runMigration27();
