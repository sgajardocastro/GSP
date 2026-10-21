const db = require('../config/dbConfig');

// Función auxiliar para inicializar tablas y semillas si no existen
const ensureTables = async () => {
  const schema = process.env.DB_SCHEMA || 'sch_leangsp';
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${schema}.tcfg_backlog (
      id SERIAL PRIMARY KEY,
      codigo_req VARCHAR(50) UNIQUE,
      nombre_requerimiento VARCHAR(255) NOT NULL,
      descripcion TEXT,
      prioridad VARCHAR(20) DEFAULT 'Media',
      fecha_registro DATE DEFAULT CURRENT_DATE,
      fecha_implementacion DATE,
      solicitado_por VARCHAR(150),
      estado VARCHAR(30) DEFAULT 'Pendiente',
      creado_por VARCHAR(150),
      creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ${schema}.tcfg_releases (
      id SERIAL PRIMARY KEY,
      version VARCHAR(30) UNIQUE NOT NULL,
      fecha_release DATE DEFAULT CURRENT_DATE,
      titulo VARCHAR(255) NOT NULL,
      tipo_release VARCHAR(50) DEFAULT 'Feature & Mejoras',
      descripcion_impacto TEXT,
      requerimientos_asociados JSONB DEFAULT '[]'::jsonb,
      publicado_por VARCHAR(150) DEFAULT 'Sergio Gajardo',
      creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    INSERT INTO ${schema}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por)
    VALUES 
    ('REQ-001', 'Buscador Omnibox Reactivo en Tablero Kanban', 'Buscador reactivo multi-criterio en la cabecera de la Torre de Control (Torre.vue) que filtra concurrentemente las 6 columnas del tablero Kanban por N° de Cotización, Cliente, Ejecutivo Comercial, Obra y Patente de Grúa, con contador de proyectos y atajo Escape.', 'Alta', '2026-09-23', '2026-09-23', 'Dayana / Operaciones', 'Implementado', 'Sergio Gajardo'),
    ('REQ-002', 'Visibilidad Universal del Ejecutivo Comercial en Tarjetas Kanban y Detalle', 'Despliegue visible y obligatorio del badge del Ejecutivo Comercial en las tarjetas del Kanban en todas las etapas del pipeline (Torre.vue), cabecera superior fija y asignación en Preventa Comercial (GestorOportunidades.vue).', 'Alta', '2026-09-23', '2026-09-23', 'Dayana / Operaciones', 'Implementado', 'Sergio Gajardo'),
    ('REQ-003', 'Asistente Canónico de 4 Casos y Filtro 30 km en Estructurador CRM', 'Asistente guiado de cotización que evalúa la distancia de traslado (umbral 30 km) y tonelaje, activando condicionalmente tarjetas canónicas y estructurando grúas y fletes en 1 clic.', 'Alta', '2026-09-22', '2026-09-23', 'Sergio Gajardo', 'Implementado', 'Sergio Gajardo'),
    ('REQ-004', 'Módulo Ejecutivo de Backlog & Release Log de Marcha Blanca', 'Pestañas de control de mejoras continuas y bitácora técnica de versiones para que el mandante y gerencia perciban todas las intervenciones de ingeniería con seguridad RBAC.', 'Alta', '2026-09-23', '2026-09-23', 'Sergio Gajardo', 'Implementado', 'Sergio Gajardo'),
    ('REQ-005', 'Firma FES Inmediata en Cierre de Surveys y Visitas a Terreno (PWA)', 'Encadenamiento automático del diálogo de firma FES (PIN 4 dígitos) inmediatamente al pasar a flujo de aprobación en Visitas a Terreno e Inspecciones, eliminando la navegación manual al menú de firmas.', 'Alta', '2026-09-23', '2026-09-23', 'Sergio Gajardo', 'Implementado', 'Sergio Gajardo'),
    ('REQ-006', 'Notificaciones Omnicanal (Email + WhatsApp) con Deep Linking Contextual', 'Arquitectura de notificaciones transaccionales unificadas en backend (notificacionService.js) con despacho concurrente SMTP y microservicio Baileys WhatsApp (puerto 3085). Resolución de deep linking con persistencia de query parameters en Vue Router ante sesiones cerradas y navegación directa a ITS, cotizaciones ganadas y asignación de visitas en PWA.', 'Alta', '2026-09-24', '2026-09-24', 'Sergio Gajardo / Operaciones', 'Implementado', 'Sergio Gajardo'),
    ('REQ-007', 'Corrección Autofill de Navegador y Desbloqueo de Teléfono en Contactos', 'Remoción de bloqueo :readonly en teléfono y correo de contactos registrados en GestorOportunidades.vue, sincronización automática al guardar contacto, autocompletado desactivado (autocomplete=off) y reglas CSS anti-autofill en modo oscuro.', 'Alta', '2026-09-24', '2026-09-24', 'Jorge Ponce / Comercial', 'Implementado', 'Sergio Gajardo'),
    ('REQ-008', 'Visor de Mapa de Telemetría GPS OSM Pantalla Completa (Cero API Key)', 'Reemplazo total de CartoDB (eliminando marca de agua de API Key requerida) por Leaflet con capas gratuitas OpenStreetMap, Esri Satélite HD y Esri Topo en ModalMapaViaje.vue. Modo Pantalla Completa inmersivo (100vw × 100vh), centrado reactivo de ruta, bitácora colapsible, waypoints animados con flyTo a zoom 17 y endpoint /desvincular en microservicio WhatsApp (puerto 3085).', 'Alta', '2026-09-24', '2026-09-24', 'Jorge Ponce / Operaciones', 'Implementado', 'Sergio Gajardo'),
    ('REQ-009', 'Desacoplamiento Total entre Despacho de Viaje e Inspección de Pre-Uso', 'Liberación de la restricción de salida en Subpestaña 5 de GestorOportunidades.vue. Botón directo [🚀 Despachar Viaje] en la cabecera de cada equipo asignado, selector de operador/conductor desbloqueado incondicionalmente, hito Stepper Pase a Terreno liberado y flexibilización de cierre para permitir avance a faena de forma asíncrona.', 'Alta', '2026-09-24', '2026-09-24', 'Jorge Ponce / Operaciones', 'Implementado', 'Sergio Gajardo'),
    ('REQ-010', 'Optimización Full-Width y Ampliación de Vista Backlog & Marcha Blanca', 'Erradicación de restricción max-w-7xl en BacklogView.vue permitiendo aprovechamiento total del ancho de pantalla en monitores amplios, rediseño espacioso de columnas de requerimientos, ajuste responsivo de tarjetas de release y sincronización persistente en base de datos PostgreSQL.', 'Alta', '2026-09-24', '2026-09-24', 'Sergio Gajardo / Gerencia', 'Implementado', 'Sergio Gajardo')
    ON CONFLICT (codigo_req) DO UPDATE 
    SET nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        fecha_registro = EXCLUDED.fecha_registro,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        solicitado_por = EXCLUDED.solicitado_por,
        estado = EXCLUDED.estado,
        creado_por = EXCLUDED.creado_por;

    INSERT INTO ${schema}.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES 
    ('v1.0.53', '2026-09-24', 'Optimización Full-Width de Backlog y Sincronización Automática de Release Log', 'UX & Product Management', 'Rediseño de alta amplitud horizontal para la vista de Backlog y Marcha Blanca eliminando bandas laterales ociosas, columnas de tabla optimizadas, actualización íntegra del catálogo de releases y persistencia garantizada en base de datos PostgreSQL.', '["REQ-010"]'::jsonb, 'Sergio Gajardo'),
    ('v1.0.52', '2026-09-24', 'Desacoplamiento Operativo de Despacho de Viaje e Inspección de Salida', 'Feature & Operaciones', 'Habilitación de despacho inmediato de convoy por cabecera de equipo sin depender de la ejecución previa del checklist de pre-uso/patio. Desbloqueo permanente de selector de operador y flexibilización de transición a terreno.', '["REQ-009"]'::jsonb, 'Sergio Gajardo'),
    ('v1.0.51', '2026-09-24', 'Visor Cartográfico OSM Cero API Key, Pantalla Completa y Corrección Autofill', 'Feature & Cartografía', 'Sustitución de CartoDB por Leaflet con capas gratuitas de OpenStreetMap, Esri Satélite HD y Topográfico. Modo Pantalla Completa inmersivo, centrado de ruta, bitácora colapsible, navegación por waypoints flyTo, y corrección de campos bloqueados por autofill en contactos.', '["REQ-007", "REQ-008"]'::jsonb, 'Sergio Gajardo'),
    ('v1.0.50', '2026-09-24', 'Sistema de Notificaciones Omnicanal y Deep Linking Contextual', 'Feature & Omnicanal', 'Despacho omnicanal concurrente (Email + WhatsApp) para transiciones operativas críticas (ITS V°B°, recepción contable, asignación de visitas técnicas en PWA). Preservación íntegra de ruta de destino (redirect_to) en Vue Router al expirar o iniciar sesión.', '["REQ-006"]'::jsonb, 'Sergio Gajardo'),
    ('v1.0.49', '2026-09-23', 'Firma FES Inmediata al Cerrar Surveys y Visitas a Terreno (PWA)', 'UX & Flujo de Firmas', 'Encadenamiento automático del diálogo FES/PIN al pulsar Pasar a Flujo de Aprobación en la PWA, eliminando fricción de navegación manual.', '["REQ-005"]'::jsonb, 'Sergio Gajardo'),
    ('v1.0.48', '2026-09-23', 'Buscador Omnibox en Kanban, Visibilidad Comercial y Backlog Ejecutivo', 'Feature & UX', 'Implementación del buscador omnibox reactivo en Torre de Control, trazabilidad visible del Ejecutivo Comercial en tarjetas Kanban y cabecera CRM, y nueva vista ejecutiva de Backlog de Marcha Blanca con Release Log.', '["REQ-001", "REQ-002", "REQ-004"]'::jsonb, 'Sergio Gajardo'),
    ('v1.0.47', '2026-09-22', 'Asistente Canónico de Cotizaciones y Matriz Urbano/Rural (30 km)', 'Feature & Estructurador', 'Auto-estructuración de cotizaciones en CRM según umbral de 30 km para grúas y fletes de contrapesos.', '["REQ-003"]'::jsonb, 'Sergio Gajardo')
    ON CONFLICT (version) DO UPDATE
    SET fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `);
};

const backlogController = {
  // 1. Obtener todos los requerimientos
  async getRequerimientos(req, res) {
    try {
      await ensureTables();
      const schema = process.env.DB_SCHEMA || 'sch_leangsp';
      const result = await db.query(`
        SELECT * FROM ${schema}.tcfg_backlog 
        ORDER BY 
          CASE estado 
            WHEN 'En ejecución' THEN 1 
            WHEN 'Pendiente' THEN 2 
            WHEN 'Implementado' THEN 3 
            ELSE 4 
          END,
          fecha_registro DESC, 
          id DESC
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error al obtener backlog:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Crear un nuevo requerimiento
  async crearRequerimiento(req, res) {
    try {
      await ensureTables();
      const schema = process.env.DB_SCHEMA || 'sch_leangsp';
      const {
        nombre_requerimiento,
        descripcion,
        prioridad = 'Media',
        fecha_registro,
        fecha_implementacion,
        solicitado_por,
        estado = 'Pendiente',
        creado_por = 'Sergio Gajardo'
      } = req.body;

      if (!nombre_requerimiento || !solicitado_por) {
        return res.status(400).json({ success: false, error: 'Nombre del requerimiento y Solicitado Por son obligatorios' });
      }

      // Obtener el siguiente correlativo REQ-xxx
      const seqRes = await db.query(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${schema}.tcfg_backlog`);
      const nextId = seqRes.rows[0].next_id;
      const codigo_req = `REQ-${String(nextId).padStart(3, '0')}`;

      const insertRes = await db.query(`
        INSERT INTO ${schema}.tcfg_backlog 
          (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por)
        VALUES 
          ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, $8, $9)
        RETURNING *
      `, [codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro || null, fecha_implementacion || null, solicitado_por, estado, creado_por]);

      res.status(201).json({ success: true, data: insertRes.rows[0] });
    } catch (err) {
      console.error('Error al crear requerimiento:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Actualizar requerimiento existente
  async actualizarRequerimiento(req, res) {
    try {
      await ensureTables();
      const schema = process.env.DB_SCHEMA || 'sch_leangsp';
      const { id } = req.params;
      const {
        nombre_requerimiento,
        descripcion,
        prioridad,
        fecha_registro,
        fecha_implementacion,
        solicitado_por,
        estado
      } = req.body;

      const updateRes = await db.query(`
        UPDATE ${schema}.tcfg_backlog
        SET 
          nombre_requerimiento = COALESCE($1, nombre_requerimiento),
          descripcion = COALESCE($2, descripcion),
          prioridad = COALESCE($3, prioridad),
          fecha_registro = COALESCE($4, fecha_registro),
          fecha_implementacion = $5,
          solicitado_por = COALESCE($6, solicitado_por),
          estado = COALESCE($7, estado),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `, [nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, id]);

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Requerimiento no encontrado' });
      }

      res.json({ success: true, data: updateRes.rows[0] });
    } catch (err) {
      console.error('Error al actualizar requerimiento:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Eliminar requerimiento
  async eliminarRequerimiento(req, res) {
    try {
      await ensureTables();
      const schema = process.env.DB_SCHEMA || 'sch_leangsp';
      const { id } = req.params;

      await db.query(`DELETE FROM ${schema}.tcfg_backlog WHERE id = $1`, [id]);
      res.json({ success: true, message: 'Requerimiento eliminado correctamente' });
    } catch (err) {
      console.error('Error al eliminar requerimiento:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Obtener todos los releases (Changelog)
  async getReleases(req, res) {
    try {
      await ensureTables();
      const schema = process.env.DB_SCHEMA || 'sch_leangsp';
      const result = await db.query(`
        SELECT * FROM ${schema}.tcfg_releases 
        ORDER BY fecha_release DESC, id DESC
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error al obtener releases:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. Crear un nuevo release
  async crearRelease(req, res) {
    try {
      await ensureTables();
      const schema = process.env.DB_SCHEMA || 'sch_leangsp';
      const {
        version,
        fecha_release,
        titulo,
        tipo_release = 'Feature & Mejoras',
        descripcion_impacto,
        requerimientos_asociados = [],
        publicado_por = 'Sergio Gajardo'
      } = req.body;

      if (!version || !titulo) {
        return res.status(400).json({ success: false, error: 'Versión y Título son obligatorios' });
      }

      const insertRes = await db.query(`
        INSERT INTO ${schema}.tcfg_releases 
          (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
        VALUES 
          ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6::jsonb, $7)
        RETURNING *
      `, [version, fecha_release || null, titulo, tipo_release, descripcion_impacto, JSON.stringify(requerimientos_asociados), publicado_por]);

      res.status(201).json({ success: true, data: insertRes.rows[0] });
    } catch (err) {
      console.error('Error al crear release:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = backlogController;
