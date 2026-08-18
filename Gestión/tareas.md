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
*   [ ] **[Sergio Gajardo] Formato PDF Impresión de OT:** Diseñar el layout de impresión física de la OT con mapa, firma física de cliente y códigos QR de acreditación.
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


---

### Fase 10: Migración WMS-Lite e Inspecciones/OTs (Herencia Global Manager - Conv. `841d80bf-22f4-45cc-b03c-e1cf54b1019c`)
*(Vinculado a la referencia funcional de Global Manager en `presentaciones/index.html` y especificaciones Spec-Driven `17_wms_inventario_spec.md` y `18_mantenimiento_ots_spec.md`)*
*   [x] **[Análisis Funcional Legacy]:** Recuperar blueprint funcional de Global Manager (`index.html`), estructurando campos, reglas de negocio duras (OC requerida, costo > 0, PIN de cierre) y roles de ejecutor.
*   [x] **[Integración Maestro de Flota]:** Confirmar reutilización y consumo directo del módulo de Flota/Equipos (`tequ_equipo`) ya implementado y activo en GSP (sin re-diseño redundante).
*   [x] **[Especificaciones Spec-Driven]:** Formalizar las especificaciones `.agents/specs/17_wms_inventario_spec.md` (RF-WMS-01 a 07) y `.agents/specs/18_mantenimiento_ots_spec.md` (RF-MNT-01 a 06).
*   [ ] **[RF-WMS-01/02] Backend WMS-Lite:** Implementar modelos de datos PostgreSQL `tinv_bodega`, `tinv_producto`, `tinv_existencia` y restricciones duras HTTP 422 (`COSTO_CERO_NO_PERMITIDO`, `OC_REQUERIDA`).
*   [ ] **[RF-WMS-03/04] Endpoints REST & Traspasos:** Desarrollar controladores Node.js para movimientos de stock, estados `EN_TRANSITO` y despacho por escaneo de código de barras a OTs.
*   [ ] **[RF-WMS-05/06] UI WMS-Lite Consola GSP:** Construir vistas Vue 3 de Bodegas, Catálogo de Productos, Registro de Existencias y Alertas de Stock Mínimo.
*   [ ] **[RF-MNT-01/02] Backend Mantenimiento OTs:** Implementar tablas `tmnt_ot`, `tmnt_ot_actividad`, `tmnt_ot_hh`, `tmnt_ot_cierre` y triggers de BD/API (`EQUIPO_CON_OT_ACTIVA`, `OT_CON_ACTIVIDADES_PENDIENTES`).
*   [ ] **[RF-MNT-03/04] Cierre OT con PIN 4 Dígitos:** Implementar flujo seguro de firma digital de cierre de OT mediante hash de PIN de supervisor e imputación automática de repuestos, HH y servicios externos.
*   [ ] **[RF-MNT-05/06] UI Mantenimiento Consola GSP:** Construir panel Kanban y Ficha de OT con checklist reactivo, imputaciones de HH/repuestos y modal de cierre con PIN.

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
* [ ] Falta el tratamiento de acreditaciones por comercial post asignación.
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
* [ ] **[Mejora UX Asignación de Recursos]:** Optimizar la experiencia de usuario (UX/UI) en la asignación de equipos y tripulación en la Torre de Control / Gestor de Oportunidades.

