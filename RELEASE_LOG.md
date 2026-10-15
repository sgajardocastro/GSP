# 🏛️ REGISTRO DE LIBERACIONES Y MEJORAS (RELEASE LOG) - GRÚAS SAN PABLO (GSP)

Este archivo contiene el historial detallado de versiones y mejoras liberadas en los ambientes del Ecosistema GSP (Web, PWA y Backend).

## [PWA GSP] - Versión 1.0.43
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 22:05:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1044` (Incidencia Terreno OT 16 / Soporte Robert Rodríguez)
- **Especificación Técnica:** PWA GSP v1.0.43: Resiliencia Operativa Report Diario, Hora de Inicio Rectificable en Terreno y Navegación Flexible a Momento 2:
  1. **Hora de Inicio Rectificable en Terreno (`ReportDiarioIzaje.vue`):**
     - Sustitución del texto estático de solo lectura `form.hora_inicio` por un campo interactivo `<input type="time">` con badge visual `✏️ Hora Rectificable`.
     - Permite al operador ajustar con exactitud su hora real de llegada a faena (p. ej. 08:30 hrs) al momento de cerrar la jornada vespertina, sin quedar atado a valores por defecto o discrepancias del inicio de faena.
  2. **Navegación Flexible a Momento 2 sin Bloqueo de Horómetro Base (`ReportDiarioIzaje.vue`):**
     - En `irAMomento2()`, si el horómetro de inicio no fue capturado o se desincronizó en el dispositivo, el sistema toma automáticamente el `horometro_base` del equipo seleccionado (`equipoSeleccionado.horometro_base`) en vez de bloquear al operador con advertencias de error, permitiéndole avanzar a Momento 2 y proceder a la captura del horómetro de término y firmas FES con el mandante.
  3. **Regularización Operativa Base de Datos Producción (`sch_leangsp_prod`):**
     - Eliminación de registro huérfano ID 15 y ajuste de correlativo del reporte emitido ID 17 a `dia_correlativo = 2` para la OT 16 (`GSP-2610-233-016`).
     - Vinculación canónica del equipo `DZXL.21-0` (ID 33) y del operador Robert Rodríguez (ID 49) a la OT 16 en `tpry_rel_equipo`, `tpry_rel_persona` y `tedp_reporte_avance`, dejando la OT lista para emitir el Día 3 sin anomalías.
  4. **Gobernanza y Hard Gate:**
     - Elevación SemVer a `v1.0.43` en `package.json`, registro en `Gestión/tareas.md` (`REQ-1044`), sincronización en PostgreSQL (`tcfg_backlog` y `tcfg_releases`) en `sch_leangsp` y `sch_leangsp_prod`, y despliegue certificado en DEV y PROD con HTTP 200 OK.

## [Portal Web GSP] - Versión 1.0.137
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 20:55:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1036`, `REQ-1037`, `REQ-1038` (Spec 16 — Sección 15)
- **Especificación Técnica:** Portal Web GSP v1.0.137: Parametrización Multi-Empresa de Contrato de Plataformas, Título Explícito `(Plataforma)` y Fecha de Término Exacta (Erradicación de `"A CONVENIR"`):
  1. **Parametrización Multi-Empresa del Arrendador y del Cliente Arrendatario (`REQ-1036`):**
     - Selector interactivo en pestaña `CONTRATO` de `GestorOportunidades.vue` para elegir libremente cualquiera de las 4 razones sociales del holding (`11: Royal Rental`, `9: Grúas San Pablo`, `7: Bestmaq`, `8: Logística del Sur`) sin restricción por empresa emisora original, permitiendo arrendar plataformas bajo la empresa donde el cliente posea línea de crédito o registro de proveedor activo.
     - Resolución dinámica de logo en Base64, razón social, RUT y domicilio legal del arrendador y arrendatario en `proyectoModel.js` y `proyectosController.js`.
  2. **Título Explícito con `(Plataforma)` en UI, PDF y Notificaciones (`REQ-1037`):**
     - Actualización de encabezados en `GestorOportunidades.vue`, `FirmarContratoView.vue`, notificaciones por correo/WhatsApp (`proyectosController.js`) y PDF de 2 páginas (`proyectoModel.js`) a `CONTRATO DE ARRENDAMIENTO DE MAQUINARIA (PLATAFORMA)`, `CONDICIONES GENERALES DE ARRIENDO (PLATAFORMA)`, `ANEXO CONTRATO DE ARRENDAMIENTO (PLATAFORMA)` y `CONDICIONES PARTICULARES DE ARRIENDO DE MAQUINARIA (PLATAFORMA)`.
  3. **Fecha de Término Explícita y Erradicación de `"A CONVENIR"` (`REQ-1038`):**
     - Incorporación de selectores de `Fecha Inicio Arriendo` y `Fecha Término Exacta` en `GestorOportunidades.vue`, auto-hidratados desde las fechas y plazos (días/meses) de la cotización comercial, con validación obligatoria previa a previsualizar o despachar el contrato.
     - Erradicación definitiva del literal `'A CONVENIR'` en `proyectoModel.js` y formateo explícito `DD-MM-YYYY`, resguardando íntegramente el rigor de las 14 cláusulas contractuales.
  4. **Gobernanza y Hard Gate:**
     - Elevación SemVer a `v1.0.137` en `package.json`, registro en `Gestión/tareas.md`, sincronización en PostgreSQL (`tcfg_backlog` y `tcfg_releases`) en `sch_leangsp` y `sch_leangsp_prod`, y despliegue certificado en DEV y PROD con HTTP 200 OK.

## [Portal Web GSP] - Versión 1.0.136
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 18:55:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1040`, `REQ-1041`, `REQ-1043` (SPEC-077 & SPEC-078)
- **Especificación Técnica:** Portal Web GSP v1.0.136: Rectificación de Operador/Rigger en Reportes Emitidos (Caso Tensacon), Tab Viático Alimentación y Apertura Detallada de Costos en Resumen Ejecutivo de ITS Final:
  1. **Rectificación de Operador y Rigger en Reportes Diarios, Asignación OT e ITS (`REQ-1043` / SPEC-077):**
     - **Rectificación Unitaria (`reportDiarioController.js`, `ModalVisorReport.vue`):** Endpoint `PUT /api/reports/:idReporte/rectificar-personal` y panel interactivo en el visor del reporte diario para corregir Operador y/o Rigger en un reporte específico con motivo de auditoría en `datos_operacion_json.historial_rectificaciones_personal`.
     - **Propagación Masiva desde OT (`reportDiarioController.js`, `GestorOportunidades.vue`):** Endpoint `POST /api/reports/proyecto/:idProyecto/propagar-personal` y opción de propagación retroactiva por rango de fechas (`Desde` / `Hasta`) al guardar la asignación de recursos de la OT.
     - **Refresco Automático en ITS (`itsController.js`):** Actualización de `id_user_operador` en jornadas existentes del ITS en estado `BORRADOR` / `RECHAZADO` al abrir la liquidación.
  2. **Tab "Viático Alimentación" en Sección 3 de Costos del ITS Final (`REQ-1040` / SPEC-078):**
     - Incorporación de la categoría `alimentacion` (`ALIMENTACION`) como primer tab de la Sección 3 de `ModalITS.vue` (10 categorías auditables), con formato idéntico al ITS de Transición (`Fecha`, `Nombre Personal`, `Concepto`, `Monto ($)` y `Declarar Sin Costo`), manteniendo intacto el tab de `Pensiones`.
  3. **Apertura Detallada en Resumen Ejecutivo de ITS Final (`REQ-1041` / SPEC-078):**
     - Desglose completo de **A. Resumen de Ingresos Totales (Venta)** y **B. Resumen de Costos Operacionales (Egresos)** con monto (`$`) y `% sobre la Venta` por cada categoría en la Sección 4 de `ModalITS.vue` y en la Sección 2 del PDF oficial (`itsPdfService.js`).
  4. **Gobernanza y Hard Gate:**
     - Elevación SemVer a `v1.0.136` en `package.json`, registro en `Gestión/tareas.md`, sincronización en PostgreSQL (`tcfg_backlog` y `tcfg_releases`) en `sch_leangsp` y `sch_leangsp_prod`, y despliegue certificado en DEV y PROD con HTTP 200 OK.

## [Portal Web GSP] - Versión 1.0.135
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 15:30:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1042` (SPEC-076)
- **Especificación Técnica:** Portal Web GSP v1.0.135: Optimización Diagramación Contratos 2 Páginas y UI Consola Web:
  1. **Diagramación Continua y Paginación Optimizada 2 Páginas (`proyectoModel.js`):**
     - Erradicación definitiva de cortes de página rígidos y artificiales que dejaban más del 60% de espacios en blanco por carilla.
     - **Página 1:** Encabezado con logo corporativo + 14 cláusulas legales íntegras en formato de doble columna legal (`column-count: 2`) + Cuadro formal de comparecencia y firmas (FES digital Arrendatario y Arrendador).
     - **Página 2:** Anexo de Condiciones Particulares con tabla comparativa de las partes, individualización técnica de la maquinaria (Serie, Motor, Modelo, Marca, Año, Propietario), condiciones operativas (plazos, tarifas, lugar faena, mantenimiento, observaciones) y cuadro de conformidad de las partes.
  2. **Actualización de Etiquetas UI (`GestorOportunidades.vue` y `FirmarContratoView.vue`):**
     - Botón de previsualización en CRM actualizado a `[ Previsualizar (2 Págs) ]`.
     - Título de sección de maquinaria actualizado a `(Anexo Pág 2)`.
     - Encabezado de visor en pantalla de firma actualizado a `📜 Texto Íntegro del Contrato (2 Páginas)`.
  3. **Gobernanza y Hard Gate:**
     - Elevación SemVer a `v1.0.135` en `package.json`, registro en `Gestión/tareas.md` (`REQ-1042`), sincronización en base de datos PostgreSQL (`tcfg_backlog` y `tcfg_releases`) en `sch_leangsp` y `sch_leangsp_prod`, y verificación empírica de 2 páginas con HTTP 200 OK en DEV y PROD.

## [Portal Web GSP] - Versión 1.0.134
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 14:55:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1041` (SPEC-076)
- **Especificación Técnica:** Portal Web GSP v1.0.134: Almacenamiento Canónico LG-Storage, Previsualización Resiliente Anti-Popups y Despacho Dual de Contratos:
  1. **Almacenamiento Canónico LG-Storage (`proyectoModel.js`):**
     - Integración de `buildStoragePath('GSP', 'contratos')` y `STORAGE_ROOT` (`/u05/LeanDocs/`).
     - Almacenamiento físico de los contratos en `/u05/LeanDocs/GSP/{env}/contratos/{YYYY}/{MM}/{folio}.pdf` y registro en `tfmg_file.path_doc` con la ruta relativa POSIX estándar.
     - Preservación de copia de seguridad local en `public/contratos/` para retrocompatibilidad total.
  2. **Resolución Resiliente y Fallback Multi-Directorio (`storageConfig.js` y `archivoController.js`):**
     - Incorporación de soporte y candidateDirs para contratos en DEV y PROD.
     - Detección determinista de rutas físicas tanto bajo `/u05/LeanDocs/` como en `public/contratos/`, subsanando el error 404 en `/api/archivo/ver/1467`.
  3. **Previsualización Resiliente Anti-Bloqueo de Popups (`GestorOportunidades.vue`):**
     - Apertura preventiva de pestaña previa a la llamada asíncrona de compilación (`wkhtmltopdf`), evitando el bloqueo nativo de popups en Chrome/Safari.
     - Feedback reactivo de carga en el botón `[ Previsualizar (4 Págs) ]` con spinner y estado disabled durante la generación.
  4. **Despacho Dual y WhatsApp Web Directo:**
     - Botón `[ 💬 WhatsApp Web ]` directamente interactivo con auto-despacho y sanitización telefónica E.164 (`569...`), permitiendo envío inmediato sin retrasos de cifrado E2E de WhatsApp.
  5. **Gobernanza y Hard Gate:**
     - Versión `v1.0.134` en `package.json`, registro en `Gestión/tareas.md` (`REQ-1041`), sincronización en base de datos PostgreSQL (`tcfg_backlog` y `tcfg_releases`) en `sch_leangsp` y `sch_leangsp_prod`, y certificación HTTP 200 OK en DEV y PROD.

## [Portal Web GSP] - Versión 1.0.133
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 14:20:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1040` (SPEC-074)
- **Especificación Técnica:** Portal Web GSP v1.0.133: Estabilización Taller Enterprise: Resolución Multi-Esquema de Técnicos (42 Usuarios), Alerta Roja de Parada de Máquina en Terreno, Banner de Avisos en Bandeja de OTs y Auto-Refresco Reactivo en Consola Web:
  1. **Resolución Multi-Esquema de Técnicos (`mantenimientoModel.js`):**
     - Eliminación de prefijo hardcodeado `sch_leangsp.` en consulta `getTecnicos` y soporte multi-tenant `WHERE (u.id_empresa = $1 OR u.id_empresa IS NULL) AND u.activo = true`.
     - Carga exitosa de los 42 miembros del equipo de GSP ordenados por categoría de taller en los selectores de OTM de la PWA móvil y consola web.
  2. **Tira de Alerta Roja Superior en Consola Web (`MantenimientoView.vue`):**
     - Detección inmediata de avisos de avería en terreno pendientes. Despliegue de banner rojo prioritario si existe `PARADA_MAQUINA` con botón de acción directa `[Atender Aviso ➔]`.
  3. **Banner Informativo en Bandeja de OTs:**
     - Callout destacado sobre los filtros de OTs que notifica de avisos pendientes listos para su conversión a orden de trabajo.
  4. **Sincronización Reactiva Automática (Auto-Polling):**
     - Ejecución en segundo plano cada 30 segundos (`setInterval`) para mantener la consola sincronizada en tiempo real con lo reportado en faena desde la PWA.
  5. **Gobernanza y Hard Gate:**
     - Elevación SemVer a `v1.0.133` en `package.json`, registro en `Gestión/tareas.md` (`REQ-1040`), registro en base de datos PostgreSQL (`tcfg_backlog` y `tcfg_releases`) en `sch_leangsp` y `sch_leangsp_prod`, y certificación HTTP 200 OK en DEV y PROD.

