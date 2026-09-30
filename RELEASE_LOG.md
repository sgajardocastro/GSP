# 🏛️ REGISTRO DE LIBERACIONES Y MEJORAS (RELEASE LOG) - GRÚAS SAN PABLO (GSP)

Este archivo contiene el historial detallado de versiones y mejoras liberadas en los ambientes del Ecosistema GSP (Web, PWA y Backend).

---

## [Portal Web GSP] - Versión 1.0.62
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-30 14:35:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-017`
- **Especificación Técnica:** `.agents/specs/56_ajustes_operacionales_segunda_sesion_marcha_blanca_spec.md`
- **Detalle de Mejoras y Cambios (Ajustes Operacionales Segunda Sesión Marcha Blanca):**
  - **[BUGFIX/OPS] Erradicación de Prevencionista Fantasma (Caso GSP-2609-3707-013):**
    - Purga de inicialización estática de `especialistasTerreno` en `GestorOportunidades.vue`.
    - Despliegue condicional de especialistas APR única y exclusivamente si `requiere_prevencionista === true` o si la cotización incluye líneas de prevención, eliminando slots vacíos.
  - **[FEAT/WORKFLOW] Reasignación Centralizada en Sub-tab 2 (Asignación) y Bloqueo en Despacho:**
    - Desbloqueo de interactividad en Sub-tab 2 tras confirmación de OT (`isAsignacionConfirmada`) mediante botón explícito `[🔄 Reasignar Recursos / Actualizar OT]`, recalculando acreditaciones en tiempo real.
    - Bloqueo en modo solo lectura de selectores de recursos en Sub-tab 5 (Despacho), preservando la integridad del proceso operativo.
  - **[FEAT/UX] Vinculación Rigger Anidado Bajo Operador/Conductor:**
    - Integración de selector y semáforo de Rigger como sub-registro en la celda del Operador de la Grúa Principal (`linesEquiposPrincipales[0]`) sin saturar la tabla con columnas adicionales.
    - Soporte multi-grúa: el rigger se asocia a la grúa principal, salvo que comercialmente se hayan vendido 2 o más riggers.
  - **[FEAT/OPS] Filtro Inclusivo con Separador y Aviso de Mayor Prestación:**
    - Agrupación del selector de grúas en dos niveles `<optgroup>`: `🎯 Equipos Sugeridos (Compromiso Comercial)` y `🚜 Flota Alternativa / Mayores Prestaciones`.
    - Despliegue de banner/badge de advertencia `[⚠️ Equipo de Mayor Capacidad (Alternativa Operativa — Tarifa Comercial Respaldada)]` ante selección de grúas de mayor tonelaje.

---

## [Portal Web GSP] - Versión 1.0.61
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-29 22:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-016`
- **Detalle de Mejoras y Cambios (Marcha Blanca Comercial Temuco):**
  - **[SECURITY/RBAC] Restricción de Scope Comercial y Depuración de Roles (Obs #4):**
    - **PostgreSQL (`sch_leangsp`):** Purga de 24 roles legacy de Transmac/Codelco y consolidación de los 9 roles oficiales GSP (`Admin`, `USR-CONSENT`, `GSP_PROG`, `GSP_APROB`, `GSP_CONTA`, `GSP_EJEC`, `ADM_COM`, `COMERCIAL`, `COORD`).
    - **Backend (`authController.js`, `authMiddleware.js`, `proyectosController.js`, `proyectoModel.js`):** Inyección de roles en JWT/sesión y cláusula determinista `WHERE p.id_usuario_creacion = $id_user` para el rol `COMERCIAL`. Los roles `Admin`, `ADM_COM` y `COORD` acceden al tablero global.
    - **Frontend (`Torre.vue`):** Refresco dinámico de roles desde BD (`cargarRolesFrescos()`), filtrado reactivo de tarjetas y badges semánticos de Scope (`[👤 Scope: Mis Cotizaciones]`, `[🌐 Scope: Global]`, `[🏗️ Scope: Coordinación]`).
    - **Mantenedor de Usuarios (`EditUsuarioDialog.vue` y `RbacMatrixTable.vue`):** Layout Split de 2 columnas fijas (`max-w-[1380px]`) a pantalla completa, eliminando scrollbars externos y presentando los 9 roles GSP en tarjetas de una línea.
  - **[FEAT/NOTIFICATIONS] Notificaciones y Distribución Parametrizada de Cotizaciones (Obs #6):**
    - **Backend (`messageModel.js`, `messageController.js`):** Soporte y paso de cabecera `cc` en `nodemailer`.
    - **Frontend (`ModalEnviarCotizacion.vue`):** Distribución estricta: `Para:` Cliente; `CC:` Comercial Emisor (`currentUser.email`) + Coordinadores de Operaciones (`COORD` / `logistica@arriendosanpablo.cl`) + Administradores (`Admin` / Sergio, Jorge, Omar). Trazabilidad de `usuario_envio` activo.
  - **[FEAT/COMMERCIAL] Diferenciación "Ida" e "Ida/Vuelta" en Traslados y Regla Devengado 50/50 (Obs #2):**
    - Desbloqueo del `<select>` de unidad en categoría `TRASLADOS` (`TRASLADO IDA` / `TRASLADO IDA/VUELTA`) en `GestorOportunidades.vue`.
    - Motor de imputación en *Sub-tab 6 Reports*: 50% devengado al completar viaje a faena y 50% remanente retenido hasta el viaje de retorno a base.
  - **[FEAT/COMMERCIAL] Deshabilitación Automática de Pensiones en 1 Día (Obs #3):**
    - Detección reactiva `esServicioUnDia` en `GestorOportunidades.vue`, forzando automáticamente `'NA'` en conceptos de pensiones y viáticos con banner informativo.
  - **[FEAT/OPERATIONS] Persistencia de Fecha, Hora y Reasignación en Viajes y Visitas (Obs #5):**
    - Persistencia de fecha y hora programada en `tequ_log_desplazamiento` y `tsrv_survey`, evitando desfases UTC y habilitando reprogramación de recursos sin pérdida de trazabilidad.

---

## [Portal Web GSP] - Versión 1.0.60
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-29 15:55:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-015`
- **Detalle de Mejoras y Cambios:**
  - **[BUGFIX/BACKEND] Idempotencia y Resiliencia de Tokens de Asignación de Visita a Terreno (`visitaTerrenoController.js`):**
    - Preservación y reutilización determinista del token activo cuando el proyecto se encuentra en estado `PENDIENTE_ASIGNACION`, impidiendo que reenvíos de notificación o correcciones de dirección invaliden enlaces previos en correos y WhatsApp.
    - Soporte multi-token histórico en `json_field->'crm_v1'->'tokens_historicos'` consultado transparentemente en `getDatosVisita` y `asignarVisita`. Los enlaces antiguos conservan su validez mientras la solicitud no haya sido asignada o firmada (un solo uso garantizado tras el cierre).
  - **[FEAT/UX] Adaptabilidad Ergonómica del Estructurador en Pantallas de 13" (`GestorOportunidades.vue`):**
    - **Modo Expandido 1-Clic:** Incorporación de botón toggle `[◀ Maximizar Ancho (13")]` / `[▶ Mostrar Datos Cliente]` en la barra de pestañas, permitiendo colapsar el panel lateral izquierdo para que el Estructurador ocupe el 100% del viewport útil (+1000px en notebooks de 13").
    - **Activación de Desplazamiento Horizontal:** Remoción de `.scrollbar-hide` y `overflow-hidden` que bloqueaban visualmente la barra de desplazamiento en Windows/Chrome, habilitando `overflow-x-auto` nativo con riel fluido.
    - **Optimización Dimensional de Columnas:** Eliminación del atributo `w-full` en la cabecera de *Descripción / Equipo* que inflaba desmedidamente el ancho de la tabla, y compactación de anchos mínimos de columnas a 850px base.
    - **Homologación Operativa:** Aplicación de scroll horizontal y anchos compactos en la Pestaña B de Operaciones para coherencia en todo el ciclo de vida de la cotización.

---

## [Portal Web GSP] - Versión 1.0.59
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-28 22:45:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-014`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/AUTH] Redirección Directa de Login al Kanban Operativo (`useAuth.js`):**
    - Redirección automática de usuarios autenticados hacia la Torre de Control (`torre`), eliminando la pantalla intermedia del dashboard.
  - **[FEAT/UX] Erradicación de Falsa Alerta de Cambios Sin Guardar (`GestorOportunidades.vue`):**
    - Detección reactiva de modo hidratación (`isHydrating`) e inmutabilidad en etapas operativas (>= 3). En Validación, Patio y Faena no se dispara advertencia errónea al volver a la Torre.
  - **[FEAT/UI] Estandarización de Tarjetas del Kanban (`Torre.vue`):**
    - Formato comercial uniforme en todas las etapas operativas: Cliente, Proyecto, Familia de Servicio / Objetivo del Proyecto, Vendedor, Monto y Fecha, eliminando asignaciones rígidas de una sola persona.
  - **[FEAT/UI] Jerarquía Visual y Rediseño de Asignación de Recursos (`GestorOportunidades.vue`):**
    - **Títulos Unificados:** Estandarización a azul técnico corporativo (`text-blue-400 font-bold uppercase`) en todas las secciones, sub-bloques y matriz de aparejos.
    - **Indentación y Árbol de Recursos:** Desplazamiento `pl-8` y guía visual vertical `border-l-2 border-slate-700/60` en las filas hijas para diferenciar inmediatamente el agrupador de sus recursos asignados.
    - **Depuración Visual:** Erradicación de candados (`🔒`), guiones huérfanos (`—`) y emojis distractores (`🚜`, `📋`, `💬`, `⛓️`, `⚡`, `📄`) en columnas de acción y celdas no aplicables, dejando la interfaz 100% limpia.
    - **Cromatismo Unificado:** Homologación estricta de categorías a azul corporativo (`text-blue-400 font-mono`) eliminando amarillos disonantes en flota principal.
    - **Consistencia Semántica:** Corrección del título de aparejos a `Matriz de Aparejos & Implementos de Izaje` (eliminación del prefijo erróneo `3.`) y etiqueta de `Requerimientos de Izaje`.
  - **[GOVERNANCE/DEV] Candado Determinista de Despliegue (Hard Gate):**
    - Implementación de compuerta obligatoria en `deploy_web_now.js` que impide físicamente la conexión SSH si no se ha incrementado `package.json`, si falta el registro en `RELEASE_LOG.md` o si el `REQ` no está completado en `Gestión/tareas.md`.

---

## [PWA GSP - Grúas San Pablo] - Versión 1.0.29
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-26 20:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-013`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/VALIDATION] Verificación Inteligente de Horómetro Motor (`ReportDiarioIzaje.vue`):**
    - **Cálculo y Propuesta Automática:** Al definir la hora de término y colación, el sistema calcula de forma reactiva el `horometroPropuesto` ($\text{horómetro inicial} + \text{horas efectivas}$) y lo sugiere con un chip interactivo *"💡 Usar Sugerido"*, autocompletándolo si el campo está vacío.
    - **Alerta de Horómetro Inferior:** Si se digita un valor menor al inicial, el input se torna rojo con pulsación de error y bloquea el botón para pasar a la firma del mandante.
    - **Alerta de Horómetro Disparado / Outlier:** Si la diferencia excede significativamente el tiempo de faena (posible digitación accidental del odómetro del chasis), se despliega una advertencia visual prominente con botón para *"Reemplazar por Sugerido"* en un solo clic y cuadro de confirmación de seguridad.
  - **[FEAT/CORE] Corrección de Base Mínima y Sobretiempo en Report:**
    - Ajuste de base contractual a 8.0 hrs estándar (o la estipulada en la OT), garantizando que las 9.0 horas efectivas generen exactamente **+1.0 hr** de sobretiempo y **9.0 hrs** a facturar con desglose transparente.

---

## [Portal Web GSP] - Versión 1.0.57
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-26 20:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-013`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/BACKEND] Extracción Dinámica de Piso Mínimo Contractual (`reportDiarioController.js`):**
    - Lectura contractual fidedigna desde `crm_v1.lineas_servicio` de la OT vinculada al equipo/grúa asignado (ej: 8 hrs para Grúa 75 Ton), con fallback general a 8.0 hrs en vez del valor de 4.0 hrs.
    - Recálculo forzado y asegurado de `horas_sobretiempo` y `horas_facturables` en el endpoint de guardado ante cualquier desfase de clientes antiguos.
  - **[FEAT/UX] Desglose Transparente y Alerta de Horómetro en Visor Web (`ModalVisorReport.vue`):**
    - Enriquecimiento de las tarjetas de resumen: *A Facturar* desglosa explícitamente `Base 8.0h + ST +1.0h`, y *Sobretiempo* clarifica `Excedente sobre base 8.0h`.
    - Detección reactiva de anomalías en el horómetro del motor en la web con badge `⚠️ Posible Odómetro` para el analista revisor.
  - **[DATA/FIX] Saneamiento del Report Día 1 (OT 98 / Equipo 43):**
    - Ajuste en base de datos para Report ID 14: `horas_minimas: 8.00`, `horas_sobretiempo: 1.00`, `horas_facturables: 9.00` y horómetro final corregido a `4185.00`.

---

## [PWA GSP - Grúas San Pablo] - Versión 1.0.28
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-26 19:35:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Especificación Técnica:** `Spec 55` (`.agents/specs/55_desacoplamiento_viaje_report_y_rediseño_home_pwa_spec.md`)
- **Requerimiento Backlog:** `REQ-012`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/UX] Rediseño Integral de Vista Principal PWA (`Surveys.vue`):**
    - Organización canónica estructurada en tres tarjetas de identidad visual unificada (fondo gradiente oscuro `#0b1426` a `#17264a`, bordes sutiles y tipografía clara):
      1. **Control de Portón & Patio:** Mantenido intacto como primera prioridad operativa de acceso a instalaciones.
      2. **Registro de Viaje:** Acceso directo a la Hoja de Ruta del Conductor con indicador y animación parpadeante (`animate-pulse`) en rojo o ámbar cuando el conductor tiene un viaje asignado pendiente por iniciar (`ASIGNADO`) o en trayecto (`EN_RUTA`).
      3. **Ingreso de Report Diario:** Acceso directo a la gestión de faena con alerta parpadeante cuando existe actividad pendiente o maquinaria arribada a obra.
    - **Ocultamiento de Ruido Visual:** Se ocultó de la vista principal la sección *"Registrar Inspección/Checklist"*, selects de filtros redundantes y buscador de protocolos, focalizando al operador 100% en sus tareas operativas críticas.

---

## [Portal Web GSP] - Versión 1.0.56
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-26 19:35:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Especificación Técnica:** `Spec 55` (`.agents/specs/55_desacoplamiento_viaje_report_y_rediseño_home_pwa_spec.md`)
- **Requerimiento Backlog:** `REQ-012`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/OPERACIONES] Desacoplamiento de Viaje y Report Diario (`ViajeConductor.vue`):**
    - La vista de viaje del conductor concluye su ciclo de transporte al registrar la llegada a faena (odómetro final, horómetro final, combustible y foto de tablero), mostrando un banner de viaje completado y enlace directo a la PWA (`/pwa-gsp-dev/`) para la gestión de reportes diarios, sin incrustar el formulario multi-día dentro del viaje carretero.
  - **[FEAT/OPERACIONES] Carga Directa de Combustible en Ruta (Cero Validación de Tarjeta):**
    - Se transformó el modal de combustible (`modalCombustible`) de un flujo de 3 pasos (solicitar tarjeta, esperar aprobación de torre, rendir) a un formulario directo de 1 solo paso: Estanque Abastecido (Chasis, Grúa, Reserva), Odómetro, Horómetro, Litros Cargados, Monto y Foto del Voucher.
    - Registro inmediato con `id_autorizacion_copec: 'DIRECTO'` tanto en local/IndexedDB como en backend PostgreSQL.

---

## [PWA GSP - Grúas San Pablo] - Versión 1.0.26
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-24 13:10:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/MOBILE] Empaquetado APK Nativo Android (GSP TWA):**
    - Saneamiento completo de residuos heredados de otros tenants y configuración del envoltorio nativo `gsp-twa`.
    - Homologación de `twa-manifest.json` y `app/build.gradle` con la identidad oficial de GSP (`cl.leanglobal.pwa_lg_gsp_dev.twa`, nombre *GSP - Grúas San Pablo*, launcher *GSP Operaciones*, URLs `/pwa-gsp-dev/` y paleta dark theme `#18181b` / `#09090b`).
    - Automatización del script de preparación `scripts/prepare-apk.ps1` (`npm run apk:prepare`), versionando y empaquetando `app-release-signed.apk` y `app-release-signed-1.0.26.apk`.
  - **[FEAT/UX] Botón de Descarga APK en Pantalla de Acceso (`Login.vue`):**
    - Habilitación del bloque y botón corporativo *"Descargar App GSP (APK)"* para operadores y conductores en terreno desde dispositivos móviles.

---

## [Portal Web GSP] - Versión 1.0.55
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-25 19:35:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Especificación Técnica:** `Spec 54` (`.agents/specs/54_consolidacion_viajes_fletes_y_report_diario_spec.md`)
- **Requerimiento Backlog:** `REQ-011`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/MOBILE] Control de Combustible Multi-Estanque y Captura Fotográfica de Marcador (`ViajeConductor.vue`):**
    - Despliegue dinámico y explícito de campos de combustible según la configuración técnica del equipo (`esGruaBimotor`: Estanque Chasis y Estanque Grúa/Superestructura). Erradicación de combos y botones de fracciones.
    - Captura fotográfica obligatoria del marcador de combustible tanto en Salida de Patio como en Llegada a Faena.
  - **[FEAT/OPERACIONES] Vinculación Estricta a Base Mínima Comercial del Estructurador:**
    - Lectura contractual directa de `pisoMinimo` desde `lineas_servicio` de la OT en `viajeModel.js`. Erradicación de pisos ficticios hardcodeados.
  - **[FEAT/BACKEND] Handoff Automático de Hito de Traslado a Estructurador y Report Diario (`viajeController.js`):**
    - Al confirmar la llegada a faena, la línea de servicio `TRASLADO` en el estructurador comercial de la OT se transiciona automáticamente a estado `CUMPLIDO`.
    - Inyección desatendida del registro de viaje en el Report Diario (`tedp_reporte_avance`) y en la liquidación ITS (`tits_jornada_detalle`) como `Flete Solo Ida` con sus horas y odómetros reales.
  - **[FEAT/OPERACIONES] Desacoplamiento de Horas en Report Diario e ITS (`ModalITS.vue` y PWA):**
    - El Report Diario inicia su cómputo de faena a partir de la hora de llegada a la obra (`fecha_llegada_faena`), desacoplando estrictamente el tramo de carretera del servicio de izaje.
    - Motor de cálculo de horas condicional en ITS: liquidación exacta de fletes carreteros según tramos (`Flete Solo Ida`, `Flete Solo Retorno`, `Flete Ida y Retorno`) sin aplicarles el piso mínimo de 8 horas contractuales de faena.
  - **[CLEANUP/UI] Depuración de Telemetría Teórica en Hoja de Ruta (`ModalMapaViaje.vue`):**
    - Remoción de tarjeta de velocidades teóricas promedio y máxima, focalizando la vista en bitácora, odómetros, combustible y traza cartográfica limpia.

---

## [Portal Web GSP] - Versión 1.0.54
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-25 11:35:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[BUGFIX/TELEMETRÍA] Erradicación de Coordenadas Fallback Espurias en Registro de Viaje (`viajeOfflineSync.js`):**
    - Eliminación de la coordenada por defecto de Chillán (`-36.6172, -72.1148`) en `currentGpsState` que se inyectaba espuriamente al reabrir la app antes de que el GPS satelital obtuviera su primer fix.
    - Inicialización estricta en `null` y validación mandatoria de `fuente === 'GPS_REAL'` antes de emitir cualquier ping automático a la API.
    - Higienización y purga de coordenadas contaminadas en el log histórico de la máquina `TYGC.45-1` (id_log 12) en base de datos PostgreSQL, restaurando el trazado directo y fidedigno Temuco ➔ Valdivia por Ruta 5 Sur.
    - Corrección de fallback de inicialización cartográfica en `ModalMapaViaje.vue`.

---

## [Portal Web GSP] - Versión 1.0.53
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-24 21:20:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-010`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/UX] Optimización Full-Width y Ampliación de Vista Backlog & Marcha Blanca (`BacklogView.vue`):**
    - Erradicación de la restricción rígida `max-w-7xl`, permitiendo el aprovechamiento íntegro del ancho de la pantalla en monitores amplios.
    - Ensanchamiento de las columnas de la tabla de requerimientos y remoción del clamping `max-w-lg` en las descripciones técnicas.
    - Adaptación responsiva de tarjetas de release y rediseño de alta amplitud visual.
  - **[DATA/DB] Sincronización Automática de Catálogo de Releases y Backlog en PostgreSQL:**
    - Registro persistente de los 10 requerimientos (`REQ-001` a `REQ-010`) y los 7 releases (`v1.0.47` a `v1.0.53`) en las tablas `sch_leangsp.tcfg_backlog` y `sch_leangsp.tcfg_releases`.
    - Actualización preventiva de semillas en `backlogController.js` para blindar la inicialización ante reinicios de servidor.

---

## [Portal Web GSP] - Versión 1.0.52
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-24 20:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Especificación Gobernadora:** `Spec 16: Sección 13.6 - Desacoplamiento Total entre Despacho de Viaje e Inspección de Pre-Uso`
- **Requerimiento Backlog:** `REQ-009`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/OPERACIONES] Desacoplamiento Total de Salida de Patio (`GestorOportunidades.vue`):**
    - Botón de acción rápida directo `[ 🚀 Despachar Viaje ]` en la cabecera de cada equipo asignado en Subpestaña 5 "Control de Flota & Despacho", permitiendo el despacho inmediato e independiente del convoy sin requerir la apertura previa del checklist de pre-uso (Template 81).
    - Desbloqueo incondicional del selector de conductor/operador (`:disabled` removido).
    - Flexibilización del Stepper "Estado Pase Terreno" (`🟢 PASE LIBERADO 2/2`) gobernado por el despacho del convoy.
    - Remoción de alertas y compuertas bloqueantes en `finalizarPreparacionSalida()`, permitiendo que el proyecto avance a faena mientras la documentación técnica avanza asíncronamente.

---

## [Portal Web GSP] - Versión 1.0.51
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-24 19:45:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Especificación Gobernadora:** `Spec 16: Sección 13 / Spec 53: Visor de Mapa de Telemetría GPS con OpenStreetMap y Pantalla Completa`
- **Requerimientos Backlog:** `REQ-007`, `REQ-008`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/CARTOGRAFÍA] Visor de Telemetría GPS Cero API Key (`ModalMapaViaje.vue`):**
    - Erradicación definitiva de CartoDB y su marca de agua restrictiva. Adopción de Leaflet con OpenStreetMap (calles por defecto), Esri Satélite HD y Esri Topográfico 100% gratuitos con switcher flotante de 3 estados.
    - Modo Pantalla Completa inmersivo (`100vw × 100vh`) con redibujado forzado (`map.invalidateSize()`).
    - Panel de bitácora cronológica colapsible (`[ 📋 Ocultar/Ver Bitácora ]`) que amplía el mapa al 100% del modal.
    - Navegación interactiva por hitos con animación `flyTo` a zoom 17 y popups descriptivos de odómetro, horómetro y velocidad.
  - **[FIX/CRM] Corrección Autofill y Desbloqueo de Teléfono en Contactos (`GestorOportunidades.vue`):**
    - Desbloqueo de edición de teléfono y correo para contactos preexistentes (`:readonly` eliminado), persistencia reactiva en `autoGuardarContactoManual` y directivas CSS anti-autofill en modo oscuro.
  - **[FEAT/WHATSAPP] Módulo de Desvinculación de Sesión Baileys:**
    - Incorporación de endpoint `/desvincular` en microservicio WhatsApp (puerto 3085) y botón de purga en panel `/admin` para regeneración instantánea de QR.

---

## [Ecosistema GSP - Web, PWA & Backend] - Versión 1.0.50
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-24 12:40:00 (-03:00)
- **Rutas de Despliegue:**
  - Frontend Web: `/var/www/html/lg-gsp-dev` (`https://servidor.leanglobal.cl/lg-gsp-dev/`)
  - Frontend PWA: `/var/www/html/pwa-gsp-dev` (`https://servidor.leanglobal.cl/pwa-gsp-dev/`)
  - Backend PM2: `lean-services-gsp` (ID 10, `/home/nodeadmin/proyectos/lean-services-gsp`)
- **Especificación Gobernadora:** `Spec 52: Sistema de Notificaciones Omnicanal (Email + WhatsApp) con Deep Linking Contextual`
- **Requerimiento Backlog:** `REQ-006`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/OMNICANAL] Servicio Unificado de Notificaciones (`notificacionService.js`):** Despacho concurrente por Correo Transaccional SMTP y WhatsApp (Microservicio Baileys en puerto 3085) para transiciones operativas críticas (Asignación/Reasignación de Visita a Terreno, V°B° Jefatura de ITS, Recepción Contable y Observaciones de Rechazo).
  - **[FEAT/UX] Deep Linking Contextual con Cero Pérdida de Intención:** Preservación de query parameters en Vue Router (`router.beforeEach`) ante sesiones expiradas y restauración automática post-login (`useAuth.js`), navegando directamente al proyecto, sub-pestaña y paso activo (`/crm?id_proyecto=XX&subtab=YY&paso=ZZ`).
  - **[FEAT/PWA] Deep Linking de Terreno en Hash Routing:** Enrutamiento directo a inspecciones de terreno (`/#/inspeccion?id_survey=XX`) con carga reactiva autónoma y encadenamiento de firmas FES.
  - **[AUDIT/DATA] Tabla de Auditoría Transaccional:** Registro persistente en `sch_leangsp.tnot_notification_log` para trazabilidad completa de cada notificación enviada (Email y WhatsApp con E.164 sanitizado).
  - **[CLEANUP] Purga de Tenant Residual:** Eliminación del 100% de referencias cruzadas a otros tenants en modelos y controladores del backend.

---

## [Portal Web GSP] - Versión 1.0.47
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-23 13:48:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/UX] Buscador Omnibox Reactivo en Tablero Kanban (Spec 16 - Sec 11):** Incorporación de barra de búsqueda multi-criterio en tiempo real en la cabecera de `Torre.vue` (N° Cotización, Cliente, Vendedor, Obra/Faena, Recursos), con contador reactivo de coincidencias, tecla de escape rápida (`Esc`) y filtros computados concurrentes.
  - **[FEAT/UX] Visibilidad Universal del Ejecutivo Comercial (Spec 16 - Sec 12):** Micro-etiqueta reactiva `👤 [Ejecutivo]` desplegada en las 6 columnas del Kanban (`Torre.vue`), badge fijo en la barra superior del proceso y campo informativo en Sección 1 Datos de la Oportunidad (`GestorOportunidades.vue`).
  - **[DATA/FIX] Saneamiento Canónico a `tpry_proyecto.id_usuario_creacion`:** Corrección del modelo de datos para alinear la clave foránea real de PostgreSQL, asegurando que jamás viaje `null` desde el frontend y resolviendo los nombres completos concatenando `name_frst` + `apellido_pat` desde `tsec_users`.

