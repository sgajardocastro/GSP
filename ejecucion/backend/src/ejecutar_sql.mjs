import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL || "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres";

async function run() {
  const client = new Client({
    connectionString,
    ssl: false
  });

  try {
    console.log('🔌 Conectando a PostgreSQL en servidor.leanglobal.cl:5432...');
    await client.connect();
    console.log('✅ Conexión establecida con PostgreSQL.');

    const sqlPath = path.resolve('..', 'Inv+Mnt', 'database', 'esquema_propuesto.sql');
    console.log(`📄 Leyendo script DDL SQL desde: ${sqlPath}`);
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Quitar comandos de creación/re-creación de esquema que requieren superusuario
    sql = sql.replace(/CREATE SCHEMA IF NOT EXISTS sch_leangsp;/g, '');
    
    console.log('🚀 Fijando search_path a sch_leangsp y creando las tablas...');
    await client.query('SET search_path TO sch_leangsp, public;');

    // Ejecutar el script SQL
    await client.query(sql);

    console.log('🎉 ¡TODAS LAS TABLAS (tinv_* y tmnt_*) Y TRIGGERS HAN SIDO CREADOS EXITOSAMENTE EN sch_leangsp!');
  } catch (err) {
    console.error('❌ Error ejecutando DDL SQL en la base de datos:', err);
  } finally {
    await client.end();
  }
}

run();
