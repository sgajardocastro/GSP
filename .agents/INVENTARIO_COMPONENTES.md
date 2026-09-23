# 📋 Inventario Oficial de Componentes y Servicios (GSP)

> **Regla Mandatoria de Gobernanza:**
> 1. Ningún servicio de Backend ni vista de Frontend se puede modificar, renombrar o eliminar sin antes actualizar su ficha técnica en este inventario con: incremento de versión, fecha del día y registro en el changelog.
> 2. Queda estrictamente prohibido dar de baja cualquier controlador o ruta sin realizar previamente una búsqueda cruzada (`grep`) en todo el frontend para verificar que no tenga llamadas activas.
> 3. Todo despliegue al servidor remoto debe contrastar que los módulos requeridos en `src/routes/index.js` existan físicamente en el servidor para evitar caídas por `MODULE_NOT_FOUND`.

---

## ⚙️ Backend Remoto (`lean-services-gsp`)
* **Ubicación local:** `ejecucion/backend_remoto/src/`
* **Ubicación servidor:** `/home/nodeadmin/proyectos/lean-services-gsp/src/`
* **Servicio PM2:** ID 10 (`lean-services-gsp`)

---

### 1. `visitaTerrenoController.js` / `visitaTerrenoRoutes.js`
* **Ruta Física:** `src/controllers/visitaTerrenoController.js` | `src/routes/visitaTerrenoRoutes.js`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-22`
* **Dominio / Alcance:** Preventa CRM (Site Visit). Solicitud de visita técnica en fase de cotización comercial, generación de tokens públicos temporales, despacho de correo al coordinador y asignación desde portal público.
* **Endpoints Expuestos (`/api/visitas`):**
  * `POST /api/visitas/solicitar/:id_proyecto` — Genera `token_visita`, guarda datos de contacto/obra en `crm_visita_terreno` y envía email al coordinador.
  * `GET /api/visitas/token/:token` — Obtiene metadatos de obra, contacto y proyecto para el formulario público de asignación.
  * `POST /api/visitas/token/:token/asignar` — Guarda asignación del técnico, crea survey y genera notificación.
  * `GET /api/visitas/proyecto/:id_proyecto` — Listado de visitas del proyecto.
  * `POST /api/visitas/asignar-web` — Asignación interna desde interfaz web.
  * `POST /api/visitas/:id_survey/reasignar` — Reasignación de técnico.
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-09-22)`: Restauración completa de rutas y controlador desde commit `f4964ef`. Registro en `routes/index.js`. Verificado 100% OK con HTTP 200 en E2E Proyecto 98.
  * `v1.0.0 (2026-08-20)`: Creación inicial del flujo público por token para visitas a terreno.

---

### 2. `surveyController.js` / `surveyRoutes.js`
* **Ruta Física:** `src/controllers/surveyController.js` | `src/routes/surveyRoutes.js`
* **Versión Actual:** `2.4.0`
* **Última Modificación:** `2026-09-12`
* **Dominio / Alcance:** Motor canónico de encuestas, checklists técnicos, Template 80 (Visita Técnica de Replanteo Operativo en fase de Verificación/Operaciones), Template 81 (Inspección de Patio), informes técnicos e inspecciones móviles PWA.
* **Endpoints Expuestos (`/api/survey`):**
  * `POST /api/survey` — Creación de encuestas/inspecciones (usado en Verificación de `GestorOportunidades.vue`).
  * `GET /api/survey/visitas-terreno` — Listado de inspecciones de terreno asociadas a proyectos.
  * `PUT /api/survey/UpdPlan/:id` — Reasignación de técnico ejecutor en terreno.
  * `GET /api/survey/:id` — Consulta de inspección individual y sus segmentos/atributos.
  * `PUT /api/survey/:id` — Actualización de ejecución de inspección.
* **Historial de Cambios (Changelog):**
  * `v2.4.0 (2026-09-12)`: Soporte para firma electrónica FES incrustada en encuestas.
  * `v2.3.0 (2026-09-02)`: Homologación de atributos para Template 80 en fase de Verificación técnica.

---