---

## [Portal Web GSP] - Versión 1.0.36
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-09 16:21:38 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/UX] Stepper de Cierre Económico en 4 Pasos Nativos (Sub-Tab 7):** Sustitución del modal superpuesto por una experiencia secuencial fluida a pantalla completa dividida en 4 fases (`① ITS ➔ ② EDP ➔ ③ Respaldo OC ➔ ④ Factura DTE`) con botones contextuales de avance y retroceso.
  - **[FIX] Estructura y Balanceo DOM en CRM:** Corrección de etiquetas de cierre en `GestorOportunidades.vue`, garantizando 0 errores en compilación de producción con Vite.
  - **[DOCS] Arquitectura FES & Generación PDF para ITS:** Formalización del diseño técnico en `bosquejo_firma.md` bajo los estándares `leanglobal_approval_flow_standard` y `generar_pdf_fes_sin_survey`.

## [Backend GSP] - Versión 1.0.36
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-09 16:21:38 (-03:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT] Sincronización de Servicios & PDFs:** Actualización de `proyectoModel.js` con cálculo contextual determinista por tipo de unidad (`Horas Diarias Minimas`, `Horas Mes Minimas`, `Traslado`, `Valor Fijo`) y normalización idempotente en `asignacionRecursosController.js`.
  - **[PERF] Reinicio en Caliente PM2:** Proceso ID 10 reiniciado con verificación empírica HTTP 200 en endpoints públicos de la API.

