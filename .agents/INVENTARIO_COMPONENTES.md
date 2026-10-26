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
* **Versión Actual:** `1.2.0`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Preventa CRM (Site Visit). Solicitud de visita técnica en fase de cotización comercial, generación de tokens públicos temporales, despacho de correo al coordinador y asignación desde portal público. Integración con `notificacionService.js` para deep linking directo PWA e inspecciones técnicas.
* **Endpoints Expuestos (`/api/visitas`):**
  * `POST /api/visitas/solicitar/:id_proyecto` — Genera `token_visita`, guarda datos de contacto/obra en `crm_visita_terreno` y envía email al coordinador.
  * `GET /api/visitas/token/:token` — Obtiene metadatos de obra, contacto y proyecto para el formulario público de asignación.
  * `POST /api/visitas/token/:token/asignar` — Guarda asignación del técnico, crea survey y genera notificación dual Email + WhatsApp con deep link canónico PWA `/#/inspeccion?id_survey=XX`.
  * `GET /api/visitas/proyecto/:id_proyecto` — Listado de visitas del proyecto.
  * `POST /api/visitas/asignar-web` — Asignación interna desde interfaz web.
  * `POST /api/visitas/:id_survey/reasignar` — Reasignación de técnico con deep link PWA.
* **Historial de Cambios (Changelog):**
  * `v1.2.0 (2026-09-24)`: Reemplazo de links genéricos por deep links contextuales hacia la PWA (`/#/inspeccion?id_survey=XX`) vía `notificacionService.js` (Spec 52) con despacho omnicanal Email + WhatsApp.
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

### 5. `viajeController.js` / `viajeRoutes.js` / `viajeModel.js`
* **Ruta Física:** `src/controllers/viajeController.js` | `src/routes/viajeRoutes.js` | `src/models/viajeModel.js`
* **Versión Actual:** `1.3.0`
* **Última Modificación:** `2026-09-25`
* **Dominio / Alcance:** Logística y Despacho de Convoy. Bitácora de viaje por etapas, registro de odómetro, combustible multi-estanque (`combustible_salida`, `combustible_llegada` en JSONB). Vinculación con estructurador comercial y handoff automático de hitos de traslado.
* **Endpoints Expuestos (`/api/viajes`, `/api/operaciones/viaje`):**
  * `GET /api/viajes/proyecto/:id_proyecto` — Estado del convoy del proyecto.
  * `POST /api/viajes/iniciar` — Despacho e inicio de viaje.
  * `PUT /api/viajes/:id/hito` — Registro secuencial de hitos y odómetro.
  * `POST /api/operaciones/viaje/:token/salida` — Salida con odómetro, horómetro y combustible multi-estanque.
  * `POST /api/operaciones/viaje/:token/llegada` — Llegada con combustible multi-estanque, fotos de marcadores y handoff a estructurador.
* **Historial de Cambios (Changelog):**
  * `v1.3.0 (2026-09-25)`: Registro de combustible multi-estanque en JSONB. Handoff automático de traslado a estado `CUMPLIDO` en estructurador comercial (`lineas_servicio` de la OT) con inyección automática de jornada en Report Diario (`tedp_reporte_avance`) e ITS (`tits_jornada_detalle`) como `Flete Solo Ida` sin digitación manual. Lectura de `pisoMinimo` desde el estructurador en `viajeModel.js` (Spec 54).
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
* **Versión Actual:** `1.2.0`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Informes Técnicos de Servicio (ITS), firmas de conformidad de cliente y horas de operación. Notificación omnicanal de V°B° jefatura y recepción contable.
* **Endpoints Expuestos (`/api/its`, `/api/operaciones/its`):**
  * `POST /api/its/crear` — Emisión de nuevo ITS.
* **Historial de Cambios (Changelog):**
  * `v1.2.0 (2026-09-24)`: Integración con `notificacionService.js` (Spec 52). Deep links canónicos `/crm?id_proyecto=...&subtab=liquidacion&paso=its` y `paso=factura` para V°B° de Jefatura y Contabilidad, con despacho dual Email + WhatsApp.
  * `v1.1.0 (2026-09-10)`: Versión previa de cálculo de horas y firmas.