## [PWA GSP] - Versión 1.0.42
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 13:50:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1038` (SPEC-073)
- **Especificación Técnica:** PWA GSP v1.0.42: Rediseño Modular Taller Móvil (Patrón Operación), Acceso Prioritario Google Workspace SSO, Eliminación de Surveys Residuales, Habilitación de Concurrencia de OTMs en Flota y Migración DDL Mantenimiento Enterprise en Producción:
  1. **Acceso Prioritario con Google Workspace SSO (`Login.vue`):**
     - Botón corporativo oficial de inicio de sesión con Google Workspace (`@arriendosanpablo.cl`) colocado en primer plano protagónico.
     - Formulario tradicional de usuario y contraseña subordinado y colapsable mediante enlace discreto para contingencias de conectividad o soporte técnico.
  2. **Rediseño Modular Canónico en 3 Bloques (`TallerHomeView.vue`):**
     - Adopción íntegra de la arquitectura visual de la pestaña Operación (`Surveys.vue`) estructurada en 3 tarjetas modulares con barra de acento superior, íconos temáticos y chips de estado:
       - *Bloque 1: APERTURA DE TRABAJOS* ➔ **Nueva Orden de Trabajo (OTM)** (Botón ancho full-width `➕ Abrir Nueva Orden de Trabajo (OTM) ➔` con modal y autocompletado reactivo de flota).
       - *Bloque 2: ALERTAS DE TERRENO* ➔ **Aviso de Avería / Falla** (Botón ancho full-width `🚨 Reportar Falla o Avería Urgente ➔` con captura fotográfica in situ).
       - *Bloque 3: TRABAJOS EN CURSO* ➔ **Bandeja de OTMs Activas** (Buscador reactivo integrado por patente, código interno o síntoma, chips de estado `Todas`, `En Proceso` y `Abiertas`, y listado directo de órdenes con botón `Atender OT ➔`).
  3. **Erradicación Total de Sección de Surveys Residuales:**
     - Eliminación definitiva del bloque `"Inspecciones Obligatorias de Grúa (Surveys)"` (Checklists 501 y 502) que generaba confusión operativa.
  4. **Habilitación de Concurrencia de OTMs en Backend (`mantenimientoModel.js`):**
     - Supresión del error bloqueante `EQUIPO_CON_OT_ACTIVA` en `crearOt`. El sistema ahora permite registrar y gestionar múltiples órdenes de trabajo activas en paralelo para una misma máquina.
  5. **Migración DDL Mantenimiento Enterprise en Producción (`sch_leangsp_prod`):**
     - Creación de tablas operativas faltantes en Producción: `tmnt_aviso`, `tmnt_hallazgo`, `tmnt_pauta_tarea`, `tmnt_ot_estado_log`, `tmnt_ot_survey` y `tmnt_parametro`.
     - Alteración de `tequ_equipo` y `tmnt_ot` con columnas operacionales (`tiene_doble_horometro`, `estado_mnt`, `prioridad`, `equipo_detenido`).
     - Sincronización masiva de horómetros y odómetros en los 110 equipos de la flota productiva.
  6. **Gobernanza y Hard Gate:**
     - Bump a `v1.0.42` en `package.json`, registro en `Gestión/tareas.md` (`REQ-1038`), sincronización en base de datos PostgreSQL (`sch_leangsp` y `sch_leangsp_prod`), compilación limpia Vite/Vue CLI (0 errores) y despliegue certificado con HTTP 200 OK en DEV y PROD.

## [Portal Web GSP] - Versión 1.0.132
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 13:20:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1039` (TSK-COT-05 / SPEC-016)
- **Especificación Técnica:** Portal Web GSP v1.0.132: Hotfix & Estabilidad Módulo de Contrato de Arriendo: Visor Completo de Documento (4 Páginas), Despacho Omnicanal Automático (Cliente + CC Ejecutivo + WhatsApp) y Sincronización de Esquema Backend:
  1. **Visor Completo del Contrato en Portal Público Móvil (`FirmarContratoView.vue`):**
     - Despliegue visual estructurado e íntegro de las 4 páginas del contrato de arrendamiento (Págs 1 a 3 con las 14 cláusulas legales exhaustivas y tabla comparativa; Pág 4 con Anexo de Condiciones Particulares y ficha técnica de la máquina) para lectura obligatoria del cliente antes de firmar.
     - Incorporación de botón destacado `[📥 Descargar Borrador PDF]` para revisión legal externa previa.
     - Casilla de verificación de consentimiento legal obligatorio: *"He leído atentamente y acepto íntegramente las 14 cláusulas del contrato de arrendamiento y sus condiciones particulares"*.
  2. **Centro de Despacho Omnicanal Automático (`POST /api/proyectos/:id/contrato/despachar`):**
     - Sustitución de copia manual de enlace por envío automatizado y simultáneo vía Nodemailer y microservicio WhatsApp Baileys:
       - **Correo al Cliente:** Plantilla B2B formal con logo institucional del emisor, individualización de la maquinaria y botón `[ 📝 REVISAR Y FIRMAR CONTRATO DIGITAL ]`.
       - **Copia al Ejecutivo Comercial (CC):** Despacho automático a la casilla del vendedor asignado (`crm.vendedor_email` o usuario logueado).
       - **WhatsApp al Mandante:** Mensaje formal directo con enlace seguro al portal público de firma.
       - **Respaldos de Contingencia:** Botones secundarios para apertura directa de WhatsApp Web y copiado de enlace al portapapeles.
  3. **Auto-Sincronización en CRM Preventa (`GestorOportunidades.vue`):**
     - Sincronización automática de Nombre, RUT, Cargo, ✉️ Correo Electrónico y 📱 Teléfono Móvil desde el contacto seleccionado en la oportunidad comercial.
  4. **Alineación de Esquema y Módulos Backend:**
     - Corrección de columnas SQL en consultas a `tpry_proyecto` (`codi_proyecto`, `nombre_proyecto`, `tpar_empresas`).
     - Importación formal de módulos `path`, `fs`, `child_process.exec` y `archivoModel` en `proyectoModel.js` para firma FES determinista con `wkhtmltopdf`.
     - Retorno de `html_contrato` en `obtenerContratoPorToken` para alimentación reactiva del visor público.
  5. **Gobernanza y Hard Gate:**
     - Elevación SemVer a `1.0.132` en `package.json`, registro en `Gestión/tareas.md` (Tarea 20 / `REQ-1039`) e inserción en `tcfg_backlog` y `tcfg_releases` (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.131
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-14 11:37:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1037` (TSK-COT-04 / SPEC-016)
- **Especificación Técnica:** Portal Web GSP v1.0.131: Módulo Oficial de Contrato de Arrendamiento y Formalización FES/Física en Preventa Comercial:
  1. **Sustitución de Pestaña Bitácora & Alertas por Contrato & Formalización:**
     - Eliminación de la 5ª pestaña inerte en el CRM `GestorOportunidades.vue` e integración de un panel completo para la emisión, seguimiento y formalización de contratos de arrendamiento de maquinaria (plataformas de elevación, alzahombres, grúas).
  2. **Motor Determinístico de Generación PDF de 4 Páginas (`wkhtmltopdf`):**
     - Compilación estándar en `proyectoModel.js` con las 4 páginas requeridas: Págs 1 a 3 con las 14 cláusulas legales exhaustivas y tabla comparativa de comparecencia (Holding Arrendador vs Mandante Arrendatario); Pág 4 con el Anexo de Condiciones Particulares e individualización de la maquinaria (Serie, Motor, Modelo, Marca, Año, Faena, Tarifa pactada). Cumplimiento estricto del estándar de la empresa con `xvfb-run wkhtmltopdf`.
  3. **Portal Móvil de Firma Digital FES (`FirmarContratoView.vue`):**
     - Portal público móvil responsive con Touch Canvas HTML5 para que el mandante firme con el dedo desde su celular (`/#/firmar-contrato?token=...`).
     - Token criptográfico de seguridad de un solo uso con vigencia de 72 horas, estampado de firma en PDF, registro de auditoría legal (IP, User-Agent, fecha/hora) y descarga inmediata del PDF suscrito.
  4. **Soporte de Firma Física / Manual Tradicional:**
     - Botón de descarga de PDF pre-llenado para impresión tradicional en papel y formulario de carga de documento escaneado/fotografiado con guardado en `tfmg_file`.
  5. **Gobernanza y Hard Gate:**
     - Registro formal en `sch_leangsp.tcfg_backlog` y `sch_leangsp_prod.tcfg_backlog` (`REQ-1037`), sincronización en `tcfg_releases` (`1.0.131`) y verificación HTTP 200 OK en DEV y PROD.

## [Portal Web GSP] - Versión 1.0.130
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-13 19:58:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1031`, `REQ-1032`, `REQ-1033`, `REQ-1034`, `REQ-1035`, `REQ-1036`
- **Especificación Técnica:** Portal Web GSP v1.0.130: Soporte Comercial CRM: Flexibilización de Viáticos, Camión Plataforma y Cotizador PDF Paramétrico (SPEC-075):
  1. **Flexibilización de Viáticos y Alimentación en Servicios de 1 Día (REQ-1031 / TSK-SOP-01):**
     - Se eliminó el bloqueo y el forzado automático a `'NA'` en el bloque de pensiones/viáticos cuando el servicio es de 1 jornada. Los ejecutivos comerciales ahora pueden definir con total libertad si el cliente costea o no el almuerzo, desayuno, cena o traslado, reflejándose en la cotización comercial.
  2. **Incorporación de Subcategoría "Camión Plataforma" en Traslados (REQ-1032 / TSK-SOP-02):**
     - Se integró la subcategoría `CAMIÓN PLATAFORMA` (ID 905) bajo la categoría `TRASLADOS` (99). En la asignación de equipos de la línea de oportunidad, se filtran automáticamente camiones planos y ramplas de transporte para el traslado de alzahombres y plataformas articuladas.
  3. **Protección Anti-Autofill del Navegador en Formulario CRM (REQ-1033 / TSK-SOP-03):**
     - Se resolvieron los incidentes donde Chrome sobrescribía o eliminaba el teléfono y datos del contacto al buscar clientes mediante atributos `autocomplete="new-password"`, `data-lpignore="true"` y nombres de campos desambiguados.
  4. **Metadatos de Ejecutivo Comercial y Fono en PDF Oficial (REQ-1034 / TSK-COT-01):**
     - El encabezado de la cotización formal en PDF ahora incluye dinámicamente el nombre completo y teléfono directo del ejecutivo comercial responsable (`crm.vendedor_nombre` o usuario asignado en `tsec_users`), agilizando el contacto directo de los mandantes.
  5. **Parametrización y Branding Dinámico de Empresa Emisora (REQ-1035 / TSK-COT-02):**
     - Se corrigió la resolución de la empresa emisora en el backend (`proyectoModel.js`), vinculando la columna real `tpry_proyecto.id_empresa` con `tpar_empresas` y el diccionario paramétrico de emisores (Royal Rental `11`, Bestmaq `7`, Logística del Sur `8`, San Pablo `9`), desplegando el membrete, razón social, RUT y logo oficial correspondiente.
  6. **Supresión de Cláusula de Régimen Urbano en Caso 5 (REQ-1036 / TSK-COT-03):**
     - En cotizaciones tipo Caso 5 (Partidas Abiertas / Alzahombres y Plataformas), se suprime la cláusula de régimen urbano (≤ 30 km) y se cataloga operacionalmente como `ESPECIAL / PLATAFORMAS (Partidas Abiertas)`.

## [Portal Web GSP] - Versión 1.0.129
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-13 11:55:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-633`, `REQ-704`, `REQ-735`
- **Especificación Técnica:** Portal Web GSP v1.0.129: Mejoras de Usabilidad en Estructurador CRM: Selector de Tonelaje (10T), Formato Monetario y Descripciones Limpias (SPEC-074):
  1. **Selector de Tonelaje en Saltos de 10T (REQ-633):**
     - En `getSubcategoriesForType`, para categoría `GRUAS TELESCOPICAS`, se despliega el listado completo y ordenado numéricamente de 10 en 10 toneladas (40T, 50T, 55T, 60T, 70T, 75T, 80T, 90T, 100T, ..., 400T), resolviendo la restricción que impedía cotizar tonelajes nominales específicos y eliminando el desorden alfabético.
  2. **Formato Monetario con Separador de Miles (REQ-704):**
     - Formateo reactivo en inputs de precio/valor unitario con adornador `$`, separación de miles con punto (`es-CL`) y prevención de errores de digitación en Preventa Comercial y visualización en Operaciones.
  3. **Descripciones Limpias y Validación Obligatoria (REQ-735):**
     - Inicialización limpia de líneas con placeholder instructivo, ensanchamiento de columna a 280px y validación bloqueante antes de guardar en Preventa y cotizar formalmente.

## [Portal Web GSP] - Versión 1.0.128
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-13 11:22:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1030`
- **Especificación Técnica:** Portal Web GSP v1.0.128: Tipificación y Edición Libre de Trayectos de Viaje en ITS Transición y Desacoplamiento DEV/PROD (SPEC-066 Master):
  1. **Edición Libre y Sugerencias de Trayectos en Reporte de Costos:**
     - En jornadas operativas (`costos.jornadas`), se reemplazó el selector rígido por un control interactivo de entrada libre (`<input v-model="j.tipo_servicio" list="tipos-servicio-jornada-list" ... />`) permitiendo ingresar cualquier texto descriptivo.
     - Se incorporó la lista de sugerencias rápidas (`datalist`) con: `Ida y Vuelta`, `Solo Ida`, `Solo Vuelta`, `Flete Ida y Vuelta`, `Flete Solo Ida`, `Flete Solo Retorno`, `Hora`, `Fijo` y `Standby`.
     - En la subtabla de traslado (`costos.horas_traslado`), se vinculó `<datalist id="conceptos-traslado-list">` con opciones análogas de trayecto (`Chofer Cama Baja (Solo Ida / Solo Vuelta / Ida y Vuelta)`, `Tracto Contrapesos (...)`, `Traslado (...)`) y edición libre.
  2. **Desacoplamiento Estricto de Entornos DEV y PROD:**
     - Compilación y empaquetado diferenciado: `npm run build:dev` para DEV (apuntando a `/lg-gsp-dev/`) y `npm run build` para PROD (apuntando a `/lg-gsp-prod/`).
     - Erradicación definitiva del bucle de redirección hacia PROD al ingresar a rutas de DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/its-transicion`).
  3. **Consolidación de Informes en Producción:**
     - Sincronización íntegra de los 14 borradores de Yiara y los 4 informes de Jorge Ponce, consolidando 19 informes en la base de datos de producción (`sch_leangsp_prod.tits_transicion_historial`).

## [Portal Web GSP] - Versión 1.0.127
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-13 10:15:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1029`
- **Especificación Técnica:** Portal Web GSP v1.0.127: Asistente Automático de Migración de Informes Locales a la Nube PostgreSQL (SPEC-066 Master):
  1. **Backup Preventivo Inmutable:** Creación automática de copia local inmutable (`its_transicion_historial_backup_seguridad`) para blindar los datos locales de cada usuario contra pérdidas accidentales.
  2. **Detección Determinista de Pendientes:** Escaneo inteligente en cliente que compara registros locales contra la base de datos de producción (`/operaciones/its/transicion/list`).
  3. **Banner Superior No Invasivo:** Visualización del conteo de informes locales no compartidos con detalle de cotizaciones detectadas.
  4. **Migración por Lotes con 1 Clic:** Subida masiva asistida a PostgreSQL mediante `POST /operaciones/its/transicion/save` asociando elaborador, jornadas y costos completos.
  5. **Herramienta de Respaldo JSON:** Descarga directa de archivo `.json` con los informes locales como salvaguarda adicional.

## [Portal Web GSP] - Versión 1.0.126
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-13 09:40:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1028`
- **Especificación Técnica:** Portal Web GSP v1.0.126: Colaboración Universal, Visibilidad Multi-Usuario y Autoguardado en Nube de Informes de Término de Servicio (ITS Transición) (SPEC-066 Master):
  1. **Autoguardado Inmediato en Servidor:**
     - Al seleccionar y comenzar a elaborar un ITS desde la Matriz Operativa de Conciliación, se registra de inmediato el estado `BORRADOR` en PostgreSQL (`tits_transicion_historial`) con el usuario en sesión (`id_usuario_elaborador`).
  2. **Trazabilidad en Vivo en Matriz de Conciliación:**
     - Despliegue del autor en el badge de estado (`🟡 BORRADOR (👤 [Nombre])`) y habilitación del botón `[✏️ Continuar]` accesible para toda la organización.
  3. **Backend Controller Enriquecido:**
     - Integración de joins en `listarItsTransicion` (`tsec_users`) para resolver identidades legibles de elaborador, verificador y aprobador.
  4. **Erradicación de Silenciamiento de Errores y Aislamiento Local:**
     - Validación estricta de respuesta en `guardarInformeConEstado` y centralización de observaciones en `data_json` de PostgreSQL.
  5. **Gobernanza:** Sincronización en `Gestión/tareas.md` (`REQ-1028`), `package.json` (`v1.0.126`) y compilación limpia Vite 0 errores.

## [Portal Web GSP] - Versión 1.0.125
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-11 19:50:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-1027`
- **Especificación Técnica:** Portal Web GSP v1.0.125: Visualización de Evidencias Iniciales (Antes), Cierre con Evidencias de Solución (Después), Resolución Técnica de Hallazgos en Subtab de OT y Normalización Backend (SPEC-072):
  1. **Visualización en Subtab "Hallazgos en esta OT":**
     - Despliegue interactivo de miniaturas fotográficas de evidencia de detección ("Antes") con visor modal a pantalla completa (`abrirPreviewFotoWeb`).
     - Despliegue estructurado de la resolución técnica (decisión, solución aplicada, responsable y fecha/hora) junto a miniaturas fotográficas de la reparación final ("Después").
  2. **Acción de Resolución Técnica In Situ:**
     - Botón `[ 🛠️ Resolver ]` habilitado dentro del subtab de la orden de trabajo para resolver anomalías detectadas sin abandonar el expediente de la grúa.
     - Recarga reactiva mediante `abrirDetalleOt()` para reflejar el estado `CERRADO` y los metadatos de auditoría al instante.
  3. **Normalización en Backend (`mantenimientoModel.js`):**
     - Actualización de `getOtById` para resolver `usuario_reporta` y `usuario_cierra` desde `tsec_users`.
     - Parseo determinista de `fotos` y `fotos_cierre` asegurando entrega de estructuras JSON normalizadas hacia el cliente.
  4. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1027`) y `tcfg_releases` (`v1.0.125`) en PostgreSQL DEV (`sch_leangsp`).

## [PWA Taller Móvil GSP] - Versión 1.0.41
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-11 19:50:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-1027`
- **Especificación Técnica:** PWA Taller Móvil v1.0.41: Integración Completa de Evidencias Fotográficas Antes/Después y Cierre de Hallazgos en Detalle de OTM (SPEC-072):
  1. **Captura y Visualización Móvil de Hallazgos:**
     - Captura de fotos de anomalías en terreno vía cámara y galería en el detalle de la OT (`TallerOtDetalleView.vue`).
     - Miniaturas fotográficas con `resolverFotoUrl()` para evitar errores 404 en el path relativo.
  2. **Resolución Móvil de Hallazgos en Terreno:**
     - Modal de resolución técnica para mecánicos con selección de decisión, solución ejecutada y evidencia fotográfica de término ("Después").
  3. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1027`) y `tcfg_releases` (`v1.0.41`) en PostgreSQL DEV (`sch_leangsp`).

## [PWA Taller Móvil GSP] - Versión 1.0.39
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-11 15:25:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-1024`, `REQ-1025`
- **Especificación Técnica:** PWA Taller Móvil v1.0.39: Corrección de Resolución de Fotos 360°, Tareas Base Obligatorias en OTMs, Selector de Técnicos RBAC Priorizado y Erradicación de Solapamiento en Aviso de Avería (SPEC-071):
  1. **Resolución Determinista de Fotos 360° en PWA:**
     - Enlace de ranuras de imágenes a través de `resolverFotoUrl(fotos360[slot.key])`, erradicando el error 404 al resolver la ruta relativa `/api/v1/storage/view/:id` contra la URL canónica de la API en el subpath `/lg-gsp-dev/api/`.
     - Asignación reactiva de ranuras (`fotos360.value = { ...fotos360.value, [slotKey]: ... }`) y soporte tolerante para deserialización de `fotos_recepcion_360` desde PostgreSQL o almacenamiento local.
  2. **Selector de Técnicos con Priorización RBAC y Etiquetas Semánticas:**
     - Integración de listado ordenado por roles de taller (`GSP_TALLER_EJEC`, `MECANICO`) con iconos descriptivos (`🛠️`, `👷`, `👤`) y subtítulo de función.
  3. **Erradicación del Solapamiento Tipográfico en Aviso de Falla:**
     - Desacoplamiento de etiquetas HTML en bloque (`<label class="text-[11px] font-bold ...">`) y uso de `hide-details` en `<v-autocomplete>`, `<v-select>` y `<v-textarea>`, eliminando la colisión del label flotante con placeholders y textos ingresados.
  4. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1024`, `REQ-1025`) y `tcfg_releases` (`v1.0.39`) en PostgreSQL DEV (`sch_leangsp`).

## [Portal Web GSP] - Versión 1.0.122
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-11 15:25:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-1025`
- **Especificación Técnica:** Portal Web GSP v1.0.122: Resolución Determinista de Fotos 360°, Tareas Base en OTMs, Notificaciones Omnicanal de Parada de Máquina y Asignación de Mecánicos (SPEC-071):
  1. **Resolución de Archivos 360° en Consola Web:**
     - Renderizado de slots y modal de ampliación fotográfica utilizando `resolverFotoUrl(fotos360Web[slot.key])`.
     - Asignación reactiva de slots y sanitización robusta al cargar detalles de OT.
  2. **Inyección de Tareas Mínimas Base en Creación de OTMs:**
     - Inyección obligatoria de las 4 tareas estructuradas de taller para grúas en órdenes de trabajo que no cuenten con pauta preventiva previa o actividades manuales, evitando OTs vacías.
  3. **Notificación Omnicanal al Asignar Técnico (Email + WhatsApp):**
     - Despacho transaccional mediante `notificacionService` con deep link directo a la orden en PWA (`/taller/ot/:id`).
  4. **Alerta Urgente por Parada de Máquina a Administradores:**
     - Despacho inmediato de correo y WhatsApp a roles administradores ante avisos con criticidad `PARADA_MAQUINA`.
  5. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1025`) y `tcfg_releases` (`v1.0.122`) en PostgreSQL DEV (`sch_leangsp`).

