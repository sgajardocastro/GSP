const { Client } = require('pg');

async function syncSeq() {
  const client = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!'
  });
  await client.connect();
  const r1 = await client.query("SELECT setval('sch_leangsp_prod.tcfg_backlog_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sch_leangsp_prod.tcfg_backlog))");
  const r2 = await client.query("SELECT setval('sch_leangsp_prod.tcfg_releases_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sch_leangsp_prod.tcfg_releases))");
  console.log('Secuencias sincronizadas:', r1.rows[0], r2.rows[0]);

  // Insertar REQ-020 en PROD
  const qBacklog = `
    INSERT INTO sch_leangsp_prod.tcfg_backlog (
      codigo_req, nombre_requerimiento, descripcion, prioridad,
      fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
    ) VALUES (
      'REQ-020', 'Sincronización Reactiva de Operador Reasignado en Despacho e Inspecciones',
      'Resolución prioritaria de opTrip y actualización en caliente de tsrv_survey', 'Alta',
      CURRENT_DATE, CURRENT_DATE, 'Caso GSP-2609-4855-008', 'Implementado', 'Sergio Gajardo'
    )
    ON CONFLICT (codigo_req) DO UPDATE 
    SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();
  `;
  await client.query(qBacklog);
  console.log('✅ REQ-020 sincronizado en sch_leangsp_prod.tcfg_backlog');

  const qRelease = `
    INSERT INTO sch_leangsp_prod.tcfg_releases (
      version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
    ) VALUES (
      'v1.0.65', CURRENT_DATE, 'Portal Web GSP v1.0.65', 'Bugfix & Reasignación',
      'Sincronización reactiva de operador entre Asignación y Despacho con actualización de survey',
      '[\"REQ-020\"]'::jsonb, 'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE 
    SET fecha_release = CURRENT_DATE,
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;
  await client.query(qRelease);
  console.log('✅ v1.0.65 sincronizado en sch_leangsp_prod.tcfg_releases');

  await client.end();
}

syncSeq().catch(console.error);