### 3. `usuarioController.js` / `usuarioRoutes.js` / `usuarioModel.js`
* **Ruta Física:** `src/controllers/usuarioController.js` | `src/routes/usuarioRoutes.js` | `src/models/usuarioModel.js`
* **Versión Actual:** `1.3.0`
* **Última Modificación:** `2026-09-22`
* **Dominio / Alcance:** Gestión de identidad, autenticación, control de operadores, enrolamiento FES, despacho y reenvío de invitaciones de firma electrónica.
* **Endpoints Expuestos (`/api/usuarios`):**
  * `GET /api/usuarios/enrolamiento/listar` — Lista usuarios enrolados y pendientes de firma electrónica.
  * `POST /api/usuarios/enrolamiento/masivo` — Carga masiva desde planilla Excel.
  * `POST /api/usuarios/enrolamiento/individual` — Invitación individual de enrolamiento.
  * `POST /api/usuarios/reenviarEnrolamiento` — [En especificación] Reenvío de enlace oficial a usuarios pendientes.
  * `GET /api/usuarios` — Catálogo general de usuarios y operadores activos.
* **Historial de Cambios (Changelog):**
  * `v1.3.0 (2026-09-22)`: Corrección de RUTs y activación de `flag_proc_enrol: true` con despacho exitoso a operadores Robert Rodriguez, Nicolas Ceballos y Humberto Contreras.
  * `v1.2.0 (2026-09-08)`: Implementación de carga masiva de enrolamiento desde Excel.

---

### 4. `patioController.js` / `patioRoutes.js`
* **Ruta Física:** `src/controllers/patioController.js` | `src/routes/patioRoutes.js`
* **Versión Actual:** `1.0.1`
* **Última Modificación:** `2026-09-22`
* **Dominio / Alcance:** Operaciones de Patio. Checklist autónomo de salida de grúas en portón, catálogo de flota activa autocompletable.
* **Endpoints Expuestos (`/api/patio`, `/api/operaciones/patio`):**
  * `GET /api/patio/equipos` — Catálogo de flota activa para selector autocompletable.
  * `POST /api/patio/iniciar` — Iniciar inspección de patio con Template 81 pre-cargado.
* **Historial de Cambios (Changelog):**
  * `v1.0.1 (2026-09-22)`: Sincronización y despliegue físico al servidor remoto para estabilizar PM2.
  * `v1.0.0 (2026-08-28)`: Implementación inicial de inspección de patio (Spec 44).

---

### 5. `viajeController.js` / `viajeRoutes.js`
* **Ruta Física:** `src/controllers/viajeController.js` | `src/routes/viajeRoutes.js`
* **Versión Actual:** `1.2.0`
* **Última Modificación:** `2026-09-18`
* **Dominio / Alcance:** Logística y Despacho de Convoy. Bitácora de viaje por etapas (Salida de Patio, Llegada a Obra, Salida de Obra, Regreso a Patio), registro de odómetro y combustible.
* **Endpoints Expuestos (`/api/viajes`, `/api/operaciones/viaje`):**
  * `GET /api/viajes/proyecto/:id_proyecto` — Estado del convoy del proyecto.
  * `POST /api/viajes/iniciar` — Despacho e inicio de viaje.
  * `PUT /api/viajes/:id/hito` — Registro secuencial de hitos y odómetro.
* **Historial de Cambios (Changelog):**
  * `v1.2.0 (2026-09-18)`: Integración de captura de combustible por hito (Spec 49).

---

### 6. `proyectoController.js` / `proyectoRoutes.js`
* **Ruta Física:** `src/controllers/proyectoController.js` | `src/routes/proyectoRoutes.js`
* **Versión Actual:** `1.5.0`
* **Última Modificación:** `2026-09-15`
* **Dominio / Alcance:** CRM Comercial, etapas de cotización, matriz de recursos requeridos, gestión de obras y clientes.
* **Endpoints Expuestos (`/api/proyectos`):**
  * `GET /api/proyectos` — Listado de oportunidades y proyectos.
  * `POST /api/proyectos` — Creación de oportunidades comerciales.
  * `PUT /api/proyectos/:id` — Actualización de etapas y parámetros comerciales.
  * `GET /api/proyectos/:id/resumen-economico` — Cierre económico y cálculo de márgenes.
* **Historial de Cambios (Changelog):**
  * `v1.5.0 (2026-09-15)`: Adaptación de filtros comerciales y soporte de restricción por creador (`id_user_creacion`).

