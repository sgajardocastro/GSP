const fs = require('fs');
const path = require('path');
const pool = require('./src/config/postgresPool');

async function run() {
  try {
    console.log('🚀 Aplicando migración DDL 20261010_mnt_enterprise.sql...');
    const ddlSql = fs.readFileSync(path.join(__dirname, '20261010_mnt_enterprise.sql'), 'utf8');
    await pool.query(ddlSql);
    console.log('✅ Migración DDL aplicada exitosamente.');

    console.log('🌱 Aplicando seed_mnt_enterprise.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed_mnt_enterprise.sql'), 'utf8');
    await pool.query(seedSql);
    console.log('✅ Seeding aplicado exitosamente.');

  } catch (err) {
    console.error('❌ Error aplicando migración:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