---

## [Portal Web GSP] - Versión 1.0.29
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 16:12:02 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT/UX]** **DataGrid Operacional B2B en Asignación de Recursos (Pestaña C):** Reestructuración de alta densidad estilo Excel/Airtable con módulos separados para Flota (Equipos Principales y Apoyo) y Tripulación/Personal, micro-badges de semáforo inline, barra de tiempos compacta con propagación rápida y matriz de aparejos en cuadrícula compacta de 4 columnas.

## [Backend GSP] - Versión 1.0.29
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 16:12:02 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[PERF]** **Optimización de Servicios:** Soporte determinista para persistencia y sincronización de recursos asignados a la OT.

## [Portal Web GSP] - Versión 1.0.28
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 15:45:51 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Estructurador de Servicios & Grúas Telescópicas:** Homologación del mapeo de categorías canónicas (`GRUAS TELESCOPICAS`, `CAMIONES`, `PLATAFORMAS`, etc.) para renderizado determinista en Preventa y Operaciones / Validación Diff.
  - **[FIX]** **Estilos de Listas Desplegables (<select>):** Aplicado fondo oscuro `#0a0f1e` y texto blanco `#f8fafc` en todas las opciones de los menús desplegables para eliminar la invisibilidad de texto blanco sobre fondo blanco.

