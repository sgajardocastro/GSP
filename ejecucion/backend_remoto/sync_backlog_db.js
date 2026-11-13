const client = require('./src/config/dbConfig.js');

async function syncBacklogAndReleases() {
  try {
    const schema = 'sch_leangsp';

    const reqs = [
      {
        codigo_req: 'REQ-001',
        nombre_requerimiento: 'Buscador Omnibox Reactivo en Tablero Kanban',
        descripcion: 'Buscador reactivo multi-criterio en la cabecera de la Torre de Control (Torre.vue) que filtra concurrentemente las 6 columnas del tablero Kanban por N° de Cotización, Cliente, Ejecutivo Comercial, Obra y Patente de Grúa, con contador de proyectos y atajo Escape.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-23',
        fecha_implementacion: '2026-09-23',
        solicitado_por: 'Dayana / Operaciones',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-002',
        nombre_requerimiento: 'Visibilidad Universal del Ejecutivo Comercial en Tarjetas Kanban y Detalle',
        descripcion: 'Despliegue visible y obligatorio del badge del Ejecutivo Comercial en las tarjetas del Kanban en todas las etapas del pipeline (Torre.vue), cabecera superior fija y asignación en Preventa Comercial (GestorOportunidades.vue).',
        prioridad: 'Alta',
        fecha_registro: '2026-09-23',
        fecha_implementacion: '2026-09-23',
        solicitado_por: 'Dayana / Operaciones',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-003',
        nombre_requerimiento: 'Asistente Canónico de 4 Casos y Filtro 30 km en Estructurador CRM',
        descripcion: 'Asistente guiado de cotización que evalúa la distancia de traslado (umbral 30 km) y tonelaje, activando condicionalmente tarjetas canónicas y estructurando grúas y fletes en 1 clic.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-22',
        fecha_implementacion: '2026-09-23',
        solicitado_por: 'Sergio Gajardo',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-004',
        nombre_requerimiento: 'Módulo Ejecutivo de Backlog & Release Log de Marcha Blanca',
        descripcion: 'Pestañas de control de mejoras continuas y bitácora técnica de versiones para que el mandante y gerencia perciban todas las intervenciones de ingeniería con seguridad RBAC.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-23',
        fecha_implementacion: '2026-09-23',
        solicitado_por: 'Sergio Gajardo',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-005',
        nombre_requerimiento: 'Firma FES Inmediata en Cierre de Surveys y Visitas a Terreno (PWA)',
        descripcion: 'Encadenamiento automático del diálogo de firma FES (PIN 4 dígitos) inmediatamente al pasar a flujo de aprobación en Visitas a Terreno e Inspecciones, eliminando la navegación manual al menú de firmas.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-23',
        fecha_implementacion: '2026-09-23',
        solicitado_por: 'Sergio Gajardo',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-006',
        nombre_requerimiento: 'Notificaciones Omnicanal (Email + WhatsApp) con Deep Linking Contextual',
        descripcion: 'Arquitectura de notificaciones transaccionales unificadas en backend (notificacionService.js) con despacho concurrente SMTP y microservicio Baileys WhatsApp (puerto 3085). Resolución de deep linking con persistencia de query parameters en Vue Router ante sesiones cerradas y navegación directa a ITS, cotizaciones ganadas y asignación de visitas en PWA.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-24',
        fecha_implementacion: '2026-09-24',
        solicitado_por: 'Sergio Gajardo / Operaciones',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-007',
        nombre_requerimiento: 'Corrección Autofill de Navegador y Desbloqueo de Teléfono en Contactos',
        descripcion: 'Remoción de bloqueo :readonly en teléfono y correo de contactos registrados en GestorOportunidades.vue, sincronización automática al guardar contacto, autocompletado desactivado (autocomplete=off) y reglas CSS anti-autofill en modo oscuro.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-24',
        fecha_implementacion: '2026-09-24',
        solicitado_por: 'Jorge Ponce / Comercial',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-008',
        nombre_requerimiento: 'Visor de Mapa de Telemetría GPS OSM Pantalla Completa (Cero API Key)',
        descripcion: 'Reemplazo total de CartoDB (eliminando marca de agua de API Key requerida) por Leaflet con capas gratuitas OpenStreetMap, Esri Satélite HD y Esri Topo en ModalMapaViaje.vue. Modo Pantalla Completa inmersivo (100vw × 100vh), centrado reactivo de ruta, bitácora colapsible, waypoints animados con flyTo a zoom 17 y endpoint /desvincular en microservicio WhatsApp (puerto 3085).',
        prioridad: 'Alta',
        fecha_registro: '2026-09-24',
        fecha_implementacion: '2026-09-24',
        solicitado_por: 'Jorge Ponce / Operaciones',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-009',
        nombre_requerimiento: 'Desacoplamiento Total entre Despacho de Viaje e Inspección de Pre-Uso',
        descripcion: 'Liberación de la restricción de salida en Subpestaña 5 de GestorOportunidades.vue. Botón directo [🚀 Despachar Viaje] en la cabecera de cada equipo asignado, selector de operador/conductor desbloqueado incondicionalmente, hito Stepper Pase a Terreno liberado y flexibilización de cierre para permitir avance a faena de forma asíncrona.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-24',
        fecha_implementacion: '2026-09-24',
        solicitado_por: 'Jorge Ponce / Operaciones',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      },
      {
        codigo_req: 'REQ-010',
        nombre_requerimiento: 'Optimización Full-Width y Ampliación de Vista Backlog & Marcha Blanca',
        descripcion: 'Erradicación de restricción max-w-7xl en BacklogView.vue permitiendo aprovechamiento total del ancho de pantalla en monitores amplios, rediseño espacioso de columnas de requerimientos, ajuste responsivo de tarjetas de release y sincronización persistente en base de datos PostgreSQL.',
        prioridad: 'Alta',
        fecha_registro: '2026-09-24',
        fecha_implementacion: '2026-09-24',
        solicitado_por: 'Sergio Gajardo / Gerencia',
        estado: 'Implementado',
        creado_por: 'Sergio Gajardo'
      }
    ];

    for (const r of reqs) {
      await client.query(`
        INSERT INTO ${schema}.tcfg_backlog (
          codigo_req, nombre_requerimiento, descripcion, prioridad,
          fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (codigo_req) DO UPDATE
        SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
            descripcion = EXCLUDED.descripcion,
            prioridad = EXCLUDED.prioridad,
            fecha_registro = EXCLUDED.fecha_registro,
            fecha_implementacion = EXCLUDED.fecha_implementacion,
            solicitado_por = EXCLUDED.solicitado_por,
            estado = EXCLUDED.estado,
            creado_por = EXCLUDED.creado_por;
      `, [
        r.codigo_req, r.nombre_requerimiento, r.descripcion, r.prioridad,
        r.fecha_registro, r.fecha_implementacion, r.solicitado_por, r.estado, r.creado_por
      ]);
    }
    console.log(`✅ ${reqs.length} requerimientos insertados/actualizados.`);

    const releases = [
      {
        version: 'v1.0.47',
        fecha_release: '2026-09-22',
        titulo: 'Asistente Canónico de Cotizaciones y Matriz Urbano/Rural (30 km)',
        tipo_release: 'Feature & Estructurador',
        descripcion_impacto: 'Auto-estructuración de cotizaciones en CRM según umbral de 30 km para grúas y fletes de contrapesos.',
        requerimientos_asociados: ['REQ-003'],
        publicado_por: 'Sergio Gajardo'
      },
      {
        version: 'v1.0.48',
        fecha_release: '2026-09-23',
        titulo: 'Buscador Omnibox en Kanban, Visibilidad Comercial y Backlog Ejecutivo',
        tipo_release: 'Feature & UX',
        descripcion_impacto: 'Implementación del buscador omnibox reactivo en Torre de Control, trazabilidad visible del Ejecutivo Comercial en tarjetas Kanban y cabecera CRM, y nueva vista ejecutiva de Backlog de Marcha Blanca con Release Log.',
        requerimientos_asociados: ['REQ-001', 'REQ-002', 'REQ-004'],
        publicado_por: 'Sergio Gajardo'
      },
      {
        version: 'v1.0.49',
        fecha_release: '2026-09-23',
        titulo: 'Firma FES Inmediata al Cerrar Surveys y Visitas a Terreno (PWA)',
        tipo_release: 'UX & Flujo de Firmas',
        descripcion_impacto: 'Encadenamiento automático del diálogo FES/PIN al pulsar Pasar a Flujo de Aprobación en la PWA, eliminando fricción de navegación manual.',
        requerimientos_asociados: ['REQ-005'],
        publicado_por: 'Sergio Gajardo'
      },
      {
        version: 'v1.0.50',
        fecha_release: '2026-09-24',
        titulo: 'Sistema de Notificaciones Omnicanal y Deep Linking Contextual',
        tipo_release: 'Feature & Omnicanal',
        descripcion_impacto: 'Despacho omnicanal concurrente (Email + WhatsApp) para transiciones operativas críticas (ITS V°B°, recepción contable, asignación de visitas técnicas en PWA). Preservación íntegra de ruta de destino (redirect_to) en Vue Router al expirar o iniciar sesión.',
        requerimientos_asociados: ['REQ-006'],
        publicado_por: 'Sergio Gajardo'
      },
      {
        version: 'v1.0.51',
        fecha_release: '2026-09-24',
        titulo: 'Visor Cartográfico OSM Cero API Key, Pantalla Completa y Corrección Autofill',
        tipo_release: 'Feature & Cartografía',
        descripcion_impacto: 'Sustitución de CartoDB por Leaflet con capas gratuitas de OpenStreetMap, Esri Satélite HD y Topográfico. Modo Pantalla Completa inmersivo, centrado de ruta, bitácora colapsible, navegación por waypoints flyTo, y corrección de campos bloqueados por autofill en contactos.',
        requerimientos_asociados: ['REQ-007', 'REQ-008'],
        publicado_por: 'Sergio Gajardo'
      },
      {
        version: 'v1.0.52',
        fecha_release: '2026-09-24',
        titulo: 'Desacoplamiento Operativo de Despacho de Viaje e Inspección de Salida',
        tipo_release: 'Feature & Operaciones',
        descripcion_impacto: 'Habilitación de despacho inmediato de convoy por cabecera de equipo sin depender de la ejecución previa del checklist de pre-uso/patio. Desbloqueo permanente de selector de operador y flexibilización de transición a terreno.',
        requerimientos_asociados: ['REQ-009'],
        publicado_por: 'Sergio Gajardo'
      },
      {
        version: 'v1.0.53',
        fecha_release: '2026-09-24',
        titulo: 'Optimización Full-Width de Backlog y Sincronización Automática de Release Log',
        tipo_release: 'UX & Product Management',
        descripcion_impacto: 'Rediseño de alta amplitud horizontal para la vista de Backlog y Marcha Blanca eliminando bandas laterales ociosas, columnas de tabla optimizadas, actualización íntegra del catálogo de releases y persistencia garantizada en base de datos PostgreSQL.',
        requerimientos_asociados: ['REQ-010'],
        publicado_por: 'Sergio Gajardo'
      }
    ];

    for (const rel of releases) {
      await client.query(`
        INSERT INTO ${schema}.tcfg_releases (
          version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        ON CONFLICT (version) DO UPDATE
        SET fecha_release = EXCLUDED.fecha_release,
            titulo = EXCLUDED.titulo,
            tipo_release = EXCLUDED.tipo_release,
            descripcion_impacto = EXCLUDED.descripcion_impacto,
            requerimientos_asociados = EXCLUDED.requerimientos_asociados,
            publicado_por = EXCLUDED.publicado_por;
      `, [
        rel.version, rel.fecha_release, rel.titulo, rel.tipo_release,
        rel.descripcion_impacto, JSON.stringify(rel.requerimientos_asociados), rel.publicado_por
      ]);
    }
    console.log(`✅ ${releases.length} releases insertados/actualizados.`);

    const countReqs = await client.query(`SELECT COUNT(*) FROM ${schema}.tcfg_backlog`);
    const countRels = await client.query(`SELECT COUNT(*) FROM ${schema}.tcfg_releases`);
    console.log(`Total en DB -> Requerimientos: ${countReqs.rows[0].count}, Releases: ${countRels.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error sincronizando backlog:', err);
    process.exit(1);
  }
}

syncBacklogAndReleases();