## [PWA Taller Móvil GSP] - Versión 1.0.38
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-11 14:20:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-1024`, `REQ-1025`
- **Especificación Técnica:** Taller Móvil PWA: Ficha QR Oficial, Medidores de Entrada/Cierre (Doble Horómetro & Odómetro), Fotos 360°, Aviso de Avería y Nueva OTM General (SPEC-071):
  1. **Aviso de Falla 100% Simétrico y Correlativo Automático:**
     - Normalización de payload en `TallerHomeView.vue` (`descripcion_sintoma` y `descripcion`), sincronizado con backend (`mantenimientoController.js` y `mantenimientoModel.js`).
     - Generación automática de folio canónico correlativo anual (`AV-YYYY-XXXX`) en base de datos para satisfacer la restricción NOT NULL de `tmnt_aviso`.
     - Selector de activo convertido a `v-autocomplete` interactivo con búsqueda en vivo.
  2. **Botón [➕ Nueva OTM] Superior Operativo:**
     - Implementación de `abrirNuevaOtModalGeneral()` y vinculación con selector `v-autocomplete` de equipos de la flota (`radarFlota`).
     - Precarga automática de horómetros acumulados (Grúa, Chasis, Odómetro) según el activo seleccionado.
  3. **Buscador de Equipos con Autocompletado Inteligente:**
     - Reemplazo del input plano por `v-autocomplete` enriquecido que despliega patente, código interno (`GPT-135`), marca, modelo y tonelaje.
     - Botones de acción directa en el desplegable: `[ 📄 Ficha QR ]`, `[ ➕ Abrir OT ]` y `[ ⏱️ Atender OT ]`.
  4. **Ficha QR Oficial en Tiempo Real (`FichaEquipoPublica.vue`):**
     - Modal interactivo con visor iframe a `https://servidor.leanglobal.cl/lg-gsp-dev/equipo/:patente` y botón `[ ↗ Abrir QR ]` para consulta de RT, Permiso, SOAP, Tablas de carga y certificaciones Bureau Veritas.
  5. **Medidores de Entrada y Salida (Doble Horómetro & Odómetro):**
     - Tarjeta de ingreso en OT con captura de Horómetro Grúa, Horómetro Chasis (grúas bicomponente) y Odómetro con botón `[ 💾 Guardar Medidores de Entrada ]` y endpoint `PUT /ots/:id/medidores-inicio`.
     - Cierre supervisado con validación de no-regresión (`cierre >= inicio`), selección de estado resultante y firma con PIN FES.
  6. **Inspección Visual 360° de Recepción:**
     - Pestaña táctil `📸 Fotos 360° (X/6)` con los 6 slots normados (Frente, Lateral Izquierdo, Lateral Derecho, Posterior, Tablero de Medidores, Pluma/Gancho), captura directa de cámara, miniaturas con visor modal a pantalla completa, eliminación y persistencia en Storage oficial.
  7. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1024`, `REQ-1025`) y `tcfg_releases` (`v1.0.38`) en PostgreSQL DEV (`sch_leangsp`).

## [Portal Web GSP] - Versión 1.0.121
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-11 13:35:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-1025`
- **Especificación Técnica:** Consola Web Desktop: Simetría Integral de Mantenimiento según SPEC-071:
  1. **Panel de Medidores de Entrada / Recepción:**
     - Tarjeta interactiva en detalle de OT con inputs numéricos para Horómetro Grúa (`horometro_grua_inicio`), Horómetro Chasis (`horometro_chasis_inicio`) y Odómetro (`odometro_inicio`).
     - Botón `[ 💾 Guardar Medidores de Entrada ]` consumiendo `PUT /api/mantenimiento/ots/:id/medidores-inicio`.
  2. **Inspección Visual 360° de Recepción:**
     - Subpestaña `📸 Fotos 360° (X/6)` con los 6 slots reglamentarios (Frente, Lateral Izquierdo, Lateral Derecho, Posterior, Tablero de Medidores, Pluma/Gancho).
     - Subida oficial a Storage (`POST /v1/storage/upload`), persistencia en PostgreSQL (`POST /api/mantenimiento/ots/:id/fotos-360`), miniaturas con zoom a pantalla completa y eliminación.
  3. **Ficha QR Oficial en Cabecera y Radar de Flota:**
     - Botón `[ 📄 Ficha QR Oficial ]` en la barra superior de la OT y en cada fila del radar de grúas.
     - Modal con iframe canónico `https://servidor.leanglobal.cl/lg-gsp-dev/equipo/:patente` y botón `[ ↗ Abrir en Nueva Pestaña ]`.
  4. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1025`) y `tcfg_releases` (`v1.0.121`) en PostgreSQL DEV (`sch_leangsp`).

## [Portal Web GSP] - Versión 1.0.120
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-10 13:30:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1022`
- **Especificación Técnica:** Bóveda Corporativa de Planillas GeraldSoft, Ingesta Incremental con Deduplicación (Upsert) y Matriz de Conciliación Geralsoft ⇄ ITS (SPEC-070):
  1. **Bóveda Corporativa Centralizada en la Nube:**
     - Tarjeta destacada en cabecera visible para todas las sesiones y usuarios con el estado de las planillas activas en el servidor (`CONTROLES` y `ORDENES`), fecha y hora exacta de sincronización, nombre del usuario que subió la versión (`usuario_nombre`) y total de registros.
     - Botón de sincronización manual instantánea `[🔄 Sincronizar Bóveda]` y modal con bitácora histórica de todas las cargas realizadas.
  2. **Ingesta Incremental Inteligente (Deduplicación & Upsert):**
     - Selector interactivo entre **Fusión Incremental Diaria (Upsert)** y **Reemplazo Total del Período**.
     - Comparación por clave natural (`cotizacion` + `orden` + `fecha` + `patente` + `item`) que anexa nuevos registros y actualiza existentes sin pérdida destructiva de datos previos.
     - Reporte estadístico post-carga: número de nuevos registros agregados, actualizados y total consolidado en el servidor.
  3. **Matriz Operativa de Conciliación Geralsoft ⇄ ITS (Pipeline de Servicios):**
     - KPIs ejecutivos en cabecera: Total de Servicios, ⚪ Pendientes de ITS, 🟡 En Trámite / Firmas FES, 🔴 Observados, 🟢 Concluidos.
     - Filtros de estado por pestañas y buscador en vivo por cotización, mandante o equipo.
     - Tabla interactiva con semáforos: botón directo `[+ Elaborar ITS]` para servicios sin liquidar (con auto-poblado instantáneo), `[✏️ Continuar]` para borradores/trámites y `[👁️ Ver PDF]` para informes concluidos.
  4. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1022`) y `tcfg_releases` (`v1.0.120`) en bases de datos PostgreSQL de DEV y PROD (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.119
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-09 17:15:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1021`
- **Especificación Técnica:** Apertura Integral de Costos Operacionales en ITS Sección 3 y Resumen 4 (Homologación Sistema Jorge):
  1. **Apertura de los 9 Rubros Canónicos en Sección 3:**
     - Desglose individual de cada rubro con encabezado gris `#f1f5f9`, total en pesos y soporte para N° de OC en Pensiones, Personal Externo y Subcontratos.
     - Formato de tabla estructurada para ítems con registros y mensaje estándar `Sin registros de gastos en este ítem ($0)` para ítems vacíos:
       1. `⬢ VIATICO ALIMENTACION PERSONAL`
       2. `⬢ PEAJES Y TAG DE RUTA`
       3. `⬢ PENSIONES Y ALOJAMIENTO FAENA`
       4. `⬢ MOVILIZACION PERSONAL (PASAJES, UBER, TAXI, TRANSFER)`
       5. `⬢ PERSONAL EXTERNO / RIGGERS DE APOYO`
       6. `⬢ PAGO FERIADOS Y BONOS`
       7. `⬢ SUBCONTRATACION FLETE EXTERNO`
       8. `⬢ GASTOS EXTRAORDINARIOS`
       9. `⬢ COSTO VALOR HORA OPERADOR (HORAS REPORT)` (Equipo, Categoría Maestra, Valor Hora, Horas Report y Total Operador).
  2. **Apertura de 8 Conceptos en Tabla B del Resumen Financiero (Sección 4):**
     - Sustitución de la consolidación de "Otros Costos Operativos Faena" por la apertura de las 8 líneas canónicas de egresos (`1. Viáticos Alimentación`, `2. Peajes y Tag`, `3. Pensiones y Alojamiento`, `4. Movilización Personal`, `5. Personal Externo y Feriados`, `6. Subcontratación Flete Externo`, `7. Gastos Extraordinarios` y `8. Costo Valor Hora Operador`) con desglose de `MONTO ($)` y `% S/ VENTA`.
  3. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1021`) y `tcfg_releases` (`v1.0.119`) en bases de datos PostgreSQL de DEV y PROD (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.118
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-09 15:20:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1020`
- **Especificación Técnica:** Corrección de Firma FES Elaborador y Reposición de Vista Previa PDF:
  1. **Resolución Multicriterio de Usuario Firmante:**
     - Corrección en backend (`itsController.js`) para resolver el usuario por `id_user`, `id_usuario`, o búsqueda por RUT de firmante (`firmante_rut`), con fallback inteligente hacia el registro de Yiara Mendoza (`id_user = 65`) y compatibilidad con `pin_fes`, `pin_hash` y `pin`.
     - Homologación en los tres métodos de firma FES: `firmarElaboradorItsTransicion`, `validarAdminItsTransicion` y `aprobarContabilidadItsTransicion`.
     - Regularización de estado `activo = true` para el usuario 65 en `sch_leangsp_prod.tsec_users`.
  2. **Reposición del Botón "Ver Informe PDF" Antes de Firmar:**
     - Reincorporación del botón `👁️ Ver Informe PDF` (`abrirVentanaImpresionOficial()`) en la barra de acciones de la Sección 4 para estados `BORRADOR` y `OBSERVADO`.
     - Inclusión del botón `👁️ Ver Informe PDF` en el pie de la ventana modal FES (`modalFesAbierto`), permitiendo a la analista/secretaria revisar el documento oficial antes de estampar su PIN.
  3. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1020`) y `tcfg_releases` (`v1.0.118`) en bases de datos PostgreSQL de DEV y PROD (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.117
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-09 14:45:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1019`
- **Especificación Técnica:** Tarifario Dinámico de Mano de Obra por Categoría de Equipo según Sistema Jorge (SPEC-069):
  1. **Catálogo Maestro de Tarifas Canónicas:**
     - Adopción íntegra de la matriz de tarifas horarias de operador del sistema de referencia de Jorge (`viaticos-pensiones.js` y `storage.js`):
       - `GRUA HORQUILLA`: $3.000 / hr
       - `CAMION PLUMA`: $5.000 / hr
       - `CAMION PLUMA 10 TON`: $5.000 / hr
       - `MANITU / TELEHANDLER`: $5.000 / hr
       - `GRUA TELESCOPICA 70 TON`: $6.000 / hr
       - `GRUA TELESCOPICA 80 TON`: $7.000 / hr
       - `TRACTOCAMION`: $7.000 / hr
       - `GRUA TELESCOPICA 100 TON`: $8.000 / hr
       - `GRUA TELESCOPICA 220 TON`: $12.000 / hr
       - `OTRA MAQUINARIA / GRUA GENERAL`: $8.500 / hr
  2. **Auto-Detección y Selector Interactivo de Categoría:**
     - Función inteligente `detectarTarifaYCatSugerida` para asignar automáticamente categoría y tarifa base según la subcategoría o tonelaje del equipo extraído de la cotización/OT GeraldSoft.
     - Selector interactivo `<select>` en la columna "Categoría Maestra" de la tabla de Mano de Obra en Sección 3 de ITS Transición, permitiendo reclasificar la máquina en tiempo real y actualizando la tarifa horaria sugerida.
  3. **Sobreescritura Manual y Recálculo Reactivo:**
     - Conservación de los inputs numéricos editables para horas y tarifa horaria por operador, permitiendo ajustes específicos sin perder la selección de categoría maestra.
     - Homologación idéntica en el visor web y en la generación de PDF oficial (`generarHtmlDocumentoOficial`).
  4. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` (`REQ-1019`) y `tcfg_releases` (`v1.0.117`) en bases de datos PostgreSQL de DEV y PROD (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.116
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-09 13:45:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1018`
- **Especificación Técnica:** Corrección Cálculo Mano de Obra Operador y Persistencia Servidor de Planillas GeraldSoft (SPEC-068):
  1. **Corrección de Cálculo de Mano de Obra por Máquina ($111.000 vs $222.000):**
     - Asignación determinista de tarifa sugerida base de `$3.000/hr` para la categoría `GRUA HORQUILLA` (ej. patente `KKFG50`).
     - Vinculación estrictamente reactiva e inmediata entre los inputs de edición (`costos.tarifas_operadores_override` y `costos.horas_operadores_override`) y el subtotal de la fila y general: $3.000 \times 37.0\text{ hrs} = \$111.000\text{ CLP}$.
     - Homologación de la fórmula exacta en la compilación y renderizado de PDF oficial (`generarHtmlDocumentoOficial`).
  2. **Persistencia de Planillas GeraldSoft en Servidor:**
     - Creación de tabla relacional `tits_geraldsoft_planillas` en `sch_leangsp` (DEV) y `sch_leangsp_prod` (PROD) con indexación por tipo y estado activo.
     - Endpoints REST `/api/operaciones/its/transicion/planillas/activas` (GET) y `/api/operaciones/its/transicion/planillas/subir` (POST).
     - Precarga automática en `onMounted` de `ItsTransicionView.vue`, auto-poblando el selector de cotizaciones y OTs del período al ingresar a la plataforma sin requerir recargas repetitivas por sesión.
     - Persistencia automática de nuevos archivos Excel subidos por cualquier usuario (Secretaria, Analista o Administrador).
     - Banner informativo de estado de sincronización de planillas en el servidor.
  3. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` y `tcfg_releases` en bases de datos PostgreSQL de DEV y PROD (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.115
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-09 12:15:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1017`
- **Especificación Técnica:** Flujo de Aprobaciones ITS Transición, Gobernanza Tripartita, Firmas FES y Notificaciones con Deep Link (SPEC-067):
  1. **Gobernanza de Roles RBAC y Enrolamiento:** Incorporación del rol `SECRETARIA` (`id_rol = 38`) en `tsec_roles`, homologación de Yiara Mendoza con rol Analista (`id_rol = 31`) y soporte para delegación de digitación de planillas GeraldSoft.
  2. **Flujo Tripartito de Estados FES:**
     - **Etapa 1 (Elaboración):** Secretaria o Analista confecciona el informe y estampa la firma FES de elaboración (`firmar-elaborador`) avanzando a `PENDIENTE_VERIFICACION`.
     - **Etapa 2 (Verificación Operativa - Rol ADMINISTRADOR):** Validación exclusiva por Administrador de Operaciones con facultades para editar, devolver al elaborador con observaciones obligatorias (`devolver`) o validar con PIN FES (`validar-admin`) transicionando a `PENDIENTE_CONTABILIDAD`.
     - **Etapa 3 (Aprobación Financiera - Rol CONTABILIDAD):** Visto bueno de Contabilidad & Finanzas con posibilidad de editar costos, devolver al elaborador o aprobar definitivo con PIN FES (`aprobar-contabilidad`) avanzando a `APROBADO`.
  3. **Notificaciones Omnicanal (Email B2B + WhatsApp) con Deep Link Contextual:** En cada transición de estado se genera un despacho dual enriquecido hacia el actor de la siguiente etapa con enlace directo hacia la pantalla de ITS Transición contextualizada con folio y cotización.
  4. **Erradicación del Pie Estático:** Sustitución integral del cuadro estático en duro por 3 casillas dinámicas oficiales FES (Elaboró, Verificó, Aprobó) con sellos digitales, códigos FES, marcas de tiempo RFC 3161 y bitácora de observaciones resueltas en el visor web y en la compilación PDF con wkhtmltopdf.
  5. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` y `tcfg_releases` en bases de datos PostgreSQL de DEV y PROD (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.114
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-09 11:06:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1016`
- **Especificación Técnica:** Módulo ITS Transición y Liquidación Relacional en Producción:
  1. **Persistencia Relacional en Producción:** Creación determinista de tabla `sch_leangsp_prod.tits_transicion_historial` con secuencia, índices y permisos para `usr_leangsp_prod`.
  2. **Controlador Backend Dinámico Multiesquema:** Adaptación de consultas SQL en `itsController.js` para usar nombres no cualificados (`tits_transicion_historial`, `tfmg_file`), resolviendo automáticamente el esquema según el contexto (`sch_leangsp_prod` en PROD y `sch_leangsp` en DEV via `SET search_path`).
  3. **Endpoints REST Activos en Producción (PM2 ID 13):** Registro y despliegue de `/api/operaciones/its/transicion/list`, `/api/operaciones/its/transicion/guardar` y `/api/operaciones/its/compilar-pdf`.
  4. **Frontend Compilado v1.0.114:** Generación de bundle de producción con Vite (`index-l_NNQtft.js`), despliegue a `/var/www/html/lg-gsp-prod/` y verificación HTTP 200 OK.
  5. **Gobernanza y Hard Gate:** Sincronización en `tcfg_backlog` y `tcfg_releases` en bases de datos PostgreSQL de DEV y PROD.

## [Portal Web GSP] - Versión 1.0.109
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-07 22:05:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1011`
- **Especificación Técnica:** SPEC-065 (Matriz Logística de Asignación de Recursos, Desacoplamiento de Traslados, Ciclo de Viajes y Emisión de Reports):
  1. **Desacoplamiento de Traslados de Grúas Autopropulsadas:** Erradicación de la asignación vehicular independiente para grúas móviles telescópicas y camiones pluma en Pestaña C del CRM (`GestorOportunidades.vue`). El ítem comercial de traslado es una tarifa de cobro que subsume el desplazamiento bajo el operador de izaje.
  2. **Supresión de Inserción Forzada Rural:** Eliminación de la creación automática de filas de `CAMA BAJA` en servicios rurales ($>30\text{ km}$), limitando `equipos_extra` a traslados con necesidad física auxiliar.
  3. **Logística de Contrapesos en 4 Trayectos:** Homologación de líneas de contrapesos como `TRACTO CONTRAPESOS` con sugerencia de `Chofer Transporte`, desacoplado de la estadía multi-día de la grúa.
  4. **Protección e Inmutabilidad de Roles (Spec 65 §4):** Salvaguarda estricta en `confirmarAsignacionOT` (`mapPersonas`), garantizando que un `Operador Grúa` o `Rigger` jamás pueda ser sobreescrito o degradado a `Chofer`.
  5. **Concentración Documental y Trazabilidad Art. 25 bis:** Exclusión de reportes diarios para camiones auxiliares, concentrando la firma en el Report de Izaje principal e integrando fórmulas de horas de conducción.
- **Detalle de Mejoras y Cambios:**
  - **[PORTAL WEB CRM] (`GestorOportunidades.vue`):** Refactor de `sincronizarTrasladosComerciales`, `tripulacionAsignada` y deduplicación con prioridad de rol en `confirmarAsignacionOT`.
  - **[DOCUMENTACIÓN OFICIAL WEB]:** Creación del Módulo 6 en `centro_documentacion_gsp.html` y manual interactivo `guia_asignacion_recursos_traslados_y_reports.html` en DEV y PROD.
  - **[SOPORTE Y BASE DE DATOS] (`sch_leangsp_prod`):** Regularización de OT 4 (Tensacon / Planta Ferrero), cierre de viaje 3 y restitución de rol a `Operador Grúa` para Robert Rodríguez (`49`).
  - **[GOBERNANZA]:** Registro formal de `REQ-1010` y sincronización en BD PostgreSQL (`tcfg_backlog` y `tcfg_releases`).

## [Portal Web & PWA GSP] - Versión 1.0.107
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-07 12:50:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1009` (Hotfix Enlace PDF Cotizador Express y Formato de Mensajería WhatsApp)
- **Especificación Técnica:** Resolución de Ruta del PDF de Cotización Express y Formato de Mensajería WhatsApp:
  1. **Inyección Dinámica de Prefijo de Proxy Nginx (`envPrefix`):** Modificación en `cotizacionExpressController.js` para resolver dinámicamente `/lg-gsp-prod` o `/lg-gsp-dev` antes de la ruta del archivo `/api/archivo/ver/:id`, erradicando el error HTTP 404 al intentar descargar el presupuesto oficial desde WhatsApp o desde el botón de la PWA.
  2. **Homologación de Ubicación en el Mensaje:** Concatenación inteligente de `obra_nombre` y `obra_comuna` separados por coma y espacio, impidiendo cadenas pegadas en el texto de WhatsApp y asignando una descripción limpia y formal al proyecto.
