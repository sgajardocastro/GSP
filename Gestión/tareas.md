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
*   [ ] **[Jorge Ponce] Enviar borrador comercial:** Enviar el borrador del acuerdo comercial / Términos y Condiciones estándar en formato Word (texto simple).
*   [ ] **[Sergio Gajardo] Planificar reuniones:** Enviar una propuesta de agenda/invitación para reuniones de seguimiento periódicas (Lunes a las 11:00 AM y Jueves, además de un control extra los Miércoles).

**Reunión 20-Jul-2026 (Seguimiento Operativo):**
*   [ ] **[Sergio Gajardo] Configurar notificaciones:** Implementar el envío automático de cotizaciones desde el sistema configurando copias predeterminadas a los contactos pertinentes (Omar, Luis y Gisel).
*   [ ] **[Sergio Gajardo] Configurar credenciales:** Configurar el acceso al dominio corporativo para el login del sistema tras la creación de las credenciales de prueba.
*   [x] **[Sergio Gajardo] Agregar campos de facturación:** Incluir los campos de región, ciudad y dirección de facturación en el formulario de creación de clientes.
*   [x] **[Sergio Gajardo] Implementar buscador de direcciones:** Integrar un buscador de direcciones en el mapa dentro del módulo de cotizaciones para facilitar la ubicación de obras.
*   [x] **[Sergio Gajardo] Importar flota:** Realizar la carga de los datos de flota utilizando la información técnica disponible en el Drive (Base de datos y estructura de frontend integradas).
*   [ ] **[Sergio Gajardo] Compartir acceso Kanban:** Reenviar el enlace de acceso a la herramienta de gestión al equipo.
*   [x] **[Sergio Gajardo] Ajustar categorías:** Cambiar el nombre de familia a categoría y asegurar la correcta vinculación con la subcategoría dependiente en el estructurador.
*   [x] **[Sergio Gajardo] Ajustar etiquetas:** Reemplazar el término global por fijo y viaje por flete en las unidades de cobro, y renombrar el encabezado a "Unidad de cobro".
*   [x] **[Sergio Gajardo] Incluir geolocalización:** Incorporar la captura de coordenadas como datos generales del servicio.
*   [x] **[Sergio Gajardo] Optimizar Inputs de Template (photoCheck):** Transformar los comboBox de SI/NO a photoCheck en el template de Visita a Terreno para habilitar fotos y comentarios dinámicos.
*   [ ] **[Sergio Gajardo] Actualizar firma cliente:** Añadir espacios para el ingreso de identificación, nombre y firma manual del cliente en el bloque de firmas.
*   [ ] **[Jorge Ponce, Jesús] Crear manuales:** Crear manuales y videos instructivos para los módulos del sistema para facilitar el uso de los usuarios.
*   [ ] **[Jorge Ponce, Jesús] Recopilar datos técnicos:** Completar la información de tara y largo para los equipos mediante la revisión por patente.
*   [x] **[Jorge Ponce] Gestionar accesos:** Compartir el acceso a las carpetas de Drive de equipos y trabajadores con los colaboradores técnicos.
*   [x] **[Jorge Ponce] Solicitar accesos:** Solicitar a Dayana la autorización de acceso a las carpetas compartidas para los usuarios correspondientes.
*   [ ] **[Jorge Ponce] Enviar notas:** Remitir las observaciones discutidas, incluyendo cambios en el formulario de servicios, a través de correo electrónico.
*   [ ] **[Jesus] Apoyar carga de datos:** Colaborar en la carga manual de equipos en caso de que el proceso masivo presente complicaciones.

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
*   [ ] **[Consultas Desplazamiento/Inspección]:** Definir quién hace la inspección de salida y si se usará el formato de Jorge. Aclarar quién marca el inicio del viaje (Conductor/Rigger), si el desplazamiento se marcará por GPS (frecuencia), si hay inspección al llegar a destino, y si se inspecciona solo la grúa o todos los equipos (¿inspecciones autónomas?).
*   [x] **[Sergio Gajardo] Búsqueda por Dirección en Mapa [COMPLETADO]:** Investigar e implementar funcionalidad para buscar direcciones directamente en el componente del mapa de Google Maps.

**Definición de Roles & Notificaciones (Pendientes de Definición):**
*   [ ] **[Definición Global de Roles]:** Definir y levantar la matriz completa de roles para todo el proceso (Ventas, Cotizaciones, Visita a Terreno, Operaciones, Mantención e Izaje), mapeando permisos bajo la nomenclatura estándar LeanGlobal (`_ADMIN`, `_PROG`, `_EJEC`, `_APROB`).
*   [ ] **[Matriz de Notificaciones a Operaciones]:** Definir a qué roles y usuarios específicos se les debe notificar automáticamente al generarse un requerimiento a Operaciones (Candidatos a evaluar: Omar, Jorge, Coordinador de Operaciones).
*   [ ] **[Flujo y Roles Aprobación ➔ Asignación]:** Definir los roles y perfiles autorizados para realizar el paso formal de la aprobación del requerimiento a la asignación efectiva de recursos (equipos, operadores y rigger).