---

### 7. `acreditacionController.js` / `acreditacionRoutes.js`
* **Ruta Física:** `src/controllers/acreditacionController.js` | `src/routes/acreditacionRoutes.js`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-07`
* **Dominio / Alcance:** Acreditación de personal y equipos en faenas mineras e industriales. Gestión de matrices documentales (`tsec_certificados_persona`).
* **Endpoints Expuestos (`/api/acreditaciones`):**
  * `GET /api/acreditaciones/persona/:id_persona` — Documentos y vigencias de operador.
  * `POST /api/acreditaciones/subir` — Carga de certificados y diplomas.
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-09-07)`: Soporte multi-proyecto para asignaciones 74 y 97.

---

### 8. `itsController.js` / `itsRoutes.js`
* **Ruta Física:** `src/controllers/itsController.js` | `src/routes/itsRoutes.js`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-10`
* **Dominio / Alcance:** Informes Técnicos de Servicio (ITS), firmas de conformidad de cliente y horas de operación.
* **Endpoints Expuestos (`/api/its`, `/api/operaciones/its`):**
  * `POST /api/its/crear` — Emisión de nuevo ITS.

---

## 🖥️ Frontend Web (`ejecucion/frontend`)
* **Ubicación local:** `ejecucion/frontend/src/`
* **Puerto de Desarrollo:** `5173` (Vite)
* **Destino de Compilación:** `dist/`

---

### 1. `GestorOportunidades.vue`
* **Ruta Física:** `src/views/CRM/GestorOportunidades.vue`
* **Versión Actual:** `1.0.47`
* **Última Modificación:** `2026-09-23`
* **Dominio / Alcance:** Componente central del CRM comercial. Gestiona:
  1. Pipeline de etapas de cotización (Ingreso, Preventa, Verificación, Oferta, Cierre).
  2. Solicitud de Visita a Terreno en Preventa (`POST /api/visitas/solicitar/:id` - Límite línea 12084).
  3. Asignación y Reasignación de Visita Técnica en Verificación (`POST /api/survey` y `PUT /api/survey/UpdPlan/:id` - Líneas 8572-8740).
  4. Cierre económico, órdenes de compra y facturación.
  5. Trazabilidad e identificación del Ejecutivo Comercial creador (`tpry_proyecto.id_usuario_creacion`).
* **Servicios que Consume:** `/api/proyectos`, `/api/visitas`, `/api/survey`, `/api/viajes`, `/api/its`, `/api/usuarios`
* **Historial de Cambios (Changelog):**
  * `v1.0.47 (2026-09-23)`: Visibilidad Universal del Ejecutivo Comercial (Spec 16 - Sección 12). Badge fijo `👤 [Ejecutivo: Nombre]` en la cabecera del requerimiento, campo informativo en Sección 1 Datos de la Oportunidad, hidratación canónica de `tpry_proyecto.id_usuario_creacion`, resolución de nombres contra `tsec_users` (`name_frst` + `apellido_pat`) y persistencia inmutable obligatoria (jamás `null`).
  * `v1.0.46 (2026-09-22)`: Integración del Despacho Dual (Correo + WhatsApp Oficial) en botón "Autorizar Salida & Notificar Viaje" (`autorizarSalidaEquipo`). Resuelve teléfono móvil del operador asignado (`+56936483259` para Sergio Gajardo), formatea el payload de Hoja de Ruta para Baileys y despacha a `https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/enviar` en simultáneo con el correo SMTP, registrando traza en auditoría.
  * `v1.0.45 (2026-09-22)`: Homologación y pre-población de fechas planificadas en Asignación de Recursos OT: `obtenerFechasComercialesDefecto` extrae por defecto `siteVisit.fecha_hora_inicio` y `siteVisit.fecha_hora_termino` hacia `Salida Base` y `Término Faena` (`operacionesAssignment`), con propagación automática a líneas de equipos, traslados y especialistas de terreno.
  * `v1.0.44 (2026-09-22)`: Blindaje del valor cotizado en Verificación Operaciones: anclaje de `totalNetoComercial` y subtotales de líneas originales a `snapshotComercial`, forzado a $0 de líneas nuevas añadidas por Operaciones (`calcularSubtotalOperaciones`), y resaltado visual en rojo de filas y campos para nuevos elementos operativos (`!isOriginalLine`).
  * `v1.0.43 (2026-09-22)`: Conexión reactiva directa de tarjetas del estructurador (Casos 1, 2, 3 y 4) vía `seleccionarYAplicarCaso` para inyectar inmediatamente las 1, 2 ó 3 líneas según contexto urbano/rural y contrapesos.
  * `v1.0.42 (2026-09-22)`: Confirmación de compatibilidad con `/api/visitas` restaurado.
  * `v1.0.41 (2026-09-21)`: Integración modal WhatsApp despacho convoy.
  * `v1.0.36 (2026-09-09)`: Stepper de cierre económico ITS/EDP/OC/DTE.

---

### 2. `MantenedorEnrolamiento.vue`
* **Ruta Física:** `src/components/mantenedores/MantenedorEnrolamiento.vue`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-22`
* **Dominio / Alcance:** Mantenedor administrativo de usuarios para firma electrónica simple (FES). Permite ver el estado de enrolamiento, invitar individualmente y cargar masivamente desde Excel.
* **Servicios que Consume:** `/api/usuarios/enrolamiento/listar`, `/api/usuarios/enrolamiento/masivo`
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-09-22)`: [En implementación] Incorporación de botón `[ ✉️ Reenviar ]` para usuarios con `flag_proc_enrol: true`.
  * `v1.0.0 (2026-08-08)`: Creación de interfaz con soporte para carga Excel drag & drop.

---

### 3. `AsignacionVisita.vue`
* **Ruta Física:** `src/views/AsignacionVisita.vue`
* **Versión Actual:** `1.0.2`
* **Última Modificación:** `2026-08-25`
* **Dominio / Alcance:** Portal público para coordinadores de faena. Permite ingresar con el token temporal (`/asignar-visita/:token`), seleccionar el inspector/técnico y agendar la fecha de visita.
* **Servicios que Consume:** `/api/visitas/token/:token`, `/api/visitas/token/:token/asignar`
* **Historial de Cambios (Changelog):**
  * `v1.0.2 (2026-08-25)`: Validación de expiración de token y prellenado de datos de faena.

---

### 4. `verSurveyPrint.vue`
* **Ruta Física:** `src/pages/verSurveyPrint.vue`
* **Versión Actual:** `1.4.0`
* **Última Modificación:** `2026-07-31`
* **Dominio / Alcance:** Renderizador y generador de reportes imprimibles / PDF para inspecciones técnicas, Template 80 y visitas a terreno.
### 5. `Torre.vue`
* **Ruta Física:** `src/views/Torre.vue`
* **Versión Actual:** `1.2.1`
* **Última Modificación:** `2026-09-23`
* **Dominio / Alcance:** Tablero Kanban principal de la Torre de Control Operativa y Comercial. Renderiza las tarjetas de proyectos en sus 6 columnas canónicas (Preventa, Verificación, Asignación, Preparación, Ejecución, Completados), cálculo dinámico de montos por tarjeta, semáforos de acreditación y accesos rápidos al CRM.
* **Servicios que Consume:** `/api/proyectos`, `/api/usuarios`
* **Historial de Cambios (Changelog):**
  * `v1.2.1 (2026-09-23)`: Visibilidad Universal del Ejecutivo en las 6 Columnas Kanban (Spec 16 - Sección 12). Despliegue de `👤 [Nombre Ejecutivo]` en todas las tarjetas operativas, soporte para `id_usuario_creacion` canónico de PostgreSQL y resolución de nombres vía concatenación `name_frst` + `apellido_pat`.
  * `v1.2.0 (2026-09-23)`: Implementación del Buscador Omnibox Reactivo en la cabecera del Tablero Kanban (Spec 16 - Sección 11). Filtrado concurrente multi-criterio en tiempo real por N° Cotización/Código, Cliente, Vendedor (resuelto vía `/api/usuarios`), Obra/Faena y Recursos asignados (patente/operador). Badge reactivo de totalización de coincidencias, botón de reseteo rápido (`Esc`) y micro-badge de Vendedor en tarjetas de Preventa.
  * `v1.0.0 (2026-08-15)`: Implementación de tablero Kanban de Torre de Control.

---

### 6. `Login.vue` (PWA)
* **Ruta Física:** `ejecucion/pwa/src/views/Login.vue`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-22`
* **Dominio / Alcance:** Pantalla de acceso a la PWA móvil de Operaciones GSP. Autenticación exclusiva mediante Google SSO (GIS) para cuentas corporativas `@arriendosanpablo.cl` y correos de operadores autorizados `@gmail.com`.
* **Servicios que Consume:** `/api/auth/login-google`, `/api/servicio/leanglobal/obtenerUsuariosRoles`
* **Historial de Cambios (Changelog):**
  * `v1.1.0 / PWA v1.0.25 (2026-09-22)`: Incremento de versión de release PWA a `1.0.25` en `package.json`. Actualización del Client ID oficial de Google a `900336188439-v2jr120b65dcvbi5j26kst05ldl73uou.apps.googleusercontent.com` (GSP). Erradicación del formulario obsoleto de usuario/contraseña, dejando Google Sign-In como único mecanismo de acceso, con feedback visual reactivo de error y soporte offline.
  * `v1.0.0 (2026-08-01)`: Versión inicial PWA con soporte offline y login mixto.