## [Backend GSP] - Versión 1.0.28
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 15:45:51 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Consistencia de Categorías:** Sincronización completa con el catálogo maestro de equipos de la base de datos.

## [Portal Web GSP] - Versión 1.0.27
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 15:18:14 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Flujo de Visita a Terreno & Firma FES:** Resuelta la captura y envío de detalle de servicio, contacto y resolución determinista de coordinador al solicitar y firmar visitas a terreno con PIN FES.
  - **[FEAT]** **Limpieza de Preventa:** Eliminado el ticket legacy 'Se ejecutó Visita a Terreno (Registrar datos aquí)' consolidando el flujo directo de visitas del proyecto.

## [Backend GSP] - Versión 1.0.27
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 15:18:14 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Visitas a Terreno & Coordinación:** Persistencia integral de campos comerciales (`obra_nombre`, `obra_direccion`, `obra_ciudad`, `detalle_servicio`, `contacto_nombre`, `contacto_telefono`, `contacto_email`) en `json_field.crm_v1`, formato limpio en correo HTML y fallback automático de coordinador en `asignarVisita`.

## [Portal Web GSP] - Versión 1.0.26
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 12:25:55 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Flags de Operación en Preventa:** Implementados los 4 flags de preventa (`Requiere Acreditación`, `Servicio incluye Traslado`, `Requiere Rigger`, `Prevencionista Certificado`) con sincronización bidireccional en el estructurador y presencia explícita en la cotización PDF.
  - **[FEAT]** **Proyección de Costos de Pensiones:** Apertura modular de alimentación en 3 conceptos individuales (Desayuno, Almuerzo, Cena) totalizando 5 items con selección de pagador y valorización monetaria.
  - **[FEAT]** **Acuerdos Comerciales Dinámicos:** Eliminación del encabezado general estático y preservación determinista de modificaciones manuales guardadas en preventa.