- **Detalle de Mejoras y Cambios:**
  - **[BACKEND / COTIZADOR EXPRESS] (`cotizacionExpressController.js`):** Construcción canónica de `pdfFullUrl` con `process.env.APP_BASE_URL` y `envPrefix`, y formateo de `ubicacionLimpia` en `textoWsp` y `nombreProyectoFinal`.
  - **[GOBERNANZA]:** Sincronización en `tcfg_backlog` y `tcfg_releases` en bases de datos PostgreSQL de desarrollo y producción (`sch_leangsp` y `sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.106
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-07 12:25:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1008` (Hotfix Visibilidad Control en Vivo OTs en Faena & Transición ITS)
- **Especificación Técnica:** Resiliencia de Consultas y Auditoría Operacional en Vivo para OTs en Faena y Servicios en Transición Documental (Caso Altumaq SA):
  1. **Inclusión de Estados Operativos Críticos:** Ampliación del filtro de estados de proyectos en `controlVivoController.js` para incluir `id_proyecto_estado IN (4, 5, 6, 7, 8)`, erradicando la exclusión inadvertida de OTs en estado 7 (`En Faena`) y 8 (`Finalizado Operacional`).
  2. **Resolución de Brecha Temporal en Servicios de Corta Duración:** Inclusión de condiciones multidimensionales de fecha que contemplan la actividad del día consultado: rango planificado, emisión de reportes diarios, desplazamientos/viajes de ida/retorno, inspecciones de patio preoperacionales, elaboración o firma de ITS, y servicios activos en faena/ruta cuya conclusión formal no ocurrió antes de la fecha consultada.
  3. **Auditoría Efectiva de SLA 13:00 hrs:** Garantiza que los servicios que concluyeron faena el día hábil anterior se mantengan visibles en el monitor del día siguiente para alertar y controlar el cumplimiento del SLA de emisión de ITS a las 13:00 hrs.
- **Detalle de Mejoras y Cambios:**
  - **[BACKEND / CONTROL EN VIVO] (`controlVivoController.js`):** Refactor integral de la consulta `proySql` en `getControlVivo` incorporando estados 7 y 8, y cláusulas `EXISTS` para reportes, viajes, inspecciones e ITS en la fecha consultada.
  - **[GOBERNANZA]:** Verificación y certificación determinista sobre base de datos PostgreSQL de producción (`sch_leangsp_prod`).

## [Portal Web GSP] - Versión 1.0.105
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-07 11:05:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1007` (Visión Gráfica Comparativa del Devengado & Monto Total Cotizado CRM)
- **Especificación Técnica:** Centro Gráfico Comparativo del Devengado (Core IFRS 15) e Integración del Pipeline Comercial Cotizado E2E:
  1. **Integración del Monto Total Cotizado ($29.649.999 CLP):** Incorporación del valor total de propuestas comerciales activas en CRM (39 cotizaciones en Gestor de Oportunidades) en la banda superior de KPIs (cuadrícula ejecutiva de 6 dimensiones) y como Paso 0 en el Pipeline E2E.
  2. **Erradicación de Barras Horizontales Planas:** Sustitución de las barras planas por un módulo visual comparativo multidimensional con 3 perspectivas clave mediante switcher de pestañas.
  3. **Perspectiva 1 - Columnas E2E (Funnel de Valor):** Gráfico de 6 columnas verticales calibradas sobre escala Y (0% a 100%) mostrando la conversión completa: Cotizado ($29.6M / 100%) ➔ En Faena ($12.4M / 42%) ➔ Con ITS ➔ EDP Visado ➔ Esperando OC ($12.2M / 41% Cuello de Botella con resplandor y badge animado) ➔ Facturado SII ($170K / 0.6%).
  4. **Perspectiva 2 - 4 Pilares Macro de Caja:** 4 columnas volumétricas de contraste directo (Cotizado CRM, Devengado Faena, Brecha Descalce Retenido y Facturación DTE).
  5. **Perspectiva 3 - Descalce por Mandante:** Gráfico comparativo segmentado por cliente mandante (Pocuro, Asenav, Dfan, etc.) evidenciando a qué clientes presionar por OCs.
  6. **Drill-down y Filtrado Reactivo:** Filtrado instantáneo de la tabla de OTs retenidas al hacer clic en cualquier fase o cliente, con indicador activo y botón de limpieza de filtros.
- **Detalle de Mejoras y Cambios:**
  - **[FRONTEND / DASHBOARD EJECUTIVO] (`Dashboard.vue`):** Refactor integral del bloque de Balanza y Pipeline; adición de imports `FileText`, `Building2`, `X`; reactividad completa en `statsPipelineReal`, `pipelineEstaciones`, `columnasComparativasE2E` y `clientesComparativa`.
  - **[BACKEND / GOBERNANZA]:** Validación estricta con datos 100% reales de PostgreSQL (`sch_leangsp`), sin multiplicadores aproximados ni mock data.

## [Portal Web GSP] - Versión 1.0.104
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-07 10:15:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1006` (Dashboard Directivo BI, Telemetría en Vivo & Versión Beta)
- **Especificación Técnica:** Consola Directiva de Business Intelligence (BI) y Control Operacional en Tiempo Real para Dirección General:
  1. **Banner Oficial de Versión Beta:** Indicador superior prominente de versión beta v0.9 en fase de calibración de métricas con Control de Gestión (Yiara Mendoza) y Dirección.
  2. **Cálculo Transaccional Real del Devengado (IFRS 15):** Suma determinista de ingresos devengados sobre proyectos en ejecución y concluidos ($12.434.999 CLP reales) y balanza del descalce ($12.264.999 CLP retenidos en 16 OTs de faena).
  3. **Waffle Chart / Heatmap de Flota (110 Equipos):** Matriz compacta de los 110 activos con 5 estados cromáticos vivos (Operando, En Ruta, Disponible, Taller, Bloqueado por Documentos), filtros por familia y tarjeta reactiva de telemetría.
  4. **Feed de Alertas Accionables y Mantenimiento:** Detección de revisiones técnicas vencidas en 51 equipos, OTs pendientes de OC mandante y radar de inspecciones registradas.
- **Detalle de Mejoras y Cambios:**
  - **[FRONTEND / DASHBOARD EJECUTIVO] (`Dashboard.vue`):** Rediseño total de la consola principal integrando pipeline de 5 fases de devengado, balanza financiera con drill-down a OTs retenidas, matriz waffle de 110 equipos y alertas directivas en 1 clic.
  - **[GOBERNANZA Y REGLAS DE NEGOCIO]:** Erradicación total de números simulados o datos inventados de maqueta; conexión directa a endpoints de catálogo de equipos (`/tequ-equipos`), proyectos (`/proyectos`), usuarios y control en vivo.

## [Portal Web GSP / PWA] - Versión 1.0.103
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 22:40:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-994` (Hotfix Visual & Segregación RBAC)
- **Especificación Técnica:** Rediseño Ergonómico Integral del Cotizador Express Móvil y Segregación Estricta RBAC para Perfiles Admin/Comercial (`Spec 64 v1.2.0`):
  1. **Solución Definitiva a Superposición de Textos:** Separación física estricta entre etiquetas HTML superiores y placeholders de inputs (`<v-text-field>`), erradicando las etiquetas flotantes de Vuetify 3 que colisionaban con el texto sugerido.
  2. **Compatibilidad Visual y Alto Contraste Bi-Tema:** Adaptabilidad nativa tanto en modo claro como en modo oscuro con fondos sobrios (`bg-white` / `bg-slate-900`), cabecera industrial navy `#0b1426`, botones ámbar contrastados y estado activo/deshabilitado con tipografía visible en todo momento.
  3. **Segregación Estricta RBAC (Admin / Comercial):** Erradicación del banner de cotizaciones del flujo operativo de conductores y operadores de terreno (`GSP_EJEC`). Acceso exclusivo condicionado a perfiles `Admin`, `ADM_COM`, `COMERCIAL` o gerenciales mediante computed reactivo `esAdminOComercial`.
  4. **Navegación Móvil de 1 Toque:** Inclusión de pestaña dedicada `[ ⚡ Cotizador ]` en la barra de navegación inferior fija (`v-bottom-navigation` en `App.vue`) visible únicamente para usuarios autorizados, y protección de ruta con Navigation Guard en `router/index.js`.
- **Detalle de Mejoras y Cambios:**
  - **[FRONTEND / PWA CONSOLA MAESTRA] (`Surveys.vue`):** Restitución del menú principal operativo a su flujo limpio y enfocado; la tarjeta comercial solo se muestra condicionalmente si el usuario tiene privilegios comerciales/admin.
  - **[FRONTEND / PWA NAVEGACIÓN] (`App.vue` & `router/index.js`):** Inclusión de pestaña dinámica en la barra inferior para perfiles comerciales y validación `requireAdminOrCom` en guards de ruta.
  - **[FRONTEND / COTIZADOR EXPRESS] (`CotizadorExpress.vue`):** Rediseño completo con selector segmented, tarjetas táctiles de grúas y plumas, stepper de días ergonómico, desglose financiero proforma y pantalla de confirmación optimizada.

## [Portal Web GSP / PWA] - Versión 1.0.102
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 22:20:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-994`
- **Especificación Técnica:** Cotizador Express Móvil en Terreno (APP PWA), Despacho WhatsApp y PDF Oficial Simétrico (`Spec 64 v1.1.0`): Módulo mobile-first de alta velocidad que permite cotizar servicios de izaje en terreno en menos de 60 segundos con despacho directo al cliente por WhatsApp (enlace `wa.me` con mensaje formal y descarga directa del PDF oficial). Simetría estructural absoluta con `tpry_proyecto` y `json_field.crm_v1.lineas_servicio` para que las cotizaciones puedan ser tratadas, visualizadas, auditadas y convertidas a OT desde el CRM Web de escritorio (`GestorOportunidades.vue`) y la Torre de Control (`Torre.vue`). Catálogo formal de 7 grúas móviles telescópicas (40t a 250t) y 3 camiones pluma (10t a 25t), auto-guardado de prospectos en `tpar_empresas` y `tpar_contactos`, condiciones contractuales estándar con piso mínimo de 9 horas diarias y validez estricta de 5 días hábiles.
- **Detalle de Mejoras y Cambios:**
  - **[BACKEND / NORMALIZADOR CANÓNICO - REQ-994] (`cotizacionExpressController.js` & `proyectoRoutes.js`):**
    - `GET /api/proyectos/express/catalogo`: Entrega catálogo unificado de familias (`GRUAS TELESCOPICAS`, `CAMIONES`), capacidades, tarifas diarias sugeridas (CLP) y piso mínimo (9 hrs/día).
    - `POST /api/proyectos/express/cotizar`: Resuelve cliente mandante o crea prospecto provisional en `tpar_empresas`, auto-guarda contacto en `tpar_contactos`, genera `codi_proyecto` oficial (`GSP-YYMM-CLIENT-XXX`), normaliza `lineas_servicio` idéntico al CRM de escritorio (`_uid`, `tipo`, `unidad`, `pisoMinimo: 9`, `subtotal`, `is_linea_base: true`), inserta en `tpry_proyecto` con `id_proyecto_estado = 2` (Cotización Enviada), compila el PDF oficial formal mediante `proyecto.generarCotizacionVersion` y genera el link nativo de WhatsApp.
  - **[FRONTEND / PWA TERRENO - REQ-994] (`CotizadorExpress.vue`, `Surveys.vue`, `router/index.js`):**
    - Wizard táctil optimizado de 3 pasos: 1) Mandante y Faena predictivos, 2) Selección de Equipo, Días de Servicio y Flete de Traslado opcional con recálculo dinámico en vivo, 3) Resumen Financiero y Emisión.
    - Pantalla de éxito con botón maestro de despacho a WhatsApp (`mdi-whatsapp`), visor de PDF oficial y botones de salida ágil.
    - Tarjeta de acceso rápido destacada `⚡ Cotizador Express en Terreno` en la consola maestra móvil (`Surveys.vue`) y ruta `/cotizador-express`.
  - **[GOBERNANZA Y REGLAS DE DOMINIO]:**
    - Erradicación absoluta de grúas torre y su emoji en todo el flujo, aplicando rigurosamente los íconos de grúas móviles (`🚜`) y camiones pluma (`🚛`).
    - Cumplimiento de la regla de validez estricta de 5 días hábiles y piso mínimo contractual de 9 horas diarias.

## [Portal Web GSP] - Versión 1.0.101
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 21:40:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1004`
- **Especificación Técnica:** Transición Determinista Kanban Columna 5 (Operaciones) ➔ Columna 6 (Contabilidad), Apertura Directa en Subpestaña 7 y Sincronización Backend ITS-Proyecto - Caso Altumac (`Spec 38 v1.1.0`): Resolución integral de la anomalía donde OTs con faena concluida o ITS visado (como Altumac GSP-2610-4671-002) permanecían visibles en la columna de operaciones. Implementación del helper canónico `esFinalizadoOperacional`, filtro de exclusión mutua entre Columna 5 y Columna 6, redirección al hacer clic a `subtab: 'liquidacion'`, proyección de ITS en consulta de proyectos (`proyectoModel.js`) y sincronización atómica de `id_proyecto_estado >= 6` en V°B° de ITS (`itsController.js`, `Torre.vue`).
- **Detalle de Mejoras y Cambios:**
  - **[ANÁLISIS FORENSE Y DIAGNÓSTICO DE CAUSA RAÍZ - REQ-1004]:**
    - Se identificó la causa exacta planteada por Jorge Ponce respecto al servicio Altumac (terminación 02 / `GSP-2610-4671-002`):
      1. En `Torre.vue`, la Columna 5 ("En Ejecución / Faena", Operaciones) ejecutaba `return [6, 7].includes(st)`, reteniendo en la vista operativa a todas las OTs con faena finalizada (`st === 6`) o facturada (`st === 7`).
      2. La Columna 6 ("Finalizado / Devengado", Contabilidad) filtraba exclusivamente por `Number(p.id_proyecto_estado) === 8`. Dado que el estado final en el dominio GSP es `7` (`Facturado / Concluido`), el estado `8` nunca se cumplía, dejando la columna permanentemente vacía.
      3. Al hacer clic en las tarjetas de Columna 6, se ejecutaba `@click="abrirProyecto(p.id_proyecto, 'dossier_acreditacion')"`, enviando erróneamente al usuario a la acreditación de portería en lugar de la mesa de liquidación contable.
      4. `proyectoModel.js` no realizaba join con `tits_informe_termino`, por lo que las tarjetas desconocían `estado_its` y `folio_its`.
      5. `itsController.js` no elevaba el `id_proyecto_estado` a `>= 6` al firmar el V°B° de Operaciones o Contabilidad.
  - **[FRONTEND / TORRE DE CONTROL PMO & KANBAN - REQ-1004] (`Torre.vue`):**
    - **Helper Canónico `esFinalizadoOperacional(p)`:** Identifica de forma determinista si un proyecto culminó su fase de terreno o se encuentra en contabilidad (`st >= 6 && st < 99` sin desestimación, `estado_its IN ('EN_REVISION_CONTABILIDAD', 'CONCLUIDO')`, `estado_financiero IN ('DEVENGADO_PENDIENTE_FACTURA', 'FACTURADO_CONFORME')`, `its_v1.concluido` o `ejecucion_finalizada`).
    - **Columna 5 ("En Ejecución / Faena" - Operaciones):** Excluye inmediatamente a cualquier proyecto que califique en `esFinalizadoOperacional(p)` y solo muestra OTs activas en terreno (`st === 5 && estaEnFaena(p)`).
    - **Columna 6 ("Finalizado / Contabilidad"):** Agrupa automáticamente todos los proyectos que cumplen `esFinalizadoOperacional(p)`, visualiza badges cromáticos financieros, folio ITS y al hacer clic navega directamente a la **Subpestaña 7: `7. Valorización, ITS & Facturación`** (`subtab: 'liquidacion'`).
    - **Navegación PMO y KPIs:** `getSubTabSugeridaPMO` sugiere `'liquidacion'` para proyectos finalizados y el KPI `pendientesFacturacion` audita proyectos concluidos no facturados sin depender de estados fantasma.
  - **[BACKEND / MODELO Y CONTROLADOR - REQ-1004] (`proyectoModel.js` & `itsController.js`):**
    - En `proyectoModel.js`, incorporación de `LEFT JOIN LATERAL` hacia `tits_informe_termino` seleccionando `id_its`, `folio_its` y `estado_its`.
    - En `itsController.js`, sincronización atómica relacional en BD `UPDATE tpry_proyecto SET id_proyecto_estado = GREATEST(id_proyecto_estado, 6)` al visar el ITS en Paso 2 y Paso 3.

## [Portal Web GSP] - Versión 1.0.100
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 21:00:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1003`
- **Especificación Técnica:** Resolución y Blindaje del Bucle de Redirección en Retorno de Faena a Base - Caso Finning Puerto Montt / Natalia (`Spec 49 v1.2.1`): Erradicación del loop infinito entre Viaje de Retorno y Report Diario mediante asignación determinista de `tipo_trayecto`, segregación de timestamps para retorno (`fecha_salida_faena` y `fecha_llegada_patio`), supresión de llamadas a `abrirFormularioReport()` al arribar a base, y estado de servicio operacionalmente concluido (`ViajeConductor.vue`, `Surveys.vue`, `viajeModel.js`).
- **Detalle de Mejoras y Cambios:**
  - **[ANÁLISIS FORENSE Y DIAGNÓSTICO DE CAUSA RAÍZ - REQ-1003]:**
    - Se identificó la causa exacta del incidente reportado por Jorge Ponce en el Proyecto 3 (Finning Puerto Montt): En `ViajeConductor.vue`, la variable reactiva `viaje.value.tipo_trayecto` no era poblada en `onMounted` a partir de `dbViaje.tipo_trayecto`, quedando indefinida (`undefined`).
    - Toda la lógica condicional `viaje.tipo_trayecto === 'RETORNO'` fallaba a `false`, tratando el viaje de retorno como si fuera de salida/ida.
    - Al confirmar el arribo a base en `ejecutarLlegadaFaena`, la función caía en la rama `else` y ejecutaba `abrirFormularioReport()`.
    - La vista de Report Diario detectaba que el número de reports alcanzaba los días contratados (`dia >= dias_planificados`) y desplegaba el modal bloqueante invitando a retornar a base con el token `vj-ret-3-44-...`. Al hacer clic, el operador volvía al viaje que lo enviaba nuevamente al report, atrapándolo en un bucle cerrado.
  - **[FRONTEND / HOJA DE CONDUCTOR - REQ-1003] (`ViajeConductor.vue`):**
    - **Detección Determinista:** Inicialización y asignación explícita de `tipo_trayecto: (dbViaje.tipo_trayecto === 'RETORNO' || tokenViaje.includes('ret')) ? 'RETORNO' : 'IDA'`.
    - **Timestamps Segregados:** Asignación de `timestamp_inicio` desde `fecha_salida_faena` y `timestamp_llegada` desde `fecha_llegada_patio` para viajes de retorno.
    - **Ruptura Definitiva del Bucle:** En `ejecutarLlegadaFaena`, se actualiza el estado a `CONCLUIDO`, se suprime cualquier invocación a `abrirFormularioReport()`, se notifica al conductor con alerta de servicio concluido conforme y se despliega el botón directo `[ 🏠 VOLVER A MIS SERVICIOS (MENÚ PRINCIPAL) ➔ ]`.
  - **[FRONTEND / PWA CONSOLA MAESTRA - REQ-1003] (`Surveys.vue`):**
    - `estadoPaso3ViajeRetorno` incorpora soporte para `v.estado_trayecto === 'CONCLUIDO'`, reconociendo el retorno como `COMPLETADO`.
    - `proximaAccionFlujo` muestra la tarjeta triunfal de servicio finalizado y equipo disponible (`deshabilitado: true`), evitando reentradas a formularios de terreno.
  - **[BACKEND / MODELO OPERACIONAL - REQ-1003] (`viajeModel.js`):**
    - Inclusión de `CONCLUIDO` en la cláusula de ordenamiento ponderado `CASE` de `getViajeActivoPorUsuario`, garantizando coherencia de prioridad entre DEV y PROD.

## [Portal Web GSP] - Versión 1.0.99
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 20:30:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1002`
- **Especificación Técnica:** Matriz Fotográfica Desacoplada por Instrumento en Terreno, Manual Operativo Visual y Locución Chilena es-CL (`Spec 49 v1.2.0`): Persistencia independiente de fotos de odómetro, horómetro camión, horómetro grúa y combustible; erradicación del término técnico "PWA" por "APP" o "Tu Aplicación en el Celular", incorporación de síntesis de voz en español de Chile (`es-CL`) y manual interactivo paso a paso para operadores con afiche de cabina (`tequ_log_desplazamiento`, `viajeModel.js`, `viajeController.js`, `ViajeConductor.vue`, `manual_operador_terreno_gsp.html`).
- **Detalle de Mejoras y Cambios:**
  - **[BASE DE DATOS / DDL - REQ-1002]:** Creación de columnas de persistencia fotográfica independiente en `tequ_log_desplazamiento`: `foto_odometro_salida_path`, `foto_horometro_salida_path`, `foto_odometro_llegada_path`, `foto_horometro_camion_llegada_path` y `foto_horometro_grua_llegada_path` en esquemas `sch_leangsp` (DEV) y `sch_leangsp_prod` (PROD).
  - **[BACKEND / PERSISTENCIA Y HANDOFF - REQ-1002] (`viajeModel.js` & `viajeController.js`):**
    - Desestructuración y persistencia atómica en BD de fotos separadas para odómetro y horómetro camión tanto en `registrarSalida` como en `registrarLlegada`.
    - Handoff automático de `foto_horometro_grua_llegada_path` hacia `foto_tablero_inicio` en `tedp_reporte_avance` garantizando trazabilidad probatoria del inicio de faena.
  - **[FRONTEND / APP DEL OPERADOR - REQ-1002] Desacople Multi-Foto (`ViajeConductor.vue`):**
    - **Salida:** Exige y permite 2 fotografías independientes (Foto 1: Odómetro del camión, Foto 2: Horómetro del camión), incluyendo botón opcional de atajo ergonómico si ambos instrumentos comparten la misma pantalla digital.
    - **Llegada a Faena:** Exige 4 fotografías independientes estructuradas por bloque: Foto 1 Odómetro, Foto 2 Horómetro Camión, Foto 3 Horómetro Grúa (cabina de izaje LICCON), y Foto 4 Nivel de Combustible.
    - **Retorno y Llegada a Base:** Exige 2 fotos en salida de obra y 3 fotos al ingresar a Base Central San Pablo.
  - **[DOCUMENTACIÓN Y UX - REQ-1002] Manual Visual y Voz es-CL (`manual_operador_terreno_gsp.html`):**
    - Erradicación total y absoluta de la sigla "PWA" en textos, manuales y botones, denominándose exclusivamente **"APP"** o **"Tu Aplicación en el Celular"**.
    - Implementación de síntesis y locución de voz con motor Web Speech API configurado en español de Chile (`es-CL`) para guiar auditivamente al operador de terreno.
    - Publicación de la Matriz Oficial de Instrumentos y afiche técnico de cabina imprimible en DEV y PROD.

## [Portal Web GSP] - Versión 1.0.98
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 16:30:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1001`
- **Especificación Técnica:** Optimización Cinemática de Hoja de Ruta, Matriz Canónica de Instrumentos 5x3 y Flujo Multi-Día en Terreno (`Spec 49 v1.1.0`): Erradicación de odómetro en faena, herencia automática de horómetro de superestructura en días intermedios, habilitación de Horómetro Grúa en Llegada a Faena y Candado Duro de Retorno a Base (`viajeModel.js`, `viajeController.js`, `reportDiarioController.js`, `ViajeConductor.vue`, `ReportDiarioIzaje.vue`, `Surveys.vue`, `tequ_log_desplazamiento`)
- **Detalle de Mejoras y Cambios:**
  - **[BASE DE DATOS / DDL - REQ-1001]:** Incorporación de columna `horometro_grua_inicial numeric` en tabla `tequ_log_desplazamiento` tanto en esquemas `sch_leangsp` (DEV) como `sch_leangsp_prod` (PROD).
  - **[BACKEND / TRASLADO & HANDOFF - REQ-1001] Persistencia y Pre-carga de Grúa (`viajeModel.js` & `viajeController.js`):**
    - `registrarLlegada` persiste formalmente `horometro_grua_inicial` en el log de desplazamiento carretero.
    - `procesarHandoffTraslado` pre-inicializa de inmediato el `horometro_inicio` de la grúa en `tedp_reporte_avance` al certificar la llegada del convoy a la faena del cliente mandante.
  - **[BACKEND / REPORT - REQ-1001] Contexto de Flota Precargado (`reportDiarioController.js`):**
    - `getReportContexto` incluye `v.horometro_grua_inicial AS horometro_grua_llegada` en `eqSql`, priorizando dicha lectura para sugerir el horómetro inicial del izaje en el Día 1.
  - **[FRONTEND WEB / HOJA DE CONDUCTOR - REQ-1001] Ergonomía de Cabina (`ViajeConductor.vue`):**
    - Modal de Llegada solicita `horometro_grua` (Horómetro de Superestructura) únicamente cuando el convoy arriba a faena (`tipo_trayecto !== 'RETORNO'`), manteniéndolo oculto en salida y ruta.
    - Pre-carga automática de la grúa en la apertura del formulario de report diario.
  - **[PWA / REPORT DIARIO - REQ-1001] Erradicación de Odómetro y Flujo Multi-Día (`ReportDiarioIzaje.vue`):**
    - Erradicación total de inputs y fotografías de odómetro en faena (Momento 1 y Momento 2), eliminando fricción con el supervisor/mandante en obra que solo fiscaliza horas de grúa.
    - Soporte multi-día para Día > 1: el equipo pernocta en la obra y no registra desplazamiento cinemático; el operador cuenta con botón de inicio rápido que solo estampa la hora de inicio y hereda automáticamente el horómetro de superestructura del día previo sin requerir fotografías obligatorias de inicio.
  - **[PWA / CONSOLA MAESTRA - REQ-1001] Desbloqueo Condicional de Retorno (`Surveys.vue`):**
    - `proximaAccionFlujo` y `estadoPaso3ViajeRetorno` mantienen el Retorno a Base en estado de espera en días intermedios (`dia_a_reportar < dias_planificados`), habilitando el Retorno únicamente al concluir el último report planificado.

## [Portal Web GSP] - Versión 1.0.97
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 14:30:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-1000`
- **Especificación Técnica:** Cierre de Brecha Operacional E2E: Ingesta Automática de Horas Manuales desde Torre de Control a Report Diario (`tedp_reporte_avance`), Normalización de Evidencias Físicas Escaneadas/Fotográficas en Pestaña 6 CRM, Visualización en Visor Digital y Proyección Fluida de Jornadas de Izaje a Mesa ITS (`controlVivoController.js`, `reportDiarioController.js`, `reportDiarioRoutes.js`, `itsController.js`, `GestorOportunidades.vue`, `ModalVisorReport.vue`)
- **Detalle de Mejoras y Cambios:**
  - **[BACKEND / TORRE - REQ-1000] Ingesta Automática y Upsert en Reporte Diario (`controlVivoController.js`):**
    - Ante edición manual de `REPORT_INICIO` o `REPORT_TERMINO` en Torre de Control sin reporte previo, se ejecuta `UPSERT` en `tedp_reporte_avance` calculando `horas_operadas`, `horas_facturables` y `horas_sobretiempo`, asignando token oficial `REG-${id_proyecto}-D${diaCorr}-${random}`, estado `REGULARIZADO_MANUAL`, y metadata `requiere_evidencia_fisica = true`.
    - Corrección de sincronización de `SALIDA_BASE` y `LLEGADA_FAENA` hacia `tequ_log_desplazamiento` (eliminando dependencia de tabla inexistente `tvia_viaje`).
  - **[BACKEND / ARCHIVOS - REQ-1000] Normalización de Evidencias Físicas y Regularización (`reportDiarioController.js` & `reportDiarioRoutes.js`):**
    - Nuevo endpoint `POST /api/operaciones/report/:id/adjuntar-respaldo-fisico`: recibe archivo escaneado o foto (PDF, PNG, JPG), guarda en storage con tipo `REPORT_FISICO_RESPALDO` en `tfmg_file`, vincula `id_doc_pdf`, pasa el reporte a `VALIDADO_ANALISTA` y `evidencia_fisica_adjunta = true`.
    - Nuevo endpoint `POST /api/operaciones/report/regularizar-manual`: permite cargar una jornada física completa desde el CRM con horas, horómetros y documento adjunto.
  - **[BACKEND / ITS - REQ-1000] Proyección a Mesa ITS (`itsController.js`):**
    - Mapeo de reportes regularizados como jornadas con `tipo_respaldo = 'FISICO_MANUAL'` y `url_comprobante = '/api/v1/storage/view/' + id_doc_pdf`, garantizando que la grúa aparezca en la grilla valorizada respetando la tarifa de la cotización ($500.000/hr) junto a los fletes.
  - **[FRONTEND / CRM - REQ-1000] Pestaña 6 y Visor de Report (`GestorOportunidades.vue` & `ModalVisorReport.vue`):**
    - Botón `[ ➕ Regularizar Reporte Físico ]` en Pestaña 6 para registro manual de reportes.
    - Badges de estado en tabla: `📄 Doc Físico OK` (verde), `⚠️ Regularizado Manual` (ámbar si falta evidencia), `✅ Validado FES` y `⏳ Pendiente Terreno`.
    - Acciones de fila: botón `[ 📎 Adjuntar Doc ]` con modal interactivo para subir el respaldo escaneado firmado por el mandante, y botón `[ 📄 Doc ]` para visualizar el documento directamente.
    - Soporte completo en `ModalVisorReport.vue` para visualizar reportes regularizados con su respaldo documental.

## [Portal Web GSP] - Versión 1.0.96
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 13:30:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-999`
- **Especificación Técnica:** Manejo de Excepciones Operacionales: Torre de Control ➔ Mesa ITS ➔ Liquidación EDP, Vías A y B, Sello PDF Oficial y Portal de Documentación (`ControlOperativoVivo.vue`, `ModalITS.vue`, `itsPdfService.js`, `centro_documentacion_gsp.html`, `politica_manejo_excepciones_gsp.html`)
- **Detalle de Mejoras y Cambios:**
  - **[WEB / TORRE - REQ-999] Marcaje Visual de Regularización en Torre de Control (`ControlOperativoVivo.vue`):**
    - Identificación automática de hitos modificados manualmente sin telemetría ni report móvil (`act.override && !act.hora_real_original`).
    - Despliegue de insignia de alerta `⚠️ Req. Regularización` junto al engranaje de configuración para visibilidad inmediata de Yiara.
    - Envío de `{ requiere_regularizacion: true }` en el payload de `POST /operaciones/control-vivo/override-hito`.
  - **[WEB / ITS - REQ-999] Vías Alternativas de Liquidación en Mesa ITS (`ModalITS.vue`):**
    - Botones de acción dedicados: `[📄 + Doc Físico (Vía A)]` (`agregarJornadaDocFisico`) para adjuntar respaldo escaneado o físico y `[⚖️ + Piso Mínimo (Vía B)]` (`agregarJornadaPisoMinimo`) para invocar cobro por standby o piso garantizado.
    - Badges cromáticos diferenciados en grilla de jornadas: `🟢 FES` (Terreno digital), `📄 Doc Físico` (Regularizado Vía A) y `⚖️ Piso Mín.` (Vía B contractual).
  - **[BACKEND - REQ-999] Sello Formal en PDF Oficial ITS (`itsPdfService.js`):**
    - Renderizado de estampas de auditoría: `[📄 DOC FÍSICO REGULARIZADO]` con cita al folio o anexo de respaldo, o `[⚖️ PISO MÍNIMO CONTRACTUAL (STANDBY)]` citando cláusula de horas mínimas contractuales.
  - **[DOCUMENTACIÓN - REQ-999] Centro de Documentación y Política Nº 04:**
    - Despliegue del portal centralizado `centro_documentacion_gsp.html` y la Política de Manejo de Excepciones `politica_manejo_excepciones_gsp.html` bajo estándar formal de roles y cargos.

## [Portal Web GSP] - Versión 1.0.95
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 10:15:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-998`
- **Especificación Técnica:** Simplificación y Unificación de Flujo en Terreno PWA: Consola Maestra 1-2-3 (Viaje Ida ➔ Report Faena ➔ Retorno a Base), Detección de Jornada en Curso y Erradicación de Quiebres UX (`Surveys.vue`, `ViajeConductor.vue`, `ReportDiarioIzaje.vue`, `reportDiarioController.js`, `viajeModel.js`)
- **Detalle de Mejoras y Cambios:**
  - **[PWA - REQ-998] Consola Maestra de Terreno Unificada (`Surveys.vue`):**
    - Unificación de las tarjetas separadas y desarticuladas ("Registro de Viaje" y "Report Diario") en una única **Consola de Flujo Continuo del Servicio Activo**.
    - Stepper didáctico 1-2-3 con micro-estados visuales: `[1. Viaje a Faena] ➔ [2. Report Faena] ➔ [3. Retorno Base]`, indicando con íconos y contrastes cromáticos el estado de cada etapa (Pendiente, En Ruta, Arribado/Firmado).
    - Botón de Acción Rápida Único ("👉 TU PRÓXIMA ACCIÓN"): Botón de 58px de altura con texto inequívoco que le dice al operador exactamente qué hacer en cada instante (Iniciar Viaje, Registrar Llegada, Iniciar Jornada de Faena, Finalizar & Firmar Report, o Iniciar Viaje de Retorno).
    - Selector compacto para alternar entre OTs en caso de que el operador cuente con más de una orden activa.
  - **[WEB / PWA - REQ-998] Hoja de Conductor y Cierres de Traslado (`ViajeConductor.vue`):**
    - Distinción nítida entre Arribo a Faena (Ida) y Arribo a Base Central San Pablo (Retorno).
    - En Arribo a Faena: Banner verde `🏁 Traslado Arribado a Faena` y botón principal `[ 📋 PASO 2: INICIAR REPORT DIARIO DE FAENA ➔ ]`, acompañado de botón de navegación a la Home.
    - En Arribo a Patio Base San Pablo: Erradicación del botón erróneo de report diario; pantalla de confirmación triunfal `🏁 Retorno a Base Central San Pablo Concluido`, equipo en estado `DISPONIBLE` y botón directo `[ 🏠 VOLVER A MIS SERVICIOS (MENÚ PRINCIPAL) ➔ ]`.
    - Enrutamiento dinámico `urlHomePwa` respetando prefijos de ambientes DEV y PROD sin pérdida de sesión.
  - **[PWA - REQ-998] Modal de Término de Faena e Inicio de Retorno (`ReportDiarioIzaje.vue`):**
    - Incorporación de botón secundario de retorno seguro al Menú Principal en el diálogo modal de confirmación de última jornada y apertura de retorno.
  - **[BACKEND - REQ-998] Auditoría de Jornadas y Priorización de Viajes (`reportDiarioController.js` & `viajeModel.js`):**
    - Endpoint `/reports/usuario/pendientes`: Detección en tiempo real de reportes con `estado_reporte = 'JORNADA_EN_CURSO'` para retornar flag `jornada_en_curso: true/false`, permitiendo a la UI conmutar instantáneamente entre "Iniciar Jornada" y "Finalizar & Firmar con Mandante".
    - `viajeModel.getViajeActivoPorUsuario`: Implementación de ordenamiento ponderado `CASE`, priorizando viajes de retorno y de ida pendientes o en ruta sobre registros históricos concluidos.

## [Portal Web GSP] - Versión 1.0.94
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-06 10:00:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-997`
- **Especificación Técnica:** Operaciones Críticas: Enrolamiento Rápido de Rigger Externo en Asignación de Recursos (`GestorOportunidades.vue`) y Corrección/Carga Manual de Horas de Hitos en Torre de Control en Vivo (`ControlOperativoVivo.vue` & `controlVivoController.js`)
- **Detalle de Mejoras y Cambios:**
  - **[CASO 1 / REQ-997] Enrolamiento Rápido de Rigger Externo:**
    - Se agregó el botón `[➕ Ext]` junto al selector de Rigger en la pestaña de Asignación de Recursos OT.
    - Se implementó mini-modal flotante con captura de Nombre, RUT, Móvil/WhatsApp y Empresa Proveedora.
    - Nuevo endpoint backend `POST /api/acreditacion/personal/externo` que registra al especialista en `tsec_users` con flag `is_externo: true`, rol `Rigger`, lo autoselecciona de inmediato y lo sincroniza en `usuarios.value` y `tpry_rel_persona`.
    - Distinción visual con badge `🏢 EXT` para personal subcontratado.
  - **[CASO 2 / REQ-997] Corrección y Carga Manual de Horas de Hitos en Control en Vivo:**
    - Soporte interactivo inline en cada fila de actividad planificada en la tarjeta de `ControlOperativoVivo.vue`.
    - Yiara y Administradores pueden hacer clic sobre `--:--` o el botón lápiz `✏️` para ingresar la hora real (`HH:mm`) y confirmarla con `[✓]`.
    - Nuevo endpoint backend `POST /api/operaciones/control-vivo/override-hito` que persiste el ajuste en `tpry_proyecto.json_field->'control_vivo_overrides'`, sincroniza marcas en `tvia_viaje` / `tedp_reporte_avance` y recalcula los semáforos al instante sin matar ni interrumpir la PWA del operador en terreno.

## [Portal Web GSP] - Versión 1.0.93
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-05 22:45:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-996`
- **Especificación Técnica:** Control y Usabilidad del Estructurador Comercial: Candado de Distancia, Reubicación de Agregar Línea, Inmutabilidad en Etapas Concluidas y Botones Contextuales de Aplicación de Casos (`GestorOportunidades.vue`)
- **Detalle de Mejoras y Cambios:**
  - **[WEB - REQ-996] Candado Duro de Casos según Distancia:**
    - Bloqueo determinista de Casos 1 y 2 (Régimen Urbano $\le 30$ km) cuando la distancia a faena es mayor a 30 km (Régimen Rural), y viceversa para Casos 3 y 4.
    - Se agregaron guardias lógicas en `seleccionarYAplicarCaso` e inhabilitación física de clics (`cursor-not-allowed`) para evitar selecciones erróneas.
  - **[WEB - REQ-996] Reubicación de "+ Agregar Línea":**
    - Se retiró el botón del encabezado superior `Líneas de Servicio a Cotizar` y se integró directamente en la franja horizontal de acción operativa (encima de la tabla de servicios), con fondo índigo destacado y alineación ergonómica.
  - **[WEB - REQ-996] Inmutabilidad Estricta de Preventa Comercial en Etapas 3+ y 5:**
    - Se incorporó la clase `pointer-events-none opacity-80 select-none` en los `fieldset` comerciales de las columnas izquierda y derecha, asegurando que tablas, botones y tarjetas no reciban clics cuando el proyecto está en Operaciones (`isModoOperaciones`).
    - Se implementaron guardias estrictas en `agregarLinea`, `eliminarLinea`, `seleccionarYAplicarCaso` y `aplicarConfiguracionCaso` para impedir mutaciones desde cualquier evento.
  - **[WEB - REQ-996] Eliminación de "Re-Aplicar Configuración" y Botones Individuales por Tarjeta:**
    - Se eliminó el botón ambiguo `[⚡ Re-Aplicar Configuración Caso X]` de la franja horizontal.
    - Cada una de las 5 tarjetas de caso ahora incorpora en su esquina inferior derecha un botón explícito: `[⬇️ Aplicar Caso]` cuando está disponible, o `[✓ Caso Activo]` cuando ya está seleccionado.

## [Portal Web GSP] - Versión 1.0.92
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-05 20:50:00 (-03:00)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimientos Asociados:** `REQ-995`
- **Especificación Técnica:** Corrección de Falsos Positivos en Validación & Auditoría Diff de Requerimientos Operativos (GestorOportunidades.vue)
- **Detalle de Mejoras y Cambios:**
  - **[WEB - REQ-995] Normalización de Unidades de Traslado (`GestorOportunidades.vue`):**
    - Se incorporó soporte explícito para unidades compuestas `'TRASLADO IDA'` y `'TRASLADO IDA/VUELTA'` en el mapeador de carga de proyectos (`cargarProyecto`), evitando la mutación a `'Valor Fijo'` o `'Traslado'` genérico.
    - Se implementó normalización insensible a caracteres especiales y espacios en `hasDiff('equipo_unidad')`, eliminando falsas observaciones en traslados cotizados originalmente.
  - **[WEB - REQ-995] Reconciliación de Líneas Originales de Preventa (`isOriginalLine`):**
    - Se extendió la verificación de líneas originales incorporando como respaldo canónico el arreglo de `crm_v1.lineas_servicio` de la oportunidad comercial, garantizando que líneas de personal certificado (Rigger, Prevencionista) no se clasifiquen como "Nueva Línea Operativa" ni disparen falsas observaciones cuando no han sufrido alteraciones.

## [PWA, Backend API, Base de Datos & Web] - Versión 1.0.91
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue:** 2026-10-05 16:15:00 (-03:00)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **PWA Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **PWA Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimientos Asociados:** `REQ-993`
- **Especificación Técnica:** Evidencias Fotográficas Separadas de Horómetro y Odómetro en Report Diario Móvil (PWA) + Simulador Web Interactivo de Cotización (Spec 64)
- **Detalle de Mejoras y Cambios:**
  - **[PWA - REQ-993] Registro y Fotos Separadas de Horómetros y Odómetros (`ReportDiarioIzaje.vue`):**
    - Se incorporaron slots de captura fotográfica e inputs numéricos completamente independientes tanto en el **Momento 1 (Inicio de Jornada en Faena)** como en el **Momento 2 (Término de Jornada)**.
    - Se resolvió la limitación física de terreno donde el horómetro (horas de motor/torreta) y el odómetro (tacógrafo de cabina en km) están en consolas físicamente separadas.
    - Botones dedicados: `📸 Tomar Foto Horómetro Superestructura` (Obligatoria) y `📸 Tomar Foto Odómetro Chasis` (con validación reactiva obligatoria si se registra kilometraje).
    - Mantenida la foto de horómetro de chasis para equipos bimotor.
  - **[BACKEND - REQ-993] Persistencia y Homologación de Evidencias (`reportDiarioController.js`):**
    - Ingesta y almacenamiento de `foto_odometro_inicio`, `foto_odometro_termino`, `odometro_inicio` y `odometro_termino` en endpoints `POST /operaciones/report/inicio-jornada` y `POST /operaciones/report/guardar`.
    - Consulta reactiva en `getReportsPorProyecto` y `getReportContexto` para precarga en caso de reapertura o contingencia.
  - **[BASE DE DATOS - REQ-993] DDL en PostgreSQL DEV y PROD:**
    - Columnas `foto_odometro_inicio TEXT` y `foto_odometro_termino TEXT` creadas y comentadas en `sch_leangsp.tedp_reporte_avance` y `sch_leangsp_prod.tedp_reporte_avance`.
  - **[WEB - SIMULADOR INTERACTIVO] Walkthrough Interactivo de Generación de Cotizaciones:**
    - Generación del artefacto interactivo `simulador_cotizacion_web.html` y publicación en `ejecucion/frontend/public/simulador_cotizacion.html` con cursor virtual animado, typing realista, selección de grúa en estructurador comercial y renderizado visual del PDF formal de 5 días hábiles.

## [PWA, Portal Web GSP y Nginx] - Versión 1.0.86
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue Producción:** 2026-10-05 01:20:00 (-03:00)
- **Fecha de Despliegue Dev:** 2026-10-05 01:20:00 (-03:00)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **PWA Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **PWA Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-045`
- **Especificación Técnica:** Corrección de Enrutamiento PWA a Hoja de Ruta de Conductor y Desacoplamiento de Estados de Despacho
- **Detalle de Mejoras y Cambios (Resolución del Disconnect PWA ➔ Web):**
  - **[BUGFIX/PWA] Dinamización de Enlace de Viaje en PWA (`Surveys.vue:893-898`):**
    - Se corrigió `abrirViajeNativo(token)` que redirigía estáticamente a `${baseOrigin}/lg-gsp-dev/viaje/${token}` incluso cuando el usuario operaba en la PWA de producción (`/pwa-gsp-prod/`).
    - Ahora detecta dinámicamente el prefijo de ambiente (`/pwa-gsp-prod` o `/lg-gsp-prod`) y redirige hacia `${baseOrigin}/lg-gsp-prod/viaje/${token}`, garantizando que las peticiones HTTP (`/operaciones/viaje/:token/salida`) se ejecuten contra el backend y base de datos de producción (`sch_leangsp_prod`).
  - **[BUGFIX/NGINX] Redirección Global de Rutas de Viaje Móvil (`/etc/nginx/default.d/base.conf`):**
    - Se corrigió la regla `location /viaje/` en Nginx que redirigía con código HTTP 301 permanente hacia `/lg-gsp-dev/viaje/$1`.
    - Actualizada para redirigir limpiamente hacia `/lg-gsp-prod/viaje/$1`.
  - **[BUGFIX/WEB] Claridad Visual de Estados y Odómetros en Despacho (`GestorOportunidades.vue:2011-2035`):**
    - Se desacopló la lógica del badge de viaje: si el convoy fue asignado en patio pero el conductor aún no registra odómetro de salida (`estado_trayecto === 'ASIGNADO'`), se visualiza `🟡 SALIDA PENDIENTE` en vez del falso `🔵 EN RUTA` parpadeante.
    - Se corrigió el placeholder `|| 0` por `!= null ? val : '---'` en odómetros y horómetros, eliminando la confusa cifra de 0 KM previa a la salida.
    - El chip de PIN ahora valida la presencia real de `pin_hash` o `km_inicial` (`🔐 PIN Validado ✅` vs `🔐 PIN Pendiente`), eliminando el texto estático engañoso.

## [Portal Web GSP, PWA y Backend API] - Versión 1.0.85
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue Producción:** 2026-10-05 00:40:00 (-03:00)
- **Fecha de Despliegue Dev:** 2026-10-05 00:40:00 (-03:00)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Backend Servicio Prod:** `lean-services-gsp-prod` (PM2 ID 13, puerto 3016)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio Dev:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **PWA Prod:** `/var/www/html/pwa-gsp-prod` (URL: `https://servidor.leanglobal.cl/pwa-gsp-prod/`)
- **PWA Dev:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-044`
- **Especificación Técnica:** Auditoría Exhaustiva de URLs, Endpoints y Storage Paths (Limpieza Total de Hardcoding)
- **Detalle de Mejoras y Cambios (Zero Hardcoding & Total Dynamic Routing):**
  - **[FRONTEND] Limpieza y Dinamización de Enlaces y Endpoints:**
    - `ModalCaratulaEDP.vue`: Reemplazadas URLs fijas `servidor.leanglobal.cl/lg-gsp` por llamadas directas con `apiAxios.post('/operaciones/edp/firmar-comercial')` y resolución dinámica de dossier PDF y archivos adjuntos según el entorno activo (`/lg-gsp-prod/api` vs `/lg-gsp-dev/api`).
    - `ModalITS.vue`: Función `resolverUrlArchivo` dinamizada para usar el prefijo del ambiente activo (`/lg-gsp-prod` o `/lg-gsp-dev`), eliminando fallback fijo a `lg-gsp-dev`.
    - `ModalMapaViaje.vue`: Enlace a "Abrir Hoja Conductor" parametrizado con `urlHojaConductor` dinámico (`/lg-gsp-prod/viaje/:token` en producción).
    - `AcreditacionDrawer.vue`: Eliminadas peticiones crudas a `lg-gsp/api`; reemplazadas por `apiAxios.get` y `apiAxios.put` con autenticación y enrutamiento dinámico.
    - `GestorOportunidades.vue`: 
      - Despacho de WhatsApp dinamizado con `wspBase` (`/lg-gsp-prod/whatsapp/enviar` en producción y `/lg-gsp-dev/whatsapp/enviar` en desarrollo).
      - Enlaces de hoja de viaje de conductor (`getLinkViajeOperador`, `abrirModalDespachoWhatsApp`, `copiarEnlaceViaje`, `abrirWebViaje`) dirigidos dinámicamente según el entorno.
      - Descarga de PDF de EDP (`descargarDossierPdfEDP`) y enlaces en listados de OT migrados a resolución canónica `getFullStaticUrl`.
    - `Vista360.vue`: Generación de código QR para equipos dirigida dinámicamente a `/lg-gsp-prod/equipo/:patente` en producción.
    - `ListadosMinsal.vue` y `ListadosRecss.vue`: Eliminadas URLs residuales hacia `transmac-dev`; fotos vinculadas al backend activo mediante `apiAxios.defaults.baseURL`.
  - **[BACKEND] Dinamización de Rutas de Validación, PDF y Almacenamiento:**
    - `archivoController.js`: Validación de documentos (`validacionUrl`) y fallback de carpeta pública parametrizados según `process.env.APP_ENV` y `process.cwd()`.
    - `itsController.js`: `validacionUrl` dinamizada hacia `/lg-gsp-prod/validador-doc` o `/lg-gsp-dev/validador-doc`.
    - `reportDiarioController.js`: `validacionUrl` y `linkPdfCompleto` generados dinámicamente con prefijo de entorno y endpoint canónico `/api/archivo/ver/:id_doc`.
    - `reportDiarioPdfService.js`: Fallback de validación TSA en pie de página ajustado dinámicamente según `APP_ENV`.
    - `estadoPagoController.js`: URL de PDF de EDP generada con prefijo correspondiente al entorno.
    - `exportService.js`: `resolveBaseWebUrl()` parametrizado según `APP_ENV`.
    - `proyectoModel.js` e `itsPdfService.js`: Detección de carpeta `public` para logos priorizando `process.cwd()` de la instancia en ejecución.
    - `storageConfig.js`: Candidatos de directorios para búsqueda de archivos actualizados para incluir `process.cwd()/public`.
    - `notificacionService.js`: Endpoint de fallback HTTPS para WhatsApp ajustado a `/lg-gsp-prod/whatsapp/enviar` en producción.
    - `signatureController.js`: `VALIDATION_URL` dinamizada con `envPrefix`.
  - **[PWA] Aislamiento de Ambiente y Dinamismo en Cliente Móvil:**
    - `services/api.js`: Implementado `resolveApiBase()` dinámico que detecta automáticamente si la PWA se ejecuta bajo `/pwa-gsp-prod/` o `/pwa-gsp-dev/`, garantizando que las llamadas a la API siempre coincidan con el entorno servido sin depender de variables fijas.
    - `App.vue`: Watcher de conectividad ajustado con la misma resolución dinámica.
    - `.env.production` y `.env.prod`: Configurados formalmente para apuntar a producción (`/pwa-gsp-prod/` y `/lg-gsp-prod/api`, con `VUE_APP_TENANT_CODE=gsp`).
    - `EquiposMoviles.vue`: Eliminado fallback hardcodeado a `pwa-transmac-dev`; previsualización de archivos migrada a `/archivo/ver/:id`.
    - `Inspeccion.vue` y `useFlujoAprobacion.js`: Sustituido código duro `'transmac'` y usuario fijo `1` por `process.env.VUE_APP_TENANT_CODE || 'gsp'` y usuario autenticado en sesión.

## [Portal Web GSP, Base de Datos y Backend API] - Versión 1.0.84
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue Producción:** 2026-10-05 00:15:00 (-03:00)
- **Fecha de Despliegue Dev:** 2026-10-05 00:15:00 (-03:00)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Backend Servicio Prod:** `lean-services-gsp-prod` (PM2 ID 13, puerto 3016)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio Dev:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-043`
- **Especificación Técnica:** Gobernanza RBAC y Protocolo de Notificaciones
- **Detalle de Mejoras y Cambios (Corrección de Destinatario Omar Ghiselini y Aislamiento de Almacenamiento):**
  - **[BD/RBAC] Corrección de Roles y Creación de Usuario Omar Ghiselini:**
    - Se identificó que `OMAR SOFFIA REYES` (user 46) es un operador de grúa (`cargo: "Operador"`). Se le retiró el rol `Admin` y se le asignó el rol `GSP_EJEC` (Operador).
    - Se creó/activó a `Omar Ghiselini` (`omar.ghiselini@arriendosanpablo.cl` / `omar.ghisellini@arriendosanpablo.cl`) con cargo `Director General` y rol `Admin` tanto en `sch_leangsp_prod` como en `sch_leangsp`.
  - **[FRONTEND/NOTIFICACIONES] Actualización de Propuestas de Envío:**
    - En `ModalEnviarCotizacion.vue`, se reemplazó cualquier sugerencia de Omar Soffia por **Omar Ghiselini (Director)**. Al consultar dinámicamente los administradores por API, ahora se propone de forma nativa a Omar Ghiselini.
    - En `GestorOportunidades.vue`, se actualizaron los destinatarios institucionales en copia a `omar.ghiselini@arriendosanpablo.cl`.
  - **[STORAGE/BACKEND] Aislamiento Estricto de Almacenamiento:**
    - Corregido `storageConfig.js` para respetar `process.env.APP_ENV` en lugar de caer en el fallback `'dev'`.
    - Documentos generados en producción ahora se almacenan bajo `/u05/LeanDocs/GSP/prod/...` y se sirven bajo `https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/:id_doc`.

## [Portal Web GSP y Backend API] - Versión 1.0.81
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue Producción:** 2026-10-04 18:30:00 (-03:00)
- **Fecha de Despliegue Dev:** 2026-10-04 18:30:00 (-03:00)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Backend Servicio Prod:** `lean-services-gsp-prod` (PM2 ID 13, puerto 3016)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio Dev:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-042`
- **Especificación Técnica:** `.agents/specs/52_notificaciones_omnichannel_deep_linking_spec.md` y `.agents/specs/63_control_operativo_vivo_hibrido_spec.md`
- **Detalle de Mejoras y Cambios (Parametrización Estricta de Ambiente en Notificaciones y WhatsApp):**
  - **[BACKEND/PARAMETRIZACIÓN] Discriminación Canónica de Entorno en `notificacionService.js`:**
    - Detección de ambiente `esAmbienteProduccion()` basada en `APP_ENV === 'prod'`, `NODE_ENV === 'production'` o esquema `sch_leangsp_prod`.
    - URLs canónicas ajustadas a `/lg-gsp-prod` y `/pwa-gsp-prod` en producción, y `/lg-gsp-dev` y `/pwa-gsp-dev` en desarrollo.
    - Inyección automática del prefijo `🟡 [DEV / PRUEBAS]` en el asunto de correos y `🟡 *[SIMULACIÓN DEV / PRUEBAS]*` al inicio de mensajes de WhatsApp en desarrollo para evitar movilizaciones o reportes erróneos en terreno.
    - Dinamización del esquema `${SCHEMA}.tnot_notification_log` en el registro de auditoría transaccional.
  - **[BACKEND/AUDITORÍA] Parametrización en `slaAuditorService.js`:**
    - Generación de Deep Link contextual hacia la Torre de Control mediante `notificacionService.construirDeepLink({ ruta: 'torre' })`, eliminando URL fija a DEV.
    - Dinamización del esquema `${SCHEMA}.tedp_reporte_avance` en la consulta del auditor de SLA.
  - **[FRONTEND/PARAMETRIZACIÓN] Enlace Directo a Operador en `ControlOperativoVivo.vue`:**
    - El enlace directo de WhatsApp (`https://wa.me/...`) detecta el entorno de ejecución (`-dev` o `localhost`) e inyecta `🟡 [PRUEBAS DEV / NO REAL]` al mensaje preformateado.
  - **[FRONTEND/PARAMETRIZACIÓN] Hoja de Ruta en `ModalDespachoWhatsApp.vue`:**
    - La URL de la hoja de ruta conmuta dinámicamente entre `/lg-gsp-prod/viaje/` y `/lg-gsp-dev/viaje/` según la ruta activa.
    - Inyección de advertencia de pruebas en el texto de recordatorio y despacho para entornos de desarrollo.

---

## [Portal Web GSP y Backend API] - Versión 1.0.80
- **Ambiente:** `prod` & `dev`
- **Fecha de Despliegue Producción:** 2026-10-04 18:05:00 (-03:00)
- **Fecha de Despliegue Dev:** 2026-10-03 16:15:00 (-03:00)
- **Ruta de Despliegue Prod:** `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Backend Servicio Prod:** `lean-services-gsp-prod` (PM2 ID 13, puerto 3016)
- **Ruta de Despliegue Dev:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio Dev:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-042`
- **Especificación Técnica:** `.agents/specs/63_control_operativo_vivo_hibrido_spec.md`
- **Detalle de Mejoras y Cambios (Soporte Multi-Equipo en Control Operativo en Vivo con la OT como Driver):**
  - **[ARQUITECTURA/DECISIÓN] La OT como Driver Unificado:**
    - Se preserva la Orden de Trabajo (OT) como entidad principal de monitoreo en el tablero de Control Operativo en Vivo, evitando la dispersión de tarjetas y manteniendo el agrupador comercial y operacional.
  - **[FEAT/UI] Selector Interactivo de Flota Asignada en Tarjeta y Drawer (`ControlOperativoVivo.vue`):**
    - Para OTs que involucran múltiples equipos (ej.: grúas telescópicas + camiones pluma + camas bajas + escoltas, como en OT 98 con 4 máquinas y OT 76 con 3 máquinas), la tarjeta incorpora una botonera de píldoras interactivas con ícono por tipo de máquina (`🚜` Izaje / `🚛` Transporte), código de patente/modelo y micro-semáforo individual de estado.
    - Las OTs mono-equipo (caso estándar) se mantienen 100% limpias sin selectores redundantes.
    - Al hacer click en cualquier máquina de la flota asignada, la tarjeta y el Drawer de Timeline Intradía conmutan en tiempo real:
      1. El nombre completo y modelo del equipo.
      2. El operador o chofer asignado con su botón directo de WhatsApp (`https://wa.me/...`) y mensaje contextualizado con la máquina y la OT.
      3. La mini-franja multi-día `[R][R][▶][ ][FIN]` con el contador de reportes de esa máquina.
      4. El desglose detallado de actividades Plan vs Real de esa máquina específica.
  - **[BACKEND/MULTI-EQUIPO] Ingesta y Rollup de Flota en Endpoint (`controlVivoController.js`):**
    - Ingesta combinada de flota desde `crm_v1.lineas_servicio` y `sch_leangsp.tpry_rel_equipo` (precargada en batch por proyecto).
    - Resolución individual del operador asignado (`operador_asignado_id`, `tripulacion_asignada` y catálogo de usuarios).
    - Discriminación inteligente de ciclo operativo (`esEquipoFaena`): Grúas y equipos de izaje evalúan reports de terreno (`REPORT_INICIO` y `REPORT_TERMINO`); equipos de transporte evalúan ciclo de desplazamiento (`INSPECCION_PATIO`, `SALIDA_BASE`, `LLEGADA_FAENA`, `VIAJE_RETORNO`) sin disparar falsas alarmas de reporte de inicio.
    - Rollup del semáforo global de la OT (`estado_global`) tomando la peor condición de sus máquinas (`PRI_SEMAFORO`).
    - Alertas in-web enriquecidas con la patente del equipo afectado (`OT (PATENTE): mensaje`).
  - **[FEAT/SEARCH] Búsqueda Global en Flota Completa:**
    - El buscador superior de la vista ahora filtra coincidencias no solo por OT o cliente, sino también buscando en las patentes, modelos y nombres de operadores de todos los equipos asignados a la OT.

---

## [Portal Web GSP y Backend API] - Versión 1.0.79
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-03 15:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-042`
- **Especificación Técnica:** `.agents/specs/63_control_operativo_vivo_hibrido_spec.md`
- **Detalle de Correcciones y Optimizaciones (Resolución de Operador, Grúa, Reportes y Candado en Control Vivo):**
  - **[BACKEND/FIX] Remoción del Filtro Destructivo de Flete en Reportes (`controlVivoController.js` y `reportDiarioController.js`):**
    - Se eliminó el filtro erróneo `AND COALESCE(incluye_flete_independiente, false) = false` que excluía todos los reportes operacionales legítimos (los cuales por estándar de facturación ITS tienen `incluye_flete_independiente = true`).
    - La exclusión de fletes puros se formaliza estrictamente mediante el discriminador canónico `(token_report IS NULL OR token_report NOT LIKE 'FLT-%')`.
  - **[BACKEND/RESOLUTION] Resolución Canónica de Operadores y Equipos:**
    - Precarga e indexación de catálogos `sch_leangsp.tsec_users` y `sch_leangsp.tequ_equipo` en memoria antes de evaluar OTs del día.
    - Resolución del operador asignado (`Jorge Ponce`, `+56977501322`) a partir de `id_user` en `tripulacion_asignada`, `operador_id` o líneas de servicio CRM.
    - Resolución del equipo y modelo (`GRUAS TELESCOPICAS · VCTR.81-9 (ATF 50 G3)`) a partir de `equipo_asignado_id`.
  - **[BACKEND/ALGORITHM] Cálculo Consolidado de Días y Candado Operacional:**
    - `totalDiasOT` considera ahora dinámicamente `Math.max(1, diasHabilesLista.length, maxDiaReport)` reflejando exactamente los reportes emitidos en terreno (3/3).
    - El candado operacional reconoce inmediatamente los servicios concluidos (`estado_global = 'terminado'`), silenciando alarmas rojas falsas en OTs completadas con éxito.
    - Normalización de las actividades de inicio y término con `fecha_inicio_servicio` y `fecha_termino_servicio` cuando el reporte está validado por analista.

---

## [Portal Web GSP y Backend API] - Versión 1.0.78
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-03 15:00:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-042`
- **Especificación Técnica:** `.agents/specs/63_control_operativo_vivo_hibrido_spec.md`
- **Detalle de Mejoras y Cambios (Control Operativo en Vivo: Opción 3 Híbrida, Semáforos Cromáticos 5 Estados, Candado por OT y Sanación de Datos):**
  - **[FEAT/UI] Opción 3 Híbrida: Matriz de Tarjetas de Servicios del Día + Slide-Over Timeline Intradía (`ControlOperativoVivo.vue`):**
    - Integrado como sub-vista prioritaria en Torre de Control PMO (`Torre.vue` -> `pmoVistaSecundaria = 'control_vivo'`).
    - Cabecera con Reloj Oficial de Chile (`America/Santiago`, UTC-3), indicador de Ventana Operativa activa (07:00 a 20:00), cuenta regresiva de auto-refresco cada 5 minutos (300 s) y botón de actualización manual puramente icónico `🔄` (con animación de rotación, sin texto ni palabras desalineadas).
    - Campana interactiva de Notificaciones In-Web con badge de conteo y popup modal para auditar y marcar alertas leídas individualmente o en lote.
    - Barra de KPIs cromáticos filtrables al click: Total OTs, Rojo (crítico / vencido con pulsación), Amarillo (riesgo próximo < 1h), Azul (planificado > 1h), Verde (cumplido en tiempo), Negro (realizado tarde), Candado (concluido) y Sin Plan.
    - Grid de tarjetas de servicios ordenadas automáticamente por orden de severidad de excepción, incluyendo:
      - Encabezado con OT, ID de negocio, cliente, obra y equipo.
      - Operador con enlace directo a WhatsApp (`https://wa.me/...`) y mensaje preformateado.
      - **Mini-Franja Multi-Día `[R][R][▶][ ][FIN]`** con seguimiento del avance del servicio día a día.
      - Desglose de actividades según el tipo de día (Día 1 / Único: Inspección patio, Salida patio, Llegada faena, Report inicio, Report término, Retorno base; Días intermedios: Reportes diarios).
      - Cálculo automático de desfases en minutos (`+35 min retraso`, `OK`, etc.).
      - Botones de acción rápida: Ver Report oficial (`ModalVisorReport`), Abrir Expediente OT (`GestorOportunidades`) y Ver Timeline.
    - **Slide-Over Drawer Lateral con Timeline Intradía:** Línea de tiempo continua de 07:00 a 20:00 con marcador interactivo `NOW` y visualización de hitos planificados vs reales.
  - **[FEAT/ASIGNACION] Configuración de Horarios y Plan Diario Reactivo en Asignación (`GestorOportunidades.vue`):**
    - Campo específico para hora de llegada a faena planificada (`hora_llegada_plan`, default `09:30`).
    - Generación y persistencia reactiva de `plan_diario` (días hábiles entre `fecha_salida_plan` y `fecha_fin_plan`) en `json_field.ejecucion_v1.plan_diario`.
    - Badge en cabecera con el conteo de días hábiles calculados.
  - **[BACKEND/API] Endpoint Consolidado del Monitor y Alertas In-Web:**
    - Creado `/api/operaciones/control-vivo` con agregación en tiempo real de proyectos, viajes, surveys e inspecciones de portón (Template 79).
    - Creados `/api/operaciones/control-vivo/notificaciones`, `/notificaciones/:id/leida` y `/notificaciones/marcar-todas`.
    - Tabla en base de datos PostgreSQL: `sch_leangsp.tnot_notification_web`.
  - **[BACKEND/SECURITY] Candado Operativo Fail-Closed por Días Hábiles de OT (`reportDiarioController.js`):**
    - Funciones canónicas `calcularCupoDiasHabiles` y `getReportesConsumidosOT` con exclusión estricta de reportes FLETE.
    - Bloqueo duro con HTTP 403 `SERVICIO_CONCLUIDO` cuando se intenta emitir un reporte adicional habiendo completado los días contratados.
    - Manejo en App Conductor (`ViajeConductor.vue`) y PWA (`ReportDiarioIzaje.vue`) para descartar de la cola offline y no atascar la sincronización.
  - **[DATA/AUDIT] Sellado de Auditoría y Resiliencia Offline:**
    - Registro de `fecha_transmision_termino` al momento exacto de transmitir el Report Diario (Momento 2).
    - Soporte de `device_timestamp` en salida, llegada y reportes para trazabilidad offline verídica.
  - **[CLEAN] Limpieza y Normalización:**
    - Erradicación de placeholders fijos (`VCTR.81-9`, `Jorge Ponce`) en `Torre.vue`.
    - Depuración de endpoints y verificación de 0 regresiones.

---

## [Portal Web GSP y Backend API] - Versión 1.0.77
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-03 13:08:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-041`
- **Especificación Técnica:** `.agents/specs/62_edp_fechas_horas_colacion_y_formato_email_spec.md`
- **Detalle de Mejoras y Cambios (Alineación Estricta al Alcance Original, Supresión de Registro de Horarios de Colación, Horarios Nativos de Faena y Contraste Email RFC):**
  - **[SCOPE/DB] Alineación Estricta de Alcance y Reversión de Base de Datos:**
    - Reversión total de cualquier registro de horarios de colación (`hora_inicio_colacion` y `hora_termino_colacion`) fuera de scope. Columnas eliminadas de PostgreSQL (`sch_leangsp.tedp_reporte_avance`).
    - En App Móvil (`ViajeConductor.vue`) y Torre PMO (`ModalVisorReport.vue`): Erradicación completa de los inputs y campos de horas de inicio/fin de colación, manteniendo exclusivamente la duración en minutos pactada en el alcance contractual.
    - En Dossier EDP (Anexo 2) y Report Diario PDF: Despliegue sobrio y verídico con únicamente la duración registrada (`Colación: 1.0 hr` o `Sin colación (0 hrs)`), sin campos vacíos ni simulación de intervalos horarios.
  - **[PDF/EDP] Horarios de Inicio y Término de Faena en Anexo 1:**
    - Formateo limpio en celda `whitespace-nowrap font-mono` (`08:00 - 18:00` / `08:00 - 19:00`) derivado con precisión de los timestamps existentes `fecha_inicio_servicio` y `fecha_termino_servicio` en zona horaria chilena (`America/Santiago`, UTC-3), sin valores vacíos ni desbordes.
    - Derivación automática de período de corte de la Carátula de EDP desde las fechas de los reportes.
  - **[EMAIL/RFC] Contraste Alto y Legibilidad en Solicitud de Modificación de EDP:**
    - Estilos inline prioritarios (`!important`) en `.content-box` y etiquetas en cian brillante (`#38bdf8`), datos en blanco puro (`#ffffff`) y montos en verde esmeralda (`#34d399`), asegurando legibilidad en todos los clientes webmail y móviles.

---

## [Portal Web GSP y Backend API] - Versión 1.0.76
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-03 12:45:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-040`
- **Especificación Técnica:** `.agents/specs/62_edp_fechas_horas_colacion_y_formato_email_spec.md`
- **Detalle de Mejoras y Cambios (Corrección Integral Dossier EDP: Horarios de Faena, Rango de Colación y Contraste de Email RFC):**
  - **[PDF/EDP] Reparación de Fechas y Horarios en Dossier EDP (Anexo 1):**
    - Erradicación definitiva de los marcadores vacíos `-- : -- - -- : --` y saltos de línea antiestéticos en la columna "Horario" mediante extracción de `hora_inicio` y `hora_termino` y clase `whitespace-nowrap` con fallback UTC-3 `America/Santiago`.
    - Período de facturación en Carátula se deriva automáticamente de las fechas mínimas y máximas de los reportes en caso de no existir cortes persistidos.
  - **[DATA/EDP] Captura y Visualización Formal del Intervalo de Colación (Anexo 2):**
    - Nuevas columnas en base de datos PostgreSQL (`sch_leangsp.tedp_reporte_avance`): `hora_inicio`, `hora_termino`, `hora_inicio_colacion` y `hora_termino_colacion`. Backfill histórico aplicado sobre OT 103 (`GSP-2609-1933-014`).
    - En App Conductor (`ViajeConductor.vue`): Inputs de rango horario de colación (`<input type="time">`) condicionados a duración, sincronizados bidireccionalmente con los botones de minutos y transmitidos en el sellado FES.
    - En Torre PMO (`ModalVisorReport.vue`): Soporte completo para auditar y modificar `hora_inicio_colacion` y `hora_termino_colacion` en ajustes de analista.
    - En Dossier EDP (Anexo 2) y Report Diario PDF: Presentación estandarizada `Faena: 08:00 a 18:00 | Colación: 13:00 a 14:00 (1.0 hr)` (o `Sin colación (0 hrs)` si es 0).
  - **[EMAIL/RFC] Contraste Alto y Legibilidad Garantizada en Solicitud de Modificación de EDP:**
    - Erradicación de texto ilegible en clientes de correo mediante estilos inline prioritarios (`!important`) en `.content-box` de `messageModel.js`.
    - En `estadoPagoController.js`: Reescritura del cuerpo del email RFC con etiquetas en cian brillante (`#38bdf8`), datos en blanco puro (`#ffffff`), montos en verde esmeralda (`#34d399`) y justificación en bloque gris oscuro contrastado (`#14171f`).

---

## [Portal Web GSP y Backend API] - Versión 1.0.75
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 19:48:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-039`
- **Especificación Técnica:** `.agents/specs/61_gantt_flota_metricas_estados_y_navegacion_spec.md`
- **Detalle de Mejoras y Cambios (Rediseño Perspectiva Temporal de Flota Gantt, Métricas de Gestión y Erradicación Cockpit):**
  - **[UI/CLEAN] Erradicación Total de Términos Desalineados ("Cockpit"):**
    - En `Torre.vue` (cabecera PMO), eliminación del texto `Actualizar Cockpit` y sustitución por botón de actualización puramente icónico `🔄`, compacto y estilizado en azul/slate (`title="Actualizar datos"`).
    - Limpieza de todos los comentarios y etiquetas en interfaz con dicha palabra.
  - **[FEAT/GANTT] Métricas de Gestión y Productividad por Equipo en Fila Fija (`Torre.vue` vista `gantt`):**
    - **Inspecciones Realizadas:** Nueva columna sticky `Inspecc.` que calcula las inspecciones y checklists de cada equipo (`📋 X`), integrando la subconsulta SQL de `tsrv_survey` en `tequEquipoModel.js` y las inspecciones preoperacionales de patio activas.
    - **Producción Económica ($):** Nueva columna sticky `Producido ($)` que calcula con precisión los ingresos netos devengados o facturados de cada máquina (`formatMoneda(eq.totalProducido)`), computando líneas de servicio con asignación de equipo y OTs donde el equipo figure como grúa principal, excluyendo cancelados.
    - **Productividad OEE (%):** Columna sticky `OEE %` con indicador numérico y barra gráfica de ocupación temporal.
  - **[FEAT/GANTT] Matriz de Barras Temporales con 4 Estados Cromáticos Contrastados e Interactividad:**
    - 🟦 **Reservado / Programado:** Azul (`bg-blue-600`) / Cian en faena activa (`bg-cyan-600`).
    - 🟩 **Ya Ejecutado:** Verde Esmeralda (`bg-emerald-600`).
    - ⬛ **Cancelado:** Gris Pizarra con tachado (`bg-slate-700` `line-through`).
    - 🟧 **En Mantenimiento:** Ámbar / Naranja fuego (`bg-amber-600`).
    - 🟥 **Colisión Horaria:** Rojo intenso pulsante (`bg-red-600` `animate-pulse`).
    - **Navegación 1-Clic a la OT:** Al hacer clic en cualquier barra temporal se redirige inmediatamente a la OT correspondiente (`abrirProyecto(evento.proyectoId, subtab)`), con apertura contextual en ejecución o comercial.
  - **[BE/EQUIPOS] Subconsulta SQL de Inspecciones en Catálogo de Equipos (`tequEquipoModel.js`):**
    - Se incorporó subconsulta correlacionada `cant_inspecciones` sobre `sch_leangsp.tsrv_survey` por ID de equipo y patente en `getEquipos()`, desplegado en producción en PM2 `lean-services-gsp`.

---

## [Portal Web GSP y Backend API] - Versión 1.0.74
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 19:25:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-038`
- **Especificación Técnica:** `.agents/specs/60_aislamiento_control_financiero_kanban_vs_pmo_spec.md`
- **Detalle de Mejoras y Cambios (Aislamiento de Control Financiero: Modo Solo Lectura en Kanban vs Edición Exclusiva en PMO):**
  - **[ARCH/KANBAN] Inmutabilidad Financiera y Modo Solo Lectura en Tablero Kanban (`GestorOportunidades.vue`):**
    - Paso 1 (ITS): Se preserva `ModalITS` en modo de solo lectura estricta (`:readonly="true"`).
    - Paso 2 (EDP): Se bloquea la edición invocando `ModalCaratulaEDP` con `:solo-lectura="true"`.
    - Paso 3 (OC Mandante): Se retiran los botones de subida física (`+ Adjuntar OC`) y acción de asunción; se eliminan los botones de borrado de OC. Se añade banner indicativo de solo lectura y visor de OCs con enlace directo a PDF.
    - Paso 4 (Facturación DTE): Erradicación completa de los inputs interactivos de número de factura, fecha, HES y del botón maestro de cierre contable (`Declarar Facturada & Cerrar`). Se implementa ficha ejecutiva de solo lectura con banner informativo que deriva la gestión a la Torre de Control PMO.
  - **[FEAT/PMO] Edición y Cierre Exclusivo en la Torre de Control PMO (`Torre.vue` - Sub-vista 3 `pendientes_edp`):**
    - El botón de acción en la grilla fue reemplazado por `[ 🧾 Carátula & Facturar PMO ➔ ]`, abriendo `ModalCaratulaEDP` directamente en el Cockpit del Analista sin redirigir al CRM.
    - Invocación de `ModalCaratulaEDP` con `:solo-lectura="false"`, facultando a Tesorería (Pamela) y Administrador (Sergio) para ajustar tarifas, cargar archivos de OC y Factura DTE y pulsar `[ 🏁 Declarar Facturado & Concluir ]`.
  - **[COMP/EDP] ModalCaratulaEDP Resiliente y Multifuncional (`ModalCaratulaEDP.vue`):**
    - Nuevo prop `soloLectura: Boolean` que conmuta entre el modo de auditoría visual (Kanban) y el modo de gestión operativa financiera (PMO).
    - Bloqueo de edición de tarifas y ocultamiento de formularios cuando `soloLectura` está activo.

---

## [Portal Web GSP y Backend API] - Versión 1.0.73
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 18:55:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-037`
- **Especificación Técnica:** `.agents/specs/59_edp_gobernanza_permisos_admin_y_solicitud_cambio_rfc_spec.md`
- **Detalle de Mejoras y Cambios (Soporte Documental OC/Factura, Permisos Globales Admin Sergio Gajardo, Flujo RFC y Fallback Resiliente WhatsApp):**
  - **[FEAT/DOCS] Soporte Documental Completo de OC y Factura en Carátula de EDP (`ModalCaratulaEDP.vue`):**
    - Módulo integral de Cierre y Soporte Documental: Subida física de archivos binarios (PDF o imagen de Orden de Compra y PDF de Factura DTE) mediante estándar `leanglobal_file_storage_standard` a `/api/v1/storage/upload`.
    - Ingreso manual estructurado de metadatos de cobranza: N° OC, fecha de emisión y monto neto; N° Factura, fecha de facturación, monto neto, monto bruto e incidencias/observaciones.
    - Botón de salvaguarda `[ ⚖️ Sin OC (Asumir EDP) ]` para negocios ejecutados sin orden formal de compra previa.
    - Botón formal `[ 🏁 Declarar Facturado & Concluir ]` que actualiza el estado del proyecto a `7` (`FACTURADO / CONCLUIDO`) y persiste los datos en `ordenes_compra`, `oc_v1` y `liquidacion_v1`.
  - **[FEAT/ADMIN] Permisos Globales de Edición para Administrador y Gobernanza RFC:**
    - Habilitación de facultades plenas de edición de tarifas y ajustes contables en `ModalCaratulaEDP.vue` y endpoint `POST /api/operaciones/edp/ajustes-tesoreria` para el Administrador del Sistema (`sgajardoc@gmail.com`, `id_rol: 1`).
    - Flujo de Solicitud de Cambio (RFC de EDP) para perfiles analistas o comerciales sin permisos de modificación, con submodal estructurado y registro auditable en `tpry_proyecto.json_field -> edp_solicitudes_ajuste`.
    - Endpoints backend `POST /api/operaciones/edp/solicitar-modificacion` y `POST /api/operaciones/edp/resolver-solicitud-modificacion` con resolución de estados (`APLICADA` / `DESCARTADA`).
  - **[FIX/NOTIF] Diagnóstico de Entrega de WhatsApp y Fallback Resiliente Omnicanal (`notificacionService.js`):**
    - Diagnóstico de la causa raíz de entrega: el servicio intentaba conectar a `http://127.0.0.1:3085/enviar` en entornos locales donde no hay microservicio Baileys local.
    - Implementación de arquitectura multi-endpoint con conmutación por error (failover) transparente hacia el endpoint público HTTPS `https://servidor.leanglobal.cl/lg-gsp-dev/whatsapp/enviar`.
    - Normalización automática de números telefónicos chilenos (E.164) y resolución cruzada de campos `movil`, `fono` y `telefono` desde `tsec_users`.

---

## [Portal Web GSP y Backend API] - Versión 1.0.72
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 15:15:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-036`
- **Especificación Técnica:** `.agents/specs/58_torre_control_pmo_avance_global_y_herencia_estados_spec.md`
- **Detalle de Mejoras y Cambios (Gobernanza de PDFs Oficiales, Barra de Avance Global y Herencia Retrospectiva de Estados):**
  - **[FEAT/PMO] Acceso y Descarga Directa de PDFs Oficiales de ITS y EDP:**
    - Se agregó el botón rojo estándar `📄 PDF` en la columna Acción de la Sub-vista 2 (Informes de Término de Servicio - ITS) y se transformó el Folio ITS en un enlace interactivo con apertura directa a `/operaciones/its/preview-pdf/:id_proyecto`.
    - Se incorporó el botón `📄 Ver EDP` en la columna Acción de la Sub-vista 3 (Pipeline EDP & Facturación) y se habilitó el badge `🔓 EDP Liberado` como acceso directo al PDF de Carátula y Dossier de cobro en `/operaciones/edp/proyecto/:id_proyecto/pdf`.
  - **[FEAT/METRICAS] Barra de Avance Global del Negocio (0% a 100%):**
    - Se incorporó la columna "Avance Global" en la Matriz de Hitos (Sub-vista 4) con cálculo ponderado de 7 hitos (`getAvanceNegocio(p)`), degradado continuo (`from-blue-500 to-emerald-400`), porcentaje monospace contrastado y etiqueta de fase en tiempo real.
  - **[FEAT/LOGICA] Principio de Herencia Retrospectiva de Estados (Lifecycle-Aware Inheritance):**
    - Erradicación de falsas alarmas y alertas rojas críticas en servicios ejecutados:
      - *Asignación:* Rescate jerárquico de equipo y operador desde reportes reales de faena (`VCTR.81-9`, Jorge Ponce) y flota master.
      - *Acreditación:* Conmutación a `No Requerida` si `requiere_acreditacion = false`, o a estado neutro `Superada en Faena` para servicios terminados.
      - *Salida Patio:* Conmutación automática a `✓ Completado` al detectar reportes validados o ITS cerrado.
      - *OC Mandante:* Transición a `⚖️ Asumir EDP (S/OC)` en ámbar de Tesorería para servicios de urgencia concluidos sin OC formal.
      - *Programación:* Restauración reactiva de fechas planificadas desde la cotización y los reportes de terreno.
    - El negocio 014 refleja un avance global consolidado del **96% • Listo Facturar**.

---

## [Portal Web GSP y Backend API] - Versión 1.0.71
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 13:05:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Backend Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-035`
- **Especificación Técnica:** `.agents/specs/46_informe_termino_servicio_its_spec.md` y `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Filas Físicas de Flete en Sección 2, Tarifa Estándar Operador $10.000 y Sanitización Universal de Fechas):**
  - **[FEAT/OPS] Filas Físicas de Traslados (Fletes) en Grilla de Servicios (Sección 2):**
    - Los fletes ya no son un número flotante en cabecera ni un fantasma en el P&L: ahora figuran como registros físicos concretos en la tabla de jornadas (`Flete Solo Ida` por $200.000 y `Flete Solo Retorno` por $200.000), totalizando los 5 ítems de servicio de la OT 014 (Ida + Día 1 + Día 2 + Día 3 + Retorno).
    - Desacople matemático en el motor de cálculo: las filas de tipo flete no suman a las horas grúa de faena (que se mantienen en 28 hrs exactas), pero sí aportan al `total_ingresos_fletes` ($400.000) y al total facturable ($2.780.000).
    - Inclusión del botón `[ 🚚 + Agregar Flete ]` en la barra de herramientas de Sección 2 para permitir la inserción ágil de tramos de traslado con tarifa pre-calculada.
  - **[FEAT/COSTOS] Tarifa Estándar de Hora Operador ($10.000 / hr) y Asignación de Tripulación Real:**
    - Erradicación definitiva de registros residuales de prueba (Nicolás Ceballos) y asociación automática del tripulante real de la OT (Jorge Ponce en grúa ATF 50 G3 `VCTR.81-9`).
    - Fijación de la tarifa unitaria estándar acordada con gerencia en **$10.000 / hr** (28 horas efectivas = $280.000).
    - Selector desplegable de operador en la grilla de costos que auto-completa el personal asignado al proyecto.
  - **[BUGFIX/UI] Sanitización Universal de Fechas en Todas las Categorías de Costo:**
    - Normalización estricta de fechas con `TO_CHAR(fecha, 'YYYY-MM-DD')` en SQL y sanitización `.split('T')[0]` en `cargarITS` de `ModalITS.vue`, erradicando por completo el placeholder vacío `dd-mm-aaaa` en inputs de fecha HTML5.

---

## [Portal Web GSP] - Versión 1.0.70
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 12:35:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-034`
- **Especificación Técnica:** `.agents/specs/46_informe_termino_servicio_its_spec.md` y `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Conciliación Reactiva ITS, Reparación de Fechas, Flete y Valorización por Ítem):**
  - **[FEAT/BACKEND] Conciliación Reactiva Automática de Jornadas (`getITS`):**
    - Se resolvió la causa raíz por la cual un ITS guardado en borrador preliminar mantenía congelada la jornada inicial ignorando los nuevos reportes validados de terreno.
    - `getITS` consulta deterministamente todos los reportes de `sch_leangsp.tedp_reporte_avance` del proyecto y, si el ITS está en estado editable (`BORRADOR` o `BORRADOR_INCREMENTAL`), incorpora automáticamente los días pendientes (Día 2 y Día 3 de OT 103), actualiza las horas validadas y FES, y sincroniza las 28 horas totales.
  - **[BUGFIX/FORMAT] Formateo Estricto de Fecha HTML5 (`YYYY-MM-DD`):**
    - Se corrigió la máscara vacía `dd-mm-aaaa` en los `<input type="date">`. En base de datos se formatea con `TO_CHAR(jd.fecha, 'YYYY-MM-DD')` y en frontend se sanitiza con `.split('T')[0]`.
  - **[FEAT/FINANZAS] Valorización por Fila y Columnas de Tarifa y Subtotal:**
    - Se agregaron las columnas `Tarifa $/hr` y `Subtotal ($)` en la tabla de jornadas tanto en el frontend web (`ModalITS.vue`) como en el documento PDF oficial (`itsPdfService.js`).
    - Cada jornada exhibe su tarifa individual (por defecto `$85.000`) y su subtotal calculado (ej: 9h = `$765.000`, 10h = `$850.000`, 9h = `$765.000`).
    - Se agregaron las columnas `tarifa_hora` y `subtotal` a la tabla relacional `sch_leangsp.tits_jornada_detalle` para persistencia idempotente en `guardarITS`.
  - **[BUGFIX/COMERCIAL] Corrección de Flete Pactado ($400.000 Ida + Retorno):**
    - Se ajustó el parser de líneas CRM para considerar el subtotal de la línea de traslado ($400.000) en lugar de truncar por cantidad unitaria ($200.000). El ITS concilia el flete completo pactado (Ida + Retorno faena, 41 km Pitrufquén).
    - Venta Neta Facturable Total consolidada: Horas ($2.380.000) + Flete ($400.000) = **$2.780.000**.

---

## [Portal Web GSP] - Versión 1.0.69
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-02 10:15:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-033`
- **Especificación Técnica:** `.agents/specs/52_notificaciones_omnichannel_deep_linking_spec.md` y `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Acotamiento de Destinatarios y Gobernanza de Notificaciones):**
  - **[FEAT/CRM] Modal Generar Requerimiento Acotado a Gestión (Flujo 1):**
    - Se reemplazó la iteración sobre `usuariosEnroladosFes` por `usuariosNotificablesGestion`, excluyendo del listado a los más de 30 operarios y riggers de faena.
    - Pre-selección por defecto acotada al Coordinador de Operaciones (`logistica@arriendosanpablo.cl`) y Comercial creador de la preventa (`id_usuario_creacion`).
  - **[FEAT/CRM] Modal Aprobar Requerimiento con Despacho Estricto a Seleccionados (Flujo 2):**
    - Listado en modal confinado a personal de gestión y comercial.
    - Pre-selección por defecto acotada al Comercial creador y Coordinador de Operaciones.
    - Despacho de notificaciones vía correo electrónico restringido única y exclusivamente a los destinatarios con casillas activas seleccionadas en el modal.
  - **[BACKEND/ITS] Restricción Canónica en Paso 3 de ITS (Flujo 3):**
    - Erradicación de la consulta amplia por roles `(31, 32, 33, 35, 36)`.
    - Envío acotado deterministamente a 4 destinatarios canónicos: Analista elaborador (`its.id_user_elaborado`), Jefatura que visó (`its.id_user_aprobado` / `logistica@arriendosanpablo.cl`), Contabilidad (`mseguel@arriendosanpablo.cl` / `id_user`) y Comercial dueño de la OT (`tpry_proyecto.id_usuario_creacion`).
  - **[BACKEND/OPS] Validación de Report Diario (Flujo 4):**
    - Mantenimiento expreso de la copia de notificación al correo del operador asignado (`rep.op_email`) junto con Analista y Logística.

---

## [Backend API GSP] - Parche Crítico Filtrado PWA (REQ-032)
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-01 18:50:00 (-03:00)
- **Servicio:** `lean-services-gsp` (PM2 ID 10, puerto 3006)
- **Requerimiento Backlog:** `REQ-032`
- **Especificación Técnica:** `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Filtrado Estricto de Reports Pendientes por Tripulante):**
  - **[BUGFIX/OPS] Erradicación de Fuga de OTs por Búsqueda Difusa LIKE:**
    - Se reemplazó la condición `p.json_field::text LIKE '%' || $1::text || '%'` en `reportDiarioController.js` por consulta determinista JSONB sobre `operador_id`, `rigger_id`, array `tripulacion_asignada`, `lineas_servicio` de cotización y `tedp_reporte_avance`.
    - Resuelve la fuga que provocaba que operadores como Robert (ID 50) visualizaran OTs ajenas asignadas a Jorge (como la OT 103) debido a coincidencias de texto como "50 TON" o cifras numéricas en el cuerpo del JSON.