---

### 9. `notificacionService.js` (Servicio Canónico Omnicanal LeanGlobal)
* **Ruta Física:** `src/services/notificacionService.js`
* **Versión Actual:** `1.0.0`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Servicio centralizado de despacho de notificaciones omnicanal (Email SMTP + WhatsApp Baileys en puerto 3085) con generación de deep links contextuales hacia Web y PWA. Gobierna la sanitización telefónica E.164, resolución de URLs canónicas multi-entorno (DEV/PROD) y fallback resiliente.
* **Métodos Principales:**
  * `resolverUrls()` — Retorna `BASE_URL_WEB` y `BASE_URL_PWA` según `NODE_ENV`.
  * `sanitizarTelefono(raw)` — Normaliza números chilenos/internacionales al estándar E.164.
  * `enviarWhatsApp({ telefono, mensaje })` — Despacho HTTP hacia `http://127.0.0.1:3085/enviar`.
  * `enviarEmail({ to, subject, html })` — Envoltura SMTP corporativa vía `MessageModel.js`.
  * `despacharNotificacion({ evento, canal, destinatario, datos })` — Orquestador omnicanal unificado.
* **Historial de Cambios (Changelog):**
  * `v1.0.0 (2026-09-24)`: Creación inicial bajo el estándar `leanglobal_notification_standard` y `Spec 52`. Soporte para los 11 eventos canónicos del ciclo operativo/comercial.

---

### 10. `estadoPagoController.js` / `estadoPagoRoutes.js`
* **Ruta Física:** `src/controllers/estadoPagoController.js` | `src/routes/estadoPagoRoutes.js`
* **Versión Actual:** `1.3.0`
* **Última Modificación:** `2026-10-26`
* **Dominio / Alcance:** Ciclo integral de liquidación y prefacturación (EDP), circuito de 3 firmas electrónicas FES (`edp_flujo_v1`), integración de OCs cliente/proveedor, soporte de facturación multi-DTE y agregador de métricas para la Perspectiva Contabilidad (`SPEC-100` y `SPEC-101`).
* **Endpoints Expuestos (`/api/operaciones/edp`):**
  * `POST /api/operaciones/edp/parsear-dte-pdf` — Extracción determinista de metadatos desde archivos PDF de facturas (Laudus ERP / Portal SII).
  * `POST /api/operaciones/edp/proyecto/:id/soporte-documental` — Registro de OCs mandante y agregación de facturas DTE con recálculo dinámico de cuenta corriente.
  * `DELETE /api/operaciones/edp/proyecto/:id/dte/:folio` — Desvinculación de factura DTE y restitución de saldo pendiente.
  * `GET /api/operaciones/edp/perspectiva-contabilidad` — Consolidado de las 5 variables financieras, semáforos contables, sábanas de horas y ventas por equipo.
  * `GET /api/operaciones/edp/proyecto/:id/pdf` — Emisión y streaming del PDF oficial timbrado del Estado de Pago con carátula y 3 firmas FES.
* **Historial de Cambios (Changelog):**
  * `v1.3.0 (2026-10-26)`: Incorporación de endpoints para análisis automático de facturas PDF (`parsear-dte-pdf`), gestión de soporte multi-factura y soporte de cuenta corriente (Spec 101 / REQ-1070).
  * `v1.2.0 (2026-10-25)`: Endpoint agregador `getPerspectivaContabilidad` para consolidar las 5 etapas financieras del embudo E2E (Spec 100 / REQ-1069).
  * `v1.1.0 (2026-10-24)`: Circuito de 3 firmas FES (`firmar-paso`) y desacoplamiento estructural de ITS (Spec 99 / REQ-1068).

---