## [Backend GSP] - Versión 1.0.26
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-18 12:25:55 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Plantilla PDF de Cotización:** Impresión explícita de los 4 flags de condiciones operativas y soporte para esquemas enriquecidos de preventa y pensiones.

## [Portal Web & Backend GSP] - Versión 1.0.24
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-07 01:13:25 (-04:00)
- **Ruta de Despliegue Web:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Proceso PM2 Backend:** `lean-services-gsp` (ID 10)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT] Identidad Google Workspace OAuth 2.0:** Autenticación federada corporativa exclusiva para dominios `@arriendosanpablo.cl` y correos autorizados. Eliminada autenticación legacy `@transmac.cl` y sockets POP3.
  - **[FEAT] Rediseño UI Split-Screen Industrial (`Login.vue`):** Interfaz dark mode de alto impacto con fotografía industrial de grúas en faena, telemetría IoT (`99.8% Disponibilidad Flota`, `Estándar ISO 45001 / Rigging Level 5`) y botón de Google integrado limpiamente sin marcos dobles.
  - **[FIX] Generación & Render de Consentimiento FES (Template 500):** Restaurada la clasificación `id_tipo_srv = 0` ('Consentimiento') en PostgreSQL y la consulta API con `LEFT JOIN`, produciendo PDFs de consentimiento 100% poblados con texto legal y metadatos de protocolo.
  - **[FEAT] Asignación Automática de Rol `USR-CONSENT` (id_rol 3):** Removido el desplegable manual de roles del frontend en enrolamiento e implementada inserción automática transparente en `tsec_user_roles` al registrar usuario.

