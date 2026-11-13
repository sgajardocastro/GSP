import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const schema = 'sch_leangsp';

    const qReq = `
      INSERT INTO ${schema}.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad,
        fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
      ) VALUES (
        'REQ-013',
        'Verificación Inteligente de Horómetro y Cuadratura Contractual de Report Diario (Piso Mínimo y Sobretiempo)',
        'Implementación de verificación inteligente de horómetro en Momento 2 de PWA: cálculo y propuesta automática del horómetro de término (inicio + horas efectivas) con chip de autocompletado, bloqueo ante valores menores al inicial y alerta visual destacada ante incrementos disparados o anómalos. Corrección estructural del piso contractual vinculándolo dinámicamente al estructurador comercial (8.0 hrs en vez de 4.0), recalculando con fidelidad las horas a facturar y el sobretiempo real (+1.0 hr). Clarificación de desglose en visor web ModalVisorReport.vue.',
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
        'v1.0.57',
        '2026-09-26',
        'Verificación Inteligente de Horómetro Motor y Cuadratura Contractual de Report Diario',
        'Core Quality, Operations & Commercial Alignment',
        'Integración de asistente inteligente de horómetro en PWA con sugerido automático y alertas de consistencia ante valores erráticos u odómetros. Corrección de lectura de base mínima de faena en backend reportDiarioController.js y PWA ReportDiarioIzaje.vue vinculada a las lineas_servicio de la OT (8.0 hrs estándar), corrigiendo la liquidación de horas a facturar y sobretiempo. Despliegue de Frontend v1.0.57 y PWA v1.0.29.',
        '["REQ-013"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE
      SET fecha_release = EXCLUDED.fecha_release,
          titulo = EXCLUDED.titulo,
          tipo_release = EXCLUDED.tipo_release,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    console.log('Insertando REQ-013 en tcfg_backlog...');
    await client.query(qReq);

    console.log('Insertando v1.0.57 en tcfg_releases...');
    await client.query(qRel);

    console.log('✅ REQ-013 y Release v1.0.57 registrados exitosamente en la base de datos.');
  } catch (err) {
    console.error('Error registrando release en DB:', err);
  } finally {
    await client.end();
  }
}

main();