### 11. `dtePdfParserService.js` (Motor Parser Determinista de Facturas DTE)
* **Ruta Física:** `src/services/dtePdfParserService.js`
* **Versión Actual:** `1.0.0`
* **Última Modificación:** `2026-10-26`
* **Dominio / Alcance:** Servicio determinista para descompresión de streams RFC 1951 (`zlib.inflateSync`) y extracción estructurada de campos tributarios y operacionales de facturas emitidas por Laudus ERP (`52.004.162-1` Grúas San Pablo) y Portal SII MIPYME (`76.209.534-3` Bestmaq, `76.218.576-8` Logística del Sur, `78.254.535-3` Royal Rental). 0 dependencias externas pesadas ni OCR.
* **Métodos Principales:**
  * `parsearFacturaDtePdf(pdfBuffer, nombreArchivo)` — Procesa el buffer binario y retorna `{ folio_dte, fecha_emision, monto_neto, monto_iva, monto_total, empresa_facturadora, ... }`.
* **Historial de Cambios (Changelog):**
  * `v1.0.0 (2026-10-26)`: Creación canónica bajo Spec 101 (REQ-1070) con certificación 100% exitosa sobre facturas reales de las 4 empresas del holding.

---

## 🖥️ Frontend Web (`ejecucion/frontend`)
* **Ubicación local:** `ejecucion/frontend/src/`
* **Puerto de Desarrollo:** `5173` (Vite)
* **Destino de Compilación:** `dist/`

---

### 1. `GestorOportunidades.vue`
* **Ruta Física:** `src/views/CRM/GestorOportunidades.vue`
* **Versión Actual:** `1.0.52`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Componente central del CRM comercial. Gestiona:
  1. Pipeline de etapas de cotización (Ingreso, Preventa, Verificación, Oferta, Cierre).
  2. Solicitud de Visita a Terreno en Preventa (`POST /api/visitas/solicitar/:id` - Límite línea 12084).
  3. Asignación y Reasignación de Visita Técnica en Verificación (`POST /api/survey` y `PUT /api/survey/UpdPlan/:id` - Líneas 8572-8740).
  4. Cierre económico, órdenes de compra y facturación.
  5. Trazabilidad e identificación del Ejecutivo Comercial creador (`tpry_proyecto.id_usuario_creacion`).
  6. Consumo contextual de deep linking (`id_proyecto`, `subtab`, `paso`) activando vistas directas en Operaciones y Liquidación/ITS.
* **Servicios que Consume:** `/api/proyectos`, `/api/visitas`, `/api/survey`, `/api/viajes`, `/api/its`, `/api/usuarios`, `/api/backlog`
* **Historial de Cambios (Changelog):**
  * `v1.0.52 (2026-09-24)`: Desacoplamiento total del despacho de viaje de la inspección de pre-uso en Subpestaña 5 "Control de Flota & Despacho". Botón directo `[ 🚀 Despachar Viaje ]` en cabecera de cada equipo asignado, desbloqueo incondicional del selector de conductor/operador, pase a terreno gobernado por el despacho del convoy y remoción de alertas bloqueantes en `finalizarPreparacionSalida` (Spec 16 - Sección 13.6).
  * `v1.0.50 (2026-09-24)`: Consumo reactivo de deep links con query parameters (`id_proyecto`, `subtab`, `paso`) respetando la FSM (estados 3+ para Operaciones, Liquidación y Facturación). Limpieza de duplicidad de props y compatibilidad con `useAuth.js` post-login (Spec 52).
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
* **Versión Actual:** `1.2.0`
* **Última Modificación:** `2026-09-25`
* **Dominio / Alcance:** Interfaz móvil para conductores y operadores en terreno (`/viaje/:token`). Gestiona:
  1. Paso 1 (Salida de Base): Registro de Odómetro inicial, Horómetro inicial, control de combustible multi-estanque con foto obligatoria de marcador, y firma digital FES mediante PIN de 4 dígitos.
  2. Paso 2 (En Ruta): Telemetría en vivo, pings GPS cada 10s y rendición de combustible Copec.
  3. Paso 3 (Llegada a Faena): Registro de Odómetro, Horómetro y combustible multi-estanque con foto de marcador, confirmación de arribo, cierre de trayecto y handoff automático de traslado.
  4. Paso 4 (Report Diario Multi-Día): Reportes correlativos por jornada con inicio desacoplado (hora de llegada), horas máquina, colación y firma táctil del mandante (Spec 54).
