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

---

### Fase 10: Migración WMS-Lite e Inspecciones/OTs (Evolucionado a Spec 48 - Conv. `841d80bf-22f4-45cc-b03c-e1cf54b1019c` / IDE)
*(Reemplaza Specs 17 y 18 por `.agents/specs/48_inventario_mantenimiento_v2_spec.md`. Estrategia aprobada 21-Sep: Mantenimiento OTs primero sobre flota existente `tequ_equipo`, desacoplando WMS-Lite para una segunda etapa).*
*   [x] **[Análisis Funcional Legacy]:** Recuperar blueprint funcional de Global Manager (`index.html`), estructurando campos, reglas de negocio duras (OC requerida, costo > 0, PIN de cierre) y roles de ejecutor.
*   [x] **[Integración Maestro de Flota]:** Confirmar reutilización y consumo directo del módulo de Flota/Equipos (`tequ_equipo`) ya implementado y activo en GSP (sin re-diseño redundante).
*   [x] **[Consolidación Spec 48]:** Especificación formal `.agents/specs/48_inventario_mantenimiento_v2_spec.md` (Catálogo SKU `{FAM}-{MAR}-{ID:04d}`, Existencia unitaria por lote con QR térmico $50 \times 30$ mm, Matriz de criticidad combinada, Ciclo OTs con costeo cuatripartito y cierre PIN supervisor).
*   [x] **[Primer Approach UI Frontend]:** Estructuración de 6 vistas Vue 3 (`MantenimientoView.vue`, `ProductosView.vue`, `BodegasView.vue`, `AlertasQuiebresView.vue`, `DespachoConsumoView.vue`, `RecepcionMaterialesView.vue`).
*   [ ] **[Etapa 1 - Mantenimiento OTs]:** Backend y UI para gestión de OTs de Flota GSP (`tmnt_ot`, `tmnt_ot_actividad`, `tmnt_ot_hh`, `tmnt_ot_cierre`), costos HH, servicios externos y cierre seguro con PIN.
*   [ ] **[Etapa 2 - WMS-Lite e Inventario]:** Modelos `tinv_bodega`, `tinv_producto`, `tinv_existencia`, trazabilidad QR térmico y alertas de reposición.

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
  - **Filtro Inclusivo con Separador y Aviso de Mayor Capacidad:** Selector de grúas estructurado en `<optgroup>` doble (`🎯 Equipos Sugeridos (Compromiso Comercial)` vs `🚜 Flota Alternativa / Mayores Prestaciones`) con alerta informativa tipo badge ante selección de mayor tonelaje respaldando la tarifa pactada.

* [x] **[Hotfix Operacional Marcha Blanca - Depuración Especialistas y Resolución Operador Despacho - REQ-018 / v1.0.63 / Spec 56]:**
  - **Purga Implacable de Prevencionista:** Descarte absoluto de cualquier registro de Prevencionista de Riesgos en `especialistasTerreno` (incluso con `id_user` histórico en BD) si la oportunidad no exige prevención (`requiere_prevencionista !== true`).
  - **Eliminación de Rigger Redundante en Sección 3:** Exclusión total del cargo Rigger de la Sección 3 (*Especialistas & Personal Técnico en Terreno*); el Rigger vive única y exclusivamente en la Grúa Principal bajo el Operador.
  - **Resolución de Nombre del Operador en Despacho:** Vinculación directa de `getOperadorAsignadoAEquipo` con `linesEquiposPrincipales` y cruce con el catálogo `usuarios.value`, corrigiendo la etiqueta que mostraba *"Sin Operador Asignado"* pese a tener semáforo verde.





