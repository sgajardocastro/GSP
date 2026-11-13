# CASO-20261111-01: Desbloqueo y Apertura en Modo Edición de Reportes Diarios Digitales desde Control Operativo Vivo e Inbox PMO

- **Fecha del Incidente:** 11 de Noviembre de 2026
- **Entorno Afectado:** Producción (`https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Estado:** CERRADO / RESUELTO DE FONDO
- **Requerimiento Asociado:** `REQ-1149`
- **Versión Liberada:** `v1.0.209` (Frontend Web & Backend)
- **Componentes Intervenidos:**
  - Frontend: `ejecucion/frontend/src/components/Operaciones/ModalVisorReport.vue`
  - Frontend: `ejecucion/frontend/src/views/Operaciones/ControlOperativoVivo.vue`
  - Gobernanza: `package.json`, `RELEASE_LOG.md`, `Gestión/tareas.md`, `sch_leangsp_prod.tcfg_backlog`, `sch_leangsp_prod.tcfg_releases`

---

## 1. Resumen Ejecutivo del Incidente
El usuario reportó que al presionar el botón `[ 📋 Report D1 ]` en la tarjeta de servicio de Control Operativo Vivo (caso testigo `GSP-2611-00017` / Constructora Carran S.A, equipo `VCTR.81-9`) y el botón amarillo `Auditar y Validar` en el Inbox de Reportes Diarios de Torre de Control (`Torre.vue`), el formulario del Report Diario no abría o abría en modo lectura estática sin permitir la edición inmediata de lo reportado en terreno (horarios, horómetros, odómetros, tripulación y standby).

---

## 2. Síntoma Reportado y Contexto Operacional
- **Reportado por:** Dirección / Analista de Control de Gestión PMO (adjuntando captura de pantalla de Control Operativo Vivo).
- **Impacto Operativo:** El analista no podía abrir de forma directa el Report Diario del Día 1 emitido para auditar y rectificar los datos operativos reportados por la tripulación antes de su validación con PIN FES.
- **Exigencia Funcional:** La interacción con ambos botones (`[ 📋 Report D1 ]` y `Auditar y Validar`) debe abrir de forma obligatoria y directa el modal en modo edición (`modoAjuste = true`).

---

## 3. Diagnóstico Forense y Causa Raíz
1. **Regla Rígida de Coincidencia de Fecha en `ControlOperativoVivo.vue`:**
   En `abrirVisorReportDirecto`, la subfunción `buscarReportDelDia(lista)` evaluaba `fRep === fechaTarget`. Si el string ISO retornado por la base de datos PostgreSQL difería en formato o por zona horaria de la fecha del ribbon (`fechaTarget`), la función ejecutaba de forma tajante `return null;`. Al retornar `null`, se ignoraba la presencia del reporte existente en `lista` y se disparaba la alerta de advertencia `alert('ℹ️ El Día ... aún no tiene horario de inicio/término...')`, impidiendo la apertura del modal.
2. **Inicialización Forzada en Modo Lectura en `ModalVisorReport.vue`:**
   Al dispararse el watcher reactivo de `props.report`, el componente ejecutaba incondicionalmente `modoAjuste.value = false;`. Esto provocaba que cualquier apertura desde Torre o Control Vivo ocultara los campos editables (`<input>`, `<select>`) y mostrara únicamente etiquetas de texto estático, obligando a buscar un botón secundario para habilitar la edición.
3. **Falta de Prop de Configuración Inicial:**
   No existía un prop formal (`modoEdicionInicial`) para gobernar el comportamiento de apertura activa según el caso de uso (auditoría/ajuste vs consulta documental).

---

## 4. Resolución Estructural Aplicada (4 Niveles)
1. **Nivel 1 (Origen del dato y Props):**
   En `ModalVisorReport.vue` se incorporó la propiedad reactiva `modoEdicionInicial: { type: Boolean, default: true }`. Al instanciarse el componente sin `readonly`, el estado `modoAjuste` se inicializa automáticamente en `true`.
2. **Nivel 2 (Lógica Intermedia en Frontend):**
   - En `ModalVisorReport.vue` se actualizaron los watchers de `props.report` y `props.visible` para establecer `modoAjuste.value = !props.readonly && props.modoEdicionInicial`, y se blindó el parseo defensivo de `ajustes_analista` para entradas JSON en formato string.
   - En `ControlOperativoVivo.vue` se reescribió `buscarReportDelDia(lista)` con resolución escalonada:
     1. Coincidencia por `id_reporte_avance` de la jornada.
     2. Coincidencia por normalización de fecha a 10 caracteres (`YYYY-MM-DD`).
     3. Coincidencia por correlativo de día (`dia_correlativo === diaSel`).
     4. Fallback de reporte único de la OT (`lista.length === 1`).
     5. Generación de borrador contextual en memoria si no existiera registro previo en base de datos.
3. **Nivel 3 (Integridad en BD y Sincronización):**
   Sincronizado el requerimiento `REQ-1149` y la versión `v1.0.209` en las tablas maestras de gobernanza de producción `sch_leangsp_prod.tcfg_backlog` y `sch_leangsp_prod.tcfg_releases`.
4. **Nivel 4 (Despliegue y Vistas):**
   Compilación de producción `dist_prod` completada con 0 errores (1.628 módulos procesados en 59s), subida limpia a `/var/www/html/lg-gsp-prod/` y reinicio sin caídas del servicio backend PM2 (ID 13).

---

## 5. Verificación Empírica y Evidencias de Pruebas
1. **Compilación Vite:**
   - Comando: `vite build --mode production --outDir dist_prod`
   - Resultado: 1.628 módulos transformados, 0 errores, bundle generado `dist_prod/assets/index-CowaIFh7.js`.
2. **Hard Gate de Gobernanza:**
   - Verificación estricta de coherencia entre `package.json` (`1.0.209`), `RELEASE_LOG.md` (`REQ-1149`) y `Gestión/tareas.md` (Tarea 119 `[x]`).
3. **Verificación HTTP 200 en Producción:**
   - URL: `https://servidor.leanglobal.cl/lg-gsp-prod/`
   - Respuesta: `HTTP/1.1 200 OK`, `Last-Modified: Wed, 11 Nov 2026 15:01:10 GMT`.
   - Asset cargado: `/lg-gsp-prod/assets/index-CowaIFh7.js`.

---

## 6. Saneamiento Histórico en Base de Datos
Se verificó que los registros de `tedp_reporte_avance` en `sch_leangsp_prod` mantienen su consistencia referencial y que las llamadas a `/operaciones/report/proyecto/:id` devuelven los reportes con su correspondiente `fecha_reporte_iso`, permitiendo el emparejamiento inmediato tanto en jornada única como en servicios multi-día.

---

## 7. Lecciones Aprendidas y Medidas Preventivas
- **Anti-patrón de Bloqueo Prematuro con Alert:** Nunca se debe bloquear la interfaz de usuario con un `alert()` cuando el usuario presiona un botón explícito de acción documental (`Report D1`). Si el reporte aún no existe físicamente en base de datos, el sistema debe proveer la plantilla en blanco prellenada con el contexto de la OT para permitir capturar la información de inmediato.
- **Semántica de los Botones de Acción:** Si un botón se denomina "Auditar y Validar" o "Report Dx", el flujo de trabajo natural del operador o analista es modificar o validar; por lo tanto, el modo de edición debe estar activado por omisión.
