import pkg from 'pg';
const { Client } = pkg;

async function runMigration() {
  const client = new Client({
    connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
  });
  await client.connect();

  console.log('🚀 Iniciando migración completa en PostgreSQL (servidor.leanglobal.cl:5432)...');

  await client.query('SET search_path TO sch_leangsp, public;');

  // 1. Alterar tabla tinv_producto para agregar marca, precio_referencia, flag_fraccionable, unidades_contenido, sku
  await client.query(`
    ALTER TABLE sch_leangsp.tinv_producto 
      ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
      ADD COLUMN IF NOT EXISTS precio_referencia NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS flag_fraccionable BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS unidades_contenido INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS sku VARCHAR(20);
  `);

  // 2. Asegurar y alterar la tabla de movimientos (Kardex Físico)
  await client.query(`
    CREATE TABLE IF NOT EXISTS sch_leangsp.tinv_movimiento (
      id_movimiento BIGSERIAL PRIMARY KEY,
      id_empresa BIGINT NOT NULL,
      id_bodega BIGINT NOT NULL REFERENCES sch_leangsp.tinv_bodega(id_bodega),
      id_producto BIGINT NOT NULL REFERENCES sch_leangsp.tinv_producto(id_producto),
      tipo_movimiento VARCHAR(30) NOT NULL,
      cantidad NUMERIC(10,2) NOT NULL,
      referencia VARCHAR(100),
      usuario_registro VARCHAR(100) DEFAULT 'Sistema',
      fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE sch_leangsp.tinv_movimiento 
      ADD COLUMN IF NOT EXISTS stock_anterior NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS stock_nuevo NUMERIC(10,2) DEFAULT 0;
  `);

  // 3. Reset secuencias y limpiar tablas
  await client.query('TRUNCATE TABLE sch_leangsp.tinv_movimiento CASCADE;');
  await client.query('TRUNCATE TABLE sch_leangsp.tinv_existencia CASCADE;');
  await client.query('TRUNCATE TABLE sch_leangsp.tinv_producto CASCADE;');
  await client.query('ALTER SEQUENCE sch_leangsp.tinv_producto_id_producto_seq RESTART WITH 1;');
  await client.query('ALTER SEQUENCE sch_leangsp.tinv_existencia_id_existencia_seq RESTART WITH 1;');

  // Insertar Maestro de Productos
  const resProd = await client.query(`
    INSERT INTO sch_leangsp.tinv_producto 
      (id_empresa, prefijo_sku, correlativo_sku, sku, nombre, marca, precio_referencia, flag_fraccionable, unidades_contenido, unidad_medida, categoria, estado)
    VALUES 
      (9, 'MASC', '000101', 'MASC-000101', 'Mascarillas de Protección N95 (Caja x20 unids)', '3M Safety', 18500.00, true, 20, 'CAJA', 'Protección Personal', 'ACTIVO'),
      (9, 'FILT', '000501', 'FILT-000501', 'Filtro de Aceite Motorcraft FL-400S Heavy Duty', 'Motorcraft', 4500.00, false, 1, 'UNID', 'Filtros', 'ACTIVO'),
      (9, 'PAST', '000882', 'PAST-000882', 'Pastillas de Freno Cerámicas Delanteras', 'Brembo', 32000.00, false, 1, 'JUEGO', 'Frenos', 'ACTIVO'),
      (9, 'ACEI', '000992', 'ACEI-000992', 'Aceite Hidráulico ISO VG 68 Premium (Tambor 20L)', 'Shell Tellus', 38000.00, false, 1, 'BIDON', 'Lubricantes', 'ACTIVO')
    RETURNING id_producto, nombre;
  `);

  const pMasc = resProd.rows[0].id_producto;
  const pFilt = resProd.rows[1].id_producto;
  const pAcei = resProd.rows[3].id_producto;

  // Insertar existencias físicas reales asociadas
  await client.query(`
    INSERT INTO sch_leangsp.tinv_existencia (id_empresa, id_bodega, id_producto, cantidad, costo_adquisicion, numero_oc, estado)
    VALUES 
      (9, 1, $1, 15, 18500.00, 'OC-88210', 'DISPONIBLE'),
      (9, 1, $2, 14, 4500.00, 'OC-99382', 'DISPONIBLE'),
      (9, 2, $3, 2, 38000.00, 'OC-99411', 'DISPONIBLE');
  `, [pMasc, pFilt, pAcei]);

  // Insertar Kardex Físico Audit de Movimientos
  await client.query(`
    INSERT INTO sch_leangsp.tinv_movimiento (id_empresa, id_bodega, id_producto, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia, usuario_registro)
    VALUES 
      (9, 1, $1, 'INGRESO_OC', 15, 0, 15, 'OC-88210', 'Sergio Gajardo'),
      (9, 1, $2, 'INGRESO_OC', 14, 0, 14, 'OC-99382', 'Sergio Gajardo'),
      (9, 2, $3, 'DESPACHO_OT', 3, 5, 2, 'OT-10045', 'Carlos Mendoza');
  `, [pMasc, pFilt, pAcei]);

  console.log('🎉 ¡MIGRACIÓN Y DATOS DE KARDEX FÍSICO COMPLETADOS CON ÉXITO EN PostgreSQL!');
  await client.end();
}

runMigration();