* **Servicios que Consume:** `/api/operaciones/viaje/:token`, `/api/operaciones/viaje/:token/salida`, `/api/operaciones/viaje/:token/llegada`, `/api/operaciones/viaje/:token/combustible`, `/api/operaciones/viaje/:token/ping`, `/api/operaciones/report/guardar`
* **Historial de Cambios (Changelog):**
  * `v1.2.0 (2026-09-25)`: Control de combustible multi-estanque adaptado a la configuración técnica del equipo (`esGruaBimotor`). Captura fotográfica obligatoria de marcadores en salida y llegada. Vinculación estricta de base mínima a `pisoMinimo` comercial del estructurador (`pisoMinimoEstructurador`). Desacoplamiento de inicio de faena tomando hora de llegada (`fecha_llegada_faena`) (Spec 54).
  * `v1.1.1 (2026-09-22)`: Homologación arquitectónica de emisión de Report Diario hacia el endpoint canónico `/api/operaciones/report/guardar`. Se desacopla de ruta ficticia y se garantiza persistencia directa en `tedp_reporte_avance` con vinculación de `id_proyecto`, `id_equipo`, `id_user_operador`, horómetros, horas facturables y firma táctil del mandante. Normalización en `viajeOfflineSync.js` para mutaciones offline `CREAR_REPORTE_DIARIO` pendientes en IndexedDB.
  * `v1.1.0 (2026-09-22)`: Pre-llenado de Odómetro y Horómetro por defecto para evitar botones bloqueados en móviles. Incorporación de feedback visual reactivo con indicadores de requisitos (`✓` / `⚠️`) para Odómetro, Horómetro y PIN (X/4). Sustitución del bloqueo rígido `:disabled` por validación interactiva que notifica explícitamente qué campos faltan si se pulsa el botón antes de tiempo.
  * `v1.0.0 (2026-09-21)`: Versión inicial con soporte offline-first y los 5 estados de operación.


---

### 8. `ModalMapaViaje.vue`
* **Ruta Física:** `ejecucion/frontend/src/components/Operaciones/ModalMapaViaje.vue`
* **Versión Actual:** `1.0.55`
* **Última Modificación:** `2026-09-25`
* **Dominio / Alcance:** Visor modal de telemetría de viaje y hoja de ruta en tiempo real para la Torre de Control y Gestor de Oportunidades. Renderiza el recorrido del convoy mediante Leaflet con soporte de 3 capas base gratuitas sin API Key (OpenStreetMap Calles por defecto, Esri Satélite HD y Esri Topográfico), modo Pantalla Completa inmersivo (`100vw × 100vh`) con invalidación automática de tamaño de mapa (`map.invalidateSize()`), centrado reactivo de ruta (`map.fitBounds`), panel de bitácora cronológica colapsible (`col-span-12` vs `col-span-9`/`col-span-7`), e interactividad por waypoints (`map.flyTo` a zoom 17 con apertura de popups de hitos de salida, ruta y arribo a faena).
* **Servicios que Consume:** Datos de trayecto y telemetría de `tequ_log_desplazamiento` (waypoints GPS, odómetros, horómetros, combustible Copec).
* **Historial de Cambios (Changelog):**
  * `v1.0.55 (2026-09-25)`: Depuración y remoción de tarjeta de telemetría teórica (velocidad promedio y máxima). Focalización en odómetros, combustible, bitácora y cartografía limpia OSM/Esri (Spec 54).
  * `v1.0.54 (2026-09-25)`: Corrección de coordenadas fallback por defecto, erradicación de desvío espurio a Chillán en `viajeOfflineSync.js` y validación estricta de `fuente === 'GPS_REAL'`. Saneamiento de bitácora en viaje `TYGC.45-1` en base de datos PostgreSQL y trazado real Temuco ➔ Valdivia.
  * `v1.2.0 (2026-09-24)`: Reemplazo completo de CartoDB (que exigía API Key con watermark restrictivo) por OpenStreetMap (OSM) y capas satelital/topográfica Esri 100% libres (Spec 16 - Sección 13 / Spec 53). Incorporación de botón Pantalla Completa / Restaurar con redibujado automático, centrado dinámico de ruta, panel colapsible de bitácora y zoom interactivo (`flyTo`) al hacer clic en los hitos del convoy.