---

## [Portal Web GSP] - Versión 1.0.22
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-03 15:35:42 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.22
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-03 15:35:42 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.21
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-03 14:30:35 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.21
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-03 14:30:35 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.20
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-03 11:38:59 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.20
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-08-03 11:38:59 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.19
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-30 16:46:52 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.19
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-30 16:46:52 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.18
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-30 16:37:49 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.18
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-30 16:37:49 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.17
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-30 11:56:21 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.17
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-30 11:56:21 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.16
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-28 14:02:00 (-04:00)
- **Ruta Web CRM:** `/var/www/html/lg-gsp-dev/` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Visor de Encuesta (verSurveyPrint):** Corregido fallo en la carga del protocolo que dejaba en blanco encuestas guardadas (ej. Survey 193). Se incorporó `encodeURIComponent` en la consulta por nombre de cliente (`name_empresa_cliente`) y aislamiento `try/catch` en peticiones secundarias de logos y usuario ejecutor para evitar interrupciones de renderizado.

---

## [Portal Web GSP & PWA] - Versión 1.0.15
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-28 13:09:30 (-04:00)
- **Ruta Web CRM:** `/var/www/html/lg-gsp-dev/` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta PWA:** `/var/www/html/pwa-gsp-dev/` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Control de Cambios (Diffs) en Preventa:** Restringida la alerta y formateo de modificaciones (línea roja y valores originales) para que opere exclusivamente en la etapa "En Preparación Operaciones" (`id_proyecto_estado === 3`), permitiendo edición limpia en etapa "Cotización".
  - **[FIX]** **Plantilla HTML de Correos B2B:** Eliminado el saludo inicial repetido y el párrafo final redundante de despedida.
  - **[FIX]** **Obra y Versión Dinámicas:** Inyectado el objeto completo del proyecto (`buildPayload()`) al modal de envíos para resolver correctamente el nombre real de la obra (`siteVisit.obra_nombre`) y el número de versión enviado (`v5`, `v25`, etc.).

