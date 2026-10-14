# 📋 Listado de Tareas: Propuesta Grúas San Pablo (GSP)

Este documento registra las tareas unitarias necesarias para armar y presentar la propuesta comercial y técnica para Grúas San Pablo.

---

## 🗂️ Registro y Control de Tareas

### Fase 1: Levantamiento de Información y Preparación del Entorno Conceptual
*   [x] Copiar y adaptar prompt de metodología general ([METODOLOGIA_SPEC_DRIVEN.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.antigravity/prompts/spec-driven/METODOLOGIA_SPEC_DRIVEN.md)).
*   [x] Copiar y adaptar prompt de desarrollo visual ([AGENTE-FRONTEND.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.antigravity/prompts/AGENTE-FRONTEND.md)).
*   [x] Compilar los antecedentes de Grúas San Pablo ([DescripciónGSP.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/DescripciónGSP.md)).
*   [x] Registrar acta de reunión comercial del 19 de junio ([2026-06-19_alineacion_operativa.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/reuniones/2026-06-19_alineacion_operativa.md)).
*   [x] Redactar y conceptualizar el comportamiento contable/tributario del devengado ([DescripciónDevengado.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/DescripciónDevengado.md)).
*   [x] Generar el mapeo y adaptación de la Consola GSP en base al mockup de Enlace ([ConsolaGSP.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/ConsolaGSP.md)).
*   [x] Compilar la referencia técnica de grúas extraída de Transmac ([ReferenciaGrúasTransmac.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/antecedentes_reuniones/antecedentes/ReferenciaGrúasTransmac.md)).
*   [x] **[Inspecciones de Patio] Checklist Autónomo de Entrada y Salida (Template 79):** Implementar flujo autónomo de control de portón y patio para inspección de flota en PWA con búsqueda reactiva de equipos (`v-autocomplete`), endpoints dedicados `/api/operaciones/patio` y plantilla unificada con 8 segmentos técnicos.

### Fase 2: Prototipado, Presentación Web y Maqueta Comercial (Hitos del 19-Jun)
*   [x] **[Sergio Gajardo] Presentar maqueta:** Preparar una maqueta concreta y funcional (Consola GSP y App del Operador) que demuestre la solución digital para los procesos operativos y de facturación de GSP.
    *   *Dashboard de Devengado (Sankey, alertas operativas, balanza de facturación).*
    *   *Torre de Control & Kanban (etapas del servicio, asignación de equipos/tripulación).*
    *   *App Móvil del Operador (checks pre-operacionales, firmas FES y orómetros).*
*   [x] **[Sergio Gajardo] Preparar presentación:** Preparar una presentación en formato web interactiva que ilustre la digitalización de reportes, los estados de pago y el seguimiento diario de procesos según los parámetros solicitados.
*   [x] **[Marcelo Eduardo Reyes Duran] Agendar reunión:** Coordinar la reunión de trabajo con el dueño de la empresa para la semana del 29 y confirmar el horario específico para el martes 30 (propuesto a las 16:00).
*   [x] **[Sergio Gajardo, Marcelo Eduardo Reyes Duran] Programar reunión:** Programar una reunión de trabajo para la semana del 29 para mostrar los procesos, la dinámica operativa y el control del sistema propuesto.

### Fase 3: Especificación Técnica y Funcional
*   [x] Generar el documento formal de Especificación de Requerimientos de Software (SRS) para GSP ([especificacion_requerimientos_gsp.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/especificacion_requerimientos_gsp.md)) cubriendo en profundidad el módulo de contabilidad simple, egresos de faena, OCs y Laudus ERP.
*   [x] Definir la Línea Base de Requerimientos y Matriz de Trazabilidad ([linea_base_requerimientos_gsp.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/linea_base_requerimientos_gsp.md)) por ámbito temático.
*   [x] Documentar la estructura oficial de registro del Formulario de Visita a Terreno (Site Visit) en base al PDF original ([especificacion_visita_terreno.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.antigravity/prompts/spec-driven/especificacion_visita_terreno.md)).




### Fase 4: Propuesta Comercial y Cierre
*   [x] Estructurar la cotización económica de implementación y licenciamiento del software de LeanGlobal.
*   [x] Armar el borrador del acuerdo de niveles de servicio (SLA) y soporte técnico.

### Fase 5: Tareas de Inicio y Levantamiento de Requerimientos (Kickoff 07-Jul)
*   [ ] **[Sergio Gajardo] Implementar herramienta proyecto:** Implementar la interfaz para el seguimiento de los avances y la trazabilidad del proyecto.
*   [x] **[Jorge Ponce] Enviar cotizaciones ejemplo:** Enviar ejemplos de las cotizaciones utilizadas actualmente para definir la lógica de negocio.
*   [x] **[Sergio Gajardo] Solicitar datos de 4 empresas:** Solicitar RUT, Razón Social, Nombre de Fantasía, Giro, Dirección, Teléfono y Logo de cada una de las 4 empresas hermanas al cliente.
*   [x] **[Sergio Gajardo] Definir RBAC Comercial Multi-Empresa:** Preguntar al cliente si los comerciales pueden cotizar a nombre de las 4 empresas (requerirá un selector de Empresa Emisora en la UI) o si cada ejecutivo está restringido a una sola empresa (asigna su `id_empresa` por defecto).
*   [x] **[Sergio Gajardo] Definir Exclusividad de Flota (Multi-Empresa):** Preguntar si las grúas/equipos son de uso exclusivo de una sola empresa matriz, o si existe "préstamo o arriendo interno" entre las 4 empresas para cubrir operaciones. 
*   [x] **[Jorge Ponce] Enviar Maestro de Flota:** Proporcionar la nómina completa de la flota (Grúas, Camiones Pluma, Camionetas, Camas Bajas, etc.) para cargar la base del Módulo de Gestión de Flota.
*   [x] **[Jorge Ponce] Enviar Maestro de Tripulación:** Proporcionar nómina del personal operativo (Operadores, Riggers, Prevencionistas) y el listado de certificaciones/acreditaciones que se les exigen.
*   [x] **[Jorge Ponce] Enviar base clientes:** Proporcionar la planilla con la información de los clientes para la estructura de datos.
*   [x] **[Jorge Ponce] Gestionar orden compra:** Tramitar la firma de la orden de compra y enviarla para facturar el porcentaje inicial del proyecto.
*   [x] **[Felipe Julio] Emitir factura:** Emitir Factura Electrónica por el 30% del Setup (36,732 UF) (depende de la Orden de Compra).

*   [x] **[Sergio Gajardo] Estudiar documentación:** Analizar detenidamente el flujo del nuevo sistema de operaciones.
*   [x] **[Jorge Ponce] Preparar carpetas:** Organizar la información relevante en directorios de trabajo.
*   [x] **[Jorge Ponce] Enviar reporte:** Compartir un ejemplo completo de un reporte de operaciones a través de WhatsApp.
*   [x] **[Sergio Gajardo] Coordinar seguimiento:** Contactar a Jorge el jueves para definir los siguientes pasos del proyecto.

### Fase 6: Sprint 1 (Adaptación Multi-Empresa y Módulo Comercial)
*   [x] **RF-4.1:** [Backend] Middleware Multi-Tenant: Implementar inyección de `id_empresa` y roles desde JWT en el contexto (Request).
*   [x] **RF-4.1:** [Backend] Filtros de Datos: Aplicar reglas de visibilidad (aislamiento por empresa o rol global) en `proyectoModel.js` y `servicios.json`.
*   [x] **RF-4.3:** [Backend] Endpoint Preventa: Crear método `createProyectoPreventa` que fuerce el estado inicial y vincule la empresa comercializadora.
*   [x] **RF-4.4:** [Backend] Módulo Empresas: Desarrollar controlador y rutas (CRUD) para tabla `tpar_empresas`.
*   [x] **RF-4.1 & RF-4.2:** [Frontend] Autenticación y Contexto: Habilitar decodificación de `id_empresa` tras el login y preparar Context Switcher global en el Topbar (App.vue).
*   [x] **RF-4.3 & RF-4.4:** [Frontend] Vistas Comerciales: Construir pantallas para el ciclo de Preventa, listado filtrado de proyectos y Selector Maestro.

### Fase 7: Sprint 2 (Frontend CRM - Gestor de Oportunidades)
*(Importante: Para todas las tareas UI de esta fase, el desarrollador debe ceñirse estrictamente a la maqueta visual "Gestor de Oportunidades & Cotizaciones" validada con el cliente).*
*   [x] **RF-5.5:** [BD] Integridad Referencial: Crear la Llave Foránea (FK) estricta desde `tpry_proyecto.id_proyecto_estado` hacia `tpry_estado.id_proyecto_estado` (La PK de proyectos ya fue normalizada).
*   [x] **RF-5.5:** [BD] Seeder de Estados: Insertar los 4 estados comerciales en `tpry_estado` ("Oportunidad Registrada", "Preparación de Cotización", "Cotización Asignada", "Cotización No Asignada").
*   [x] **RF-5.1:** [Frontend] Layout CRM: Construir UI para capturar "Datos del Cliente" (Razón social, rut, dirección, giro, contactos, tipo de pago, OC/HES, acreditación) y "Datos Generales del Servicio" (obra, ciudad, pesos, radios, alturas, visita terreno).
*   [x] **RF-5.2:** [Frontend] Modal Cliente: Ampliar ventana flotante de "Creación Rápida" para capturar todos los atributos de contacto definidos en el diagrama y guardarlos en `tpar_empresas`.
*   [x] **RF-5.3:** [Frontend] Estructurador (Familias): Desarrollar la tabla reactiva obligando a usar la lista estricta de 9 Familias de Servicios del diagrama, más condición de "Programado vs Disponibilidad".
*   [x] **RF-5.4:** [Frontend] Integración Final: Conectar el botón `GUARDAR EN PREVENTA` armando el `json_field` completo con los datos del servicio y cliente.
*   [x] **RF-5.6:** [Frontend] Rediseño del Layout del Mapa & Campos a dos columnas (inputs izquierda, mapa `w-full h-96` a la derecha).
*   [x] **RF-5.7:** [Frontend] Geolocalización Inteligente robusta: inicializado en null, geolocaliza solo en creación y usa Temuco como fallback.
*   [x] **RF-5.8:** [Backend] Códigos de Negocio en Actualización (updateProyecto autogenera código si es null).
*   [x] **RF-5.9:** [Backend] Endpoint `POST /api/proyectos/:id/generar-cotizacion` con secuencia de BD `seq_id_cotizacion` y renombrado dinámico `[CODI]V[VERSION]-[ID].pdf`.
*   [x] **RF-5.10:** [Frontend] Integrar generación de versiones de cotización en botón "Generar PDF" y refrescar panel "Control de Versiones".
*   [x] **RF-5.11:** [Frontend] Solución a race condition del mapa (v-if="!loading" para evitar sobreescritura de geolocalización) y mapeo correcto de coordenadas en la importación de visitas.
*   [x] **RF-5.12:** [Backend] Sanitización de códigos transaccionales: detectar prefijos temporales 'COT-' y reemplazarlos automáticamente con códigos definitivos 'GSP-YYMM-XXX' en creación y actualización.

### Fase 8: Sprint 3 (PWA Operador Móvil)
*   [x] **RF-8.1:** [PWA] Clonar y portar la estructura de la PWA desde Transmac a `ejecucion/pwa` (excluyendo node_modules y builds).
*   [x] **RF-8.2:** [PWA] Adaptar configuraciones de entorno (`.env` y `vue.config.js`) para apuntar a la API de GSP (`/lg-gsp/api`) y renombrar la app a `'LgGsp'`.
*   [x] **RF-8.3:** [PWA] Instalar dependencias npm locales.

### Fase 9: Sprint 4 (Módulo de Mantenedores y Enrolamiento)
*   [x] **RF-9.1:** [Frontend] Registrar rutas `/mantenedores` y `/enrolamiento` en `router/index.js` de la consola de administración GSP.
*   [x] **RF-9.2:** [Frontend] Integrar el link de navegación de "Mantenedores" en el menú de `Sidebar.vue` usando el icono `Settings`.
*   [x] **RF-9.3:** [Frontend] Configurar middleware `beforeEach` en el router para interceptar usuarios con `flag_proc_enrol: true` y forzar redirección a `/enrolamiento`.

### 📅 Compromisos y Pendientes de Reuniones
*(Registro vivo de tareas derivadas de las minutas de seguimiento continuo)*

**Reunión 13-Jul-2026 (Seguimiento Preventa):**
*   [ ] **[Sergio Gajardo] Inducción técnica:** Realizar una inducción técnica sobre la plataforma para Jesús Acevedo.
*   [x] **[Jorge Ponce] Compartir contacto:** Compartir el contacto de Jesús con Sergio.
*   [x] **[Sergio Gajardo] Solicitar datos:** Revisar la carpeta de datos reales compartida y solicitar puntualmente lo que falte.
*   [x] **[Jorge Ponce] Enviar datos:** Enviar la información faltante o corregir columnas de las maestras si es necesario.
*   [x] **[Jorge Ponce] Enviar borrador comercial:** Enviar el borrador del acuerdo comercial / Términos y Condiciones estándar en formato Word (texto simple).
*   [x] **[Sergio Gajardo] Planificar reuniones:** Enviar una propuesta de agenda/invitación para reuniones de seguimiento periódicas (Lunes a las 11:00 AM y Jueves, además de un control extra los Miércoles).

**Reunión 20-Jul-2026 (Seguimiento Operativo):**
*   [x] **[Sergio Gajardo] Configurar notificaciones:** Implementar el envío automático de cotizaciones desde el sistema configurando copias predeterminadas a los contactos pertinentes (Omar, Luis y Gisel).
*   [ ] **[Sergio Gajardo] Configurar credenciales:** Configurar el acceso al dominio corporativo para el login del sistema tras la creación de las credenciales de prueba.
*   [x] **[Sergio Gajardo] Agregar campos de facturación:** Incluir los campos de región, ciudad y dirección de facturación en el formulario de creación de clientes.
*   [x] **[Sergio Gajardo] Implementar buscador de direcciones:** Integrar un buscador de direcciones en el mapa dentro del módulo de cotizaciones para facilitar la ubicación de obras.
*   [x] **[Sergio Gajardo] Importar flota:** Realizar la carga de los datos de flota utilizando la información técnica disponible en el Drive (Base de datos y estructura de frontend integradas).
*   [ ] **[Sergio Gajardo] Compartir acceso Kanban:** Reenviar el enlace de acceso a la herramienta de gestión al equipo.
*   [x] **[Sergio Gajardo] Ajustar categorías:** Cambiar el nombre de familia a categoría y asegurar la correcta vinculación con la subcategoría dependiente en el estructurador.
*   [x] **[Sergio Gajardo] Ajustar etiquetas:** Reemplazar el término global por fijo y viaje por flete en las unidades de cobro, y renombrar el encabezado a "Unidad de cobro".
*   [x] **[Sergio Gajardo] Incluir geolocalización:** Incorporar la captura de coordenadas como datos generales del servicio.
*   [x] **[Sergio Gajardo] Optimizar Inputs de Template (photoCheck):** Transformar los comboBox de SI/NO a photoCheck en el template de Visita a Terreno para habilitar fotos y comentarios dinámicos.
*   [x] **[Sergio Gajardo] Actualizar firma cliente:** Añadir espacios para el ingreso de identificación, nombre y firma manual del cliente en el bloque de firmas.
*   [ ] **[Jorge Ponce, Jesús] Crear manuales:** Crear manuales y videos instructivos para los módulos del sistema para facilitar el uso de los usuarios.
*   [ ] **[Jorge Ponce, Jesús] Recopilar datos técnicos:** Completar la información de tara y largo para los equipos mediante la revisión por patente.
*   [x] **[Jorge Ponce] Gestionar accesos:** Compartir el acceso a las carpetas de Drive de equipos y trabajadores con los colaboradores técnicos.
*   [x] **[Jorge Ponce] Solicitar accesos:** Solicitar a Dayana la autorización de acceso a las carpetas compartidas para los usuarios correspondientes.
*   [x] **[Jorge Ponce] Enviar notas:** Remitir las observaciones discutidas, incluyendo cambios en el formulario de servicios, a través de correo electrónico.
*   [x] **[Jesus] Apoyar carga de datos:** Colaborar en la carga manual de equipos en caso de que el proceso masivo presente complicaciones.

**Reunión 24-Jul-2026 (Análisis de OT & Flujo Comercial-Operativo):**
*   [x] **[Sergio Gajardo] Modelo de datos Spec-Driven `tpry_*`:** Migrar en Prisma/Postgres las tablas `tpry_proyecto`, `tpry_orden_trabajo` (con tiempos planificados/reales y aparejos en JSONB) y `tpry_recurso_asignado`.
*   [x] **[Sergio Gajardo] Unificación de Código Maestro:** Propagar el identificador único maestro (`codigo_maestro`) a lo largo del ciclo Cotización ➔ Requerimiento ➔ Proyecto ➔ OT.
*   [x] **[Sergio Gajardo] Notificaciones Email con Trazabilidad:** Implementar el envío de cotizaciones/requerimientos desde `notificaciones.gsp@leanglobal.cl` con prueba a `sgajardoc@gmail.com`.
*   [x] **[Sergio Gajardo] Botón Generar Requerimiento & Validaciones:** Renombrar botón "Ganar" por "Generar Requerimiento" y aplicar validación visual de atributos obligatorios.
*   [x] **[Sergio Gajardo] Comparador Visual (Diff Comercial vs Operaciones):** Construir la vista de aprobación de Requerimiento mostrando diferencias entre la propuesta comercial y los ajustes de operaciones para KPI de calidad.
*   [x] **[Sergio Gajardo] Formato PDF Impresión de OT [COMPLETADO - Spec 33]:** Diseñar e implementar motor de generación PDF de OT en backend (`POST /api/proyectos/:id/generar-ot`) con versionamiento inmutable (`V1, V2...`), panel de historial en Pestaña C, visualizador en storage y modal de despacho por correo B2B (`POST /api/proyectos/:id/enviar-ot`).
*   [x] **[Sergio Gajardo] Categorías e Implementación de Traslado:** Ajustar el estructurador de servicios para consumir categorías desde la base de datos e incluir la categoría "Traslado".
*   [x] **[Sergio Gajardo] Proyección de Pensiones:** Agregar en Condiciones Comerciales los campos de costo para Alojamiento, Alimentación (Desayuno, Almuerzo, Cena) y Traslado.
*   [x] **[Jesús & Sergio Gajardo] Códigos QR de Acreditación:** Finalizar la generación de códigos QR para operadores, riggers y flota, exportando el PDF para la entrega de la próxima semana.
*   [ ] **[Sergio Gajardo] PWA Marcaciones en Tiempo Real [PENDIENTE]:** Habilitar en la PWA los botones de marcación real (`hora_salida_real`, `hora_llegada_obra_real`, `hora_liberacion_real` y firma) *(Fase PWA en desarrollo gradual)*.
*   [x] **[Consultas Desplazamiento/Inspección]:** Definir quién hace la inspección de salida y si se usará el formato de Jorge. Aclarar quién marca el inicio del viaje (Conductor/Rigger), si el desplazamiento se marcará por GPS (frecuencia), si hay inspección al llegar a destino, y si se inspecciona solo la grúa o todos los equipos (¿inspecciones autónomas?).
*   [x] **[Sergio Gajardo] Búsqueda por Dirección en Mapa [COMPLETADO]:** Investigar e implementar funcionalidad para buscar direcciones directamente en el componente del mapa de Google Maps.

**Definición de Roles & Notificaciones (Pendientes de Definición):**
*   [ ] **[Definición Global de Roles]:** Definir y levantar la matriz completa de roles para todo el proceso (Ventas, Cotizaciones, Visita a Terreno, Operaciones, Mantención e Izaje), mapeando permisos bajo la nomenclatura estándar LeanGlobal (`_ADMIN`, `_PROG`, `_EJEC`, `_APROB`).
*   [x] **[Matriz de Notificaciones a Operaciones]:** Definir a qué roles y usuarios específicos se les debe notificar automáticamente al generarse un requerimiento a Operaciones (Candidatos a evaluar: Omar, Jorge, Coordinador de Operaciones).
*   [x] **[Flujo y Roles Aprobación ➔ Asignación]:** Definir los roles y perfiles autorizados para realizar el paso formal de la aprobación del requerimiento a la asignación efectiva de recursos (equipos, operadores y rigger).

**Sprint Acreditaciones Post-Asignación & Dossier B2B (04-Ago-2026):**
*   [x] **[Sergio Gajardo] Especificación UX 23 Acreditaciones:** Especificar e implementar el Dossier de Acreditaciones Post-Asignación en `GestorOportunidades.vue` (Sub-tab 4) en 3 columnas espaciales (Empresa, Equipos, Personas) con carga in-situ (`[Subir PDF]`), exigencias ad-hoc (`[+ Exigir Doc]`), semáforo estricto de vencimientos (< 30 días), historial de despachos con links y visor de correo HTML exacto (`Ver Correo 👁️`).
*   [x] **[Sergio Gajardo] Limpieza Kanban & Clasificación Inmutable (`Torre.vue`):** Eliminar legacy de `DossierDrawer.vue` en la Torre de Control y asegurar la inmutabilidad de la clasificación de proyectos en la columna "En Preparación Operaciones".

**Reunión 06-Ago-2026 (Seguimiento Plataforma, Acreditaciones & Inspección):**
*   [ ] **[Sergio Gajardo] Incidente RUT en Terreno:** Resolver el bug que copia erróneamente el RUT de empresa en los campos de ramas y cables eléctricos en el reporte de Visita a Terreno.
*   [x] **[Sergio Gajardo] Lista Tipos de Documentos:** Compartir la nómina de tipos de documentos cargados en el sistema para contrastarla con la lista de la prevencionista.
*   [ ] **[Sergio Gajardo] Homologación de Documentos:** Modificar la validación en el sistema para comparar contra el `tipo_documento` en lugar del nombre/observación del archivo subido.
*   [ ] **[Sergio Gajardo] Columna/Vista Acreditaciones:** Diseñar e implementar vista o columna dedicada para que Comercial gestione acreditaciones pendientes sin entrar a la vista de Operaciones.
*   [ ] **[Sergio Gajardo] Campos Obligatorios Visita Terreno:** Agregar campos obligatorios de horario de visita y equipo/vehículo asignado en la PWA/formulario de visita.
*   [ ] **[Sergio Gajardo] Configuración Dominio:** Habilitar el acceso e integración con el dominio corporativo `arriendosanpablo.cl`.
*   [ ] **[Sergio Gajardo] Propuesta Control Combustible:** Realizar análisis y redactar propuesta técnica/funcional para el control de combustible en faenas.
*   [ ] **[Jorge Ponce] Ajuste Checklist Inspección:** Revisar con la prevencionista y enviar Excel corregido del checklist de inspección de patio (sin campos de cantidad para variables cualitativas).
*   [ ] **[Jorge Ponce] Enviar Formatos Plan Izaje & ART:** Enviar archivos PDF del Plan de Izaje y Análisis de Riesgo de Trabajo para integración en la PWA.
*   [ ] **[Jorge Ponce] Involucrar Líder Operativo:** Definir e incorporar a un líder operativo de GSP en el equipo de seguimiento del proyecto.