---

## [Portal Web GSP] - Versión 1.0.68
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-01 18:25:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-031`
- **Especificación Técnica:** `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Ocultamiento Condicional de Rigger en Visor Web de Reports):**
  - **[FEAT/UI] Ocultamiento Total de Tarjeta Rigger:**
    - La tarjeta `🦺 Rigger / Asistente` en `ModalVisorReport.vue` se condiciona con `tieneRigger`. Si la OT o report no cuenta con Rigger asignado (`id_user_rigger` nulo o 'S/R'), la tarjeta se remueve al 100% y la grilla se ajusta fluidamente a 3 columnas.

---

## [PWA GSP - Grúas San Pablo] - Versión 1.0.33
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-01 18:25:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-031`
- **Especificación Técnica:** `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Erradicación de Rigger por Defecto en PWA Terreno):**
  - **[FEAT/OPS] Eliminación de Fallback Hardcodeado de Rigger:**
    - Se eliminó el retorno forzado `'JOSE ARRIAGADA'` de la propiedad reactiva `riggerNombre`. Si la OT no incluye un especialista con rol Rigger asignado, retorna `null`.
  - **[FEAT/UI] Ocultamiento de Etiqueta Rigger en los 3 Pasos del Formulario:**
    - Las etiquetas `Rig: {{ riggerNombre }}` en el encabezado, en la confirmación de inicio y en la certificación final de jornada se condicionan con `v-if="riggerNombre"`, ocultándose limpiamente.