---

## [Portal Web GSP & PWA] - Versión 1.0.14
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-28 12:25:00 (-04:00)
- **Ruta Web CRM:** `/var/www/html/lg-gsp-dev/` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta PWA:** `/var/www/html/pwa-gsp-dev/` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Visor Web de Inspecciones (`/versurveyprint`):** Integrada la ruta e iframe de previsualización de reportes de visitas a terreno en el Vue Router y Web CRM.
  - **[FEAT]** **Correos B2B Enriquecidos:** Estandarizado el despacho de cotizaciones vía `POST /message` con maquetas HTML comerciales responsivas de tarjetas corporativas.
  - **[FIX]** **Resolución Paramétrica de Logos en PDF:** Incorporada la resolución física de `logo-sanpablo.png` desde la carpeta `/public` del backend con permisos de `nodeadmin`.

## [Backend GSP] - Versión 1.0.14
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-28 12:25:00 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Logos en PDFs de Cotizaciones:** Corregida la ruta de lectura de logos en `proyectoModel.js` a la carpeta local del proyecto con fallback dinámico in-memory.

---

## [Portal Web GSP] - Versión 1.0.13
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 23:27:33 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Ordenamiento de Columnas:** Implementada lógica interactiva para ordenar de forma ascendente/descendente las columnas (ID, Email, Nombre, Rut, Empresa, Estado, Cargo, Nacimiento, FES) al clickear sus encabezados en la grilla de usuarios.

## [Backend GSP] - Versión 1.0.13
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 23:27:33 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Integridad de Datos en BD:** Saneado el mapeo de los 4 administradores enrolados principales en PostgreSQL asignándoles `id_empresa = 9` para consistencia con el filtro de multi-tenant de GSP.

## [Portal Web GSP] - Versión 1.0.12
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 17:52:59 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Expediente de Personal:** Rediseño del modal de edición del especialista liberando el 100% de la columna derecha para los certificados y trasladando la carga de archivos a un sub-modal flotante blur.
  - **[FEAT]** **Navegación e Interacción:** Unificada la grilla de personal con la de equipos eliminando el botón 'Editar', haciendo la fila cliqueable y añadiendo el chevron de navegación.
  - **[FEAT]** **Descarga de PDFs:** Habilitados botones para abrir de forma directa los archivos PDF reales del personal almacenados en el servidor Centos.

## [Backend GSP] - Versión 1.0.12
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 17:52:59 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Normalización de Parámetros:** Corregida la utilidad `dbQuery` para sanitizar el prefijo de guion bajo en parámetros como `_id_empresa` y evitar excepciones de Postgres.
  - **[FIX]** **Acreditación Model:** Corregido el mapeo de certificados de personal cambiando `cp.documento_url` por la columna real `cp.id_doc` en PostgreSQL.
  - **[FEAT]** **Semáforos HSEC:** Implementados los cuatro estados de alertas de vigencias HSEC (Verde, Amarillo, Rojo, Gris) idénticos a los criterios de flota de equipos.
  - **[FEAT]** **Carga de Archivos Históricos:** Ejecutada subida automatizada vía SSH de los 287 archivos PDF reales de trabajadores registrando su respectivo `id_doc` en Postgres.

## [Portal Web GSP] - Versión 1.0.11
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 15:55:39 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Expediente de Personal:** Rediseño del modal de edición del especialista liberando el 100% de la columna derecha para los certificados y trasladando la carga de archivos a un sub-modal flotante blur.
  - **[FEAT]** **Navegación e Interacción:** Unificada la grilla de personal con la de equipos eliminando el botón 'Editar', haciendo la fila cliqueable y añadiendo el chevron de navegación.
  - **[FEAT]** **Descarga de PDFs:** Habilitados botones para abrir de forma directa los archivos PDF reales del personal almacenados en el servidor Centos.

## [Backend GSP] - Versión 1.0.11
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 15:55:39 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Acreditación Model:** Corregido el mapeo de certificados de personal cambiando `cp.documento_url` por la columna real `cp.id_doc` en PostgreSQL.
  - **[FEAT]** **Semáforos HSEC:** Implementados los cuatro estados de alertas de vigencias HSEC (Verde, Amarillo, Rojo, Gris) idénticos a los criterios de flota de equipos.
  - **[FEAT]** **Carga de Archivos Históricos:** Ejecutada subida automatizada vía SSH de los 287 archivos PDF reales de trabajadores registrando su respectivo `id_doc` en Postgres.

## [Portal Web GSP] - Versión 1.0.10
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 11:49:12 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Layout Público GSP:** Configurado el router-view en App.vue para renderizar de manera limpia la ficha pública sin layouts de barra lateral o cabeceras de la consola.
  - **[FIX]** **Ficha Equipo GSP:** Reescrita FichaEquipoPublica.vue para que consuma de manera nativa los endpoints de flota y certificados del backend de GSP en vez de Transmac, ajustando el pie de página.

