import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const schema = 'sch_leangsp';

    const qReq = `
      INSERT INTO ${schema}.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad,
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES (
        'REQ-011',
        'Consolidación de Viajes, Control Combustible Multi-Estanque y Desacoplamiento de Horas en Report Diario e ITS',
        'Registro explícito de combustible multi-estanque con captura fotográfica obligatoria en PWA Conductor. Desacoplamiento de horas de carretera vs horas efectivas de faena en Report Diario. Handoff automático de traslado a estado CUMPLIDO en estructurador comercial con inyección en Report Diario e ITS. Motor condicional de liquidación de horas en ITS desacoplando piso mínimo de faena para fletes carreteros.',
        'Crítica',
        '2026-09-25',
        '2026-09-25',
        'Sergio Gajardo / Operaciones',
        'Implementado',
        'Sergio Gajardo'
      )
      ON CONFLICT (codigo_req) DO UPDATE
      SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
          descripcion = EXCLUDED.descripcion,
          prioridad = EXCLUDED.prioridad,
          fecha_registro = EXCLUDED.fecha_registro,
          fecha_implementacion = EXCLUDED.fecha_implementacion,
          solicitado_por = EXCLUDED.solicitado_por,
          estado = EXCLUDED.estado,
          creado_por = EXCLUDED.creado_por;
    `;

    const qRel = `
      INSERT INTO ${schema}.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        'v1.0.55',
        '2026-09-25',
        'Consolidación Operativa de Traslados, Combustible Multi-Estanque y Liquidación Condicional ITS',
        'Core Operations & Commercial Alignment',
        'Implementación del control multi-estanque por equipo con fotografía de marcador, handoff automático de línea TRASLADO cumplido en el estructurador comercial, desacoplamiento de inicio de faena (llegada a obra) en Report Diario y motor de cálculo de horas de viaje independientes del piso mínimo en ITS.',
        '["REQ-011"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE
      SET fecha_release = EXCLUDED.fecha_release,
          titulo = EXCLUDED.titulo,
          tipo_release = EXCLUDED.tipo_release,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    await client.query(qReq);
    console.log('✅ REQ-011 registrado en sch_leangsp.tcfg_backlog');

    await client.query(qRel);
    console.log('✅ v1.0.55 registrado en sch_leangsp.tcfg_releases');

    const verify = await client.query('SELECT version, titulo, fecha_release FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 3');
    console.log('Ultimas versiones en DB:', verify.rows);
  } catch (e) {
    console.error('Error insertando release/backlog:', e);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