---

### 9. `Surveys.vue` (PWA)
* **Ruta Física:** `ejecucion/pwa/src/views/Surveys.vue`
* **Versión Actual:** `1.0.26`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Lista de inspecciones, encuestas y acceso rápido a la Hoja de Ruta del Conductor en la PWA móvil.
* **Servicios que Consume:** `/api/survey`, `/lg-gsp-dev/viaje/:token`
* **Historial de Cambios (Changelog):**
  * `v1.0.26 (2026-09-24)`: Corrección de deep link en `abrirViajeNativo` apuntando a la ruta canónica `${baseOrigin}/lg-gsp-dev/viaje/${token}`, enlazado con la regla de redirección 301 de Nginx (`/viaje/*` ➔ `/lg-gsp-dev/viaje/*`) para acceso transparente desde navegadores móviles (Spec 53).

---

### 10. `gsp-whatsapp-service` (Microservicio Baileys)
* **Ruta Física:** `gsp-whatsapp-service/server.js` (Servidor: `/home/nodeadmin/proyectos/gsp-whatsapp-service/server.js`)
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Microservicio independiente de mensajería WhatsApp para Grúas San Pablo operando en puerto 3085 (PM2 ID 17). Provee panel web `/admin` para escaneo de código QR, monitoreo de estado de conexión con servidores de Meta, endpoint `/enviar` para notificaciones transaccionales y Hoja de Ruta, y endpoint `/desvincular` para cierre y re-generación inmediata de credenciales QR.
* **Endpoints Expuestos:**
  * `GET /admin` — Panel web con visualización reactiva del código QR o badge de conexión activa.
  * `POST /enviar` — Despacho transaccional de mensajes a números en formato E.164.
  * `POST /desvincular` — Cierre forzado de sesión Baileys, purga de directorio `auth_info_baileys` y reactivación inmediata del listener de socket para escaneo de nuevo código QR.
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-09-24)`: Incorporación de endpoint `/desvincular` y botón de acción en panel `/admin` para permitir el reseteo instantáneo de la sesión sin requerir intervención por SSH o consola (Spec 53).

---

### 11. `BacklogView.vue`
* **Ruta Física:** `ejecucion/frontend/src/views/BacklogView.vue`
* **Versión Actual:** `1.0.53`
* **Última Modificación:** `2026-09-24`
* **Dominio / Alcance:** Módulo ejecutivo de seguimiento de mejoras continuas, requerimientos de marcha blanca y bitácora técnica de releases (Changelog) para mandante y gerencia. Renderiza KPIs de avance, tabla de requerimientos con filtros dinámicos (texto, estado, prioridad) y tarjetas de release con requerimientos cerrados asociados. Diseño full-width de alta amplitud horizontal.
* **Servicios que Consume:** `/api/backlog`, `/api/backlog/releases`
* **Historial de Cambios (Changelog):**
  * `v1.0.53 (2026-09-24)`: Rediseño a ancho completo (`w-full`), eliminando restricción `max-w-7xl` y pérdida lateral de espacio en monitores anchos. Ampliación de columnas de tabla y descripciones técnicas sin clamping. Sincronización completa de los 10 requerimientos y 7 releases en PostgreSQL (Spec 51 / REQ-010).
  * `v1.0.48 (2026-09-23)`: Creación inicial del módulo con soporte RBAC y tabs de Requerimientos y Release Log.

---

### 12. `ModalITS.vue` (Liquidación e Informe de Término de Servicio)
* **Ruta Física:** `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-25`
* **Dominio / Alcance:** Módulo de liquidación operativa e informe de término de servicio (ITS). Gobernanza de firmas de cliente y cálculo de horas de faena y carretera.
* **Servicios que Consume:** `/api/operaciones/its`, `/api/proyectos/:id`
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-09-25)`: Motor condicional de liquidación de horas según `tipo_servicio` (`Flete Solo Ida`, `Flete Solo Retorno`, `Flete Ida y Retorno`). Desacoplamiento estricto del piso mínimo de faena (8 horas) para fletes carreteros (Spec 54).

---

