const client = require('./src/config/dbConfig.js');

async function main() {
  try {
    const q1 = `
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, 
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES (
        'REQ-006',
        'Notificaciones Omnicanal (Email + WhatsApp) con Deep Linking Contextual',
        'Arquitectura de notificaciones transaccionales unificadas en backend (notificacionService.js) con despacho concurrente SMTP y microservicio Baileys WhatsApp (puerto 3085). Resolución de deep linking con persistencia de query parameters en Vue Router ante sesiones cerradas y navegación directa a ITS, cotizaciones ganadas y asignación de visitas en PWA.',
        'Alta',
        '2026-09-24',
        '2026-09-24',
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

    const q2 = `
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
      ) VALUES (
        'v1.0.50',
        '2026-09-24',
        'Sistema de Notificaciones Omnicanal y Deep Linking Contextual',
        'Feature & Omnicanal',
        'Despacho omnicanal concurrente (Email + WhatsApp) para transiciones operativas críticas (ITS V°B°, recepción contable, asignación de visitas técnicas en PWA). Preservación íntegra de ruta de destino (redirect_to) en Vue Router al expirar o iniciar sesión.',
        '["REQ-006"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE
      SET fecha_release = EXCLUDED.fecha_release,
          titulo = EXCLUDED.titulo,
          tipo_release = EXCLUDED.tipo_release,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    await client.query(q1);
    console.log('✅ REQ-006 registrado/actualizado en sch_leangsp.tcfg_backlog');

    await client.query(q2);
    console.log('✅ v1.0.50 registrado/actualizado en sch_leangsp.tcfg_releases');

    const verify = await client.query('SELECT version, titulo, fecha_release FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 3');
    console.log('Ultimas versiones en DB:', verify.rows);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error actualizando release/backlog en DB:', err);
    process.exit(1);
  }
}

main();