## [Backend GSP] - Versión 1.0.10
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-22 11:49:12 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP.

## [Portal Web GSP] - Versión 1.0.9
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:28:54 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Layout Público GSP:** Configurado el router-view en App.vue para renderizar de manera limpia la ficha pública sin layouts de barra lateral o cabeceras de la consola.
  - **[FIX]** **Ficha Equipo GSP:** Reescrita FichaEquipoPublica.vue para que consuma de manera nativa los endpoints de flota y certificados del backend de GSP en vez de Transmac, ajustando el pie de página.

## [Backend GSP] - Versión 1.0.9
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:28:54 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP.

## [Portal Web GSP] - Versión 1.0.8
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:21:39 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Ficha QR Pública GSP:** Corregida la URL del código QR para redireccionar al portal de GSP (/lg-gsp-dev/equipo/{patente}) en lugar de Transmac.
  - **[FIX]** **Coherencia Tipográfica en Vista 360:** Normalizados los pesos de letra (reemplazando font-black por font-bold) y removidas cursivas e imposiciones de mayúsculas en marca/modelo para alinearse estéticamente con el modal de edición.

## [Backend GSP] - Versión 1.0.8
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:21:39 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP para propagar las correcciones del modelo de flota.

## [Portal Web GSP] - Versión 1.0.7
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:13:15 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.7
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 13:13:15 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.6
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:50:43 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.6
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:50:43 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.5
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:46:06 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.5
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:46:06 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.4
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:39:32 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro Multi-Empresa Reactivo:** Vinculado el selector de empresa de la barra superior con las consultas de proyectos de la Torre de Control, incorporando la opción 'Todas las empresas'.
  - **[FEAT]** **CRUD de Equipos y Certificados:** Integrado el nuevo modal unificado `ModalCrearEditarEquipo.vue` para el registro, edición de maquinaria y carga/gestión digital de sus documentos en la Vista 360.

## [Backend GSP] - Versión 1.0.4
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:39:32 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Filtro de Empresa Dinámico:** Ajustado el controlador de proyectos para permitir consultar el total consolidado de empresas cuando se selecciona 'all'.
  - **[FEAT]** **API de Equipos normalizada:** Actualizado el backend de equipos para persistir campos técnicos normalizados de la migración y proveer catálogo de tipos de certificados.

## [Portal Web GSP] - Versión 1.0.3
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:16:14 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Independización del Tema en Consola:** Reemplazada la clave genérica 'theme' por 'gsp-theme' en el localStorage del portal para evitar interferencias estéticas (menú lateral en color blanco) causadas por la selección de tema en aplicaciones hermanas del mismo dominio.

## [Backend GSP] - Versión 1.0.3
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 12:16:14 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Mantenimiento:** Sincronizado el reinicio del servidor de backend de GSP.

## [Portal Web GSP] - Versión 1.0.2
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 11:59:30 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FIX]** **Eliminación de Mapas en Cotizaciones:** Ocultado el elemento gráfico del mapa Yandex en la previsualización e impresión de cotizaciones para mostrar exclusivamente Latitud y Longitud en formato de texto.
  - **[FEAT]** **Tabla de Estructurador de Servicios:** Integrado el desglose completo de líneas de servicio (Tarifas Comerciales) y totales de cotización en el reporte de impresión de cotizaciones.

## [Backend GSP] - Versión 1.0.2
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-21 11:59:30 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Estructurador de Servicios:** Sincronizado el segmento estructurador y las líneas de servicio cotizadas reales en la creación de cotizaciones.

## [Portal Web GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:32:50 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Semáforos por Máxima Severidad:** Implementada agregación por riesgo (Rojo > Amarillo > Verde > Gris).
  - **[FIX]** **URL Singular de Archivos:** Ajustada la ruta de previsualización a `/api/archivo/ver/:id`.

## [Backend GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:32:50 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Evaluación SQL en `tequEquipoModel.getEquipos()`:** Agregada evaluación por máxima severidad en la carga inicial de flota.
  - **[FEAT]** **Endpoint de Archivos Físicos:** Expuesta la ruta `/api/archivo/ver/:id` leyendo de `/u05/LeanDocs/GSP/Equipos/`.

## [Portal Web GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:20:00 (-04:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Semáforos de Severidad Estricta en Flota:** Implementado cálculo dinámico en PostgreSQL que asigna estados por máxima severidad: Rojo (Vencido < HOY), Amarillo (Alerta <= 30 días), Verde (Vigente > 30 días) y Gris (Sin Documentos ✕).
  - **[FIX]** **Ruta de Visualización de Documentos:** Corregida la URL de previsualización en `Vista360.vue` al prefijo singular `/api/archivo/ver/:id` para abrir de forma directa los PDFs escaneados desde `/u05/LeanDocs/GSP/Equipos/`.
  - **[FEAT]** **Sincronización de KPIs y Filtros:** Actualizadas las tarjetas del encabezado ("Total Flota", "A Vencer", "Vencidos") y botones de filtro para considerar la severidad combinada de certificados legales y generales.

## [Backend GSP] - Versión 1.0.1
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-07-20 22:20:00 (-04:00)
- **Proceso PM2:** `lean-services-gsp` (ID 10)
- **Ruta Remota:** `/home/nodeadmin/proyectos/lean-services-gsp`
- **Detalle de Mejoras y Cambios:**
  - **[FEAT]** **Evaluación SQL en `tequEquipoModel.js`:** Incorporadas expresiones `CASE` con `FILTER (WHERE ...)` en la función `getEquipos()` para calcular el semáforo `estado_doc_legal` y `estado_doc_gral` directamente en la base de datos PostgreSQL.
  - **[FEAT]** **Servicio de Lectura de Archivos:** Incorporado `verArchivoById` en `archivoController.js` y expuesto `/api/archivo/ver/:id` en `archivoRoutes.js`.
