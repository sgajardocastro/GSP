import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const schema = 'sch_leangsp';

    const qReq = `
      INSERT INTO ${schema}.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad,
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES (
        'REQ-012',
        'Desacoplamiento Operacional Viaje vs Report Diario, Carga Directa Combustible y Rediseño Home PWA',
        'Desacoplamiento del flujo de viaje respecto al formulario multi-día de Report Diario en ViajeConductor. Carga directa de combustible en ruta sin necesidad de autorización previa de tarjeta Copec. Rediseño integral de la pantalla principal de la PWA (Surveys.vue) organizando tres tarjetas principales canónicas con estilo corporativo unificado (Control Portón, Registro de Viaje con alerta pulsante y Report Diario con alerta pulsante), ocultando temporalmente formularios innecesarios.',
        'Crítica',
        '2026-09-26',
        '2026-09-26',
        'Sergio Gajardo / Operaciones GSP',
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
        'v1.0.56',
        '2026-09-26',
        'Desacoplamiento Viaje vs Report, Combustible Directo y Rediseño PWA Home v1.0.28',
        'PWA UX & Operational Flow Decoupling',
        'Desacople completo del viaje de ruta frente al reporte diario de faena. Habilitación de registro directo de combustible sin validación previa de tarjeta Copec. Renovación de vista principal PWA (Surveys.vue) con 3 tarjetas canónicas de estilo unificado oscuro: Portón y Patio, Registro de Viaje (con alerta parpadeante en asignado/en ruta) y Report Diario (con alerta parpadeante en arribado). Frontend v1.0.56 y PWA v1.0.28 desplegados.',
        '["REQ-012"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE
      SET fecha_release = EXCLUDED.fecha_release,
          titulo = EXCLUDED.titulo,
          tipo_release = EXCLUDED.tipo_release,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    console.log('Insertando REQ-012 en tcfg_backlog...');
    await client.query(qReq);

    console.log('Insertando v1.0.56 en tcfg_releases...');
    await client.query(qRel);

    console.log('✅ REQ-012 y Release v1.0.56 registrados exitosamente en la base de datos.');
  } catch (err) {
    console.error('Error registrando release en DB:', err);
  } finally {
    await client.end();
  }
}

main();