**Reunión 10-Ago-2026 (Análisis de Reporte Diario & Estados de Pago EDP):**
*   [ ] **[Sergio Gajardo] Ampliar Modelo BD:** Agregar tablas faltantes al modelo de base de datos para Reporte Diario, Horas Mínimas y EDP.
*   [ ] **[Sergio Gajardo] Lógica Cálculo Horas (Flete vs Sin Flete):** Programar lógica de cálculo diferenciando reglas Con Flete (Inicio a Término) vs Sin Flete / Radio Urbano < 30km (Salida Base a Término).
*   [ ] **[Sergio Gajardo] Sistema Reporte Diario PWA/Web:** Construir UI para tiempos (salida, inicio, colación, término, retorno), observaciones, orómetros, fotos y firma digital FES del cliente.
*   [ ] **[Sergio Gajardo] Envío Automático Reporte Firmado:** Implementar procedimiento para enviar el reporte diario firmado al cliente de forma automática (`tnot_queue`).
*   [ ] **[Jorge Ponce] Reglas Edición Manual Horarios:** Consultar con Omar sobre las reglas de negocio para la modificación manual de horarios de inicio y término por parte de operadores.
*   [ ] **[Jorge Ponce] Lógica Comercial Categorías de Cobro:** Evaluar categorías de cobro vigentes (Hora, Día, Mes, Fijo) y coordinar definición final con Contabilidad, Comercial y Omar.

**Reunión 17-Ago-2026 (Seguimiento App Móvil, Condiciones Comerciales & Validación Operativa):**
*   [ ] **[Sergio Gajardo] Finalizar Inspecciones PWA:** Finalizar ajustes en la aplicación móvil de inspecciones de terreno (saneamiento de cabecera, datos de obra/contacto, barra de progreso y comentarios dinámicos) y formato de checklist de salida de patio.
*   [x] **[Sergio Gajardo] Desglose Viáticos y Pensiones:** Incorporar campos independientes de Alojamiento y Alimentación (Desayuno, Almuerzo, Cena) en Condiciones Comerciales especificando responsabilidad de pago (Cliente vs GSP).
*   [ ] **[Jorge Ponce] Coordinar y Confirmar Reunión Presencial:** Coordinar con Omar la fecha definitiva de la reunión presencial (semana del 24-Ago) y confirmar a Sergio para itinerario de viaje.
*   [ ] **[Jorge Ponce] Pruebas Piloto de Plataforma:** Realizar pruebas de campo con equipo comercial (Richard) y operaciones/analista para recopilar feedback previo a la sesión presencial.

**Reunión 19-Ago-2026 (Revisión de Detalles Operativos y Comerciales):**
*   [x] **[Sergio Gajardo] Restringir fechas (Alta):** Obligar al vendedor a ingresar fecha de inicio y término para poder generar la cotización.
*   [x] **[Sergio Gajardo] Implementar selectores (Alta):** Reemplazar los campos de selección actuales por listas desplegables (SÍ/NO) con valores nulos por defecto y marcación en rojo.
*   [x] **[Sergio Gajardo] Obligar campos (Alta):** Configurar los campos clave en la interfaz como obligatorios para evitar datos incompletos.
*   [x] **[Sergio Gajardo] Reubicar costos (Alta):** Eliminar el campo de valor de la cotización comercial y trasladarlo a la fase de verificación.
*   [x] **[Sergio Gajardo] Incluir combustible (Alta):** Agregar el indicador de combustible a cargo del cliente en la columna de preventa.
*   [x] **[Sergio Gajardo] Crear buscador (Media-Alta):** Implementar una función de filtrado en el buscador de equipos para localizar elementos específicos por su nombre o patente.
*   [x] **[Sergio Gajardo] Agregar botón traslado (Media-Alta):** Implementar un botón funcional para añadir traslados en la cotización.
*   [x] **[Sergio Gajardo] Regla de negocio conductores (Media-Alta):** Programar la regla de negocio para asignar obligatoriamente un conductor a cada patente de equipo.
*   [x] **[Sergio Gajardo] Asociar flota (Media-Alta):** Asociar la flota de patentes a sus respectivas categorías y subcategorías.
*   [ ] **[Sergio Gajardo] Configurar registro combustible (Media):** Habilitar la función de registro de carga de combustible en el módulo de viajes, incluyendo orómetro, odómetro y fotografías.
*   [x] **[Sergio Gajardo] Corregir estados (Media):** Revisar y corregir el error en el sistema relacionado con el estado de la tarjeta de preparación de operaciones.
*   [x] **[Sergio Gajardo] Añadir comentarios (Media):** Incluir un campo de texto libre para que el coordinador pueda añadir observaciones al asignar el servicio.
*   [x] **[Sergio Gajardo] Añadir comentario técnico (Media):** Agregar un campo de texto expandible para observaciones en la sección de implementos de izaje.
*   [ ] **[Sergio Gajardo] Despachar dossier (Baja):** Finalizar el envío del dossier al cliente con los enlaces correspondientes.
*   [ ] **[Sergio Gajardo] Reprogramar reunión (Baja):** Reasignar la reunión de gestión para mañana a las 16 horas.
*   [ ] **[Sergio Gajardo] Revisar modificaciones (Baja):** Analizar los cambios realizados y notificar a Jorge Ponce para ejecutar la prueba del desarrollo.
*   [ ] **[Sergio Gajardo] Tratamiento de Alimentos, Hospedaje y Traslados de Personal en Tierra (Media-Alta):** Diseñar e implementar el registro y control operativo de alimentación, hospedaje y traslados para el personal de faena (Riggers, Prevencionistas, Supervisores) que no se desplaza en las cabinas de los equipos de izaje/maquinaria.

**Reunión 26-Ago-2026 (Seguimiento Operativo, Despacho y Presentación):**
*   [ ] **[Sergio Gajardo] Cálculo Horario en UI:** Mostrar el cálculo total de horas de la jornada debajo de los campos de horarios de inicio y término.
*   [x] **[Sergio Gajardo] Homologar Control Flota vs Report:** Separar conceptual y funcionalmente el registro de control de flota (viajes/telemetría) del reporte diario orientado al mandante.
*   [ ] **[Sergio Gajardo] Ajustar Formato PDF Checklist:** Imprimir texto completo (*Bueno, Regular, Malo*) en lugar de iniciales en los reportes exportados.
*   [x] **[Sergio Gajardo] Especificar e Inyectar AST Simple por Equipo:** Formalización de Spec 36 y seeding en base de datos (`TMPL-GSP-AST-SIMPLE` ID 77).
*   [x] **[Sergio Gajardo] Especificar e Inyectar Plan de Izaje Digital:** Formalización de Spec 37 y seeding en base de datos (`TMPL-GSP-PLAN-IZAJE` ID 78).
*   [ ] **[Sergio Gajardo] Preparar Presentación Presencial:** Desarrollar el material técnico y soporte del enfoque sistémico para la sesión del 27-Ago.
*   [ ] **[Jorge Ponce] Agendar Sesiones Individuales:** Coordinar reuniones breves de la tarde con Secretaría, Contabilidad, Operador y Coordinador.
*   [ ] **[Jorge Ponce] Conversar con Prevencionista:** Validar con Dayana la periodicidad y alcance del AST simple por equipo.

**Reunión 21-Sep-2026 (Seguimiento Operacional, Roles Comerciales & Estrategia Mantenimiento):**
*   [x] **[Sergio Gajardo] Documentos de Empresa (Opción A):** Integrar interfaz de carga y actualización de documentación de empresa (F30-1, Siniestralidad, Carpeta Tributaria, RIOHS) en Dimensión 1 de `Documentos.vue` para las 4 empresas.
*   [ ] **[Sergio Gajardo] Enrolamiento de Usuarios en Marcha Blanca:** Enrolar y configurar permisos de Wilson, Yara, Marita y Dayana con credenciales y roles canónicos LeanGlobal.
*   [ ] **[Sergio Gajardo] Restricción Comercial de Edición:** Restringir visibilidad/edición de cotizaciones en Gestor de Oportunidades para que cada vendedor solo modifique sus propias cotizaciones.
*   [ ] **[Sergio Gajardo] Mantenimiento OTs Primero (Spec 48):** Implementar flujo operacional de Órdenes de Trabajo para flota existente (`tequ_equipo`), HH, servicios de terceros y cierre con PIN de supervisor.
*   [ ] **[Jorge Ponce] Enviar Datos para Enrolamiento:** Remitir nombres, RUT, correos y cargos de Wilson, Yara, Marita y Dayana.
*   [ ] **[Jorge Ponce & Dayana] Carga de Documentación Empresa:** Cargar los F30-1 y carpetas tributarias de las 4 empresas hermanas durante la semana.
*   [ ] **[Jorge Ponce] Inicio Marcha Blanca en Paralelo:** Coordinar con Wilson y Natalia para cotizar en paralelo en la nueva plataforma web y en Geralsoft.

**Reunión 08-Oct-2026 (ITS Transición Manual, Reemplazo de Geralsoft & Tabla de Costos):**
*   [ ] **[Yiara Mendoza] Enviar materiales técnicos:** Remitir a Sergio Gajardo el informe técnico actual, código fuente HTML del formulario anterior (`index.html`), planillas de entrada de OTs y casos de control de servicio de San Pablo.
*   [ ] **[Yiara Mendoza] Generar prompt detallado:** Enviar el prompt estructurado en Gemini/AntiGravity con la descripción funcional y técnica del formulario.
*   [ ] **[Yiara Mendoza] Crear usuario QR:** Gestionar creación de usuario para Remis sobre administración de códigos QR.
*   [ ] **[Sergio Gajardo] Especificación Spec-Driven (Spec 66):** Formalizar `.agents/specs/66_its_transicion_manual_y_resumen_costos_spec.md` con campos, modelo de datos y cálculo de márgenes/costos.
*   [ ] **[Sergio Gajardo] Formulario ITS Transición V1 Manual (Hito Hoy):** Construir interfaz web de captura manual con edición protegida de observaciones, cálculo reactivo de costos y generación de PDF oficial con tabla de resumen financiero.
*   [ ] **[Sergio Gajardo] Persistencia en Base de Datos & Multi-Día (Hito 2 Días):** Conexión con PostgreSQL (`tits_*`), guardado incremental de avances diarios y supervisión colaborativa en tiempo real por folio.
*   [ ] **[Sergio Gajardo] Despacho Omnicanal:** Envío de notificación automática con PDF adjunto por Correo y WhatsApp a Omar y Contabilidad.

---

