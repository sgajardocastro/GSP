require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Iniciando migración de BD...');
    
    // 1. Agregar columnas a tpry_proyecto
    console.log('📦 Verificando columnas en tpry_proyecto...');
    await client.query(`ALTER TABLE tpry_proyecto ADD COLUMN IF NOT EXISTS token_visita VARCHAR(255) UNIQUE;`);
    await client.query(`ALTER TABLE tpry_proyecto ADD COLUMN IF NOT EXISTS estado_solicitud_visita VARCHAR(50) DEFAULT 'SIN_SOLICITAR';`);
    console.log('✅ Columnas de visita a terreno aseguradas.');

    // 2. Insertar Categorías y Subcategorías para id_empresa = 9
    console.log('📦 Insertando Categorías...');
    const idEmpresa = 9;
    
    // Categoría OTROS
    const resCatOtros = await client.query(`
      INSERT INTO tequ_categoria (nombre_categoria, descripcion, id_empresa)
      VALUES ('OTROS', 'Categoría Otros', $1)
      RETURNING id_categoria
    `, [idEmpresa]);
    const idCatOtros = resCatOtros.rows[0].id_categoria;

    await client.query(`
      INSERT INTO tequ_subcategoria (nombre_subcategoria, id_categoria, descripcion)
      VALUES ('OTROS', $1, 'Subcategoría Otros')
    `, [idCatOtros]);

    // Categoría PERSONAL CERTIFICADO
    const resCatPers = await client.query(`
      INSERT INTO tequ_categoria (nombre_categoria, descripcion, id_empresa)
      VALUES ('PERSONAL CERTIFICADO', 'Personal operativo certificado', $1)
      RETURNING id_categoria
    `, [idEmpresa]);
    const idCatPers = resCatPers.rows[0].id_categoria;

    const subcats = ['RIGGER', 'OPERADOR', 'PREVENCIONISTA', 'OTROS'];
    for (const sub of subcats) {
      await client.query(`
        INSERT INTO tequ_subcategoria (nombre_subcategoria, id_categoria, descripcion)
        VALUES ($1, $2, 'Personal: ' || $1)
      `, [sub, idCatPers]);
    }

    console.log('✅ Categorías y Subcategorías insertadas con éxito.');
    await client.query('COMMIT');
    console.log('🎉 Migración completada correctamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