---

### 7. `ViajeConductor.vue` (Hoja de Ruta y Despacho Móvil)
* **Ruta Física:** `ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue`
* **Versión Actual:** `1.1.1`
* **Última Modificación:** `2026-09-22`
* **Dominio / Alcance:** Interfaz móvil para conductores y operadores en terreno (`/viaje/:token`). Gestiona:
  1. Paso 1 (Salida de Base): Registro de Odómetro inicial, Horómetro inicial, foto de tablero y firma digital FES mediante PIN de 4 dígitos.
  2. Paso 2 (En Ruta): Telemetría en vivo, pings GPS cada 10s y rendición de combustible Copec.
  3. Paso 3 (Llegada a Faena): Confirmación de arribo y cierre de trayecto.
  4. Paso 4 (Report Diario Multi-Día): Reportes correlativos por jornada con horas máquina, colación y firma táctil del mandante (Spec 49).
* **Servicios que Consume:** `/api/operaciones/viaje/:token`, `/api/operaciones/viaje/:token/salida`, `/api/operaciones/viaje/:token/llegada`, `/api/operaciones/viaje/:token/combustible`, `/api/operaciones/viaje/:token/ping`, `/api/operaciones/report/guardar`
* **Historial de Cambios (Changelog):**
  * `v1.1.1 (2026-09-22)`: Homologación arquitectónica de emisión de Report Diario hacia el endpoint canónico `/api/operaciones/report/guardar`. Se desacopla de ruta ficticia y se garantiza persistencia directa en `tedp_reporte_avance` con vinculación de `id_proyecto`, `id_equipo`, `id_user_operador`, horómetros, horas facturables y firma táctil del mandante. Normalización en `viajeOfflineSync.js` para mutaciones offline `CREAR_REPORTE_DIARIO` pendientes en IndexedDB.
  * `v1.1.0 (2026-09-22)`: Pre-llenado de Odómetro y Horómetro por defecto para evitar botones bloqueados en móviles. Incorporación de feedback visual reactivo con indicadores de requisitos (`✓` / `⚠️`) para Odómetro, Horómetro y PIN (X/4). Sustitución del bloqueo rígido `:disabled` por validación interactiva que notifica explícitamente qué campos faltan si se pulsa el botón antes de tiempo.
  * `v1.0.0 (2026-09-21)`: Versión inicial con soporte offline-first y los 5 estados de operación.

---

## 🔒 Reglas Anti-Regresión y Verificación

1. **Protocolo Cross-Grep Pre-Deprecación:**
   Antes de borrar o renombrar cualquier archivo de ruta o controlador en el backend, se debe ejecutar:
   ```bash
   grep -rnw "ejecucion/frontend/src" -e "<nombre_del_endpoint>"
   ```
   Si existen coincidencias, el endpoint NO puede ser eliminado bajo ninguna circunstancia.

2. **Protocolo de Verificación de Módulos en Despliegue:**
   Antes de reiniciar PM2 tras modificar `src/routes/index.js`, se debe verificar que todos los archivos requeridos (`require('./...Routes.js')`) existan en `/home/nodeadmin/proyectos/lean-services-gsp/src/routes/`.