### Fase 10: Migración WMS-Lite e Inspecciones/OTs (Evolucionado a Spec 48 V3.0 Canónica)
*(Reemplaza Specs 17 y 18 por `.agents/specs/48_inventario_mantenimiento_v2_spec.md`).*
*   [x] **[Auditoría Experta WMS y Maqueta Web]:** Auditoría crítica de clase mundial, resolución de brechas estructurales (kardex inmutable, SoD, maestro jerárquico de ubicaciones) y diseño interactivo de 9 pantallas (`maqueta_inventario_gsp.html`).
*   [x] **[Paso 1 - Spec Canónica V3.0]:** Reescritura integral de `.agents/specs/48_inventario_mantenimiento_v2_spec.md` (569 líneas) con DDL, endpoints REST, ledger contable y segregación de funciones `_EJEC` / `_APROB`.
*   [x] **[Paso 2 - Saneamiento de Seguridad & DDL]:** Eliminación de credenciales SSH/DB en texto plano y generación del script canónico `ejecucion/bd/20261012_tinv_wms_lite_ddl.sql` (12 tablas, secuencias y triggers inmutables).
*   [x] **[Paso 3 - Pipeline ETL & Carga Inicial]:** Normalización de 2.801 ítems del Excel real con `scripts/etl_inventario.cjs`, 63 ubicaciones (`E1-A1`..`E9-G6`, Corral, Pañol) y generación de `ejecucion/bd/seed_carga_inicial_inventario.sql` (50.505 líneas).
*   [x] **[Paso 4 - Backend Oficial & Refactorización Frontend]:** Implementados `inventarioModel.js`, `inventarioController.js`, `inventarioRoutes.js`, montados en `routes/index.js`, y refactorizadas vistas (`BodegasView.vue`, `ProductosView.vue`, `AlertasQuiebresView.vue`, `RecepcionMaterialesView.vue`, `DespachoConsumoView.vue`) eliminando mocks y conectando a la API real (compilación Vite 0 errores).
*   [x] **[Despliegue DEV & Carga de BD]:** DDL canónico y carga masiva inicial aplicada con éxito en PostgreSQL DEV (`sch_leangsp`), 63 ubicaciones, 2.805 productos, 660 existencias físicas activas valorizadas en $72M+, PM2 10 reiniciado y Frontend publicado en DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`, HTTP 200 OK).

### Fase 11: Sprint 5 (Plan de Trabajo Antigravity 2.0 - Refinamiento Operativo)
*(Ver especificaciones detalladas en [plan_de_trabajo_ag2.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión/plan_de_trabajo_ag2.md))*
*   [ ] **[RBAC]** Configurar roles por sucursal (`Ejecutivo_comercial_[sucursal]`) y permisos de solo lectura global para `Gerencia`.
*   [x] **[Clientes]** Implementar creación de múltiples puntos de contacto por cliente con teléfono, correo y observaciones.
*   [ ] **[Preventa]** Habilitar categoría "Accesorios", flag inicial "REQUIERE ACREDITACIÓN" y excluir FES por el momento.
*   [x] **[Terreno]** Crear template `Solicitud_Visita_Terreno` en PWA con geolocalización (Lat/Long) y asignación por el Coordinador.
*   [ ] **[Operaciones]** Carga predeterminada de aparejos de izaje desde la visita a terreno y opción de completado manual del catálogo completo.
*   [x] **[Operaciones]** Restricción de sustitución equivalente de grúas y activación de marcadores de diferencia (Diffs) en aprobación.
*   [ ] **[Notificaciones]** Configurar copias obligatorias a Gerencia/Luis/Omar/Analista/Coordinador en eventos de cotización Ganada y confirmación con observaciones.


### Fase ajustes pendientes 
* [x] Corregir rol enrolamiento. Asignación automática del rol `USR-CONSENT` (id_rol = 3) al enrolar usuarios, removiendo selector manual de roles del frontend y auto-insertando en `tsec_user_roles`.
* [ ] **[Google OAuth Consent Screen Name]** Cambiar el nombre de la aplicación de "Transamac-sst" a "**Acceso a LeanGlobal Platform**" en Google Cloud Console (`console.cloud.google.com ➔ APIs y Servicios ➔ Pantalla de consentimiento de OAuth`).
* [x] categrorias y subcategorias. Se están desplegando bien, pero debemos agrergar algunas mas.
    Categorias	                Subcategorias
        OTROS	                OTROS
        PERSONAL CERTIFICADO	RIGGER
                                OPERADOR
                                PREVENCIONISTA
                                OTROS  
* [x] Creación de Visita a terreno desde comercial > coordinador > Ejecutor visita
Actualmente la visita a terreno se puede crear desde el comercial. Esto no es correcto. El comercial debe solicitar al coordinador que este asigne la visita a terreno. Para simplificar el proceso, creo que bastaría con un correo con un link de asignación de unica ejecución abra un link que esté alojado en el sistema y el coordinador asigne al usuario con la fecha del proceso, quedando vinculado al proyecto que lo origina.
* [x] Matriz de pensiones: Apertura en 5 conceptos independientes (Alojamiento, Desayuno, Almuerzo, Cena, Traslado) con selección de pagador y valorización.
* [x] **[Rediseño Sobrio Acreditaciones Post-Asignación - Spec 45]:** Erradicación del árbol navideño de botones en Pestaña 4 (`GestorOportunidades.vue`), reemplazando botones redundantes de colores chillones por botón minimalista `[ 👁️ ]` para documentos vigentes, botón sobrio `[ 📤 Subir ]` para pendientes y menú contextual Kebab `[ ••• ]` con auto-cierre para opciones secundarias (Vincular/Reemplazar/Quitar).
* [x] **[Pareo Determinístico por ID de Tipo en Acreditaciones - Spec 45]:** Erradicación de heurísticas de búsqueda por subcadenas sueltas (`'ci'` y `'rt'` que causaban colisión entre ODI/Licencia/Cédula y Revisión Técnica/Certificación Izaje). Implementación de diccionarios canónicos y comparación estricta de IDs enteros (`c.id_tipo_certificado_persona === idTipoExigido` y `c.id_tipo_certificado === idTipoExigido`).
* [x] Condiciones comerciales: Generación modular sin encabezado general estático y preservación de texto editado en preventa.
* [x] Modelamiento proyectos asignación de  personas y equipos (Spec 22 en `.agents/specs/22_asignacion_recursos_db_spec.md`)

---

### 📌 Sprint Backlog Reunión (11-Ago-2026) - Prioridades Vendedores

#### Grupo A (Bugs Críticos Inmediatos)
* [x] **Item 6 (Acreditación Personal):** `OK PARA PRUEBA`. Fallback de tipos de certificados en selector y casilla de duración "Permanente" (sin fecha vencimiento).
* [x] **Item 7 (Modificar Precio Cotización):** `OK PARA PRUEBA`. Sincronización de `snapshot_comercial.lines` al guardar ediciones de cotización.
* [x] **Item 12 (Modal "+Nuevo Cliente"):** `OK PARA PRUEBA`. Rediseño con scroll interno (`max-h-[90vh]`), sticky footer para botón Registrar y contraste alto en modo oscuro.

#### Grupo B (Mejoras en Cotización y PDF)
* [x] **Item 20 (Flags Flete & Rigger en Sección 1):** `OK PARA PRUEBA`. Reubicados los checkboxes `incluye_flete` y `requiere_rigger` en Sección 1 Datos de Oportunidad junto a Acreditación.
* [x] **Item 13 (Horarios Inicio y Término Tentativo):** `OK PARA PRUEBA`. Inputs `datetime-local` en Sección 2 Datos de Operación e Ingeniería.
* [x] **Item 8 (Expandir Estructurador):** `OK PARA PRUEBA`. Ampliados anchos de columnas en tabla de líneas para evitar truncado.
* [x] **Item 9 (Eliminar Categoría de Servicio):** `OK PARA PRUEBA`. Removido el dropdown innecesario en Datos de Oportunidad.
* [x] **Item 10 (Ajustar Ubicación PDF):** `OK PARA PRUEBA`. Formato de ubicación estructurado en bullets (Dirección, Comuna, GPS) eliminando espacio en blanco.
* [x] **Item 11 (Eliminar Duplicado Visita Terreno PDF):** `OK PARA PRUEBA`. Removida la fila duplicada de Visita en Sección 2 del reporte impreso.
* [x] **Item 4 (Renombrar Unidades de Medida):** `OK PARA PRUEBA`. Opciones del selector de unidades actualizadas exactamente a: `Horas`, `Diario`, `Semanal`, `Mensual`, `Fijo` y `Flete`.
* [x] **Item 5 (Renombrar Royal Holding ➔ Royal Rental):** `OK PARA PRUEBA`. Reemplazado nombre en selector de empresas, Sidebar y modales de equipos.

#### Grupo C (Asignación de Recursos, Flota y Operaciones)
* [x] **Item 1 (Capacidad Estanque Combustible):** `OK PARA PRUEBA`. Input `capacidad_estanque_combustible_litros` incorporado en el modal de creación y edición de flota 360.
* [x] **Item 14 (Filtrar Personas por Cargo Rigger/Operador):** `OK PARA PRUEBA`. Helper `getUsuariosPorCargo(cargo)` filtra automáticamente el desplegable de personal por el rol seleccionado.
* [x] **Item 15 (Comentario Operaciones):** `OK PARA PRUEBA`. Textarea de observaciones libres incorporado en la pestaña de preparación/asignación de operaciones.
* [x] **Dar de Baja a Isis Oses:** `OK PARA PRUEBA`. Usuario filtrado y excluido de las listas operativas y asignaciones.

#### Grupo D (Lógica de Negocio: Flags Flete y Rigger - 12-Ago-2026)
* [x] **Punto 1 (Flete):** Inyección automática de Flete por $500.000 en el Estructurador al encender el flag, y visibilidad explícita en el PDF. `VERIFICADO POR EL USUARIO`.
* [x] **Punto 2 (Rigger - Bidireccionalidad):** Sincronización bidireccional entre flag y línea del Estructurador. (Incluye limpieza automática al apagar el flag).
* [x] **Punto 3 (Rigger - PDF):** Indicador SÍ/NO explícito en el PDF generado. (Desplegado en prod).
* [x] **Punto 4 (Rigger - Operaciones):** Bloqueo mandatorio en el tab de Asignación si falta seleccionar Rigger. (Desplegado en prod).

---

### 📌 Sprint Activo (18-Ago-2026)
* [x] **[Eliminar Ticket Visita a Terreno en Preventa]:** Eliminar checkbox/ticket "Se ejecutó Visita a Terreno (Registrar datos aquí)" y su bloque legacy en el Tab 1 (Site Visit) de Preventa, manteniendo la gestión oficial vinculada al proyecto.
* [x] **[Fix Estructural Asignación Visita & FES]:** Resolver de raíz la persistencia de datos comerciales en la solicitud de visita a terreno, formato limpio de contacto y resolución automática de coordinador en la firma con PIN FES (Caso `GSP-2608-4851-033`).
* [x] **[Mejora UX Asignación de Recursos]:** Optimizar la experiencia de usuario (UX/UI) en la asignación de equipos y tripulación en la Torre de Control / Gestor de Oportunidades: DataGrid de alta densidad operacional (Equipos, Tripulación, Aparejos y Tiempos Globales compactos).
* [x] **[Spec 16 Consolidada - Core Pipeline & Asignación de Recursos]:** Consolidación Spec-Driven en `.agents/specs/16_crm_gestor_oportunidades_spec.md` (Sección 4) de la arquitectura del Core Pipeline: regla canónica de Rigger (prohibición de "Señalero"), separación semántica estricta entre Flota física y Tripulación de personas, soporte para Prevencionista de Riesgos y DataGrid B2B de alta densidad.
* [x] **[Refactor Máquina de Estados FSM & Torre Kanban]:** Alineación canónica con PostgreSQL (`id_proyecto_estado`), eliminación de heurísticas ambiguas, desbloqueo en edición comercial y despliegue exitoso en producción.
* [x] **[Validaciones Estrictas Preventa, Selectores Combobox & PDF]:** Reemplazo de checkboxes por comboboxes con alerta roja en `null`, nuevo flag obligatorio de combustible cliente/empresa (`cliente_pone_combustible`), fechas inicio/término y categoría/subcategoría mandatorias en estructurador de servicios, e inclusión de desglose de pensiones y combustible en el PDF de cotización.
* [x] **[Compuertas de Calidad Comercial - Cotización y Requerimiento]:** Validación determinística para Generar Cotización (Cliente, Contacto Nombre/Fono, Tipo de Pago, 6 Requerimientos Comerciales, Descripción Proyecto, Nombre/Dirección/Ciudad Obra, Fechas Inicio/Término, Estructurador) y compuerta estricta para Generar Requerimiento (exige al menos una cotización generada y efectivamente enviada al cliente).
* [x] **[Invariante de Acreditación en FSM & Purga de Pruebas]:** Documentación en Spec 16 (Sección 6) de la regla de activación condicional de acreditación (estrictamente 0% y gauges ocultos en Estados < 5 hasta que se asignen recursos en Patio), e higienización/purga total de los 38 proyectos de prueba obsoletos en la base de datos PostgreSQL.
* [x] **[Eliminación Montos Pensiones & Comentarios Visita a Terreno]:** Remoción definitiva de inputs numéricos de montos en Pensiones de Preventa (conservando únicamente desplegables de responsabilidad), y captura de comentarios del coordinador en la web token de asignación (`AsignacionVisita.vue`) con inyección en Segmento 1 (`body_exec`) del Survey de Terreno (Template 80).
* [x] **[Categoría y Subcategoría en Vista Equipos 360 & Asignación Operativa]:** Inclusión de columnas `Categoría` y `Subcategoría`, filtros reactivos y exportación Excel en `Vista360.vue`, y filtrado inteligente de flota disponible por categoría/subcategoría en el DataGrid de asignación de recursos en `GestorOportunidades.vue`.
* [x] **[Desplazamiento, Monitoreo de Viaje & Carga Combustible Copec Offline-First]:** Especificación técnica formal (Spec 32), persistencia resiliente IndexedDB, flujo móvil de conductor `/viaje/:token` con PIN SHA-256, handshake de tarjeta Copec en ruta (odómetro, horómetro, selección multi-estanque, fotos de tablero y voucher) y panel de monitoreo/aprobación en la Torre de Control (`GestorOportunidades.vue`).
* [x] **[Report Diario Digital de Izaje & Firma Manual Mandante (Spec 34 - Bloque 1)]:** Implementación de la vista móvil PWA `ReportDiarioIzaje.vue` (precarga de OT, selector rápido de colación, horómetros, cálculo reactivo de horas efectivas/sobretiempo y firma Canvas del receptor cliente con GPS), controlador backend `reportDiarioController.js`, endpoints `/api/operaciones/report/*`, migración DDL `20260825_alter_tedp_reporte_avance.sql` y subpestaña multi-día *"6. Ejecución & Reports"* con modal visor formal `ModalVisorReport.vue` y validación de calidad del analista en la Torre de Control.
* [x] **[Despacho Escalonado y Ciclo de Vida Independiente por Equipo (Spec 35)]:** Desacoplamiento de macro-estado de OT vs micro-estado operacional por equipo (`tpry_rel_equipo` / `tequ_log_desplazamiento`), salida de patio asíncrona por máquina, elevación automática del proyecto a Ejecución con el 1er equipo activo, continuidad aislada de horómetros/días en Report Diario, selector multi-máquina en PWA y semáforos por fila en la Torre de Control. `VERIFICADO Y COMPILADO 0 ERRORES`.
* [ ] **[Tratamiento Operativo Pensiones y Traslados Personal en Tierra]:** Modelamiento y registro operativo de alimentación, hospedaje y traslados para el personal de faena (Riggers, Prevencionistas, Supervisores) que no se desplaza en las cabinas de los equipos de izaje/maquinaria.
* [ ] **[Envío Dossier Acreditación B2B]:** Implementar el despacho por correo electrónico del expediente consolidado de acreditaciones (Empresa, Flota y Personal) al cliente mandante con trazabilidad de entrega.
* [ ] **[Dar OK a Salida de Patio]:** Consolidación y validación formal de los 3 segmentos de preparación de salida (Control de Riesgos, Inspección 360° en PWA y Analista GPS) con transición al estado de Desplazamiento / Ruta.
* [x] **[AST Simple (1 Usuario / Dupla) - Spec 36]:** Especificación formal del template dinámico AST en 60 segundos (`.agents/specs/36_ast_simple_usuario_spec.md`), reducción del formato papel a 4 segmentos clave (EPP 1-tap, 5 Controles Críticos de Izaje, Declaración y Firmas FES) y generación del script de seeding SQL (`ejecucion/bd/seed_ast_simple_gsp.sql`).
* [x] **[Plan de Izaje Digital & Calculadora Reactiva - Spec 37]:** Especificación formal de la memoria de maniobra (`.agents/specs/37_plan_de_izaje_reactivo_spec.md`), cálculo automático de Peso Total y % de Utilización de Grúa, compuerta de seguridad dura al 85%, verificación de aparejos/suelo/clima y script de seeding SQL (`ejecucion/bd/seed_plan_de_izaje_gsp.sql`).
* [x] **[Liquidación Operacional, Consolidación de EDP y Registro de Facturación - Spec 38]:** Subpestaña 7 *"Liquidación & EDP"* en Gestor de Oportunidades, motor de consolidación financiera cruzando cotización vs reports diarios validados (horas base, sobretiempo y flete), modal carátula formal de EDP (`ModalCaratulaEDP.vue`), registro de N° HES/OC y N° Factura con transición final a Estado 7 (Facturado/Concluido) en la Torre de Control. `VERIFICADO EN PRODUCCIÓN Y COMPILADO 0 ERRORES`.
* [x] **[Tratamiento Integral de Registros de Flota: Viaje, Control de Flota y Report - Spec 39]:** Especificación formal consolidada (`.agents/specs/39_tratamiento_integral_flota_viaje_control_y_report_spec.md`) del modelo de 3 pilares de GSP: 1. Registro de Viaje (Desplazamiento, Odómetros/Horómetros con foto, Copec multi-estanque, PIN FES), 2. Control de Flota Interno (Gestión técnica, horometría diaria y mantenimiento Taller), 3. Report Diario (Horarios, colación, horas efectivas, sobretiempo, firma táctil mandante y GPS para EDP).
* [x] **[Gestor Documental Dimensional Multi-Eje - Spec 44]:** Implementación de la vista unificada `/documentos` en 1 sola columna de ancho completo con árbol jerárquico puro, badges compactos inline de semáforo de vigencia (`🟢 N  🟡 N  🔴 N`), totalización concurrente real de los 110 equipos (289 certificados) y nómina de personas (286 certificados), e integración documental de las 26 OTs (cotizaciones comerciales históricas v1-v3, OTs formales, visitas técnicas con informe PDF y reports diarios de izaje con firma Canvas y GPS). Apertura directa en nueva pestaña y modal visor digital de faena. `VERIFICADO Y COMPILADO 0 ERRORES`.
* [x] **[Estandarización Estructurador, 4 Unidades Canónicas y Piso Mínimo (Specs 16 y 27)]:** Homologación en Preventa y Validación de las 4 unidades canónicas (`Horas Diarias Minimas`, `Horas Mensuales Minimas`, `Traslado`, `Valor Fijo`), incorporación de la columna `Piso Mínimo` con defaults sugeridos (`8.0` / `180.0` hrs) y bloqueo en fijos/traslados, cálculo reactivo multi-día determinista ($\text{Días} \times \text{Piso Mínimo} \times \text{Tarifa}$), retrocompatibilidad en BD y despliegue exitoso en DEV. `VERIFICADO Y COMPILADO 0 ERRORES`.
* [x] **[Repositorio y Selección de Órdenes de Compra (OCs) para Facturación - Spec 38]:** Implementación en Subpestaña 7 de la Torre de Control (`GestorOportunidades.vue`) del pipeline de cierre de 4 pasos (ITS, EDP, Respaldo OC, DTE), carga de archivos PDF de Órdenes de Compra con metadatos (N° OC, Monto Neto, Fecha Emisión, Centro de Costo, Observaciones), cálculo automático de cobertura financiera vs total neto del EDP, visor integrado de PDF y selección rápida con chips en el formulario de emisión DTE Laudus. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Estructurador de Servicios Contextual, Consistencia PDF & Guardián de Estado (Spec 16)]:** Especificación e implementación formal del estructurador con inputs contextuales estrictos por tipo de cobro (Horas Diarias Minimas: Días 1..30 × Horas 1..24 × $/hr; Horas Mes Minimas: Meses ≥ 1 × Horas > 1 × $/hr; Traslado y Valor Fijo: Cantidad ≥ 1 × $), consistencia matemática idéntica en el generador PDF (`proyectoModel.js`), guardián de navegación por estado bloqueando acceso a operaciones en Estado < 3 y normalización resiliente de flota en `cargarDatosCotizacion`. `DOCUMENTADO EN SPEC 16 Y COMPILADO 0 ERRORES`.
* [ ] **[Flujo de Aprobación FES Triple Firma y Generación PDF para ITS - bosquejo_firma.md]:** Implementación del circuito formal de triple firma electrónica con PIN FES (Analista ➔ Jefe Operaciones ➔ Contabilidad), gestión transaccional de observaciones por responsable, circuito de rechazo con retorno automático al Analista Operativo para subsanación, generación de PDF oficial A4 (logos paramétricos en Base64, balance económico, jornadas y costos 8 categorías), estampado visual con pdf-lib y sellado de tiempo TSA RFC 3161.

### 📌 Sprint Activo (11-Sep-2026) - Reglas de Distancia, Limpieza PWA y Pruebas en Paralelo (Hito 21-Sep)
*(Derivado de los acuerdos de las reuniones del 10 y 11 de septiembre con Jorge Ponce)*
* [x] **[POC Cotizador por Distancia - PocCotizadorDistancia.vue]:** Maquetación en 2 columnas, cálculo reactivo de fletes, alertas rojas anti-fuga y cláusula dinámica urbano/rural. `VALIDADO CON JORGE PONCE`.
* [x] **[Migración Cotizador Distancia a CRM - GestorOportunidades.vue]:** Reemplazar flag manual `incluye_flete` ($500.000) por input numérico estimado de `distancia_km` (ida desde Casa Matriz, sin selector de comunas), inyectando las 3 líneas canónicas en Caso 4 (Horas Grúa, Flete Grúa, Traslado Contrapesos). `COMPILADO 0 ERRORES Y VERIFICADO`.
* [x] **[Cálculo Interno Duplicado de Distancia - Backend & PDF]:** Multiplicar distancia de ida por 2 internamente ($D \times 2$) para costos operacionales e inyectar cláusula contractual dinámica de faena en el PDF de cotización (`proyectoModel.js`). `COMPLETADO`.
* [x] **[Simplificación PWA Chofer & Report Secuencial con Combustible - Spec 49]:** Especificación formal redactada (`.agents/specs/49_simplificacion_viaje_y_report_secuencial_con_combustible_spec.md`). Erradicado el log maestro de 7 dimensiones de la vista móvil del chofer; estructurado en 5 estados gigantes (Salida Patio, En Ruta, Llegada Faena, En Faena y Sellar Report con firma Canvas mandante); modal ubicuo de Carga de Combustible Copec y articulación de notificaciones secuenciales por WhatsApp (Despacho inicial y Recordatorio 17:30 hrs). `COMPILADO 0 ERRORES Y VERIFICADO`.
* [x] **[Despacho WhatsApp desde Torre de Control & Protocolo Captura Teléfono - Spec 50]:** Especificación formal redactada (`.agents/specs/50_despacho_whatsapp_torre_control_y_captura_telefono_spec.md`). Incorporación de botones de 1-clic para Hoja de Ruta (`preparacion_salida`) y Recordatorio de Report Diario (`reports`) en Torre de Control, con detección de celular faltante, modal de captura al vuelo (`ModalDespachoWhatsApp.vue`) y consumo de `/lg-gsp-dev/whatsapp/enviar`. `COMPILADO 0 ERRORES Y VERIFICADO`.
* [x] **[Depuración Preparación de Salida - GestorOportunidades.vue]:** Eliminar la columna y bloqueos de "Control de Calidad" en Subpestaña 5 Preparación de Salida, consolidando el flujo en 2 pasos operativos directos (1. Inspección de Patio & Flota, 2. Despacho Conductor & GPS) con pase a terreno automático al cumplir ambos. `COMPILADO 0 ERRORES Y VERIFICADO`.
* [x] **[Candado Criptográfico FES en Estado de Pago (EDP) - GestorOportunidades.vue]:** Bloquear la Carátula Oficial de EDP hasta que el Coordinador Richard apruebe el ITS con su PIN FES de 4 dígitos (Spec 47), desplegando banner dorado con acceso directo a visación. `COMPILADO 0 ERRORES Y VERIFICADO`.
* [x] **[Mapa Didáctico de Entregables por Etapa]:** Pipeline interactivo HTML completado y activo en producción (`https://servidor.leanglobal.cl/pptas/GSP/GSP-core/presentaciones/proceso/index.html`), fuente local en `antecedentes_reuniones/presentaciones/presentacion_pipeline_interactivo.html`. `DISPONIBLE Y EN PRODUCCIÓN`.
* [ ] **[Hito Pruebas en Paralelo - 21 de Septiembre]:** Inicio de marcha blanca con vendedores cotizando en vivo en Casa Matriz.
* [x] **[Documentos de Empresa - Opción A]:** Interfaz de carga y actualización de documentación de empresa (F30-1, Siniestralidad, Carpeta Tributaria, RIOHS) en Dimensión 1 de `Documentos.vue` para las 4 empresas. `VERIFICADO Y COMPILADO 0 ERRORES`.
* [x] **[Reenvío de Correo de Enrolamiento Web - MantenedorEnrolamiento.vue]:** Incorporar acción de 1-clic `[ ✉️ Reenviar Enlace ]` en la tabla de Estado General de Usuarios de Mantenedores para todo usuario con enrolamiento pendiente (`flag_proc_enrol: true` / `pass_hash_fes: null`), consumiendo endpoint que despacha la plantilla corporativa con enlace parametrizado `?email=...&rut=...` y feedback visual en pantalla. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Buscador Omnibox Reactivo en Torre Kanban - Spec 16 Sec 11]:** Implementación de buscador unificado en la cabecera de `Torre.vue` para filtrar en tiempo real las 6 columnas por N° Cotización, Cliente, Vendedor (`/api/usuarios`), Obra/Faena y Flota/Tripulación, con badge de conteo de coincidencias y reseteo rápido (`Esc`). `VERIFICADO Y COMPILADO 0 ERRORES`.
* [x] **[Visibilidad Universal del Ejecutivo Comercial - Spec 16 Sec 12]:** Implementación de trazabilidad e identificación permanente del ejecutivo comercial creador en todas las tarjetas de las 6 columnas del tablero Kanban (`Torre.vue`), badge fijo en cabecera de detalle y campo informativo en Sección 1 Datos de la Oportunidad (`GestorOportunidades.vue`), con hidratación canónica de `tpry_proyecto.id_usuario_creacion`, resolución de nombres contra `tsec_users` (`name_frst` + `apellido_pat`) y persistencia inmutable obligatoria (jamás `null`). `VERIFICADO Y COMPILADO 0 ERRORES`.
* [x] **[Sistema de Notificaciones Omnicanal (Email + WhatsApp) con Deep Linking Contextual - Spec 52]:**
  - Implementación del estándar canónico de notificaciones omnicanal LeanGlobal (`leanglobal_notification_standard`).
  - Resolución de la "Doble Falla de la Web" en `router/index.js` y `useAuth.js` (Web y PWA) preservando query params post-login.
  - Aterrizaje contextual en `GestorOportunidades.vue` (`id_proyecto`, `subtab=liquidacion`, `paso=its` con botón FES directo), `Torre.vue` e `Inspeccion.vue` (`id_survey`).
  - Creación del servicio unificado backend `notificacionService.js` (resolución canónica de URLs, sanitización E.164, microservicio WhatsApp 3085 y SMTP).
  - Refactorización de `visitaTerrenoController.js`, `itsController.js` y purga de URLs residuales en `signatureModel.js`.
  - Despliegue en DEV, verificación E2E de despacho WhatsApp a Sergio Gajardo (+56936483259) y registro en `tcfg_backlog` (REQ-006 / Release v1.0.50). `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Desacoplamiento Despacho de Viaje e Inspección de Salida de Patio - Spec 16 Sec 13.6 / v1.0.52]:** Liberación de la restricción de salida en Subpestaña 5 de `GestorOportunidades.vue`. Botón directo `[ 🚀 Despachar Viaje ]` en cabecera de equipos, selector de operador/conductor desbloqueado incondicionalmente, hito Stepper Pase a Terreno liberado y compuerta de cierre flexibilizada para faena asíncrona. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Corrección Autofill Navegador y Desbloqueo Teléfono Contacto - GestorOportunidades.vue]:** Remoción de atributo `:readonly` que bloqueaba la edición de teléfono y correo al seleccionar un contacto registrado que no poseía fono previo, sincronización automática en `autoGuardarContactoManual`, incorporación de `autocomplete="off"` en campos de contacto y obra (Nombre, Dirección, Ciudad), y regla CSS anti-autofill en `<style scoped>` para evitar que Chrome pinte los inputs de color blanco en modo oscuro. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Visor de Mapa Telemetría OSM & Pantalla Completa - Spec 16 Sec 13 / Spec 53]:**
  - **RF-53.1:** Erradicación de CartoDB y su marca de agua de API Key requerida en `ModalMapaViaje.vue`. Configuración de OpenStreetMap (`tile.openstreetmap.org`) como capa base por defecto, más capas satelital (`World_Imagery`) y topográfica (`World_Topo_Map`) de Esri 100% gratuitas con switcher flotante de 3 estados.
  - **RF-53.2:** Modo Pantalla Completa inmersivo (`100vw × 100vh`) con redibujado forzado de canvas Leaflet (`map.invalidateSize()`) tras transición.
  - **RF-53.3:** Panel de bitácora cronológica colapsible (`[ 📋 Ocultar/Ver Bitácora ]`) que amplía el mapa al 100% del contenedor (`col-span-12`).
  - **RF-53.4:** Navegación interactiva por hitos con animación `flyTo` a zoom 17 y apertura automática de popups descriptivos, más botón `[ 🎯 Centrar Ruta ]` (`fitBounds`).
  - **RF-53.5:** Regla de redirección permanente 301 en Nginx (`/viaje/*` ➔ `/lg-gsp-dev/viaje/*`) y normalización del deep link en PWA (`Surveys.vue`) resolviendo el error 404 en móviles.
  - **Microservicio WhatsApp:** Incorporación de endpoint `/desvincular` y botón de reinicio en `/admin` de `gsp-whatsapp-service` (puerto 3085) para desvincular sesiones trabadas y regenerar QR al instante.
  - Compilación limpia de Frontend (Vite) y PWA (Vue CLI), despliegue a DEV y verificación en vivo (`HTTP 200 OK`). `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Optimización Full-Width y Sincronización de Backlog & Release Log - REQ-010 / v1.0.53]:**
  - Rediseño de `BacklogView.vue` a ancho completo (`w-full`), eliminando restricción `max-w-7xl` y pérdida lateral de espacio en pantallas de escritorio.
  - Ensanchamiento de columnas de la tabla de requerimientos y remoción del clamping `max-w-lg` en descripciones para lectura cómoda.
  - Sincronización persistente en base de datos PostgreSQL (`sch_leangsp.tcfg_backlog` y `sch_leangsp.tcfg_releases`) de los 10 requerimientos (`REQ-001` a `REQ-010`) y los 7 releases (`v1.0.47` a `v1.0.53`).
  - Actualización preventiva de semillas en `backlogController.js` y despliegue a servidor remoto con reinicio de PM2 10. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Consolidación de Viajes, Fletes y Report Diario - REQ-011 / v1.0.55]:**
  - Control de combustible multi-estanque con captura fotográfica obligatoria de tablero en `ViajeConductor.vue`.
  - Vinculación estricta de piso mínimo comercial en `lineas_servicio` de la OT.
  - Handoff automático de hito de traslado a estructurador y generación de Report Diario (`tedp_reporte_avance`) e ITS (`tits_jornada_detalle`) como `Flete Solo Ida`.
  - Desacoplamiento de horas de carretera vs faena de izaje. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Desacoplamiento de Viaje y Report Diario / Rediseño Home PWA - REQ-012 / v1.0.56 / PWA v1.0.28]:**
  - Finalización de ciclo de transporte al llegar a faena en `ViajeConductor.vue`, redireccionando a PWA para reports diarios.
  - Carga directa de combustible en ruta sin autorización previa obligatoria.
  - Rediseño estructurado de la Home PWA (`Surveys.vue`) en 3 tarjetas unificadas: Portón/Patio, Hoja de Ruta y Report Diario con animaciones parpadeantes de estado. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Verificación Inteligente de Horómetro Motor en Report Diario - REQ-013 / v1.0.57 / PWA v1.0.29]:**
  - Propuesta reactiva de horómetro motor sugerido ($\text{inicial} + \text{horas efectivas}$) en `ReportDiarioIzaje.vue`.
  - Alerta bloqueante ante horómetro final menor al inicial y detección de outliers/odómetros disparados con reemplazo en 1 clic.
  - Extracción dinámica de piso contractual desde `crm_v1.lineas_servicio` en `reportDiarioController.js` y desglose transparente en `ModalVisorReport.vue`. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Estandarización Kanban, Blindaje Dirty en Etapas 3+ e Higiene Visual de Asignación - REQ-014 / v1.0.59]:**
  - Redirección directa de login hacia la Torre de Control (`torre`), omitiendo la pantalla intermedia del dashboard.
  - Blindaje anti-dirty: detección reactiva de hidratación (`isHydrating`) e inmutabilidad en etapas operativas (>= 3), eliminando alertas falsas de cambios sin guardar.
  - Estandarización de tarjetas del Kanban (`Torre.vue`): formato comercial homogéneo (Cliente, Proyecto, Familia de Servicio / Objetivo, Vendedor, Monto, Fecha).
  - Rediseño técnico de Asignación de Recursos (`GestorOportunidades.vue`): títulos y categorías unificados en azul corporativo (`text-blue-400`), indentación `pl-8` y guía `border-l-2` en filas hijas para distinguir agrupadores de recursos, erradicación de candados y guiones `—` en celdas de acciones, y corrección semántica de la tarjeta como `Matriz de Aparejos & Implementos de Izaje`. `VERIFICADO Y DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Idempotencia de Tokens de Visita y Adaptabilidad del Estructurador en 13" - REQ-015 / v1.0.60]:**
  - **Idempotencia de Tokens (`visitaTerrenoController.js`):** Reutilización determinista de `token_visita` activo cuando el proyecto está en estado `PENDIENTE_ASIGNACION`, y soporte multi-token histórico en `json_field->'crm_v1'->'tokens_historicos'`. Erradicación de enlaces inválidos o huérfanos por reenvíos de notificación en email y WhatsApp.
  - **Ergonomía en Pantallas de 13" (`GestorOportunidades.vue`):** Incorporación de botón toggle `[◀ Maximizar Ancho (13")]` / `[▶ Mostrar Datos Cliente]` que expande el Estructurador al 100% del viewport útil (+1000px en notebooks compactos).
  - **Habilitación de Desplazamiento Horizontal:** Remoción de `.scrollbar-hide` y `overflow-hidden` en Preventa y Operaciones Pestaña B, habilitando `overflow-x-auto` visible y fluido.
  - **Optimización Dimensional:** Eliminación de `w-full` en la columna descripción que inflaba artificialmente la tabla, y ajuste de anchos mínimos base a 850px. `VERIFICADO Y COMPILADO 0 ERRORES`.

* [x] **[Sprint Marcha Blanca Comercial Temuco - REQ-016 / v1.0.61]:**
*(Derivado de la sesión en vivo de cotizaciones y operación con el equipo comercial de GSP)*
* [x] **[Incidente #0 - Enlace de Visita a Terreno Expirado por Re-solicitud]:** Resuelto en REQ-015 / v1.0.60 mediante idempotencia de UUID y soporte de tokens históricos en `tpry_proyecto`. `DESPLEGADO EN DEV`.
* [x] **[Observación #1 - Visualización y Desplazamiento Horizontal del Estructurador en 13"]:** Resuelto en REQ-015 / v1.0.60 mediante toggle de maximización, desbloqueo de `overflow-x-auto` y retiro de `w-full`. `DESPLEGADO EN DEV`.
* [x] **[Observación #2 - Diferenciación Explícita de "Ida" e "Ida/Vuelta" en Traslados]:** Desbloqueo del `<select>` de unidad en categoría `TRASLADOS` en `GestorOportunidades.vue` (`TRASLADO IDA` / `TRASLADO IDA/VUELTA`), imputación de devengado proporcional al 50% al completar viaje a faena y 50% remanente al retorno a base. `DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Observación #3 - Deshabilitación Automática de Pensiones en Servicios de 1 Día]:** Detección computada `esServicioUnDia` en `GestorOportunidades.vue`, seteo forzado a `'NA'` en todos los conceptos de pensión y viáticos, bloqueo visual con banner informativo en el panel de base para EDP. `DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Observación #4 - Restricción RBAC de Scope Comercial y Depuración de Roles]:**
  - **Base de Datos PostgreSQL (`sch_leangsp`):** Purga de 24 roles legacy y 43 asignaciones obsoletas; consolidación de 9 roles oficiales (`Admin`, `USR-CONSENT`, `GSP_PROG`, `GSP_APROB`, `GSP_CONTA`, `GSP_EJEC`, `ADM_COM`, `COMERCIAL`, `COORD`).
  - **Backend Local (`authController.js`, `authMiddleware.js`, `proyectosController.js`, `proyectoModel.js`):** Inyección de roles en JWT, protección de endpoints y cláusula determinista `WHERE p.id_usuario_creacion = $id_user` para rol `COMERCIAL`.
  - **Frontend (`Torre.vue`):** Refresco dinámico de roles desde BD (`cargarRolesFrescos()`), filtrado de tarjetas en cliente y badges semánticos de Scope (`Mis Cotizaciones`, `Global`, `Coordinación`).
  - **Mantenedor de Usuarios (`EditUsuarioDialog.vue` y `RbacMatrixTable.vue`):** Erradicación de módulos de Transmac/Codelco, rediseño a Layout Split 2 columnas a pantalla completa (`max-w-[1380px]`) con tarjetas de 1 línea sin barras de scroll. `DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Observación #5 - Persistencia de Fecha, Hora y Reasignación en Visita a Terreno / Viajes]:**
  - **Base de Datos & Backend Modelo (`viajeModel.js`):** Incorporación de columna `fecha_programada` en `tequ_log_desplazamiento` y persistencia en `crearOObtenerViaje`.
  - **Backend Controlador (`viajeController.js`):** Extracción de `fecha_programada` y ensamble determinista de `fecha_inspeccion_plan` + `hora_inspeccion_plan`.
  - **Frontend CRM (`GestorOportunidades.vue`):** Transmisión de fecha/hora de salida en `autorizarSalidaEquipo`, hidratación reactiva al cargar viajes de la OT en `cargarViajesProyecto`, y reprogramación completa de fecha y hora en el modal de reasignación técnica (`/survey/UpdPlan`).
  - **Frontend Asignación Externa (`AsignacionVisita.vue`):** Input de hora programada (`hora_visita`) y ensamble de timestamp local explícito, erradicando el desfase UTC a las 21:00 hrs del día previo. `DESPLEGADO EN DEV 0 ERRORES`.
* [x] **[Observación #6 - Notificaciones y Distribución Canónica de Cotizaciones por Correo]:**
  - **Backend (`messageModel.js`, `messageController.js`):** Soporte y paso de cabecera `cc` en `nodemailer`.
  - **Frontend (`ModalEnviarCotizacion.vue`):** Parametrización estricta de destinatarios: `Para:` Cliente; `CC:` Comercial Emisor (`currentUser.email`) + Coordinadores de Operaciones (`COORD` / `logistica@arriendosanpablo.cl`) + Administradores (`Admin` / Sergio, Jorge, Omar). Trazabilidad de `usuario_envio` activo. `DESPLEGADO EN DEV 0 ERRORES`.
* [ ] **[Observación #7 - Captura Rápida de Oportunidad Comercial (Light)]:** Formulario simplificado de prospecto comercial para registro rápido de llamadas y solicitudes preliminares sin obligatoriedad de estructuración técnica inmediata. `PENDIENTE ESPECIFICACIÓN Y DESARROLLO`.

* [x] **[Ajustes Operacionales Segunda Sesión Marcha Blanca - REQ-017 / v1.0.62 / Spec 56]:**
  - **Erradicación de Prevencionista Fantasma:** Purga de inicialización estática en `especialistasTerreno`. Despliegue de slot APR únicamente si `requiere_prevencionista === true` o existe línea comercial cotizada. Caso GSP-2609-3707-013 resuelto.
  - **Reasignación Centralizada en Sub-tab 2 (Asignación):** Desbloqueo de interactividad tras confirmación (`estado_ot >= 5`) con botón `[🔄 Reasignar Recursos / Actualizar OT]` y recálculo automático de acreditaciones.
  - **Restricción de Recursos en Sub-tab 5 (Despacho):** Inhabilitación de edición de personal y equipos en Despacho (modo lectura/informativo), protegiendo la integridad del flujo operativo.
  - **Rigger Anidado Bajo Operador:** Presentación de selector y semáforo de Rigger como sub-registro integrado en la celda del Operador de la Grúa Principal (Línea 0), extensible a grúas secundarias solo si se vendieron múltiples riggers comercialmente.
  - **Filtro Inclusivo con Separador y Aviso de Mayor Capacidad:** Selector de grúas estructurado en `<optgroup>` doble (`🎯 Equipos Sugeridos (Compromiso Comercial)` vs `🚚 Flota Alternativa / Mayores Prestaciones`) con alerta informativa tipo badge ante selección de mayor tonelaje respaldando la tarifa pactada.

* [x] **[Hotfix Operacional Marcha Blanca - Depuración Especialistas y Resolución Operador Despacho - REQ-018 / v1.0.63 / Spec 56]:**
  - **Purga Implacable de Prevencionista:** Descarte absoluto de cualquier registro de Prevencionista de Riesgos en `especialistasTerreno` (incluso con `id_user` histórico en BD) si la oportunidad no exige prevención (`requiere_prevencionista !== true`).
  - **Eliminación de Rigger Redundante en Sección 3:** Exclusión total del cargo Rigger de la Sección 3 (*Especialistas & Personal Técnico en Terreno*); el Rigger vive única y exclusivamente en la Grúa Principal bajo el Operador.
  - **Resolución de Nombre del Operador en Despacho:** Vinculación directa de `getOperadorAsignadoAEquipo` con `linesEquiposPrincipales` y cruce con el catálogo `usuarios.value`, corrigiendo la etiqueta que mostraba *"Sin Operador Asignado"* pese a tener semáforo verde.

* [x] **[Compactación Dimensional Layout y Erradicación Scroll Horizontal - REQ-019 / v1.0.64 / Spec 56]:**
  - **Layout de Tabla Fija (`table-fixed`):** Forzado de ancho estricto al 100% del contenedor sin desbordes horizontales innecesarios en la matriz de Asignación de Recursos (`GestorOportunidades.vue`).
  - **Rebalanceo Canónico de Columnas:** Recurso (22%), Equipo (25%), Operador & Rigger (28%), Ventana (21%), Acciones (4%) = 100%.
  - **Blindaje Dimensional (`min-w-0` y `truncate`):** Truncamiento elástico con elipsis en selectores largos y badge de mayor capacidad para evitar ensanchamiento de columnas en pantallas de 13" o superiores. `VERIFICADO Y COMPILADO 0 ERRORES`.

* [x] **[Reimplementación y Certificación de Ambiente de Producción (PROD) - Estándares LeanGlobal BCH/GSP]:**
  - **Fase 1 (Base de Datos Aislada `sch_leangsp_prod`):** DDL idempotente exportado y ejecutado. Esquema recreado con `search_path` corregido en `usr_leangsp_prod`. Purga transaccional total (0 proyectos/0 surveys) y siembra íntegra de maestros (110 equipos, 45 usuarios, 4850 empresas, 9 roles RBAC, templates).
  - **Fase 2 (Backend Microservicio Node.js en Puerto 3016):** Clonación limpia de `lean-services-gsp` hacia `/home/nodeadmin/proyectos/lean-services-gsp-prod/`. Configuración canónica de `.env` (`PORT=3016`, `DB_SCHEMA=sch_leangsp_prod`, `STORAGE_PATH=/u05/LeanDocs/GSP/prod`). Purga de esquemas relacionales hardcodeados en código. Daemon PM2 registrado (`lean-services-gsp-prod` ID 13) en estado `online`.
  - **Fase 3 (Ruteo Determinista NGINX):** Bloques `/lg-gsp-prod/`, `/lg-gsp-prod/api/` (proxy :3016) y `/pwa-gsp-prod/` inyectados en `/etc/nginx/default.d/base.conf`. Recarga limpia de NGINX con `nginx -t` verificado.
  - **Fase 4 (Gestor Documental y Storage Modular):** Árbol de carpetas físico creado en `/u05/LeanDocs/GSP/prod/` (`cotizaciones/`, `ots/`, `edp/`, `surveys/`, `firmas/`, `acreditacion/`, etc.) con permisos `nodeadmin:nodeadmin (775)` y prueba de escritura validada.
  - **Fase 5 (Compilación y Despliegue de Frontends Web y PWA):** Build de Web Console (`base: /lg-gsp-prod/`) y PWA Móvil (`base: /pwa-gsp-prod/`) con sus respectivos `.env.prod`. Despliegue a `/var/www/html/lg-gsp-prod` y `/var/www/html/pwa-gsp-prod`.
  - **Fase 6 (Certificación E2E Gates A-F & Desplegador Oficial):** Verificación integral superada (Gates A, B, C, D, E, F aprobados). Creación y prueba de `deploy_prod_now.js` con Hard Gate determinista de gobernanza (`tcfg_backlog` y `tcfg_releases`). `PRODUCCIÓN 100% OPERATIVA Y AISLADA`.

* [x] **[Sincronización Reactiva de Operador Reasignado en Despacho e Inspecciones - REQ-020 / v1.0.65 / Spec 56]:**
  - **Prioridad Canónica de Asignación en Despacho (`getNombreOperadorAsignado`):** Resolución directa del operador asignado en la OT (`opTrip?.id_user`) con prioridad sobre valores estáticos en `ins.operador_id`, resolviendo el desfase del caso GSP-2609-4855-008.
  - **Sincronización Automática en Guardado de Asignación (`guardarCambiosAsignacion`):** Actualización de `preparacionSalidaState.inspecciones_patio` con reasignación en vivo del survey en base de datos mediante `PUT /survey/UpdPlan/:id_survey`.
  - **Reconciliación en Entrada a Despacho (`sincronizarInspeccionesPWA`):** Sincronización continua y recálculo determinista de operadores y surveys ante discrepancias con la OT. `VERIFICADO Y COMPILADO 0 ERRORES`.

* [x] **[Validación de Report Diario Digital con PIN FES, PDF Oficial y Dossier - REQ-021 / v1.0.66 / Spec 57]:**
  - **Firma Electrónica Simple (FES) con PIN de 4 Dígitos:** Submodal interactivo en `ModalVisorReport.vue` con 4 casillas numéricas, navegación por teclado y validación SHA-256 contra `tsec_users.pass_hash_fes` (rechazo 401 si es erróneo).
  - **Generación de PDF Oficial con Doble Firma (`reportDiarioPdfService.js`):** Compilación automática con Puppeteer incorporando la firma manual del mandante con georreferenciación GPS y sello FES del analista con código único `FES-REP-...`.
  - **Integración Automática con Dossier del Proyecto:** Registro en `sch_leangsp.tfmg_file` e inyección determinista en `tpry_proyecto.json_field.ejecucion_v1.dossier_documentos`.
  - **Notificaciones Omnicanal:** Despacho de correo formal con banner del código FES y enlace directo para visualización y descarga (`/api/v1/storage/view/:id_doc`).
  - **Acceso Directo en Cockpit Torre de Control:** Botón `📄 PDF` en la bandeja del Analista PMO en `Torre.vue` para consulta inmediata.

* [ ] **[Firma Digital Avanzada & Código QR de Validación Pública del Documento PDF - REQ-022 / Spec 57]:**
  - **Código QR Dinámico en PDF Oficial:** Incorporación de QR bidimensional en el pie/sello del PDF oficial emitido (`reportDiarioPdfService.js`) que enlace a la URL pública de validación y verificación del documento (`https://servidor.leanglobal.cl/lg-gsp/validar/:codigo_fes` o endpoint público equivalente).
  - **Landing / Vista Pública de Validación de Certificado:** Creación de endpoint/página liviana de consulta pública donde cualquier mandante o auditor externo pueda escanear el QR o ingresar el código FES (`FES-REP-...`) para verificar la autenticidad del documento, emisor (Sergio Gajardo / Analista), RUT, fecha/hora exacta de firma, geolocalización de terreno y hash SHA-256 de integridad.
  - **Firma Digital Avanzada (FDA) / Estampado Criptográfico:** Evaluar e integrar soporte para firma digital con certificado digital y timestamp token oficial (TSA) complementando la Firma Electrónica Simple (FES) bajo estándar Ley 19.799.

* [x] **[Corrección Definitiva Timezone America/Santiago y Auditoría Visual de Horarios - REQ-024 / Spec 57]:**
  - **Erradicación de Desfase +3 Horas:** Normalización de visualización en `ModalVisorReport.vue` con `toLocaleTimeString('es-CL', { timeZone: 'America/Santiago' })` eliminando `split('T')` en crudo sobre marcas UTC.
  - **Auditoría Visual de Ajustes:** Tarjeta de Horario de Faena exhibe horario original reportado tachado en rojo suave (`08:30 ➔ 18:00`) y horario ajustado vigente en verde esmeralda con badge `[AJUSTADO]`. Trazabilidad inferior sincronizada. `COMPLETADO Y VERIFICADO`.

* [x] **[Separación Estricta de Roles: Edición Cockpit PMO vs Solo Lectura en Kanban - REQ-023 / Spec 57]:**
  - **Modo Solo Lectura en `GestorOportunidades.vue`:** Desactivación de botones de mutación para Reports (`ModalVisorReport.vue` con `readonly: true`), e ITS (`ModalITS.vue` con `readonly: true`) en el Kanban general de Oportunidades (solo badges informativos y visualización).
  - **Centralización en Cockpit PMO:** Confinamiento exclusivo de validación de horas, horas extras, descuentos de colación y formulación técnica en la interfaz del Analista (`Torre.vue`). `COMPLETADO Y VERIFICADO`.

* [x] **[PWA Terreno: Bloqueo de Emisión Post-Término y Filtro Dinámico de Pendientes - REQ-025 / Spec 57]:**
  - **Filtrado Reactivo en Home PWA (`Surveys.vue`):** Endpoint `GET /api/reports/usuario/pendientes` evalúa OTs del operador; si la OT es de 1 día (o completó sus días pactados) y ya cuenta con report emitido, la OT se oculta de la lista de pendientes y se inhabilita el acceso.
  - **Hard Gate Backend en `reportDiarioController.js`:** Rechazo determinista con HTTP 403 ante intentos de emitir reports sobre OTs concluidas o con cuota de días agotada. Sustitución de emoji `🚜` por `🚚`. `COMPLETADO Y VERIFICADO`.

* [x] **[ITS Incremental, SLA 13:00 hrs y Alerta Automática WhatsApp - REQ-026 / Spec 57]:**
  - **Autosave Diario Incremental:** Formulación progresiva del ITS por el Analista con estado `BORRADOR_INCREMENTAL` para servicios multi-día.
  - **Monitoreo de SLA con Bot WhatsApp (Puerto 3085):** Servicio `slaAuditorService.js` y worker periódico en `index.js` (intervalo 15 min) que audita diariamente a las 13:00 hrs las OTs terminadas el día anterior sin ITS cerrado por el Analista, disparando alerta inmediata a Yiara Mendoza (+56968320225) y Jorge Ponce (+56977501322) con copia por correo. Endpoints `GET /api/reports/sla/auditar` y `POST /api/reports/sla/ejecutar-alertas`. `COMPLETADO Y VERIFICADO`.

* [x] **[Doble Firma FES en ITS, Anexo de Reports y Despacho Multicanal - REQ-027 / Spec 57]:**
  - **Flujo de Firma de 2 Pasos:** Firma 1 (Analista con PIN FES) transiciona a `EN_REVISION_OPERACIONES`; Firma 2 (Jorge Ponce con PIN FES como 2do validador técnico) transiciona a `APROBADO_OPS` / `EN_REVISION_CONTABILIDAD`.
  - **Compilación PDF con Anexo Documental:** `itsPdfService.js` genera PDF oficial e incorpora como **Sección 7 (Anexo Técnico Vinculante)** todos los Reports Diarios aprobados de la faena con firmas canvas y georreferenciación GPS. Reemplazado `🚜` por `🌲`.
  - **Despacho Automático:** Notificación con PDF adjunto a Gerencia General, Contabilidad, Operaciones, Comercial y Facturación. `COMPLETADO Y VERIFICADO`.

* [x] **[Gobernanza de EDP: Hard Gate ITS, Edición Exclusiva Pamela y Despacho Condicional - REQ-028 / Spec 57]:**
  - **Hard Gate Determinista:** Bloqueo de carátula de EDP si el ITS no cuenta con visto bueno de Operaciones (`itsAprobadoPorOperaciones`).
  - **Edición Exclusiva de Tarifas / Valores:** Restricción estricta en `ModalCaratulaEDP.vue` y endpoint `POST /api/operaciones/edp/ajustes-tesoreria`: solo **Pamela (Gerente de Tesorería)** / `GSP_CONTA` / Admin puede desbloquear y modificar tarifas o aplicar notas de descuento.
  - **Emisión Comercial y Firma FES:** Submodal de PIN FES comercial (4 dígitos SHA-256) y endpoint `POST /api/operaciones/edp/firmar-comercial`.
  - **Bifurcación Condicional de Envío:** Si el cliente ya pagó (Contado / Pago Previo), el EDP se procesa como expediente interno sin enviar cobro al mandante, avanzando directamente a Facturación DTE. Si es crédito, se envía formalmente al cliente con copia obligatoria (CC) a Gerencia General, Contabilidad y Operaciones. `COMPLETADO Y VERIFICADO`.

* [x] **[Integración de OC y Facturación sin Bloqueo - REQ-029 / Spec 57]:**
  - **Regla ante Ausencia de OC:** Botón `[ 📄 Cliente Sin OC (Asumir EDP) ]` en Paso 3 de Cierre (`GestorOportunidades.vue`) que auto-registra la condición `S/OC - ASUME EDP` con el valor total devengado del EDP, auto-completando `hes_oc_numero` y avanzando a Facturación DTE sin trabas.
  - **Acceso Directo en Facturación:** Botón `[ 📄 Sin OC (Asumir EDP) ]` junto al campo de HES/OC en Paso 4 para auto-completar en 1 clic. `COMPLETADO Y VERIFICADO`.

* [x] **[Erradicación de Rigger por Defecto y Ocultamiento Limpio en Report Diario - REQ-031 / Spec 57]:**
  - **PWA Móvil (`ReportDiarioIzaje.vue`):** Eliminación definitiva de fallbacks fijos ('JOSE ARRIAGADA') en `riggerNombre`. Si la OT no incluye especialista con rol Rigger asignado, retorna `null` y oculta limpiamente las etiquetas `Rig: {{ riggerNombre }}` en los 3 pasos del formulario.
  - **Visor Web de Operaciones (`ModalVisorReport.vue`):** Inclusión de computed `tieneRigger` que valida la presencia real de Rigger asignado. Oculta al 100% la tarjeta `🦺 Rigger / Asistente` y conmuta la grilla automáticamente a 3 columnas.
  - **Backend y PDF (`reportDiarioController.js` y `reportDiarioPdfService.js`):** Sustitución de `COALESCE(..., 'Rigger')` por `CASE WHEN r.id_user_rigger IS NOT NULL ... ELSE NULL END`. El generador de PDF expande la celda de Piso Mínimo a `colspan="3"` y omite por completo la fila de Rigger cuando no exista personal asignado. `COMPLETADO Y VERIFICADO`.

* [x] **[Filtrado Estricto de Reports Pendientes por Tripulación en PWA - REQ-032 / Spec 57]:**
  - **Diagnóstico y Causa Raíz:** Se detectó que el endpoint `GET /api/reports/usuario/pendientes` utilizaba una cláusula difusa `p.json_field::text LIKE '%' || $1::text || '%'`. Al consultar por el operador Robert (Roberto Melillan, `id_user = 50`), la consulta convertía todo el JSON del proyecto a texto y hacía match con cualquier ocurrencia de la subcadena `"50"` (por ejemplo "GRUA 50 TON", precios o marcas horarias), provocando que OTs asignadas a Jorge (como la OT 103) le aparecieran indebidamente a Robert en la PWA.
  - **Resolución Determinista en Backend (`reportDiarioController.js`):** Sustitución del `LIKE` de texto por verificación estricta de asignación en JSON estructurado: validación de `id_user_chofer`, `operador_id`, `rigger_id`, `tripulacion_asignada` (array de tripulantes), `lineas_servicio` de cotización y reportes existentes en `tedp_reporte_avance`. Certificado en producción: Robert (`id_user: 50`) ahora recibe 0 pendientes ajenos y Jorge (`id_user: 19`) conserva su asignación legítima. `COMPLETADO Y VERIFICADO`.

* [x] **[Acotamiento de Destinatarios de Notificaciones y Gobernanza de Correo - REQ-033 / v1.0.69 / Spec 52 & 57]:**
  - **Flujo 1 (Modal Generar Requerimiento Comercial ➔ Operaciones):** Restricción de destinatarios a gestión y coordinación (`usuariosNotificablesGestion`), eliminando del listado a los más de 30 operarios y riggers de faena. Pre-selección por defecto acotada al Coordinador de Operaciones (`logistica@arriendosanpablo.cl`) y Comercial creador de la preventa.
  - **Flujo 2 (Modal Aprobar Requerimiento Operaciones ➔ OT):** Restricción de destinatarios en modal a gestión y comercial. Pre-selección por defecto acotada al Comercial de la OT y Coordinador de Operaciones. Despacho de correo respetando estrictamente a las personas seleccionadas en los checkboxes del modal.
  - **Flujo 3 (ITS Paso 3 - Conclusión y Liberación EDP):** Erradicación de la consulta masiva por roles `(31, 32, 33, 35, 36)` en `itsController.js`. Restricción determinista a los 4 roles canónicos del proceso: Analista elaborador (`its.id_user_elaborado`), Jefatura que visó (`its.id_user_aprobado` / `logistica@arriendosanpablo.cl`), Contabilidad firmante (`id_user` / `mseguel@arriendosanpablo.cl`) y Comercial dueño de la OT (`tpry_proyecto.id_usuario_creacion`).
  - **Flujo 4 (Validación de Report Diario por Analista):** Mantenimiento explícito del correo al operador (`rep.op_email`) junto con Analista validador y Logística/Jefatura.

* [x] **[Conciliación Reactiva ITS, Reparación de Fechas, Flete y Valorización por Ítem - REQ-034 / v1.0.70 / Spec 46 & 57]:**
  - **Conciliación Reactiva en `getITS` (`itsController.js`):** Auto-sincronización de todos los reportes diarios de terreno (`tedp_reporte_avance`) para ITS en estado editable (`BORRADOR`), incorporando en memoria e insertando las jornadas de días posteriores (Día 2 de 10h y Día 3 de 9h de OT 103) totalizando las 28 horas facturables.
  - **Reparación de Fechas Vacías en `<input type="date">`:** Formateo estricto `TO_CHAR(jd.fecha, 'YYYY-MM-DD')` en SQL y sanitización `.split('T')[0]` en `ModalITS.vue`, erradicando el placeholder vacío `dd-mm-aaaa`.
  - **Valorización por Fila y Columnas de Tarifa y Subtotal:** Inclusión de `Tarifa $/hr` y `Subtotal ($)` en la tabla de jornadas del modal y en el PDF oficial (`itsPdfService.js`), con nuevas columnas relacionales en `tits_jornada_detalle`.
  - **Flete Comercial Completo ($400.000):** Parser de CRM corregido para tomar el subtotal del traslado cotizado (Ida + Retorno faena, 41 km Pitrufquén), cuadrando la venta neta total en `$2.780.000`. `COMPLETADO Y VERIFICADO`.

* [x] **[Filas Físicas de Traslados (Fletes), Tarifa Estándar Operador $10.000 y Fechas Sanitizadas - REQ-035 / v1.0.71 / Spec 46 & 57]:**
  - **Filas Físicas de Flete en Sección 2:** Inyección y persistencia de `Flete Solo Ida` ($200.000) y `Flete Solo Retorno` ($200.000) como filas concretas en la grilla de servicios. Desacople matemático en el motor de cálculo para no sumar horas grúa a los traslados y totalizar los $2.780.000 facturables exactos. Botón `[ 🚚 + Agregar Flete ]` disponible en la barra de herramientas.
  - **Tarifa Estándar Operador ($10.000 / hr):** Limpieza de registros espurios de prueba (Nicolás Ceballos) y asociación de tripulación real (Jorge Ponce, patente `VCTR.81-9`, 28 hrs a $10.000/hr = $280.000). Selector desplegable de operador para fácil asignación.
  - **Sanitización de Fechas:** Erradicación universal del bug de fecha vacía (`dd-mm-aaaa`) en inputs HTML5 para todas las 9 categorías de costos y jornadas. `COMPLETADO Y VERIFICADO`.

* [x] **[Torre de Control PMO: Acceso a PDFs, Avance Global del Negocio y Herencia de Estados - REQ-036 / v1.0.72 / Spec 58]:**
  - **Acceso Directo a PDFs Oficiales de ITS y EDP:** Incorporación del botón rojo estándar `📄 PDF` e hipervínculo en Folio ITS para la Sub-vista 2 (Informes de Término de Servicio), y botón `📄 Ver EDP` junto al badge interactivo `🔓 EDP Liberado` en la Sub-vista 3 (Pipeline EDP & Facturación), conectando con los endpoints oficiales de streaming binario.
  - **Columna de Avance Global (0% a 100%):** Motor de cálculo ponderado de 7 hitos (`getAvanceNegocio(p)`) y barra de progreso ejecutiva con degradado (`from-blue-500 to-emerald-400`), porcentaje monospace contrastado y etiqueta de fase en tiempo real.
  - **Principio de Herencia Retrospectiva de Estados (Lifecycle-Aware):** Erradicación total de falsos positivos y alarmas rojas críticas en faenas concluidas. En el negocio 014: Asignación rescata la patente `VCTR.81-9` (Jorge Ponce); Acreditación no requerida pasa a `No Requerida`; Salida Patio pasa a `✓ Completado`; y OC sin documento formal pasa a `⚖️ Asumir EDP (S/OC)` en ámbar de Tesorería, alcanzando un avance consolidado del 96% (`Listo Facturar`). Fechas de programación restauradas desde la cotización. `COMPLETADO Y VERIFICADO`.

* [x] **[Gobernanza de EDP: Permisos Globales de Administración (Sergio Gajardo), Solicitud de Cambio RFC y Notificaciones Omnicanal con Deep Link - REQ-037 / v1.0.73 / Spec 59]:**
  - **Permisos de Edición para Administrador:** Reconocimiento irrestricto de `sgajardoc@gmail.com` y roles Admin (`id_rol: 1`) en `ModalCaratulaEDP.vue` y endpoint backend `POST /api/operaciones/edp/ajustes-tesoreria`, permitiendo edición directa de tarifas y descuentos con banner distintivo de Administrador del Sistema.
  - **Flujo de Requerimiento de Cambio (RFC de EDP):** Botón `[ 📝 Solicitar Modificación de EDP ]` para usuarios sin permisos de edición (Analistas PMO, Operaciones, Comerciales) con submodal estructurado (motivo, detalle de tarifas/horas, monto estimado).
  - **Persistencia y Trazabilidad:** Almacenamiento de solicitudes en `tpry_proyecto.json_field -> edp_solicitudes_ajuste` con identificador único, fecha, datos del solicitante y estado (`PENDIENTE`, `APLICADA`, `DESCARTADA`).
  - **Notificación Omnicanal con Deep Link Canónico (leanglobal_notification_standard):** Despacho simultáneo vía Email Transaccional (MessageModel) y WhatsApp (Microservicio Baileys) a Pamela Seguel y Sergio Gajardo con enlace contextual directo a la Torre de Control PMO (`/torre?id_proyecto=...&subtab=pendientes_edp`). `COMPLETADO Y VERIFICADO`.

* [x] **[Aislamiento de Control Financiero: Modo Solo Lectura en Tablero Kanban y Edición Exclusiva en Torre de Control PMO - REQ-038 / v1.0.74 / Spec 60]:**
  - **Inmutabilidad Financiera en el Tablero Kanban (`GestorOportunidades.vue` Subtab D: Liquidación & Cierre):**
    - Paso 1 (ITS): Se preserva `ModalITS` en modo de solo lectura estricta (`:readonly="true"`).
    - Paso 2 (EDP): Se bloquea la edición invocando `ModalCaratulaEDP` con `:solo-lectura="true"`.
    - Paso 3 (OC Mandante): Se retiran los botones de subida física (`+ Adjuntar OC`) y acción de asunción; se eliminan los botones de borrado de OC. Se añade banner indicativo de solo lectura y visor de OCs con enlace directo a PDF.
    - Paso 4 (Facturación DTE): Erradicación completa de los inputs interactivos de número de factura, fecha, HES y del botón maestro de cierre contable (`Declarar Facturada & Cerrar`). Se implementa ficha ejecutiva de solo lectura con banner informativo que deriva la gestión a la Torre de Control PMO.
  - **Edición y Cierre Exclusivo en la Torre de Control PMO (`Torre.vue` - Sub-vista 3 `pendientes_edp`):**
    - El botón de acción en la grilla fue reemplazado por `[ 🧾 Carátula & Facturar PMO ➔ ]`, abriendo `ModalCaratulaEDP` directamente en el Cockpit del Analista sin redirigir al CRM.
    - Invocación de `ModalCaratulaEDP` con `:solo-lectura="false"`, facultando a Tesorería (Pamela) y Administrador (Sergio) para ajustar tarifas, cargar archivos de OC y Factura DTE y pulsar `[ 🏁 Declarar Facturado & Concluir ]`.
  - **ModalCaratulaEDP Resiliente y Multifuncional (`ModalCaratulaEDP.vue`):**
    - Nuevo prop `soloLectura: Boolean` que conmuta entre el modo de auditoría visual (Kanban) y el modo de gestión operativa financiera (PMO). `COMPLETADO Y CERTIFICADO`.

* [x] **[Perspectiva Temporal de Flota (Gantt), Métricas de Gestión y Erradicación Cockpit - REQ-039 / v1.0.75 / Spec 61]:**
  - **Erradicación del Término "Cockpit":** Eliminación total de la palabra "Cockpit" en toda la interfaz de `Torre.vue`. Sustitución del botón `[ Actualizar Cockpit ]` por botón cuadrado compacto que contiene exclusivamente el ícono `🔄` (`title="Actualizar datos"`), con estilizado sobrio.
  - **Métricas de Gestión y Productividad por Equipo en Fila Fija (`Torre.vue` vista `gantt`):**
    - **Inspecciones Realizadas:** Columna sticky `Inspecc.` que calcula las inspecciones y checklists de cada equipo (`📋 X`), integrando la subconsulta SQL de `tsrv_survey` en `tequEquipoModel.js` y las inspecciones preoperacionales de patio activas.
    - **Producción Económica ($):** Columna sticky `Producido ($)` que calcula con precisión los ingresos netos devengados o facturados de cada máquina (`formatMoneda(eq.totalProducido)`), computando líneas de servicio con asignación de equipo y OTs donde el equipo figure como grúa principal, excluyendo cancelados.
    - **Productividad OEE (%):** Columna sticky `OEE %` con indicador numérico y barra gráfica de ocupación temporal.
  - **Matriz de Barras Temporales con 4 Estados Cromáticos Contrastados e Interactividad:**
    - 🟦 **Reservado / Programado:** Azul (`bg-blue-600`) / Cian en faena activa (`bg-cyan-600`).
    - 🟩 **Ya Ejecutado:** Verde Esmeralda (`bg-emerald-600`).
    - ⬛ **Cancelado:** Gris Pizarra con tachado (`bg-slate-700` `line-through`).
    - 🟧 **En Mantenimiento:** Ámbar / Naranja fuego (`bg-amber-600`).
    - 🟥 **Colisión Horaria:** Rojo intenso pulsante (`bg-red-600` `animate-pulse`).
    - **Navegación 1-Clic a la OT:** Al hacer clic en cualquier barra temporal se redirige inmediatamente a la OT correspondiente (`abrirProyecto(evento.proyectoId, subtab)`), con apertura contextual en ejecución o comercial.
  - **Subconsulta SQL de Inspecciones en Catálogo de Equipos (`tequEquipoModel.js`):**
    - Se incorporó subconsulta correlacionada `cant_inspecciones` sobre `sch_leangsp.tsrv_survey` por ID de equipo y patente en `getEquipos()`, desplegado en producción en PM2 `lean-services-gsp`. `COMPLETADO Y CERTIFICADO`.

* [x] **[Alineación de Alcance y Corrección de Dossier EDP: Eliminación de Horario de Colación, Horarios Nativos de Faena y Contraste de Email RFC - REQ-041 / v1.0.77 / Spec 62]:**
  - **Alineación Estricta al Alcance Original (Sin Registro de Horarios de Colación):** Reversión completa de la alteración de base de datos; se eliminaron de PostgreSQL (`sch_leangsp.tedp_reporte_avance`) las columnas de horario de colación. En la App del Conductor (`ViajeConductor.vue`) y en la Torre PMO (`ModalVisorReport.vue`) se suprimieron todos los inputs de hora de inicio/término de colación, preservando exclusivamente la duración en minutos/horas pactada en el scope. En el Anexo 2 del EDP y en el PDF del Report Diario se despliega formalmente solo la duración registrada (`Colación: 1.0 hr` o `Sin colación (0 hrs)`), sin campos vacíos ni horarios inexistentes.
  - **Horarios de Inicio y Término de Faena en Anexo 1 del EDP:** Extracción y formateo limpio de la jornada a partir de los campos timestamp existentes (`fecha_inicio_servicio` y `fecha_termino_servicio`) en zona horaria chilena (`America/Santiago`, UTC-3) con estilo `whitespace-nowrap font-mono` (`08:00 - 18:00`), eliminando definitivamente los marcadores vacíos `-- : -- - -- : --`. Período de corte en Carátula toma fallback de primera y última fecha de los reportes incluidos.
  - **Legibilidad y Contraste Alto en Correo de Solicitud de Modificación EDP (RFC):** Estilos inline prioritarios (`!important`) en `.content-box` y etiquetas en cian brillante (`#38bdf8`), datos en blanco puro (`#ffffff`) y montos en verde esmeralda (`#34d399`), asegurando lectura nítida en clientes webmail y móviles. `COMPLETADO Y CERTIFICADO`.

* [x] **[Control Operativo en Vivo: Opción 3 Híbrida, Semáforos Cromáticos 5 Estados, Candado por OT y Sanación de Datos - REQ-042 / v1.0.78 / Spec 63]:**
  - **Fase 0 (Sanación y Blindaje de Datos):**
    - Exclusión de reportes FLETE del cómputo de cupo de días de faena en backend.
    - Función canónica de cuota `validarCupoReportesOT` fail-closed en creación y actualización de reportes.
    - Soporte de timestamp de dispositivo en eventos de viaje y reportes para resiliencia offline.
    - Registro de timestamp de transmisión en Momento 2 de reporte diario (`fecha_transmision_termino`).
    - Erradicación de placeholders fijos en Matriz PMO y depuración de endpoints redundantes de ping.
  - **Fase 1 (Arquitectura del Plan Diario y Parámetros en Asignación):**
    - Desglose reactivo de días hábiles en `json_field.ejecucion_v1.plan_diario` con horas inicio/término editables.
    - Captura de hora de llegada a faena planificada en formulario de asignación.
  - **Fase 2 (Backend Endpoint Agregado y Notificaciones In-Web):**
    - Endpoint `GET /api/operaciones/control-vivo` con agregación de OTs del día, estados de semáforo y KPIs.
    - Tabla y lógica de generación de alertas in-web en PostgreSQL (`tnot_notification_web`).
  - **Fase 3 (Frontend Opción 3 Híbrida en Torre de Control):**
    - Componente modular `ControlOperativoVivo.vue` integrado como sub-vista en PMO de `Torre.vue`.
    - Tarjetas ordenadas por criticidad, mini-franja multi-día, slide-over lateral con timeline 07:00-20:00 y campana interactiva. `COMPLETADO Y DESPLEGADO EN PRODUCCIÓN DEV (v1.0.78)`.

* [x] **[Gobernanza RBAC y Protocolo de Notificaciones - REQ-043 / v1.0.84]:**
  - Corrección de rol a Omar Soffia como Operador (`GSP_EJEC`).
  - Creación y activación de Omar Ghiselini como Director General (`Admin`) en BD DEV y PROD.
  - Actualización de sugerencias de destinatarios en `ModalEnviarCotizacion.vue` y `GestorOportunidades.vue`.
  - Aislamiento de almacenamiento por ambiente en `storageConfig.js` (`/u05/LeanDocs/GSP/prod/`). `COMPLETADO Y CERTIFICADO`.

* [x] **[Auditoría Exhaustiva de URLs y Storage Paths (Zero Hardcoding) - REQ-044 / v1.0.85]:**
  - Limpieza y dinamización de endpoints en `ModalCaratulaEDP.vue`, `ModalITS.vue`, `ModalMapaViaje.vue`, `AcreditacionDrawer.vue`, `GestorOportunidades.vue`.
  - Backend: `archivoController.js`, `itsController.js`, `reportDiarioController.js`, `exportService.js` dinamizados según `APP_ENV`.
  - PWA: `resolveApiBase()` dinámico en `api.js` detectando `/pwa-gsp-prod/` vs `/pwa-gsp-dev/`. `COMPLETADO Y CERTIFICADO`.

* [x] **[Corrección de Enrutamiento PWA a Hoja de Conductor y Desacoplamiento de Despacho - REQ-045 / v1.0.86]:**
  - Dinamización de `abrirViajeNativo(token)` en `Surveys.vue` para redirigir al ambiente activo (`/lg-gsp-prod/viaje/` en producción).
  - Nginx: redirección de `/viaje/` a `/lg-gsp-prod/viaje/`.
  - Desacoplamiento de badge de viaje en despacho (`SALIDA PENDIENTE` vs `EN RUTA`) y odómetros no iniciados (`---` en vez de `0 KM`). `COMPLETADO Y CERTIFICADO`.

* [ ] **[Backlog: Modelo de Servicios Recurrentes y Modo Arriendo Mensual - REQ-030 / Spec 57]:**
  - Arquitectura para gestionar servicios de largo aliento bajo el mismo negocio/proyecto con cortes de facturación periódicos (EDP mensual) sin duplicar OTs.

---

### 📋 Requerimientos de Terreno (Backlog Jorge Ponce - 05-Oct-2026)
* [x] **[REQ-569] Cambio de empresa en cotización:** Al colocar otra empresa como Bestmaq o Logística se actualiza correctamente en la cotización. `CONCLUIDO Y VERIFICADO EN DEV Y PROD`.
* [x] **[REQ-620] Limpieza de campos al crear negocio:** Limpieza de nombres de obra y ciudad precargados al crear un nuevo negocio. `CONCLUIDO Y VERIFICADO EN DEV Y PROD`.
* [x] **[REQ-651] Destinatarios al enviar cotización:** Destinatario corregido formalmente a Omar Ghiselini como Director General en lugar de Omar Soffia (Operador). `CONCLUIDO Y VERIFICADO EN DEV Y PROD`.
* [x] **[REQ-682] Duplicidad de traslado en PDF cotización vs estructurador:** Corrección del filtro de flota en `proyectoModel.js` evitando que traslados comerciales ingresen al segmento de izaje principal; deduplicación certificada en `GSP-2610-4853-003` (2 registros exactos). `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.88)`.
* [x] **[REQ-773] Hora de inicio de servicio en OT y horas mínimas en PDF OT:** Incorporada hora de inicio de faena/servicio en OT y reflejadas las horas mínimas en el PDF de OT. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.87)`.
* [x] **[REQ-804] Notificación WhatsApp a operador y rigger:** Despacho y entrega de WhatsApp de asignación y salida autorizada tanto a operador como rigger con endpoint dinámico prod/dev. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.87)`.
* [x] **[REQ-835] Simplificación de toma de combustible en App PWA:** Eliminada toma de combustible en salida de base; select de porcentaje (1 a 100%) y foto en llegada a faena. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.87)`.
* [x] **[REQ-896] Defecto de cierre de App tras arribo a obra:** Corregido botón verde con deep link dinámico a `/pwa-gsp-prod/#/reportDiario...` sin botar sesión ni enviar a dev; eliminado odómetro redundante en Momento 1. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.87)`.
* [x] **[REQ-957] Claridad de horómetros al término de servicio en Report:** Registro claro e individual de ambos horómetros (Superestructura y Chasis bimotor) con fotografías dedicadas al término de faena; odómetro retirado de Momento 2. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.87)`.
* [x] **[REQ-990] Motivo de reverso y notificación interna en devolución Verificación a Comercial:** Modal con motivo obligatorio al devolver cotización a comercial, persistencia en `crm_v1.motivo_reverso_verificacion` y despacho omnicanal (Email y WhatsApp) exclusivamente al equipo interno (comercial, operaciones y PMO), excluyendo al cliente mandante. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.88)`.
* [x] **[REQ-988] Flujo de retorno a base (Hoja de Ruta de Retorno al Último Report):** Detección determinista del último report de faena al sellar (`dia_correlativo >= dias_planificados`); apertura automática de Registro de Viaje reverso (Faena mandante a Patio Base San Pablo GSP); Momento 1: salida faena con odómetro, horómetro y PIN; Momento 2: pings de desplazamiento; Momento 3: llegada a base con odómetro, horómetro, porcentaje combustible (1 a 100%), fotos de tablero, marcador de estanque y checklist de patio. Cierre del proyecto a `OPERACIONALMENTE_CONCLUIDO` (estado 6) y liberación del equipo a `DISPONIBLE`. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.89)`.
* [x] **[REQ-991] Pipeline Documental en Control en Vivo con Umbral SLA 13:00 hrs:** Integración en `ControlOperativoVivo.vue` de franja interactiva de 4 hitos (`[1. ITS] ➔ [2. EDP] ➔ [3. OC / HES] ➔ [4. FACTURA]`) por tarjeta de servicio. Apertura directa de modales (`ModalITS.vue`, `ModalCaratulaEDP.vue` y visores de OC y Factura) con 1 clic sin abandonar la vista de control. Indicador de retraso SLA de emisión de ITS al día hábil siguiente a las 13:00 hrs con semáforo rojo pulsante y barra superior de KPIs de facturación. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.89)`.
* [x] **[REQ-992] Condiciones y Acuerdos Comerciales Oficiales para Grúas/Plumas y Validez 5 Días Hábiles:** Incorporación del texto canónico oficial de 6 secciones para grúas telescópicas y camiones pluma directamente debajo de la tabla del estructurador de servicios en CRM, preservando condiciones de traslados, y actualización del plazo estándar de validez de oferta a 5 días hábiles en interfaz y PDF de propuesta. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.90)`.
* [x] **[REQ-993] Registro y Fotos Separadas de Horómetros y Odómetros en PWA:** Separación de captura fotográfica independiente para horómetros (izajes/motor) y odómetros (tacógrafo chasis en km) en Momento 1 (Inicio) y Momento 2 (Término), resolviendo consolas separadas en camiones pluma y grúas móviles. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.91)`.
* [x] **[Resolución de Falsos Positivos en Validación & Diff - REQ-995 / v1.0.92]:** Corrección en `GestorOportunidades.vue` normalizando unidades compuestas de traslados (`TRASLADO IDA/VUELTA`, `TRASLADO IDA`) y reconciliando líneas de preventa contra `crm_v1.lineas_servicio` para eliminar falsas observaciones rojas y marcas de nueva línea operativa en servicios validados. `CONCLUIDO Y VERIFICADO EN DEV Y PROD`.
* [x] **[Operaciones Críticas: Rigger Externo & Carga Manual de Horas - REQ-997 / v1.0.94]:** Enrolamiento rápido de rigger externo (`[➕ Ext]`) en Asignación de Recursos con persistencia en `tsec_users`, autoselección y sincronización con OT; y corrección/carga manual interactiva inline de horas de hitos (`HH:mm`) en `ControlOperativoVivo.vue` con persistencia en `tpry_proyecto.json_field->'control_vivo_overrides'`, sincronización no destructiva en `tvia_viaje`/`tedp_reporte_avance` y recalculo de semáforos sin interrumpir al operador en PWA. `CONCLUIDO Y VERIFICADO`.
* [x] **[Simplificación y Unificación de Flujo en Terreno PWA: Consola Maestra 1-2-3 (Viaje Ida ➔ Report Faena ➔ Retorno a Base) - REQ-998 / v1.0.95]:**
  - **PWA (`Surveys.vue`):** Consola operativa unificada que reemplaza las tarjetas separadas de Viaje y Report por un Stepper guiado 1-2-3 (`[1. Viaje a Faena] ➔ [2. Report Faena] ➔ [3. Retorno Base]`) y un botón maestro táctil prioritario ("👉 TU PRÓXIMA ACCIÓN") que conduce directamente al paso activo del operador sin confusión.
  - **Hoja de Conductor (`ViajeConductor.vue`):** Distinción entre Arribo a Faena (botón directo `[ 📋 PASO 2: INICIAR REPORT DIARIO DE FAENA ➔ ]`) y Arribo a Patio Base San Pablo (confirmación triunfal de servicio finalizado y botón `[ 🏠 VOLVER A MIS SERVICIOS ➔ ]`), erradicando enlaces erróneos a report diario en retorno y garantizando navegación `urlHomePwa` respetando el ambiente DEV/PROD.
  - **Report Diario (`ReportDiarioIzaje.vue`):** Botón de retorno al inicio en el modal de generación de Hoja de Ruta de Retorno.
  - **Backend API (`reportDiarioController.js` & `viajeModel.js`):** Detección en tiempo real de `jornada_en_curso: true/false` en `/reports/usuario/pendientes` y priorización ponderada `CASE` en `viajeModel.getViajeActivoPorUsuario`. `CONCLUIDO Y VERIFICADO`.
* [x] **[Manejo de Excepciones: Torre de Control ➔ ITS ➔ EDP - REQ-999 / v1.0.96 / Spec 63 §12]:**
  - **Torre de Control (`ControlOperativoVivo.vue`):** Flag `⚠️ Req. Regularización` visual cuando se corrige o carga hora manual sin telemetría ni report móvil (`act.override && !act.hora_real_original`). Envío de `{ requiere_regularizacion: true }` en payload.
  - **Mesa ITS (`ModalITS.vue`):** Botones `[📄 + Doc Físico (Vía A)]` (`agregarJornadaDocFisico`) y `[⚖️ + Piso Mínimo (Vía B)]` (`agregarJornadaPisoMinimo`). Badges cromáticos `🟢 FES`, `📄 Doc Físico`, `⚖️ Piso Mín.`.
  - **PDF Oficial ITS (`itsPdfService.js`):** Sello `[📄 DOC FÍSICO REGULARIZADO]` con anexo documental o `[⚖️ PISO MÍNIMO CONTRACTUAL (STANDBY)]` citando cláusula de horas mínimas contractuales.
  - **Centro Documentación y Política Nº 04:** Portal centralizado y política formal de excepciones desplegados. `CONCLUIDO Y VERIFICADO`.
* [x] **[Cierre E2E Torre de Control ➔ Pestaña 6 CRM ➔ Evidencia Física ➔ Mesa ITS - REQ-1000 / v1.0.97]:**
  - **Torre de Control (`controlVivoController.js`):** Upsert automático en `tedp_reporte_avance` ante ingreso manual de horas en Torre de Control con cálculo de horas operadas, facturables, sobretiempo y flag `requiere_evidencia_fisica = true`. Corrección de sincronización de `tequ_log_desplazamiento`.
  - **Gestión Documental de Terreno (`reportDiarioController.js` & `reportDiarioRoutes.js`):** Endpoints `POST /api/operaciones/report/:id/adjuntar-respaldo-fisico` y `POST /api/operaciones/report/regularizar-manual` para normalizar respaldos escaneados/fotográficos y asociar `id_doc_pdf` con cambio de estado a `VALIDADO_ANALISTA`.
  - **Mesa ITS (`itsController.js`):** Proyección de reportes regularizados con `tipo_respaldo = 'FISICO_MANUAL'` y `url_comprobante`, vinculación fluida en grilla de jornadas ITS y preservación de tarifas de propuesta.
  - **Pestaña 6 CRM (`GestorOportunidades.vue` & `ModalVisorReport.vue`):** Botón `[ ➕ Regularizar Reporte Físico ]`, badges cromáticos de estado (`📄 Doc Físico OK`, `⚠️ Regularizado Manual`), modales dedicados para adjuntar evidencia física escaneada y apertura directa de documentos. `CONCLUIDO Y VERIFICADO EN DEV Y PROD`.
* [x] **[REQ-994] Cotizador Express Móvil en PWA (Spec 64 v1.2.0 - Release v1.0.103):**
  - **Arquitectura Backend Canónica (`cotizacionExpressController.js` & `proyectoRoutes.js`):** Patrón Fachada y Normalizador Canónico con endpoints `GET /api/proyectos/express/catalogo` y `POST /api/proyectos/express/cotizar`. Auto-creación de prospectos en `tpar_empresas` y contactos en `tpar_contactos`, generación formal de `codi_proyecto` (`GSP-YYMM-CLIENT-XXX`), ensamble simétrico de `crm_v1.lineas_servicio` con piso mínimo contractual de 9 hrs/día, inserción en `tpry_proyecto` en estado 2 (`Cotización Enviada`), compilación de PDF oficial mediante `proyecto.generarCotizacionVersion` y generación de share link directo de WhatsApp (`wa.me`).
  - **Frontend Móvil PWA (`CotizadorExpress.vue`, `Surveys.vue`, `App.vue`, `router/index.js`):** Rediseño ergonómico integral. Separación estricta de labels superiores y placeholders (eliminando al 100% solapamientos de texto en Vuetify 3). Adaptabilidad a tema claro y oscuro con alto contraste. Segregación RBAC estricta: retiro del banner del flujo operativo de operadores y choferes (`GSP_EJEC`), botón dedicado `[ ⚡ Cotizador ]` en Bottom Navigation (`App.vue`) condicionado a `esAdminOComercial` y Navigation Guard en `router/index.js`. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.103)`.
* [x] **[REQ-1001] Optimización Cinemática de Viaje y Report Multi-Día (Spec 49 v1.1.0):**
  - **Matriz Canónica de Instrumentos 5x3:** Salida (Odómetro + Horómetro Camión), Llegada (Odómetro + Horómetro Camión + Horómetro Grúa), Término (Horómetro Grúa + Hora Término + Firma), Retorno (Odómetro + Horómetro Camión) y Llegada a Base (Odómetro + Horómetro Camión + Combustible).
  - **Hoja de Conductor (`ViajeConductor.vue`):** Ajuste de campos según matriz en las 4 instancias de ruta, ocultando horómetro de grúa en ruta y habilitando horómetro inicial de grúa exclusivamente al arribar a faena.
  - **Report Diario (`ReportDiarioIzaje.vue`):** Erradicación total de campos y fotos de odómetro en faena. Día 1: toma inicio de grúa desde llegada. Día > 1: inicio de faena solo registra tiempo (Hora de Inicio) con herencia automática de horómetro previo. Término: solo Hora Término, Horómetro Grúa y firma mandante.
  - **Consola Maestra PWA (`Surveys.vue`):** Desbloqueo de Retorno a Base condicionado estrictamente al último report planificado (`dia_correlativo === dias_planificados`). En días intermedios, mantener estado en espera de próxima jornada en faena.
  - **Backend API:** Normalización de esquemas y payloads en `viajeController.js`, `reportDiarioController.js`, `tequ_log_desplazamiento` y `tedp_reporte_avance`. `CONCLUIDO Y VERIFICADO`.
* [x] **[REQ-1002] Matriz Fotográfica Desacoplada por Instrumento en Terreno, Manual Visual y Locución Chilena es-CL (Spec 49 v1.2.0):**
  - **Base de Datos / DDL:** Columnas de persistencia fotográfica independiente en `tequ_log_desplazamiento` (`foto_odometro_salida_path`, `foto_horometro_salida_path`, `foto_odometro_llegada_path`, `foto_horometro_camion_llegada_path`, `foto_horometro_grua_llegada_path`) en esquemas `sch_leangsp` y `sch_leangsp_prod`.
  - **Backend API (`viajeModel.js` & `viajeController.js`):** Desestructuración y persistencia independiente de fotos por reloj/pantalla física. Inyección automática de `foto_horometro_grua_llegada_path` hacia `foto_tablero_inicio` en `tedp_reporte_avance`.
  - **Frontend APP (`ViajeConductor.vue`):** Desacople total de inputs fotográficos. Salida exige 2 fotos independientes (Odómetro y Horómetro Camión). Llegada a faena exige 4 fotos separadas (Odómetro, Horómetro Camión, Horómetro Grúa en cabina de izaje y Combustible). Retorno exige 2 fotos y Llegada a Base 3 fotos. Inclusión de atajo ergonómico para consolas integradas digitales.
  - **Estándar de Comunicación y Manual Oficial (`manual_operador_terreno_gsp.html`):** Erradicación absoluta de la sigla "PWA" llamándola exclusivamente "APP" o "Tu Aplicación en el Celular". Síntesis y locución guiada por voz en español de Chile (`es-CL`). Matriz visual paso a paso de 7 momentos y afiche imprimible de cabina. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.99)`.
* [x] **[REQ-1003] Resolución de Bucle de Redirección en Retorno de Faena a Base (Caso Finning / Natalia - Spec 49 v1.2.1):**
  - **Causa Raíz Identificada:** En `ViajeConductor.vue`, la propiedad `tipo_trayecto` no era transferida desde `dbViaje` al objeto reactivo `viaje.value` en `onMounted`, causando que la vista asumiera `IDA`. En consecuencia, al registrar la llegada en base se ejecutaba la apertura automática de `reportDiario?id_proyecto=3`, el cual detectaba que todos los días contratados estaban completados y reabría el modal del viaje de retorno (`vj-ret-3-44-...`), produciendo un bucle infinito de redirección hacia el inicio de la salida a faena.
  - **Hoja de Conductor (`ViajeConductor.vue`):** Inicialización y mapeo reactivo estricto de `tipo_trayecto: esRetorno ? 'RETORNO' : 'IDA'` deduciendo tokens con prefijo `ret` y estado de base de datos. Segregación de timestamps: lectura de `fecha_salida_faena` y `fecha_llegada_patio` para viajes de retorno. En `ejecutarLlegadaFaena`, fijación de `estado_trayecto = 'CONCLUIDO'`, emisión de alerta de servicio finalizado y erradicación total de llamadas a `abrirFormularioReport()`, redirigiendo exclusivamente a pantalla de término y retorno a `urlHomePwa`.
  - **Consola Maestra PWA (`Surveys.vue`):** `estadoPaso3ViajeRetorno` incorpora soporte para `v.estado_trayecto === 'CONCLUIDO'`, visualizando el paso 3 como `COMPLETADO` y mostrando la tarjeta de felicitaciones con el equipo disponible sin habilitar más reportes.
  - **Backend API (`viajeModel.js`):** En `getViajeActivoPorUsuario`, incorporación de `CONCLUIDO` en el ordenamiento ponderado del `CASE` evitando desalineaciones de estado. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.100)`.
* [x] **[REQ-1004] Transición Determinista Kanban Columna 5 (Operaciones) ➔ Columna 6 (Contabilidad) y Sincronización ITS (Caso Altumac - Spec 38 v1.1.0):**
  - **Causa Raíz Identificada:** En `Torre.vue`, la Columna 5 ("En Ejecución / Faena", Operaciones) ejecutaba `return [6, 7].includes(st)`, reteniendo a las OTs con faena terminada o facturadas. Al mismo tiempo, la Columna 6 ("Finalizado / Devengado", Contabilidad) filtraba exclusivamente por `st === 8` (código de estado inexistente en GSP, donde el cierre es estado 7). Además, al hacer clic en las tarjetas de la Columna 6 se dirigía erróneamente a `dossier_acreditacion` en vez de la subpestaña de liquidación (`liquidacion`), `getSubTabSugeridaPMO` sugería `'reports'` para proyectos finalizados, y `proyectoModel.js` no exponía `estado_its` ni `folio_its` para visibilidad contable en Torre.
  - **Tablero Kanban Torre de Control (`Torre.vue`):**
    * Definición de helper canónico reactivo `esFinalizadoOperacional(p)` que detecta estados `>= 6`, ITS en revisión contable (`EN_REVISION_CONTABILIDAD`), ITS concluido (`CONCLUIDO`), liquidación facturada o devengada.
    * Columna 5 ("En Ejecución / Faena"): Exclusión estricta de todo proyecto finalizado o en contabilidad (`if (esFinalizadoOperacional(p)) return false`), limitándose únicamente a OTs con operación activa en faena (`st === 5 && estaEnFaena(p)`).
    * Columna 6 ("Finalizado / Contabilidad"): Título formalizado, inclusión automática de todas las OTs finalizadas (`esFinalizadoOperacional(p)`), badges cromáticos de estado financiero (`FACTURADO_CONFORME` / `DEVENGADO_PENDIENTE_FACTURA`), visualización de folio ITS y enlace directo al hacer clic hacia la Subpestaña 7: `7. Valorización, ITS & Facturación` (`subtab: 'liquidacion'`).
    * Sincronización en `getSubTabSugeridaPMO` y `pendientesFacturacion`.
  - **Backend API (`proyectoModel.js` & `itsController.js`):**
    * En `proyectoModel.js`, incorporación de `LEFT JOIN LATERAL` hacia `tits_informe_termino` proyectando `id_its`, `folio_its` y `estado_its` en la consulta principal de proyectos.
* [x] **[Cockpit Operacional PWA Apple-Grade y Segregación Operación/Comercial - REQ-1005 / v1.0.107]:** Erradicación total de grúas pluma de construcción en navegación, cockpit operacional permanente con contadores en vivo de viajes, reports y checklists, bottom navigation nativo iOS frosted glass y botones ergonómicos de un toque en terreno. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.107)`.
* [x] **[Dashboard Directivo BI y Telemetría en Vivo - REQ-1006 / v1.0.104]:** Consola ejecutiva de Business Intelligence para Dirección General con cálculo real de Devengado (IFRS 15), Balanza de Descalce ($12.2M CLP retenidos en 16 OTs), Waffle Chart / Heatmap de 110 equipos en tiempo real con 5 estados cromáticos, feed de alertas accionables, radar de inspecciones y sello explícito de VERSIÓN BETA v0.9 en calibración. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.104)`.
* [x] **[Visión Gráfica Comparativa del Devengado & Monto Total Cotizado CRM - REQ-1007 / v1.0.105]:** Erradicación total de barras horizontales planas y creación del Centro Gráfico Comparativo del Devengado con 3 perspectivas visuales: 1) Columnas E2E (Funnel de Valor de 6 estaciones con base Y-Axis), 2) 4 Pilares Macro de la Cadena de Ingresos (Cotizado CRM, Devengado Faena, Brecha Descalce, Facturado SII), 3) Descalce por Mandante con barras horizontales segmentadas. Integración del Monto Total Cotizado ($29.649.999 CLP / 39 cotizaciones CRM) en la banda superior de KPIs (6 dimensiones), en el Paso 0 del pipeline y en el drill-down reactivo con botón de limpieza de filtros. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.105)`.
* [x] **[Hotfix Visibilidad Control en Vivo OTs en Faena & Transición ITS - REQ-1008 / v1.0.106]:** Ampliación de la consulta SQL principal de `controlVivoController.js` para incluir proyectos en estado 7 (`En Faena`) y 8 (`Finalizado Operacional`), además de incorporar condiciones dinámicas de fecha que abarcan actividad real del día (desplazamientos, inspecciones de patio, reportes diarios, elaboración de ITS o servicios activos en faena pendientes de conclusión), resolviendo la invisibilidad de servicios de 1 día con transición documental al día siguiente (Caso Altumaq SA). `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.106)`.
* [x] **[Hotfix Enlace PDF Cotizador Express y Formato de Mensajería WhatsApp - REQ-1009 / v1.0.107]:** Resolución de ruta del PDF de cotización express mediante inyección dinámica de prefijo de ambiente (`envPrefix` `/lg-gsp-prod` o `/lg-gsp-dev`) en `cotizacionExpressController.js`, erradicando el error HTTP 404 al descargar el PDF desde WhatsApp. Homologación de ubicación (`obra_nombre` y `obra_comuna`) en el cuerpo del mensaje y nombre de proyecto final para evitar textos pegados o truncados. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.107)`.
* [x] **[Desacoplamiento de Traslados de Grúas Autopropulsadas, Logística de Contrapesos y Emisión de Reports - REQ-1011 / v1.0.109 / Spec 65]:**
  - **Doctrina & Especificación Core (`SPEC-065`):** Formalización de matriz canónica de 5 casos de negocio, axioma de no duplicación vehicular en grúas telescópicas/plumas, logística de 4 viajes para tracto de contrapesos en faenas multi-día, concentración documental en un único Report Diario de izaje firmado por el mandante y cálculo de horas de conducción Art. 25 bis.
  - **Portal Web CRM (`GestorOportunidades.vue`):** En `sincronizarTrasladosComerciales()`, supresión estricta de traslados propios de grúa en Pestaña C, erradicación de inserción forzada de Cama Baja en servicios rurales ($>30\text{ km}$), tipificación de Contrapesos como `TRACTO CONTRAPESOS` y asignación de `Chofer Transporte`. Protección inmutable de roles en `confirmarAsignacionOT` (`mapPersonas`), blindando al `Operador Grúa` contra degradaciones a chofer.
  - **Centro de Documentación Web & Manual Oficial:** Despliegue de Módulo 6 en `centro_documentacion_gsp.html` y manual interactivo `guia_asignacion_recursos_traslados_y_reports.html` en Nginx DEV y PROD.
  - **Soporte & Regularización BD (`sch_leangsp_prod`):** Regularización de viaje ID 3 a `ARRIBADO`, restitución de rol a `Operador Grúa` para Robert Rodríguez (`49`) en OT 4 y habilitación del cierre del Report Día 2 en PWA. `CONCLUIDO Y VERIFICADO EN DEV Y PROD (v1.0.109)`.
* [x] **[Ribbon Horizontal de Jornadas en Control en Vivo, Navegación Multi-Día, Telemetría Directa y Secuencia de Report - REQ-1012 / v1.0.110 / Spec 66]:**
  - **Especificación Canónica Core (`SPEC-066`):** Formalización en `.agents/specs/66_control_vivo_ribbon_jornadas_y_secuencia_report_spec.md` de los 4 pilares: Ribbon Horizontal de Jornadas Multi-Día, Navegación y Filtro Reactivo Intradía, Acceso Inmediato a Telemetría de Hoja de Ruta (`ModalMapaViaje.vue`) y Visor de Report (`ModalVisorReport.vue`), y Regla de Secuencia Cronológica Fail-Closed en Terreno.
  - **Backend API (`reportDiarioController.js`):** Validación en `guardarInicioJornada` con compuerta fail-closed `HTTP 409 Conflict` (`codigo: 'DIA_PREVIO_PENDIENTE'`) si `dia_correlativo > 1` y la jornada previa no está sellada y validada.
  - **Backend API (`controlVivoController.js`):** Enriquecimiento de la franja multi-día para iterar cada día planificado de la OT, consultando viajes e inspecciones, y calculando `actividades`, `id_reporte_avance`, `estado_reporte`, `tiene_viaje` y `viaje_resumen` por jornada individual.
  - **Despliegue Backend DEV en Linux:** Actualización de controladores en `/home/nodeadmin/proyectos/lean-services-gsp/`, reinicio de PM2 ID 10 en puerto 3006 y verificación empírica con curl HTTP 200 confirmando 19 OTs activas con franja multi-día enriquecida.
  - **Frontend Web (`ControlOperativoVivo.vue`):** Despliegue del Ribbon horizontal interactivo de jornadas con badges de estado, cápsula activa seleccionable, sincronización de actividades plan vs real por día, botones directos de telemetría GPS satelital (`ModalMapaViaje`) y visor FES de reportes diarios (`ModalVisorReport`). Compilación Vite validada con 0 errores (v1.0.110). `CONCLUIDO Y VERIFICADO EN DEV (v1.0.110)`.
* [x] **[Módulo ITS Transición V1: Ingesta de Planillas GeraldSoft, Edición de Horas, 8 Rubros de Costos y Balance de Margen - REQ-1013 / SPEC-066 / v1.0.111]:**
  - **Especificación Canónica Core (`SPEC-066`):** Documento formal `.agents/specs/66_its_transicion_manual_y_resumen_costos_spec.md` detallando arquitectura de dos pestañas: "Elaborar Informe" y "Control y Estados", fórmulas de utilidad/margen operacional y matriz de costos.
  - **Módulo Frontend Maestro (`ItsTransicionView.vue`):**
    * Pestaña 1 ("Elaborar Informe"): Parser client-side con SheetJS para planillas GeraldSoft (`CONTROLES [MES].XLS` y `OT [MES].xlsx`), agrupación inteligente por Cotización / Cliente / Fecha, edición manual de horas, reportes y 8 costos operacionales con toggle "NO REEMBOLSAR".
    * Blindaje contra pérdida de datos: Llaves locales canónicas aisladas (`grp_cot_...`) que erradican la sobreescritura en blanco que ocurría en la solución previa.
    * Balance financiero reactivo: Cálculo instantáneo de Venta Neta, Costo Directo Total, Margen Bruto ($) y Margen Operacional (%).
    * Exportación & Maquetación A4: Plantilla de impresión idéntica al formato corporativo oficial de GSP.
    * Pestaña 2 ("Control y Estados"): Pipeline de estados (Sin Ingresar, Borrador, Emitido, Aprobado), métricas consolidadas del mes y repositorio de reportes históricos.
  - **Enrutamiento & Navegación:** Registro de ruta `/its-transicion` en `router/index.js` e integración de acceso directo con icono `FileSpreadsheet` en el menú principal de la consola (`Sidebar.vue`).
  - **Certificación de Build:** Compilación Vite (`npm run build`) validada con 0 errores (v1.0.111). `CONCLUIDO Y VERIFICADO EN FRONTEND LOCAL`.
* [x] **[Módulo ITS Transición V2: Filtros de Fecha, Mapeo Columna A, Horas Reales Editables, Peajes Totales y Reporte Imprimible Oficial - REQ-1014 / v1.0.112]:**
  - **Requerimientos Operativos Acordados (Reunión Sergio Gajardo & Yiara Mendoza 08-Oct):**
    1. *Filtro Rango Fechas & Buscador:* Filtro `Fecha Desde` / `Fecha Hasta` y buscador de texto en vivo en barra superior para cotizaciones y mandantes (Louisiana, Nolar, Pocuro, ASENAV, etc.).
    2. *Mapeo Columna A (Geralsoft):* Priorización canónica de Columna A (`s.__EMPTY` / primer valor) como fecha real cuando celdas intermedias vengan en blanco; mapeo de horas: Salida (Col E), Llegada faena (Col I), Término faena (Col L), Retorno base (Col O).
    3. *Cálculo de Horas Reales & Editabilidad Total:* Cálculo automático de Salida a Retorno menos Colación; campos `horas_reales_texto` y `horas_report` 100% editables en tabla de jornadas para resolución de excepciones.
    4. *Costo Financiero de Peajes (100%):* Inclusión del 100% de peajes en `subtotalPeajes` para contabilidad, manteniendo badge selector `NR` (No Reembolsable / TAG) y `RE` (Reembolsable persona).
    5. *Encabezados de Tabla Pensiones & Soporte Multi-Viaje Diario:* Agregado el encabezado formal (`Fecha | Personal | Desayuno | Almuerzo | Cena | Alojamiento | Total ($) | Acciones`) y soporte para registrar múltiples viajes y líneas de horario por día/equipo sin bloqueo.
    6. *Mano de Obra & Horas de Traslado:* Horas de operador editables por equipo y subtabla para agregar líneas adicionales de `Horas de Traslado / Conducción` (Concepto, Patente, Horas, Tarifa/hr, Total) sumándose al costo total.
    7. *Porcentajes sobre la Venta Facturable:* Desglose porcentual `(% s/ Venta)` en cada ítem de venta facturable en Sección 4 y reporte final.
    8. *Reporte Imprimible Oficial:* Formato de impresión A4 actualizado con subtítulos de viáticos desglosados, traslados y peajes totales con indicación clara de "NO REEMB".
  - **Despliegue a DEV:** Compilado con Vite en modo development (`/lg-gsp-dev/`) con 0 errores y desplegado exitosamente vía SSH a `/var/www/html/lg-gsp-dev/` con verificación HTTP 200 OK. `CONCLUIDO Y VERIFICADO EN DEV (v1.0.112)`.
* [x] **[Módulo ITS Transición V3: Almacenamiento Canónico en Gestor Documental (/u05/LeanDocs/GSP/{ambiente}/ITS-TRANSICION/{YYYY}/{MM}), Parseo de Fechas en Texto y Aprobación FES Contabilidad - REQ-1015 / v1.0.113]:**
  - **Corrección de Carga Fecha Columna A:** Soporte completo para fechas con meses abreviados en español e inglés (`01-Oct-26` -> `2026-10-01`), seriales de Excel y fallback al timestamp de la Columna E (`horasalida`). Erradicado el fallback involuntario a fecha actual (`08-10-2026`).
  - **Simplificación Estricta de Acciones:** Supresión de botones redundantes al pie del formulario, dejando exclusivamente: **"💾 Grabar"** (guardado de borrador y avances) y **"✅ Aprobar ITS"** (emisión y depósito documental).
  - **Depósito de Archivos según Estándar Canónico:** Conexión con `/api/v1/storage/upload` (`leanglobal_file_storage_standard`), archivando físicamente los documentos bajo `/u05/LeanDocs/GSP/{ambiente}/ITS-TRANSICION/{YYYY}/{MM}/` y registrando el `path_relativo` en `tfmg_file`.
  - **Subformulario "Control y Estados" Actualizado:** Muestra la bandeja con Folio ITS, Cotización, Cliente, Fechas de Faena, Totales Financieros, y la ruta física particionada por `{ambiente}/{mes}`. Botón para previsualizar el PDF depositado (`/api/v1/storage/view/:id_doc`).
  - **Firma Electrónica Simple (FES) para Contabilidad:** Modal interactivo de visto bueno contable con ingreso de PIN OTP de 4 dígitos, validación, estampado de sello digital FES (firmante, RUT, código FES, timestamp) y transición formal a estado `APROBADO`.
  - **Despliegue a DEV:** Compilado con Vite en modo development (`/lg-gsp-dev/`) con 0 errores y desplegado vía SSH a `/var/www/html/lg-gsp-dev/` con HTTP 200 OK. `CONCLUIDO Y VERIFICADO EN DEV (v1.0.113)`.
* [x] **[Módulo ITS Transición y Liquidación Relacional en Producción - REQ-1016 / v1.0.114]:**
  - **Base de Datos / DDL:** Creación de tabla `sch_leangsp_prod.tits_transicion_historial`, secuencia e índice por `numero_cotizacion`, con asignación de privilegios completos a `usr_leangsp_prod`.
  - **Backend API (`itsController.js` & `itsRoutes.js`):** Desacoplamiento de nombres de esquema en consultas SQL (`tits_transicion_historial`, `tfmg_file`) permitiendo resolución multiesquema automática vía `search_path`. Despliegue en `/home/nodeadmin/proyectos/lean-services-gsp-prod/` y reinicio de PM2 ID 13.
  - **Frontend Web (`ItsTransicionView.vue`):** Compilación en modo producción con Vite (`index-l_NNQtft.js`), despliegue a `/var/www/html/lg-gsp-prod/` y verificación HTTP 200 OK.
  - **Gobernanza y Sincronización:** Registro en `RELEASE_LOG.md`, inserción en `tcfg_backlog` y `tcfg_releases` en `sch_leangsp` y `sch_leangsp_prod`. `CONCLUIDO Y VERIFICADO EN PRODUCCIÓN (v1.0.114)`.
* [x] **[Flujo de Aprobaciones ITS Transición, Gobernanza Tripartita, Firmas FES y Notificaciones con Deep Link - REQ-1017 / SPEC-067]:**
  - **Especificación Canónica:** Redacción de `.agents/specs/67_its_transicion_flujo_aprobaciones_secretaria_admin_contabilidad_spec.md`.
  - **Base de Datos / DDL:** Creación de rol `SECRETARIA` (`id_rol = 38`), enrolamiento de Analista Yiara Mendoza (`id_user = 65`) y extensión de columnas `firmas_fes`, `historial_observaciones`, `id_usuario_elaborador`, `id_usuario_verificador`, `id_usuario_aprobador` en `sch_leangsp` y `sch_leangsp_prod`.
  - **Backend API (`itsController.js` & `itsRoutes.js`):** Implementación de endpoints `/firmar-elaborador`, `/devolver`, `/validar-admin`, `/aprobar-contabilidad` y despacho de notificaciones omnicanal (Email B2B + WhatsApp) con Deep Linking contextual hacia DEV y PROD.
  - **Frontend Web (`ItsTransicionView.vue`):** Switcher de roles activos, banner de alerta para informes devueltos, modal tripartito FES con verificación de PIN OTP SHA-256, modal de devoluciones con observaciones requeridas y sustitución integral del pie estático por 3 columnas dinámicas oficiales FES con trazabilidad de devoluciones. `CONCLUIDO Y DESPLEGADO EN DEV Y PROD (v1.0.115)`.
* [x] **[Corrección Cálculo Mano de Obra y Persistencia Planillas GeraldSoft - REQ-1018 / SPEC-068]:**
  - **Especificación Canónica:** Redacción de `.agents/specs/68_its_mano_obra_fix_y_persistencia_planillas_spec.md`.
  - **Base de Datos / DDL:** Creación de tabla relacional `tits_geraldsoft_planillas` en `sch_leangsp` (DEV) y `sch_leangsp_prod` (PROD) con indexación compuesta por tipo de planilla y estado activo.
  - **Backend API (`itsController.js` & `itsRoutes.js`):** Implementación de endpoints `/transicion/planillas/activas` (GET) para precarga automática de planillas y `/transicion/planillas/subir` (POST) para persistencia transaccional con versionamiento activo.
  - **Corrección de Cálculo de Mano de Obra ($111.000 vs $222.000):** Tarifa sugerida base para categoría `GRUA HORQUILLA` ajustada a `$3.000/hr`, reactividad bidireccional estricta en `costos.tarifas_operadores_override` e inputs numéricos, y homologación de fórmula en PDF oficial.
  - **Frontend Web (`ItsTransicionView.vue`):** Precarga en `onMounted`, auto-poblado persistente del selector de servicios y OTs para todas las sesiones, persistencia en subida y banner visual de planillas sincronizadas. `CONCLUIDO Y DESPLEGADO EN DEV Y PROD (v1.0.116)`.

* [x] **[Tarifario Dinámico de Mano de Obra por Categoría de Equipo según Sistema Jorge - REQ-1019 / SPEC-069]:**
  - **Especificación Canónica:** Redacción de `.agents/specs/69_its_tarifario_equipos_operador_jorge_spec.md`.
  - **Catálogo Maestro Canónico:** Integración del tarifario de operadores de Jorge (`CATALOGO_TARIFAS_OPERADOR` con 10 categorías maestras: Grúa Horquilla $3.000/hr, Camión Pluma $5.000/hr, Manitou $5.000/hr, Grúas 70T-80T $6.000-$7.000/hr, Tractocamión $7.000/hr, Grúa 100T $8.000/hr, Grúa 220T $12.000/hr, Otra Maquinaria $8.500/hr).
  - **Auto-Detección y Selector Interactivo en UI:** Lógica inteligente `detectarTarifaYCatSugerida` en `ItsTransicionView.vue` que sugiere automáticamente la categoría y tarifa horaria por tonelaje/subcategoría, y añade selector `<select>` interactivo en la columna "Categoría Maestra" de la tabla de Mano de Obra.
  - **Recálculo Reactivo y PDF Oficial:** Soporte desacoplado para sobreescritura manual de valor hora y horas report por equipo con actualización matemática instantánea del costo fila, subtotal sección 3 y margen neto en el informe y en la generación de PDF oficial.
* [x] **[Corrección de Firma FES Elaborador y Reposición de Vista Previa PDF - REQ-1020 / v1.0.118]:**
  - **Resolución Multicriterio de Usuario Firmante:** Ajuste en `itsController.js` para resolver usuario por `id_user`, `id_usuario`, o búsqueda por RUT (`firmante_rut`), con fallback automático a Yiara Mendoza (`id_user = 65`) y compatibilidad de hashing para `pin_fes`, `pin_hash` y `pin` de 4 dígitos.
  - **Reposición Botón Ver Informe PDF:** Incorporación del botón `👁️ Ver Informe PDF` (`abrirVentanaImpresionOficial()`) en la barra de acciones de la Sección 4 y en el footer interactivo de la ventana modal FES (`modalFesAbierto`).
* [x] **[Apertura Integral de Costos Operacionales en ITS Sección 3 y Resumen 4 (Sistema Jorge) - REQ-1021 / v1.0.119]:**
  - **Apertura de los 9 Rubros Canónicos en Sección 3:** Homologación de la Sección 3 en `generarHtmlDocumentoOficial` ([`ItsTransicionView.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue)) aperturando de forma independiente los 9 rubros canónicos de la aplicación original de Jorge (`viaticos-pensiones.js`), con tabla detallada (`#f8fafc`) para rubros con gastos o mensaje estilizado `Sin registros de gastos en este ítem ($0)` para rubros en cero.
  - **Apertura de 8 Conceptos en Tabla B de la Sección 4:** Erradicación de la consolidación de "Otros Costos Operativos Faena" y apertura detallada de los 8 ítems independientes (`1. Viáticos Alimentación`, `2. Peajes y Tag`, `3. Pensiones y Alojamiento`, `4. Movilización Personal`, `5. Personal Externo y Feriados`, `6. Subcontratación Flete Externo`, `7. Gastos Extraordinarios`, `8. Costo Valor Hora Operador`) con sus montos en pesos y `% S/ VENTA`.
  - **Gobernanza y Despliegue:** Compilación Vite dual (`dist_dev` y `dist_prod`) con 0 errores, despliegue a DEV (`/var/www/html/lg-gsp-dev/`) y PROD (`/var/www/html/lg-gsp-prod/`), verificación HTTP 200 OK y sincronización en `tcfg_backlog` y `tcfg_releases`. `CONCLUIDO Y DESPLEGADO EN DEV Y PROD (v1.0.119)`.
* [x] **[Bóveda Corporativa de Planillas GeraldSoft, Ingesta Incremental con Upsert y Matriz de Conciliación ITS - REQ-1022 / SPEC-070 / v1.0.120]:**
  - **Especificación Canónica Core (`SPEC-070`):** Formalización en `.agents/specs/70_boveda_planillas_geralsoft_cargas_incrementales_y_conciliacion_its_spec.md` de la arquitectura tripartita: Bóveda Central Compartida en la Nube, Ingesta Incremental Diaria con Deduplicación (Upsert) y Matriz de Conciliación Operativa Geralsoft ⇄ ITS.
  - **Base de Datos / DDL:** Extensión de `tits_geraldsoft_planillas` con columnas `modo_carga`, `registros_nuevos` y `registros_actualizados`, e indexación compuesta por tipo, activo y fecha en esquemas `sch_leangsp` (DEV) y `sch_leangsp_prod` (PROD).
  - **Backend API (`itsController.js` & `itsRoutes.js`):** Soporte en `subirPlanillaPersistente` para modo incremental diario con deduplicación por clave natural (`cotizacion` + `orden` + `fecha` + `patente` + `item`), enriquecimiento de `obtenerPlanillasActivas` con autor de carga y fecha, e implementación de `obtenerHistorialPlanillas` (`GET /transicion/planillas/historial`). Despliegue en DEV (PM2 10) y PROD (PM2 13).
  - **Frontend Web (`ItsTransicionView.vue`):** Cabecera corporativa de la Bóveda con estado de sincronización y autor, panel desplegable de carga con selector de modo (Fusión Incremental vs Reemplazo Total), modal de auditoría histórica de cargas, y Matriz de Conciliación interactiva con KPIs (Total, ⚪ Pendientes, 🟡 En Trámite, 🔴 Observados, 🟢 Concluidos) y botones directos `[+ Elaborar ITS]`, `[✏️ Continuar]` y `[👁️ Ver PDF]`.
  - **Gobernanza y Hard Gate:** Incremento de versión a `1.0.120` en `package.json`, registro en `RELEASE_LOG.md`, sincronización en tablas `tcfg_backlog` y `tcfg_releases` de PostgreSQL en DEV y PROD, y certificación empírica HTTP 200 OK. `CONCLUIDO Y DESPLEGADO EN DEV Y PROD (v1.0.120)`.
* [x] **[Módulo Enterprise de Mantenimiento de Flotas, Radar de Horómetros, Pautas Cíclicas, Hallazgos C1-C4, Cierre Supervisado FES y PWA Taller Móvil - SPEC-067 / REQ-1023]:**
  - **Especificación Canónica Core (`SPEC-067`):** Redacción y aprobación formal de `.agents/specs/67_mantenimiento_enterprise_spec.md` con arquitectura de 6 pilares: Segregación Comercial vs Taller, Máquina de Estados FSM, Catálogo Cíclico Fabricante (PM250, PM500, PM1000, PM2000), Gobernanza de Hallazgos C1-C4 (ISO 14224), Candados Duros de Calidad (Checklist 100% y PIN FES criptográfico SHA-256) y Balanza Financiera de Costos Reales (HH + Materiales + Terceros).
  - **Base de Datos / DDL & Seeders:** Creación de tablas `tmnt_hallazgo`, `tmnt_aviso`, `tmnt_pauta_tarea`, `tmnt_ot_estado_log`, `tmnt_ot_survey`, `tmnt_parametro`; extensión de `tmnt_ot`, `tmnt_ot_cierre`, `tmnt_ot_repuesto`, `tmnt_ot_hh`, `tmnt_ot_actividad`, y ampliación de `tequ_equipo.estado` a VARCHAR(30) en `sch_leangsp` (DEV). Creación de roles `GSP_TALLER_PROG`, `GSP_TALLER_APROB`, `GSP_TALLER_EJEC`, pautas preventivas y plantillas de inspección pre/post (Template 501 y 502).
  - **Corrección de Trigger PL/pgSQL:** Actualización de `fn_chk_cierre_ot` para separar validación por tabla (`TG_TABLE_NAME`) evitando error de campo `estado` en `tmnt_ot_cierre` y desacoplando control de inventario WMS para compras y materiales manuales de Fase 1.
  - **Backend API & Auditor de Alertas:** Implementación en `mantenimientoModel.js`, `mantenimientoController.js` y `mantenimientoRoutes.js` de los 7 endpoints canónicos (`/kpis`, `/flota/radar`, `/pautas`, `/parametros`, `/ots`, `/hallazgos`, `/avisos`). Servicio de segundo plano `mantenimientoAlertasService.js` integrado en `index.js` monitoreando OTs envejecidas (>7d), deltas PM y vencimiento de certificaciones BV con anti-spam. Despliegue en PM2 app 10 (`lean-services-gsp`).
  - **Certificación Empírica E2E:** Ejecución de `test_workflow_dev.mjs` con 100% de éxito: creación de OT, inyección automática de tareas PM250, registro de hallazgo C3, rechazo por PIN inválido (422), rechazo por checklist incompleto (422), completitud de tareas, imputación de 4 HH + filtro aceite, cierre formal supervisado con PIN FES (200 OK), cálculo financiero exacto ($105.000) y restauración de activo a `OPERATIVO`.
  - **Consola Web GSP Taller Enterprise (`MantenimientoView.vue`):** Diseño corporativo sin datos mock; banner ejecutivo de KPIs (Disponibilidad %, Cumplimiento PM %, Ratio PM/CM, Backlog Semanas, OTs Envejecidas, Gasto Mes CLP); tira de alerta crítica; 5 pestañas operacionales (Bandeja OTs, Radar Flota & Horómetros, Avisos de Avería, Hallazgos Taller, Parámetros Operacionales); slide-over de detalle integral de OT con 6 sub-pestañas; y modales de apertura, imputación, hallazgos y cierre supervisado FES.
  - **Hoja de Vida 360 del Activo (`HojaVidaEquipoView.vue`):** Nueva vista en `/mantenimiento/equipo/:id` con pasaporte integral de la grúa: odómetro/horómetro, historial completo de OTs, histórico de costos acumulados, hallazgos históricos, avisos de terreno y certificaciones estructurales Bureau Veritas.
  - **Módulo PWA Móvil para Mecánicos (`/taller` y `/taller/ot/:id`):** Nueva vista `TallerHomeView.vue` con escáner QR de grúas, lista de OTs en taller, emisión de avisos de avería in-situ y acceso a checklists pre/post. Nueva vista `TallerOtDetalleView.vue` con marcado táctil de tareas (1 tap), imputación rápida de HH y materiales, reporte de hallazgo con severidad y cierre formal con PIN FES. Acceso directo incorporado en `Surveys.vue`.
  - **Feed de Actividades Estilo Social & Corrección Visual Contraste (PWA y Consola Web):**
    - Rediseño de tickets de checklist con alto contraste en tema Claro y Oscuro (resolución de círculos negros ilegibles y textos invisibles).
    - Extensión DDL de `tmnt_ot_actividad` con columnas `fotos JSONB DEFAULT '[]'` y `comentarios JSONB DEFAULT '[]'`.
    - Endpoints backend `POST /actividades/:idActividad/fotos` y `POST /actividades/:idActividad/comentarios`.
    - Tarjeta interactiva por tarea tipo red social en PWA Móvil y Consola Web: galería de miniaturas fotográficas con zoom modal a pantalla completa, hilo de notas técnicas de campo, caja desplegable para publicar y botones de acción rápida `[📷 Adjuntar Foto]` y `[💬 Comentar]`.
    - Integración oficial con `leanglobal_file_storage_standard` (`POST /v1/storage/upload` con `tenant_code: 'gsp'`, `modulo: 'mantenimiento'`, `tipo_doc: 'EVIDENCIA_MNT'`), indexación en `tfmg_file` por `id_doc`, y helper universal `resolverFotoUrl` en PWA y Web.
    - Soporte completo de eliminación de fotos de actividades: endpoint backend `DELETE /actividades/:idActividad/fotos/:idFoto`, botón `[✕]` flotante en miniaturas y método reactivo en PWA Móvil y Consola Web.
    - Erradicación del solapamiento de textos en PWA: rediseño integral de las pestañas Horas (`hh`), Insumos (`materiales`) y Hallazgos (`hallazgos`) reemplazando componentes Vuetify por inputs y etiquetas HTML nativas con clases adaptativas (`bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white`), garantizando 100% de legibilidad y cero colisiones tipográficas en tema claro y oscuro.
    - Ficha Técnica Operativa en Encabezado de OT (PWA y Consola Web): Endpoint `GET /mantenimiento/tecnicos`, selector obligatorio de mecánico responsable, fecha y hora de inicio programada, y observaciones de asignación del Jefe de Taller en modal de creación Web; auto-asignación en creación autónoma PWA; y cabecera estructurada en PWA Móvil con responsable asignado, prioridad, tipo de trabajo, horómetro, ventana temporal (inicio/término) e instrucción destacada en ámbar.
    - Compilación limpia de PWA (Vue CLI) y Consola Web (Vite), despliegue a DEV y validación cruzada E2E en OT `MNT-2610-010`. `CONCLUIDO Y DESPLEGADO EN DEV`.
  - **Compilación de Frontend:** Vite build completado con 0 errores (53.56s). `CONCLUIDO Y CERTIFICADO EN DEV (SPEC-067)`.

---

### 📌 Tareas Prioritarias Registradas (05-Oct-2026)
* [ ] **1. Coordinar inducción:** Llamar a Marcelo Reyes para coordinar inducción.
* [ ] **2. Notificaciones Jorge Ponce:** Reemplazar el usuario de notificaciones de Jorge que está con Gmail por su cuenta recién enrolada con el dominio `arriendosanpablo.cl`.
* [ ] **3. Backlog:** Revisar backlog. (Completada sincronización y relevamiento DEV/PROD; items 1, 2, 3 concluidos; 4 en revisión; 10 pendiente; 5, 6, 7, 8, 9 en ejecución).
* [x] **4. Formulario de control:** Validar formulario de control con Yiara (Concretado en reunión del 08-Oct-2026 con despliegue de ITS Transición V1).
* [ ] **5. Análisis e Impacto Sistémico de Odómetros y Doble Horómetro en Inspecciones y Reportes [PENDIENTE]:**
  - Evaluar impacto del modelo bicomponente (Grúa/Superestructura vs Tracto/Chasis) y odómetro en:
    1. Inspección de Patio Entrada/Salida (Template 79 Survey).
    2. Reportes Diarios de Avance (`tedp_reporte_avance`).
    3. Registros de viajes / traslados en carretera.
    4. Reglas de validación en captura móvil para operadores y choferes (advertencias por digitación menor / monotonicidad).
* [x] **6. Base de Datos SSOT de Odómetros y Doble Horómetro para Grúas y Tractos [MIGRACIÓN DEV COMPLETADA]:**
  - Extensión DDL de `tequ_equipo` con `tiene_doble_horometro`, `horometro_grua_acumulado`, `horometro_chasis_acumulado`, `odometro_acumulado`, `fecha_ultima_lectura`, `fuente_ultima_lectura`.
  - Extensión DDL de `tmnt_ot` con `alcance_mantenimiento`, `horometro_grua_inicio`, `horometro_grua_cierre`, `horometro_chasis_inicio`, `horometro_chasis_cierre`, `odometro_inicio`, `odometro_cierre`.
  - Activación de triggers PostgreSQL de no-regresión `trg_sync_equipo_odohoro_reportes` y `trg_sync_equipo_odohoro_ot`.
  - Población de lecturas iniciales desde reportes de faena en DEV (12 equipos poblados y 38 grúas tipificadas con doble horómetro).
* [x] **7. PWA Taller Móvil: Catálogo de Flota, Búsqueda Normalizada y Ficha Clínica 360° [COMPLETADO Y DESPLEGADO EN DEV]:**
  - Implementación en `TallerHomeView.vue` de selector dual: OTs Activas vs Catálogo Completo de la Flota (58 equipos).
  - Búsqueda reactiva normalizada (`replace(/[^a-zA-Z0-9]/g, '').toUpperCase()`) que encuentra patentes sin importar guiones, puntos o espacios (`DZXL.21-0`, `TJVB14`, `135`, `Liebherr`, `Tadano`).
  - Medidores adaptativos por equipo: Grúa (Izaje) y Tracto (Chasis / Odómetro) para equipos con doble horómetro (`tiene_doble_horometro = true`), y medidor único para plataformas/alzahombres.
  - Ficha Clínica 360° del Activo con 3 pestañas:
    1. Documentación Legal & Certificaciones Bureau Veritas (Permiso, RT, SOAP, Tablas de carga) con badges de vigencia y botón para ver/descargar PDF oficial.
    2. Historial de OTMs anteriores del equipo con su tipo, fecha, diagnóstico final y costo.
    3. Inspecciones de Patio recientes (Template 79: entradas y salidas con inspector y observaciones).
  - Integración en `TallerOtDetalleView.vue` del botón directo "Ficha Clínica del Activo" e indicadores duales de horómetro/odómetro en la cabecera técnica.
  - Apertura in-situ de nuevas OTs con horómetros y odómetro precargados desde el maestro de equipos.
  - Compilación Vue CLI y despliegue a DEV (`/var/www/html/pwa-gsp-dev/`), certificado con HTTP 200 OK.
* [x] **8. PWA Taller Móvil: Ficha QR Oficial, Medidores de Entrada/Cierre (Doble Horómetro) e Inspección 360° [REQ-1024 / SPEC-071 / PWA v1.0.38 / COMPLETADO Y DESPLEGADO EN DEV]:**
  - **Especificación Canónica:** Formalización en [.agents/specs/71_taller_movil_ficha_qr_odohoro_y_fotos360_spec.md](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/.agents/specs/71_taller_movil_ficha_qr_odohoro_y_fotos360_spec.md).
  - **Ficha QR Oficial (`FichaEquipoPublica.vue`):** Integración del modal con iframe a `https://servidor.leanglobal.cl/lg-gsp-dev/equipo/:patente` (y botón `[ ↗ Abrir QR ]`) en [TallerOtDetalleView.vue](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/pwa/src/views/taller/TallerOtDetalleView.vue) y botón `[ 📄 Ficha QR ]` en [TallerHomeView.vue](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/ejecucion/pwa/src/views/taller/TallerHomeView.vue), visualizando documentos legales, certificaciones Bureau Veritas y especificaciones sin duplicar lógica.
  - **Medidores de Entrada y Salida (Doble Horómetro & Odómetro):**
    - Entrada: Tarjeta interactiva en OT para registrar lecturas de recepción (`horometro_grua_inicio`, `horometro_chasis_inicio`, `odometro_inicio`), endpoint backend `PUT /ots/:id/medidores-inicio` y botón `[ 💾 Guardar Medidores de Entrada ]`.
    - Cierre: Modal con captura obligatoria de `horometro_grua_cierre`, `horometro_chasis_cierre` y `odometro_cierre`, validando regla de no-regresión (`>= inicio`), estado resultante y firma supervisada con PIN FES. Sincronización automática con `tequ_equipo`.
  - **Inspección Visual 360° de Recepción:** Nueva pestaña `📸 Fotos 360° (X/6)` con 6 slots normalizados (Frente, Lateral Izquierdo, Lateral Derecho, Posterior, Tablero de Medidores, Pluma/Gancho), captura directa de cámara, miniaturas con visor modal a pantalla completa, eliminación y persistencia en Storage oficial.
  - **Compilación y Despliegue:** Vue CLI build completado con 0 errores, backend PM2 10 actualizado y desplegado en DEV (`https://servidor.leanglobal.cl/pwa-gsp-dev/`), certificado con HTTP 200 OK.
* [x] **9. Paridad Total Web/PWA Mantenimiento: Ficha QR, Medidores Entrada, Fotos 360, Nueva OTM y Avisos [REQ-1025 / SPEC-071 / Web v1.0.121 / PWA v1.0.38 / DEV & PROD]:**
  - **Aviso de Avería (PWA):** Normalización de `descripcion_sintoma` y `descripcion`, generación determinista de folio canónico `AV-YYYY-XXXX` y selector interactivo `v-autocomplete`.
  - **Nueva OTM General (PWA):** Implementación de `abrirNuevaOtModalGeneral()` con modal selector `v-autocomplete` conectado a `radarFlota` y precarga automática de horómetros/odómetro.
  - **Corrección Crítica Backend:** Normalización de los 27 placeholders en `mantenimientoModel.crearOt` y migración de `sistema_falla` a `VARCHAR(50)` en PostgreSQL DEV y PROD.
  - **Buscador de Flota (PWA):** Reemplazo de input plano por componente `v-autocomplete` con acciones directas (`[ 📄 Ficha QR ]`, `[ ➕ Abrir OT ]`, `[ ⏱️ Atender OT ]`).
  - **Paridad Total Consola Web Desktop (`MantenimientoView.vue`):** Panel interactivo de Medidores de Entrada con guardado en `PUT /ots/:id/medidores-inicio`, galería de 6 slots de Fotos 360° con zoom/eliminación y modal de Ficha QR oficial.
  - **Gobernanza y Despliegue:** Compilación limpia Vite (Web) y Vue CLI (PWA), despliegue en DEV certificado HTTP 200 OK, y sincronización en `tcfg_backlog` (`REQ-1025`) y `tcfg_releases` (`v1.0.121` y `v1.0.38`) en PostgreSQL DEV y PROD.
* [x] **10. Mantenimiento y Taller: Fotos 360°, Tareas Base en OTMs, Notificaciones RBAC y Parada de Máquina [REQ-1025 / SPEC-071 / PWA v1.0.39 / Web v1.0.122 / DEV]:**
  - **Fotos 360° Storage Resolver:** Integración de `resolverFotoUrl()` en ranuras fotográficas y visores modal de PWA (`TallerOtDetalleView.vue`) y Web (`MantenimientoView.vue`), corrigiendo la ruta relativa de la API y garantizando reactividad en asignación de ranuras.
  - **Tareas Base Estructuradas:** Inyección automática en `mantenimientoModel.crearOt` de las 4 tareas base obligatorias de taller para grúas en órdenes de trabajo sin pauta preventiva (evaluación diagnóstica, desarme, reparación y pruebas funcionales), impidiendo OTs vacías.
  - **Selector de Técnicos con Ordenamiento RBAC:** Enriquecimiento de `getTecnicos` para listar prioritariamente a mecánicos y técnicos de taller (`GSP_TALLER_EJEC`, `MECANICO`) con iconos descriptivos y categorías de rol.
  - **Notificaciones Omnicanal con Deep Link:** Despacho automático de Email y WhatsApp al mecánico asignado a una OT con enlace directo a la PWA (`/taller/ot/:id`).
  - **Alertas de Parada de Máquina:** Notificación omnicanal urgente (Email y WhatsApp) a los roles administradores (`Admin`, `GSP_ADMIN`, `OPERACIONES`) ante avisos con criticidad `PARADA_MAQUINA`.
  - **Erradicación de Solapamiento en Aviso de Avería:** Desacoplamiento de etiquetas y uso de `hide-details` en el modal de falla de la PWA.
  - **Gobernanza SemVer:** Sincronización independiente de versiones PWA `v1.0.39` y Web `v1.0.122` en `tcfg_releases` y `RELEASE_LOG.md`.
* [x] **11. Erradicación Transversal de Textos Montados y Upgrade Integral de Aviso de Falla [REQ-1026 / SPEC-071 / PWA v1.0.40 / Web v1.0.124 / DEV]:**
  - **Erradicación Transversal de Textos Montados (PWA):** Desacoplamiento total de etiquetas flotantes de Vuetify 3 (`v-autocomplete`, `v-select`, `v-text-field`, `v-textarea`) mediante etiquetas externas HTML (`<label class="block text-[11px] font-bold text-slate-300 uppercase mb-1">`) e inputs numéricos/textareas nativos estilizados. Se eliminó al 100% la colisión de labels con placeholders y valores pre-cargados (`0` en horómetros y odómetros) en los modales de "Nueva OT de Taller", "Reportar Aviso de Falla", "Escáner Manual" y "Cierre Supervisado PIN FES".
  - **Identidad del Usuario Reportante (Aviso de Falla):** Tarjeta visual en PWA con la identidad del usuario logueado (`profileStore.NOMBRE_USUARIO` / `localStorage.perfil`), inyección de `id_user` en el payload POST hacia `/api/mantenimiento/avisos`, persistencia en columna `tmnt_aviso.id_user_reporta` y resolución automática del nombre real del reportante en las notificaciones urgentes de WhatsApp y Email institucional.
  - **Carga de Evidencia Fotográfica en Terreno:** Integración de controles de captura con cámara directa (`capture="environment"`) y selector de galería en el modal de aviso de la PWA, subida asíncrona hacia `/v1/storage/upload` (`modulo: mantenimiento`, `tipo_doc: AVISO_FALLA`), galería de miniaturas previas con eliminación individual (`✕`), persistencia en columna `tmnt_aviso.fotos` (JSONB) e indicación de fotos adjuntas en el mensaje de alerta WhatsApp y correo.
  - **Paridad en Consola Web Desktop (`MantenimientoView.vue`):** Enriquecimiento de la tabla de "Bitácora de Avisos de Falla" con las columnas "Reportado Por" (con nombre del usuario y horómetro de la falla) y "Evidencias" (con miniaturas clicables que abren el visor a pantalla completa existente).
  - **Verificación Empírica y Despliegue en DEV:**
    - Compilación limpia de PWA Vue CLI (`npm run build`, exit code 0).
    - Compilación limpia de Consola Web Vite (`vite build`, exit code 0).
    - Despliegue en DEV (`/var/www/html/pwa-gsp-dev/` y `/var/www/html/lg-gsp-dev/`), certificados con HTTP 200 OK.
    - Prueba real en vivo de inserción de aviso con fotos, horómetro e `id_user=55`: confirmado despacho inmediato de Email institucional y WhatsApp descifrado con nombre del reportante y aviso de fotos adjuntas.

* [x] **12. Resolución Integral de Hallazgos con Evidencias Fotográficas Antes/Después y Sincronización en Detalle de OT [REQ-1027 / SPEC-072 / PWA v1.0.41 / Web v1.0.125 / DEV]:**
  - **Especificación Canónica:** Formalización en [.agents/specs/72_resolucion_hallazgos_evidencias_y_taller_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/72_resolucion_hallazgos_evidencias_y_taller_spec.md) del ciclo de vida integral de hallazgos en taller (detección, categorización de criticidad C1-C4, evidencias fotográficas antes/después y decisiones de ingeniería).
  - **Captura y Evidencias Fotográficas "Antes" (Detección):** Captura táctil en PWA y Consola Web, subida a Storage `/v1/storage/upload` y persistencia en columna `fotos` (JSONB) de `sch_leangsp.tmnt_hallazgo`.
  - **Visualización en Expediente de la OT (`MantenimientoView.vue`):** Enriquecimiento del subtab "Hallazgos en esta OT" con miniaturas fotográficas interactivas (evidencia antes y solución después), visor modal con zoom a pantalla completa y botón `[ 🛠️ Resolver Hallazgo ]`.
  - **Backend Model & Controller (`mantenimientoModel.js`):** Parseo determinista de `fotos` y `fotos_cierre` en `getOtById` y resolución de identidades `usuario_reporta` y `usuario_cierra`.
  - **Resolución Técnica Estructurada:** Modal interactivo con decisiones (`RESUELTO_EN_OT`, `OT_DERIVADA`, `BACKLOG`, `RESTRICCION_OPERACION`, `FUERA_DE_SERVICIO`), detalle de solución aplicada y carga de fotografías de término ("Después").
  - **Gobernanza SemVer y Despliegue:** Incremento de versiones (Web v1.0.125, PWA v1.0.41), documentación en `RELEASE_LOG.md` y sincronización en `tcfg_backlog` y `tcfg_releases`.

* [x] **13. Colaboración Universal, Visibilidad Multi-Usuario y Autoguardado en Nube de ITS Transición [REQ-1028 / SPEC-066 Master / Web v1.0.126 / DEV & PROD]:**
  - **Especificación Canónica Única:** Consolidación total de definiciones vigentes en [.agents/specs/66_its_transicion_maestro_integral_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/66_its_transicion_maestro_integral_spec.md) (SPEC-066 Master), unificando ingesta incremental, bóveda corporativa, tarifario maestro, flujo tripartito FES y colaboración sin restricciones locales.
  - **Autoguardado Inmediato en Servidor:** Creación automática de registro en `sch_leangsp.tits_transicion_historial` con estado `BORRADOR` al pulsar `[➕ Elaborar ITS]`, asociando el `id_usuario_elaborador` y su nombre legible.
  - **Trazabilidad en Matriz Operativa de Conciliación:** Visualización en vivo del nombre del elaborador (`👤 [Nombre Elaborador]`) en el badge de estado (`🟡 BORRADOR`) y botón `[✏️ Continuar]` accesible para todo el equipo operativo, jefaturas y contabilidad.
  - **Backend Controller Enriquecido:** Incorporación en `listarItsTransicion` de joins a `tsec_users` para resolver identidades de elaborador, verificador y aprobador, y persistencia de `nombre_elaborador` en `guardarItsTransicion`.
  - **Erradicación de Falsos Positivos Locales:** Eliminación del silenciamiento de errores en `guardarInformeConEstado` y centralización de observaciones en `data_json` de PostgreSQL.
  - **Gobernanza SemVer:** Incremento de versión Web a `v1.0.126`, documentación en `RELEASE_LOG.md` y compilación limpia Vite 0 errores.

* [x] **14. Asistente Automático de Migración de Informes Locales a la Nube [REQ-1029 / SPEC-066 Master / Web v1.0.127 / DEV & PROD]:**
  - **Especificación Canónica:** Incorporación en [.agents/specs/66_its_transicion_maestro_integral_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/66_its_transicion_maestro_integral_spec.md) (Capítulo 3.4) de la arquitectura de detección y migración asistida desde almacenamiento local hacia la base de datos central PostgreSQL.
  - **Respaldo Inmutable Preventivo:** Copia de seguridad automática en cliente (`its_transicion_historial_backup_seguridad`) antes de cualquier mutación de memoria.
  - **Detección Determinista:** Comparación reactiva entre datos de `localStorage` y el listado de producción del servidor (`/operaciones/its/transicion/list`).
  - **Banner Superior Intuitivo:** Visualización no invasiva con conteo de informes locales no compartidos, detalle de cotizaciones y botón `[ ☁️ Subir al Servidor Central ]`.
  - **Subida por Lotes:** Disparo secuencial de guardados vía `POST /operaciones/its/transicion/save` asociando costos, jornadas y elaborador, con refresco automático de la Matriz Operativa en vivo.
  - **Exportación de Respaldo JSON:** Descarga directa de archivo `.json` como salvaguarda complementaria.
  - **Gobernanza SemVer:** Incremento de versión Web a `v1.0.127`, documentación en `RELEASE_LOG.md` y compilación limpia Vite 0 errores.

* [x] **15. Tipificación y Edición Libre de Trayectos de Viaje en ITS Transición y Desacoplamiento DEV/PROD [REQ-1030 / SPEC-066 Master / Web v1.0.128 / DEV & PROD]:**
  - **Especificación Canónica:** Actualización formal de [.agents/specs/66_its_transicion_maestro_integral_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/66_its_transicion_maestro_integral_spec.md) (Sección 4.2) detallando la tipificación flexible y edición libre de tipos de servicio/viaje.
  - **Edición Libre y Datalist de Jornadas:** Sustitución del `<select>` rígido por un control combinado de input libre con `<datalist id="tipos-servicio-jornada-list">`, ofreciendo opciones de `Ida y Vuelta`, `Solo Ida`, `Solo Vuelta`, `Flete Ida y Vuelta`, `Flete Solo Ida`, `Flete Solo Retorno`, `Hora`, `Fijo` y `Standby`, admitiendo cualquier texto o concepto tarifario personalizado.
  - **Datalist de Horas de Traslado:** Vinculación de `<datalist id="conceptos-traslado-list">` para la selección rápida y edición abierta de trayectos de traslado (cama baja, tractos, choferes).
  - **Aislamiento y Compilación Desacoplada de Bundles:** Generación independiente de `dist_dev` (`build:dev` con base `/lg-gsp-dev/`) y `dist_prod` (`build` con base `/lg-gsp-prod/`), erradicando la redirección espuria que enviaba usuarios de DEV hacia PROD.
  - **Consolidación de Datos en Servidor:** Clonación segura de los 14 borradores de Yiara desde DEV a PROD (totalizando 19 registros en `sch_leangsp_prod.tits_transicion_historial`) para que estén disponibles inmediatamente para todos los usuarios.
  - **Gobernanza y Despliegue:** Registro formal en `tcfg_backlog` (`REQ-1030`), `tcfg_releases` (`1.0.128`), `RELEASE_LOG.md` y `package.json` (`v1.0.128`).

* [x] **16. Mejoras de Usabilidad en Estructurador CRM: Selector de Tonelaje (10T), Formato Monetario y Descripciones Limpias [REQ-633 / REQ-704 / REQ-735 / SPEC-074 / Web v1.0.129 / DEV & PROD]:**
  - **Especificación Canónica:** Formalización en [.agents/specs/74_usabilidad_estructurador_crm_tonelajes_formato_descripciones_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/74_usabilidad_estructurador_crm_tonelajes_formato_descripciones_spec.md) (SPEC-074).
  - **Selector de Tonelaje en Saltos de 10T (REQ-633):** Despliegue de capacidades canónicas de 10 en 10 Toneladas (40T a 400T) ordenadas numéricamente en `GestorOportunidades.vue`.
  - **Formato Monetario con Separador de Miles (REQ-704):** Adornador `$` y formateo reactivo en tiempo de tipeo con separador de miles (`es-CL`) en valor unitario Preventa y Operaciones.
  - **Descripciones Limpias y Validación Bloqueante (REQ-735):** Inicialización de líneas con descripción limpia (`''`), ensanchamiento de columna a 280px y validación obligatoria antes de guardar o cotizar.
  - **Gobernanza y Hard Gate:** Sincronización en `package.json` (`v1.0.129`), `RELEASE_LOG.md` y base de datos PostgreSQL (`tcfg_backlog` / `tcfg_releases`).

* [x] **17. Soporte Comercial CRM: Flexibilización de Viáticos, Camión Plataforma y Cotizador PDF Paramétrico [REQ-1031..REQ-1036 / SPEC-075 / Web v1.0.130 / DEV & PROD]:**
  - **Especificación Canónica:** Formalización en [.agents/specs/75_mejoras_soporte_cotizador_pensiones_traslados_y_pdf_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/75_mejoras_soporte_cotizador_pensiones_traslados_y_pdf_spec.md) (SPEC-075).
  - **Flexibilización de Viáticos y Alimentación en 1 Día (REQ-1031 / TSK-SOP-01):** Eliminación del bloqueo visual y forzado a `NA` en `comercial.pensiones` de `GestorOportunidades.vue`, permitiendo acordar y costear viáticos diarios.
  - **Incorporación de Camión Plataforma en Traslados (REQ-1032 / TSK-SOP-02):** Creación de subcategoría `CAMIÓN PLATAFORMA` (ID 905) bajo categoría `TRASLADOS` (99) y asignación reactiva de ramplas y camiones planos para plataformas y alzahombres.
  - **Prevención de Conflicto de Autocompletado del Navegador (REQ-1033 / TSK-SOP-03):** Blindaje de campos de búsqueda de cliente y contacto con `autocomplete="new-password"` y `data-lpignore="true"` para evitar borrado de teléfonos.
  - **Metadatos de Ejecutivo Comercial y Teléfono en PDF (REQ-1034 / TSK-COT-01):** Incorporación en el header PDF de la cotización del nombre del ejecutivo y fono de contacto directo resolviendo `tsec_users` / `crm.vendedor_nombre`.
  - **Parametrización y Branding Dinámico de Empresa Emisora (REQ-1035 / TSK-COT-02):** Corrección en `proyectoModel.js` para resolver `p.id_empresa` contra `tpar_empresas` y catálogo (Royal Rental `11`, Bestmaq `7`, Logística `8`, San Pablo `9`).
  - **Supresión de Régimen Urbano en Caso 5 (REQ-1036 / TSK-COT-03):** Ocultamiento de la cláusula urbana en el PDF para Caso 5 (Plataformas / Partidas Abiertas) y rotulación operacional de partidas especiales.
  - **Gobernanza y Hard Gate:** Versión `v1.0.130` en `package.json`, sincronización en `RELEASE_LOG.md` y registro en `sch_leangsp` / `sch_leangsp_prod` (`tcfg_backlog` y `tcfg_releases`).

* [x] **18. Módulo de Contrato de Arrendamiento y Formalización FES/Física en Preventa [REQ-1037 / TSK-COT-04 / Spec 16 / Web v1.0.131 / DEV & PROD]:**
  - **Especificación Canónica:** Formalización en [.agents/specs/16_crm_gestor_oportunidades_spec.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/specs/16_crm_gestor_oportunidades_spec.md) (Sección 15).
  - **Sustitución de Pestaña Bitácora & Alertas:** Eliminación de la 5ª pestaña inerte en `GestorOportunidades.vue` y creación de `CONTRATO & FORMALIZACIÓN`.
  - **Plantilla Multi-Empresa de 4 Páginas:** Generación del contrato oficial (Págs 1-3 Condiciones Generales con 14 cláusulas legales, Pág 4 Anexo Maquinaria y Condiciones Particulares) con logos y datos según emisor (Royal Rental `11`, San Pablo `9`, Bestmaq `7`, Logística `8`) y mandante.
  - **Motor HTML-to-PDF (`wkhtmltopdf`):** Compilación determinística sin Puppeteer utilizando `xvfb-run wkhtmltopdf` estándar de la plataforma.
  - **Firma Digital Móvil (Magic Link de 1 Solo Uso):** Generación de enlace con token criptográfico para firma en celular con el dedo (`FirmarContratoView.vue`: nombre, RUT, cargo, fecha, canvas táctil HTML5 y metadatos IP/timestamp de 72h).
  - **Firma Física / Impresa Tradicional:** Descarga de PDF pre-llenado y carga de documento escaneado/fotografiado.
  - **Gobernanza y Hard Gate:** Versión `v1.0.131` en `package.json`, sincronización en `RELEASE_LOG.md` y registro en `sch_leangsp` / `sch_leangsp_prod` (`tcfg_backlog` y `tcfg_releases`). Certificado en DEV y PROD con HTTP 200 OK.






