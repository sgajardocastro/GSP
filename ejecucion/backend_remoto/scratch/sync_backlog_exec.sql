
    BEGIN;
    
-- SINCRONIZACION SCHEMA: sch_leangsp

      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-021', 'Auditoría de Roles y Permisos RBAC en Creación de Clientes y OTs', 'Control de acceso basado en roles para la gestión de clientes, preventas y asignaciones operacionales.', 'Alta', 'Implementado', 'Operaciones GSP', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-023', 'Integración de Folios y Versionamiento de Cotizaciones en Base de Datos', 'Generación canónica de versiones de cotización V1, V2 con secuencia seq_id_cotizacion y trazabilidad.', 'Alta', 'Implementado', 'Comercial GSP', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-028', 'Gobernanza de EDP: Hard Gate ITS, Edición Exclusiva Pamela y Despacho Condicional', 'Bloqueo duro de Carátula EDP sin ITS visado, restricción de tarifas a Tesorería y despacho condicional según condición de pago.', 'Crítica', 'Implementado', 'Pamela Seguel / Contabilidad', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-029', 'Integración de OC y Facturación sin Bloqueo', 'Manejo de condición Cliente Sin OC (Asumir EDP) para avanzar a Facturación DTE sin trabas operativas.', 'Alta', 'Implementado', 'Pamela Seguel / Tesorería', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-030', 'Modelo de Servicios Recurrentes y Modo Arriendo Mensual', 'Arquitectura para gestionar servicios de largo aliento bajo el mismo negocio/proyecto con cortes de facturación periódicos sin duplicar OTs.', 'Media', 'Pendiente', 'Gerencia General GSP', 'Sistema', '2026-10-01', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-031', 'Erradicación de Rigger por Defecto y Ocultamiento Limpio en Report Diario', 'Eliminación definitiva de fallbacks fijos de Rigger en PWA, Visor Web y PDF cuando la OT no tiene especialista asignado.', 'Alta', 'Implementado', 'Jorge Ponce / Operaciones', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-032', 'Filtrado Estricto de Reports Pendientes por Tripulación PWA', 'Sustitución de LIKE difuso por verificación estricta de JSON en endpoint de pendientes en PWA.', 'Crítica', 'Implementado', 'Operaciones / Terreno', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-033', 'Acotamiento de Destinatarios de Notificaciones y Gobernanza de Correo', 'Restricción de destinatarios en modales de Requerimiento, Aprobación de OT e ITS a gestión y comercial.', 'Alta', 'Implementado', 'Operaciones / Comercial', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-034', 'Conciliación Reactiva ITS, Reparación de Fechas, Flete y Valorización por Ítem', 'Auto-sincronización de reportes diarios en ITS borrador, reparación de inputs date, cálculo de flete $400.000.', 'Alta', 'Implementado', 'Contabilidad / PMO', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-035', 'Filas Físicas de Traslados (Fletes), Tarifa Estándar Operador $10.000 y Fechas Sanitizadas', 'Inyección de Flete Solo Ida y Solo Retorno en ITS, asignación de operador y sanitización de fechas.', 'Alta', 'Implementado', 'Contabilidad / Pamela', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-036', 'Torre de Control PMO: Acceso a PDFs, Avance Global del Negocio y Herencia de Estados', 'Botones directos de PDF ITS y EDP, motor de avance global 0-100% y herencia retrospectiva de estados en faenas concluidas.', 'Alta', 'Implementado', 'Yiara / PMO', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-037', 'Gobernanza de EDP: Permisos Globales de Administración, Solicitud de Cambio RFC y Deep Link', 'Permisos de edición para Sergio Gajardo, flujo RFC con botón Solicitar Modificación y notificación omnicanal con deep link.', 'Alta', 'Implementado', 'Sergio Gajardo / Dirección', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-038', 'Aislamiento de Control Financiero: Modo Solo Lectura en Kanban vs Edición Exclusiva en PMO', 'Inmutabilidad financiera en GestorOportunidades y edición/cierre exclusivo en Torre PMO.', 'Alta', 'Implementado', 'Tesorería / PMO', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-039', 'Perspectiva Temporal de Flota (Gantt), Métricas de Gestión y Erradicación Cockpit', 'Métricas de inspecciones, devengado y OEE por equipo, barras cromáticas interactivas y navegación 1-clic a la OT.', 'Alta', 'Implementado', 'Dirección / Operaciones', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-040', 'Corrección Integral Dossier EDP: Horarios de Faena, Rango de Colación y Contraste Email RFC', 'Extracción de horarios de servicio en Anexo 1, contraste en notificaciones HTML y validación de período.', 'Alta', 'Implementado', 'Pamela Seguel / Contabilidad', 'Sistema', '2026-10-03', '2026-10-03', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-041', 'Alineación de Alcance y Corrección de Dossier EDP: Eliminación de Horario de Colación', 'Reversión de horario de colación en BD, mantenimiento estricto de duración en horas/minutos pactada.', 'Alta', 'Implementado', 'Dirección General GSP', 'Sistema', '2026-10-03', '2026-10-03', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-042', 'Control Operativo en Vivo Multi-Equipo con la OT como Driver, Semáforos Cromáticos y Candado', 'Sub-vista Control Vivo en Torre PMO, soporte multi-equipo con píldoras interactivas, endpoint consolidado y candado de cierre operacional.', 'Crítica', 'Implementado', 'Yiara / Dirección', 'Sistema', '2026-10-03', '2026-10-04', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-043', 'Gobernanza RBAC y Protocolo de Notificaciones (Omar Ghiselini y Aislamiento Storage)', 'Reasignación de Omar Soffia como Operador, activación de Omar Ghiselini como Director y aislamiento de storage por ambiente.', 'Crítica', 'Implementado', 'Dirección GSP', 'Sistema', '2026-10-05', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-044', 'Auditoría Exhaustiva de URLs, Endpoints y Storage Paths (Limpieza Total de Hardcoding)', 'Erradicación de URLs estáticas y fallbacks a DEV en frontend, backend y PWA; Dynamic Routing universal.', 'Crítica', 'Implementado', 'Dirección Técnica', 'Sistema', '2026-10-05', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-045', 'Corrección de Enrutamiento PWA a Hoja de Ruta de Conductor y Desacoplamiento de Despacho', 'Dinamización de abrirViajeNativo en PWA para redirigir al ambiente activo y desacoplamiento de estados en GestorOportunidades.', 'Crítica', 'Implementado', 'Dirección / Operaciones', 'Sistema', '2026-10-05', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-569', 'Cambio de empresa en cotizacion', 'al colocar otra empresa como bestmaq o logistica no se cambia en la cotizacion.', 'Crítica', 'Implementado', 'jorge ponce', 'jorge ponce', '2026-10-04', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-620', 'Nombre obra y ciudad autocompeltada con letras al azar', 'en la cotizacion al generar un nuevo negocio esta prellenado el nombre de obra y ciudad con letras al azar, deberia estar vacio.', 'Alta', 'Implementado', 'jorge ponce', 'jorge ponce', '2026-10-04', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-651', 'Destinatarios al enviar cotizacion aparecen personas que no corresponden', 'aparecen personas en destinatarios, ejemplo Omar soffia como adm (no corresponde)', 'Crítica', 'Implementado', 'jorge ponce', 'jorge ponce', '2026-10-04', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-682', 'DUPLICADO EL TRASLADO EN COTIZACION VS ESTRUCTURADOR', 'los traslados se ven dos veces en el pdf cotizacion vs una vez en el estructurador de precios.', 'Crítica', 'En Revisión', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-773', 'FALTA HORA DE INICIO SERVICIO EN OT Y HORAS MINIMAS EN PDF OT', 'solo esta la hora de salida de la base, pero no esta la hora de inicio de servicio. Tambien faltan las horas minimas en OT pdf.', 'Crítica', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-804', 'WHATSAPP NO ESTA FUNCIONANDO AL NOTIFICAR A OPERADOR Y RIGGER', 'solo esta llegando el correo, no el wsp de notificacion de servicio.', 'Media', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-835', 'EN LA LA APP SIMPLIFICAR LA TOMADE NIVEL DE COMBUSTIBLE', 'DEJAR SOLO LA TOMA DEL NIVEL DE COMBUSTIBLE UNA VEZ AL LLEGAR A FAENA, ELIMINAR LA TOMA DE COMB DE LA SALIDA DE BASE. Y DEJARLO CON SOLO PORCENTAJE CON UNA LISTA DESPLEGABLE O AL ESCRIBIR QUE MUESTRE EL PORCENTAJE Y SOLO DEJE ESCRIBIR DEL 1 AL 100 + %', 'Media', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-896', 'AL TERMINAR ARRIBO A OBRA BOTON VERDE AL PRESIONAR CIERRA APP', 'AL PRESIONAR BOTON VERDE DESPUES DE ARRIBO A OBRA, (BOTON IR A LA PWA / REGISTRAR REPORT DIARIO) CIERRA LA APP, DEBERIA ENVIAR DIRECTAMENTE AL INIICO DE REPORT. TAMBIEN ESTE DEBERIA SOLICITAR SOLO EL HOROMETRO DE LA SUPERESTRUCTURA Y FOTO DE ESTA. ELIMINAR EL ODOMETRO PORQUE YA SE INDICO EN EL ARRIBO.', 'Crítica', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-957', 'HOROMETRO NO CLARO AL TERMINO DE SERVICIO EN REPORT', 'AL TERMINAR REPORT EN MOMENTO 2, NO ES CLARO EL HOROMETRO YA QUE DEBEMOS REGISTRAR AMBOS HOROMETROS, DEBERIAMOS PORDER REGISTRAR AL TERMINO CADA HOROMETRO CON FOTOGRAFIA CADA UNO. EL ODOMETRO SOLO ES NECESARIO AL REGRESO EN BASE CON SU RESPECTIVA FOTO.', 'Media', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-988', 'FALTA RETORNO A BASE', 'AL TERMINAR EL REPORT, FALTA LA OPCION DE REGISTRAR SALIDA DE OBRA A BASE (UN SOLO BOTON SIMPLE SIN MAS DATOS) Y OTRO BOTON DE LLEGADA A BASE DONDE SE INDIQUE EL ODOMETRO Y FOTO, HOROMETRO Y FOTO. (SIMILAR A LA SALIDA DE BASE)', 'Crítica', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.66', '2026-10-01', 'Portal Web GSP v1.0.66: Auditoría de Roles y Permisos RBAC', '["REQ-021"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.67', '2026-10-01', 'Portal Web GSP v1.0.67: Integración de Folios y Versionamiento de Cotizaciones', '["REQ-023"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.68', '2026-10-01', 'Portal Web GSP v1.0.68: Erradicación de Rigger por Defecto', '["REQ-031"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'api-v1.0.12', '2026-10-01', 'Backend GSP: Parche Crítico Filtrado de OTs por Tripulante PWA', '["REQ-032"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.69', '2026-10-02', 'Portal Web GSP v1.0.69: Acotamiento de Destinatarios de Notificaciones', '["REQ-033"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.70', '2026-10-02', 'Portal Web GSP v1.0.70: Conciliación Reactiva ITS y Flete Comercial', '["REQ-034"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.71', '2026-10-02', 'Portal Web GSP v1.0.71: Filas Físicas de Traslados y Tarifa Estándar Operador', '["REQ-035"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.72', '2026-10-02', 'Portal Web GSP v1.0.72: Torre PMO Acceso PDFs y Avance Global', '["REQ-036"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.73', '2026-10-02', 'Portal Web GSP v1.0.73: Gobernanza EDP Permisos Sergio Gajardo y RFC', '["REQ-037"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.74', '2026-10-02', 'Portal Web GSP v1.0.74: Aislamiento Control Financiero Kanban vs PMO', '["REQ-038"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.75', '2026-10-02', 'Portal Web GSP v1.0.75: Perspectiva Temporal de Flota Gantt', '["REQ-039"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.76', '2026-10-03', 'Portal Web GSP v1.0.76: Corrección Integral Dossier EDP y Contraste Email', '["REQ-040"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.77', '2026-10-03', 'Portal Web GSP v1.0.77: Alineación Alcance Sin Horarios de Colación', '["REQ-041"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.78', '2026-10-03', 'Portal Web GSP v1.0.78: Control Operativo en Vivo Opción 3 Híbrida', '["REQ-042"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.80', '2026-10-04', 'Control Operativo en Vivo Multi-Equipo con la OT como Driver (Producción)', '["REQ-042"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.81', '2026-10-04', 'Portal Web GSP v1.0.81: Parametrización Estricta de Entorno en Notificaciones', '["REQ-042"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.84', '2026-10-05', 'Portal Web GSP v1.0.84: Gobernanza RBAC y Creación Omar Ghiselini', '["REQ-043"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.85', '2026-10-05', 'Portal Web GSP v1.0.85: Zero Hardcoding y Total Dynamic Routing', '["REQ-044"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        '1.0.86', '2026-10-05', 'Fix de Enrutamiento PWA a Hoja de Ruta de Conductor y Desacoplamiento de Estados de Despacho', '["REQ-045"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
    
-- SINCRONIZACION SCHEMA: sch_leangsp_prod

      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-021', 'Auditoría de Roles y Permisos RBAC en Creación de Clientes y OTs', 'Control de acceso basado en roles para la gestión de clientes, preventas y asignaciones operacionales.', 'Alta', 'Implementado', 'Operaciones GSP', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-023', 'Integración de Folios y Versionamiento de Cotizaciones en Base de Datos', 'Generación canónica de versiones de cotización V1, V2 con secuencia seq_id_cotizacion y trazabilidad.', 'Alta', 'Implementado', 'Comercial GSP', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-028', 'Gobernanza de EDP: Hard Gate ITS, Edición Exclusiva Pamela y Despacho Condicional', 'Bloqueo duro de Carátula EDP sin ITS visado, restricción de tarifas a Tesorería y despacho condicional según condición de pago.', 'Crítica', 'Implementado', 'Pamela Seguel / Contabilidad', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-029', 'Integración de OC y Facturación sin Bloqueo', 'Manejo de condición Cliente Sin OC (Asumir EDP) para avanzar a Facturación DTE sin trabas operativas.', 'Alta', 'Implementado', 'Pamela Seguel / Tesorería', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-030', 'Modelo de Servicios Recurrentes y Modo Arriendo Mensual', 'Arquitectura para gestionar servicios de largo aliento bajo el mismo negocio/proyecto con cortes de facturación periódicos sin duplicar OTs.', 'Media', 'Pendiente', 'Gerencia General GSP', 'Sistema', '2026-10-01', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-031', 'Erradicación de Rigger por Defecto y Ocultamiento Limpio en Report Diario', 'Eliminación definitiva de fallbacks fijos de Rigger en PWA, Visor Web y PDF cuando la OT no tiene especialista asignado.', 'Alta', 'Implementado', 'Jorge Ponce / Operaciones', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-032', 'Filtrado Estricto de Reports Pendientes por Tripulación PWA', 'Sustitución de LIKE difuso por verificación estricta de JSON en endpoint de pendientes en PWA.', 'Crítica', 'Implementado', 'Operaciones / Terreno', 'Sistema', '2026-10-01', '2026-10-01', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-033', 'Acotamiento de Destinatarios de Notificaciones y Gobernanza de Correo', 'Restricción de destinatarios en modales de Requerimiento, Aprobación de OT e ITS a gestión y comercial.', 'Alta', 'Implementado', 'Operaciones / Comercial', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-034', 'Conciliación Reactiva ITS, Reparación de Fechas, Flete y Valorización por Ítem', 'Auto-sincronización de reportes diarios en ITS borrador, reparación de inputs date, cálculo de flete $400.000.', 'Alta', 'Implementado', 'Contabilidad / PMO', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-035', 'Filas Físicas de Traslados (Fletes), Tarifa Estándar Operador $10.000 y Fechas Sanitizadas', 'Inyección de Flete Solo Ida y Solo Retorno en ITS, asignación de operador y sanitización de fechas.', 'Alta', 'Implementado', 'Contabilidad / Pamela', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-036', 'Torre de Control PMO: Acceso a PDFs, Avance Global del Negocio y Herencia de Estados', 'Botones directos de PDF ITS y EDP, motor de avance global 0-100% y herencia retrospectiva de estados en faenas concluidas.', 'Alta', 'Implementado', 'Yiara / PMO', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-037', 'Gobernanza de EDP: Permisos Globales de Administración, Solicitud de Cambio RFC y Deep Link', 'Permisos de edición para Sergio Gajardo, flujo RFC con botón Solicitar Modificación y notificación omnicanal con deep link.', 'Alta', 'Implementado', 'Sergio Gajardo / Dirección', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-038', 'Aislamiento de Control Financiero: Modo Solo Lectura en Kanban vs Edición Exclusiva en PMO', 'Inmutabilidad financiera en GestorOportunidades y edición/cierre exclusivo en Torre PMO.', 'Alta', 'Implementado', 'Tesorería / PMO', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-039', 'Perspectiva Temporal de Flota (Gantt), Métricas de Gestión y Erradicación Cockpit', 'Métricas de inspecciones, devengado y OEE por equipo, barras cromáticas interactivas y navegación 1-clic a la OT.', 'Alta', 'Implementado', 'Dirección / Operaciones', 'Sistema', '2026-10-02', '2026-10-02', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-040', 'Corrección Integral Dossier EDP: Horarios de Faena, Rango de Colación y Contraste Email RFC', 'Extracción de horarios de servicio en Anexo 1, contraste en notificaciones HTML y validación de período.', 'Alta', 'Implementado', 'Pamela Seguel / Contabilidad', 'Sistema', '2026-10-03', '2026-10-03', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-041', 'Alineación de Alcance y Corrección de Dossier EDP: Eliminación de Horario de Colación', 'Reversión de horario de colación en BD, mantenimiento estricto de duración en horas/minutos pactada.', 'Alta', 'Implementado', 'Dirección General GSP', 'Sistema', '2026-10-03', '2026-10-03', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-042', 'Control Operativo en Vivo Multi-Equipo con la OT como Driver, Semáforos Cromáticos y Candado', 'Sub-vista Control Vivo en Torre PMO, soporte multi-equipo con píldoras interactivas, endpoint consolidado y candado de cierre operacional.', 'Crítica', 'Implementado', 'Yiara / Dirección', 'Sistema', '2026-10-03', '2026-10-04', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-043', 'Gobernanza RBAC y Protocolo de Notificaciones (Omar Ghiselini y Aislamiento Storage)', 'Reasignación de Omar Soffia como Operador, activación de Omar Ghiselini como Director y aislamiento de storage por ambiente.', 'Crítica', 'Implementado', 'Dirección GSP', 'Sistema', '2026-10-05', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-044', 'Auditoría Exhaustiva de URLs, Endpoints y Storage Paths (Limpieza Total de Hardcoding)', 'Erradicación de URLs estáticas y fallbacks a DEV en frontend, backend y PWA; Dynamic Routing universal.', 'Crítica', 'Implementado', 'Dirección Técnica', 'Sistema', '2026-10-05', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-045', 'Corrección de Enrutamiento PWA a Hoja de Ruta de Conductor y Desacoplamiento de Despacho', 'Dinamización de abrirViajeNativo en PWA para redirigir al ambiente activo y desacoplamiento de estados en GestorOportunidades.', 'Crítica', 'Implementado', 'Dirección / Operaciones', 'Sistema', '2026-10-05', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-569', 'Cambio de empresa en cotizacion', 'al colocar otra empresa como bestmaq o logistica no se cambia en la cotizacion.', 'Crítica', 'Implementado', 'jorge ponce', 'jorge ponce', '2026-10-04', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-620', 'Nombre obra y ciudad autocompeltada con letras al azar', 'en la cotizacion al generar un nuevo negocio esta prellenado el nombre de obra y ciudad con letras al azar, deberia estar vacio.', 'Alta', 'Implementado', 'jorge ponce', 'jorge ponce', '2026-10-04', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-651', 'Destinatarios al enviar cotizacion aparecen personas que no corresponden', 'aparecen personas en destinatarios, ejemplo Omar soffia como adm (no corresponde)', 'Crítica', 'Implementado', 'jorge ponce', 'jorge ponce', '2026-10-04', '2026-10-05', NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-682', 'DUPLICADO EL TRASLADO EN COTIZACION VS ESTRUCTURADOR', 'los traslados se ven dos veces en el pdf cotizacion vs una vez en el estructurador de precios.', 'Crítica', 'En Revisión', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-773', 'FALTA HORA DE INICIO SERVICIO EN OT Y HORAS MINIMAS EN PDF OT', 'solo esta la hora de salida de la base, pero no esta la hora de inicio de servicio. Tambien faltan las horas minimas en OT pdf.', 'Crítica', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-804', 'WHATSAPP NO ESTA FUNCIONANDO AL NOTIFICAR A OPERADOR Y RIGGER', 'solo esta llegando el correo, no el wsp de notificacion de servicio.', 'Media', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-835', 'EN LA LA APP SIMPLIFICAR LA TOMADE NIVEL DE COMBUSTIBLE', 'DEJAR SOLO LA TOMA DEL NIVEL DE COMBUSTIBLE UNA VEZ AL LLEGAR A FAENA, ELIMINAR LA TOMA DE COMB DE LA SALIDA DE BASE. Y DEJARLO CON SOLO PORCENTAJE CON UNA LISTA DESPLEGABLE O AL ESCRIBIR QUE MUESTRE EL PORCENTAJE Y SOLO DEJE ESCRIBIR DEL 1 AL 100 + %', 'Media', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-896', 'AL TERMINAR ARRIBO A OBRA BOTON VERDE AL PRESIONAR CIERRA APP', 'AL PRESIONAR BOTON VERDE DESPUES DE ARRIBO A OBRA, (BOTON IR A LA PWA / REGISTRAR REPORT DIARIO) CIERRA LA APP, DEBERIA ENVIAR DIRECTAMENTE AL INIICO DE REPORT. TAMBIEN ESTE DEBERIA SOLICITAR SOLO EL HOROMETRO DE LA SUPERESTRUCTURA Y FOTO DE ESTA. ELIMINAR EL ODOMETRO PORQUE YA SE INDICO EN EL ARRIBO.', 'Crítica', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-957', 'HOROMETRO NO CLARO AL TERMINO DE SERVICIO EN REPORT', 'AL TERMINAR REPORT EN MOMENTO 2, NO ES CLARO EL HOROMETRO YA QUE DEBEMOS REGISTRAR AMBOS HOROMETROS, DEBERIAMOS PORDER REGISTRAR AL TERMINO CADA HOROMETRO CON FOTOGRAFIA CADA UNO. EL ODOMETRO SOLO ES NECESARIO AL REGRESO EN BASE CON SU RESPECTIVA FOTO.', 'Media', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_backlog (
        codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
      ) VALUES (
        'REQ-988', 'FALTA RETORNO A BASE', 'AL TERMINAR EL REPORT, FALTA LA OPCION DE REGISTRAR SALIDA DE OBRA A BASE (UN SOLO BOTON SIMPLE SIN MAS DATOS) Y OTRO BOTON DE LLEGADA A BASE DONDE SE INDIQUE EL ODOMETRO Y FOTO, HOROMETRO Y FOTO. (SIMILAR A LA SALIDA DE BASE)', 'Crítica', 'Pendiente', 'jorge ponce', 'jorge ponce', '2026-10-04', NULL, NOW()
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        prioridad = EXCLUDED.prioridad,
        estado = EXCLUDED.estado,
        solicitado_por = EXCLUDED.solicitado_por,
        fecha_implementacion = EXCLUDED.fecha_implementacion,
        updated_at = NOW();
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.66', '2026-10-01', 'Portal Web GSP v1.0.66: Auditoría de Roles y Permisos RBAC', '["REQ-021"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.67', '2026-10-01', 'Portal Web GSP v1.0.67: Integración de Folios y Versionamiento de Cotizaciones', '["REQ-023"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.68', '2026-10-01', 'Portal Web GSP v1.0.68: Erradicación de Rigger por Defecto', '["REQ-031"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'api-v1.0.12', '2026-10-01', 'Backend GSP: Parche Crítico Filtrado de OTs por Tripulante PWA', '["REQ-032"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.69', '2026-10-02', 'Portal Web GSP v1.0.69: Acotamiento de Destinatarios de Notificaciones', '["REQ-033"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.70', '2026-10-02', 'Portal Web GSP v1.0.70: Conciliación Reactiva ITS y Flete Comercial', '["REQ-034"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.71', '2026-10-02', 'Portal Web GSP v1.0.71: Filas Físicas de Traslados y Tarifa Estándar Operador', '["REQ-035"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.72', '2026-10-02', 'Portal Web GSP v1.0.72: Torre PMO Acceso PDFs y Avance Global', '["REQ-036"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.73', '2026-10-02', 'Portal Web GSP v1.0.73: Gobernanza EDP Permisos Sergio Gajardo y RFC', '["REQ-037"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.74', '2026-10-02', 'Portal Web GSP v1.0.74: Aislamiento Control Financiero Kanban vs PMO', '["REQ-038"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.75', '2026-10-02', 'Portal Web GSP v1.0.75: Perspectiva Temporal de Flota Gantt', '["REQ-039"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.76', '2026-10-03', 'Portal Web GSP v1.0.76: Corrección Integral Dossier EDP y Contraste Email', '["REQ-040"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.77', '2026-10-03', 'Portal Web GSP v1.0.77: Alineación Alcance Sin Horarios de Colación', '["REQ-041"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.78', '2026-10-03', 'Portal Web GSP v1.0.78: Control Operativo en Vivo Opción 3 Híbrida', '["REQ-042"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.80', '2026-10-04', 'Control Operativo en Vivo Multi-Equipo con la OT como Driver (Producción)', '["REQ-042"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.81', '2026-10-04', 'Portal Web GSP v1.0.81: Parametrización Estricta de Entorno en Notificaciones', '["REQ-042"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.84', '2026-10-05', 'Portal Web GSP v1.0.84: Gobernanza RBAC y Creación Omar Ghiselini', '["REQ-043"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        'v1.0.85', '2026-10-05', 'Portal Web GSP v1.0.85: Zero Hardcoding y Total Dynamic Routing', '["REQ-044"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
      INSERT INTO sch_leangsp_prod.tcfg_releases (
        version, fecha_release, titulo, requerimientos_asociados
      ) VALUES (
        '1.0.86', '2026-10-05', 'Fix de Enrutamiento PWA a Hoja de Ruta de Conductor y Desacoplamiento de Estados de Despacho', '["REQ-045"]'::jsonb
      )
      ON CONFLICT (version) DO UPDATE SET
        fecha_release = EXCLUDED.fecha_release,
        titulo = EXCLUDED.titulo,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    
    COMMIT;
  