### 13. `ViajeConductor.vue` (Hoja de Ruta y Desplazamiento de Maquinaria)
* **Ruta Física:** `ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue`
* **Versión Actual:** `1.2.0`
* **Última Modificación:** `2026-09-26`
* **Dominio / Alcance:** Hoja de ruta móvil y offline para conductores de grúas y camiones de transporte. Control de salida de patio (odómetro, horómetro, combustible con foto marcador), tracking GPS en carretera y confirmación de llegada a obra.
* **Servicios que Consume:** `/api/operaciones/viaje/:token`, `/api/operaciones/viaje/:token/combustible`
* **Historial de Cambios (Changelog):**
  * `v1.2.0 (2026-09-26)`: Desacoplamiento completo del Report Diario (seccion 6 oculta con banner de conclusión y botón de redirección a PWA). Simplificación del modal de combustible (`modalCombustible`) a 1 solo paso directo (sin solicitud de tarjeta Copec ni espera de coordinador) con envío directo de `id_autorizacion_copec: 'DIRECTO'` (Spec 55 / REQ-012).
  * `v1.1.0 (2026-09-25)`: Registro explícito de combustible multi-estanque según equipo (chasis y grúa para bimotor) con foto de marcador obligatoria (Spec 54).
  * `v1.0.0 (2026-09-20)`: Creación inicial con soporte offline IndexedDB, tracking GPS y PIN de conductor.

---

### 14. `Surveys.vue` (Vista Principal PWA)
* **Ruta Física:** `ejecucion/pwa/src/views/Surveys.vue`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-09-26`
* **Dominio / Alcance:** Portal operativo móvil y PWA para operadores, conductores y supervisores de terreno de Grúas San Pablo.
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-09-26)`: Rediseño canónico estructurado en tres tarjetas prioritarias con gradiente oscuro unificado (`#0b1426` a `#17264a`): 1º Control de Portón & Patio (intacto), 2º Registro de Viaje (con alerta parpadeante en viajes asignados/en ruta) y 3º Ingreso de Report Diario (con alerta parpadeante en actividad pendiente). Ocultamiento temporal de la sección de checklist y filtros superfluos (Spec 55 / REQ-012).
  * `v1.0.0 (2026-08-15)`: Vista inicial con lista de encuestas e inspecciones técnicas.

---

### 15. `PerspectivaContabilidad.vue` (Torre de Control - Embudo Financiero E2E y Gestión Multi-DTE)
* **Ruta Física:** `ejecucion/frontend/src/components/Operaciones/PerspectivaContabilidad.vue`
* **Versión Actual:** `1.1.0`
* **Última Modificación:** `2026-10-26`
* **Dominio / Alcance:** 4ª perspectiva ejecutiva de la Torre de Control para Contabilidad, Tesorería y Cobranzas. Presenta los 5 KPIs del embudo financiero (`Comprometido`, `Devengado Reports`, `Cerrado ITS`, `Emitido EDP`, `Facturado DTE`), gráfico temporal interactivo (6 meses mensual / mes semanal), bandeja contable inteligente con reducción de ruido, protocolo de acceso directo a PDFs oficiales firmados (cero modales web) y dropzone para reconocimiento automático de DTEs de Laudus y Portal SII (`SPEC-100` y `SPEC-101`).
* **Servicios que Consume:** `/api/operaciones/edp/perspectiva-contabilidad`, `/api/operaciones/edp/parsear-dte-pdf`, `/api/operaciones/edp/proyecto/:id/soporte-documental`, `/api/operaciones/edp/proyecto/:id/dte/:folio`
* **Historial de Cambios (Changelog):**
  * `v1.1.0 (2026-10-26)`: Modo Bandeja Contable Inteligente por defecto (`SOLO_TRABAJO`), apertura directa en nueva pestaña de PDFs oficiales (EDP, ITS, Reports, OC) sin vistas web interactivas, integración de motor parser DTE y soporte multi-factura (Spec 101 / REQ-1070).
  * `v1.0.0 (2026-10-25)`: Creación inicial del componente, 5 KPIs del embudo, cascada ejecutiva y 3 submenús exportables a Excel nativo (Spec 100 / REQ-1069).

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