---

## [Portal Web GSP] - Versión 1.0.67
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-01 18:05:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-023`
- **Especificación Técnica:** `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Cockpit PMO Unificado con Accesos Directos a Reports, ITS, EDP y Matriz de Hitos):**
  - **[FEAT/PMO] Barra de Navegación de 4 Sub-vistas en Torre de Control PMO:**
    - `1. Reports Diarios Inbox`: Bandeja de entrada unificada de reports diarios de terreno con filtros (Pendientes, Con Ajustes, Validados), badges de SLA y botón directo `[Auditar y Validar ➔]` con apertura del visor interactivo.
    - `2. Informes de Término (ITS)`: Bandeja de OTs en curso con conteo de reports validados vs pendientes, estado del circuito de firmas FES y botón `[Gestionar ITS ➔]`.
    - `3. Pipeline EDP & Facturación`: Reconciliación de OTs concluidas con acceso directo a Carátula EDP mandante y facturación CRM.
    - `4. Matriz Hitos Global OT`: Matriz de 7 hitos operativos con trazabilidad en tiempo real.
  - **[FEAT/PMO] KPIs Ejecutivos del Analista de Operaciones:**
    - Indicadores interactivos de Reports por Validar, Reports con Ajustes, OTs sin ITS, ITS en Firmas FES y EDPs Listos para Facturación con redirección contextual inmediata.

