import pkg from 'pg';
const { Client } = pkg;

async function seed() {
  const client = new Client({
    connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
  });
  await client.connect();

  console.log('🌱 Poblando datos reales en sch_leangsp...');

  // 1. Insertar Bodegas Reales
  await client.query(`
    INSERT INTO sch_leangsp.tinv_bodega (id_empresa, nombre, ubicacion, estado)
    VALUES 
      (9, 'Bodega Principal Santiago', 'Santiago Central', 'ACTIVA'),
      (9, 'Bodega Faena Antofagasta', 'Norte Grande', 'ACTIVA'),
      (9, 'Bodega Taller Móvil San Bernardo', 'San Bernardo', 'ACTIVA')
    ON CONFLICT DO NOTHING;
  `);

  // 2. Insertar Productos Reales en el Maestro de Productos
  await client.query(`
    INSERT INTO sch_leangsp.tinv_producto (id_empresa, prefijo_sku, correlativo_sku, nombre, unidad_medida, categoria, estado)
    VALUES 
      (9, 'FILT', '000501', 'Filtro de Aceite Motorcraft', 'UNID', 'Filtros', 'ACTIVO'),
      (9, 'PAST', '000882', 'Pastillas de Freno Delanteras', 'UNID', 'Frenos', 'ACTIVO'),
      (9, 'ACEI', '000992', 'Aceite Hidráulico ISO VG 68 (20L)', 'BIDON', 'Lubricantes', 'ACTIVO')
    ON CONFLICT DO NOTHING;
  `);

  // 3. Insertar Existencias Reales
  await client.query(`
    INSERT INTO sch_leangsp.tinv_existencia (id_empresa, id_bodega, id_producto, cantidad, costo_adquisicion, numero_oc, estado)
    VALUES 
      (9, 1, 1, 14, 4500, 'OC-99382', 'DISPONIBLE'),
      (9, 2, 3, 8, 38000, 'OC-99411', 'DISPONIBLE')
    ON CONFLICT DO NOTHING;
  `);

  console.log('✅ ¡DATOS REALES ALMACENADOS EXITOSAMENTE EN PostgreSQL (servidor.leanglobal.cl)!');
  await client.end();
}

seed();