---

## [Portal Web GSP] - Versión 1.0.66
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-01 16:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-021`
- **Especificación Técnica:** `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (Ciclo Integral Reports, ITS, EDP y Facturación - Spec 57):**
  - **[FEAT/FES] Validación de Report Diario con PIN FES y Auditoría Horaria:**
    - Submodal interactivo de 4 casillas para firma PIN FES en `ModalVisorReport.vue` con validación SHA-256; normalización horaria `America/Santiago` y visualización de horario original vs ajustado con badge `[AJUSTADO]`.
  - **[FEAT/ITS] Doble Firma FES en ITS y Anexo Vinculante:**
    - Doble validación técnica FES (Paso 1 Analista, Paso 2 Jorge Ponce) y compilación automática de reportes diarios aprobados en Sección 7.
  - **[FEAT/EDP] Hard Gate Determinista y Restricción de Tarifas Exclusiva de Tesorería:**
    - Bloqueo de carátula EDP si no cuenta con visto bueno técnico; modificación de tarifas y descuentos reservada exclusivamente a Pamela / Tesorería.
  - **[FEAT/FACTURACIÓN] Botón Cliente Sin OC para Cierre Continuo:**
    - Opción directa para avanzar a Facturación DTE asumiendo el valor liquidado del EDP ante ausencia de orden de compra formal.

---

## [PWA GSP - Grúas San Pablo] - Versión 1.0.32
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-10-01 16:30:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/pwa-gsp-dev` (URL: `https://servidor.leanglobal.cl/pwa-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-025`
- **Especificación Técnica:** `.agents/specs/57_ciclo_integral_reports_its_edp_y_facturacion_spec.md`
- **Detalle de Mejoras y Cambios (PWA Terreno: Regla de Cómputo de Inicio y Filtrado de Pendientes):**
  - **[FEAT/OPS] Regla de Cómputo de Inicio de Servicio (Momento 1 Urbano vs Rural):**
    - Cómputo base a base para servicios urbanos (≤ 30 km) y portón a portón para faenas rurales (> 30 km), con cobro de flete según cotización comercial.
  - **[FEAT/UX] Filtrado Reactivo de OTs Pendientes en Home PWA (`Surveys.vue`):**
    - Ocultamiento automático de OTs concluidas o con jornadas completadas para evitar doble reporte en terreno.
  - **[FEAT/SECURITY] Hard Gate Backend HTTP 403:**
    - Bloqueo determinista ante intentos de generar reports sobre OTs concluidas.

---

## [Portal Web GSP] - Versión 1.0.65
- **Ambiente:** `dev` / `prod`
- **Fecha de Despliegue:** 2026-09-30 21:15:00 (-03:00) [Dev] / 2026-09-30 21:17:00 (-03:00) [Prod]
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`) & `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimiento Backlog:** `REQ-020`
- **Especificación Técnica:** `.agents/specs/56_ajustes_operacionales_segunda_sesion_marcha_blanca_spec.md`
- **Detalle de Mejoras y Cambios (Sincronización Reactiva de Operador Reasignado en Despacho e Inspecciones de Patio):**
  - **[BUGFIX/DESPACHO] Prioridad Canónica de Asignación en Despacho (`getNombreOperadorAsignado`):**
    - Se invirtió la prioridad de resolución de operador en Sub-tab 5: el operador asignado a la grúa en la OT (`opTrip?.id_user` de Sub-tab 2) es ahora la autoridad primaria sobre cualquier dato histórico en `ins.operador_id`, eliminando el desfase visual reportado en el caso GSP-2609-4855-008.
  - **[FEAT/REASIGNACIÓN] Sincronización Automática en Guardado de Asignación (`guardarCambiosAsignacion`):**
    - Al pulsar `[💾 Guardar Modificaciones]` en Sub-tab 2, el sistema sincroniza automáticamente `preparacionSalidaState.inspecciones_patio` con los operadores actualizados de la OT antes de persistir el payload.
    - Si la inspección ya contaba con un Survey creado (`id_survey`), el sistema invoca de forma reactiva `PUT /survey/UpdPlan/:id_survey` reasignando el responsable en `tsrv_survey` de la base de datos para que la PWA móvil del nuevo operador reciba la tarea de inmediato.
  - **[REACTIVIDAD] Sincronización en Entrada a Despacho (`sincronizarInspeccionesPWA`):**
    - Verificación y actualización automática de operador en `sincronizarInspeccionesPWA` ante discrepancias entre la asignación de la OT y la inspección de patio, garantizando consistencia bidireccional continua.

---

## [Portal Web GSP] - Versión 1.0.64
- **Ambiente:** `dev` / `prod`
- **Fecha de Despliegue:** 2026-09-30 18:35:00 (-03:00) [Dev] / 2026-09-30 20:07:00 (-03:00) [Prod]
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`) & `/var/www/html/lg-gsp-prod` (URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Requerimiento Backlog:** `REQ-019`
- **Especificación Técnica:** `.agents/specs/56_ajustes_operacionales_segunda_sesion_marcha_blanca_spec.md`
- **Detalle de Mejoras y Cambios (Ajuste Dimensional Layout y Scroll Horizontal):**
  - **[UI/UX] Erradicación de Scroll Horizontal Innecesario en Asignación:**
    - Incorporación de `table-fixed` a la tabla matriz de Asignación en `GestorOportunidades.vue`, forzando el ajuste estricto al 100% del ancho del viewport sin desbordes.
    - Rebalanceo canónico de columnas de cabecera: `Recurso (22%)`, `Equipo (25%)`, `Operador & Rigger (28%)`, `Ventana (21%)`, `Acciones (4%)` sumando 100%.
  - **[CSS/LAYOUT] Blindaje de Anchos y Truncamiento de Texto:**
    - Inyección de clases `min-w-0`, `w-full` y `truncate` en selectores y celdas de las tres secciones (Flota Principal, Traslados y Especialistas).
    - Compactación semántica del badge de mayor prestación: `Equipo Mayor Capacidad (Tarifa Respaldada)` con tooltip explicativo completo en `title="..."`.

---

## [Portal Web GSP] - Versión 1.0.63
- **Ambiente:** `dev`
- **Fecha de Despliegue:** 2026-09-30 15:45:00 (-03:00)
- **Ruta de Despliegue:** `/var/www/html/lg-gsp-dev` (URL: `https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Requerimiento Backlog:** `REQ-018`
- **Especificación Técnica:** `.agents/specs/56_ajustes_operacionales_segunda_sesion_marcha_blanca_spec.md`
- **Detalle de Mejoras y Cambios (Hotfix Operacional Marcha Blanca):**
  - **[BUGFIX/OPS] Purga Total de Prevencionista Fantasma (Caso GSP-2609-3707-013):**
    - Exclusión incondicional de cualquier prevencionista (incluso con `id_user` histórico en BD) si la cotización no demanda prevencionista (`requiere_prevencionista !== true`).
  - **[BUGFIX/UX] Erradicación de Rigger Duplicado en Sección 3 Especialistas:**
    - Exclusión total de Riggers en la Sección 3 (*Especialistas & Personal Técnico en Terreno*); el Rigger vive única y exclusivamente en la Grúa Principal bajo el Operador.
  - **[BUGFIX/DESPACHO] Resolución de Nombre Real del Operador en Sub-tab 5:**
    - Conexión determinista de `getOperadorAsignadoAEquipo` con `linesEquiposPrincipales` y cruce con el catálogo maestro de `usuarios.value`, corrigiendo la etiqueta que mostraba *"Sin Operador Asignado"* pese a tener semáforo verde.

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
