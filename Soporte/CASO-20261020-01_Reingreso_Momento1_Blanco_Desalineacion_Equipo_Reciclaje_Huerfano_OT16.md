# 🛠️ CASO-20261020-01: Reingreso a Report Diario Muestra Momento 1 en Blanco tras Iniciar Jornada (Desalineación de `id_equipo` y Reciclaje de Huérfano en OT-16)

---

## 1. Ficha del Incidente

| Parámetro | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261020-01` |
| **Fecha / Hora** | 2026-10-20 19:21 CLT (Hora Oficial de Chile) |
| **Operador / Usuario Afectado** | Robert Rodríguez (`id_user = 49`, RUT `26.588.627-5`) |
| **Negocio / OT** | `GSP-2610-233-016` (`id_proyecto = 16`, servicio de 10 días) |
| **Cliente / Faena** | Sociedad de Constructores Tensacon S.A. / Faena planta Ferrero |
| **Equipo Operado vs Viaje** | Grúa operada: **Liebherr LTM-1090 (`PJYY.20-1`, `id_equipo = 33`)** / Equipo en viaje de traslado: **Camión Tracto / Rampla (`GKDS.88-9`, `id_equipo = 45`)** |
| **Ambiente** | Producción (`PROD` - Base de datos `sch_leangsp_prod`, PWA `v1.0.51` ➔ Resuelto en `v1.0.53`) |
| **Severidad** | **Crítica** (Bloqueo reiterado en cierre de jornada en terreno) |
| **Estado** | **RESUELTO DEFINITIVAMENTE EN ARQUITECTURA E2E (`REQ-1060` / `SPEC-088` / PWA `v1.0.53`, 14/14 Tests E2E PASA)** |

---

## 2. Síntoma Reportado por Terreno

Mediante audio de WhatsApp (`WhatsApp Audio 2026-10-20 at 19.21.35.ogg`) y dos capturas de pantalla enviadas desde terreno:
1. En la mañana (`16:02 UTC` / `13:02 CLT`), el operador Robert Rodríguez ingresó a la OT `GSP-2610-233-016` desde la PWA, completó los datos de **Momento 1 (Inicio de Jornada)** (horómetro inicial `4467`, hora `08:00`, fecha `20-10-2026`, foto de horómetro) y presionó **Guardar Inicio de Jornada**.
2. La aplicación respondió con el mensaje verde: `"🟢 Inicio de Jornada guardado en Control de Flota exitosamente!"` y registró en pantalla `"Inicio registrado: 2026-10-20 a las 08:00 hrs"`.
3. En la tarde (`19:18 CLT`), al reingresar desde la consola de la PWA (`Surveys.vue`) para realizar el cierre de la jornada (**Momento 2 — Cierre & Firma Mandante**), el sistema **volvió a abrir el Momento 1 en blanco** (`Día 1 de 10`, `08:00`, horómetro precargado del equipo equivocado `1192`), como si nunca hubiese iniciado la jornada en la mañana.

---

## 3. Diagnóstico Quirúrgico & Evidencia Empírica

### A. Logs de Acceso Nginx (`/var/log/nginx/access.log` — 20/Oct/2026)
La trazabilidad de red confirmó que **no hubo pérdida de conectividad ni cola offline**:
* **`13:02:23 -0300`**: `GET /lg-gsp-prod/api/operaciones/report/contexto/16?id_equipo=45` ➔ HTTP `200`.
* **`13:02:59 -0300`**: `POST /lg-gsp-prod/api/operaciones/report/inicio-jornada` ➔ HTTP `200` (`480 bytes`).
* **`19:18:49 -0300`**: `GET /lg-gsp-prod/api/operaciones/report/contexto/16?id_equipo=45` ➔ HTTP `200`.

### B. Evidencia en Base de Datos (`sch_leangsp_prod`)
1. **Asignación de Equipos en la OT 16 (`tpry_rel_equipo`):**
   * `id_equipo = 33` (`PJYY.20-1`, Grúa Móvil Liebherr LTM-1090).
2. **Viaje de Desplazamiento (`tequ_log_desplazamiento`):**
   * `id_viaje = 46`, token `vj-16-45-nr3c3`, `id_equipo = 45` (`GKDS.88-9`), `tipo_trayecto = 'IDA'`, `estado_viaje = 'ASIGNADO'`.
3. **Registros en `tedp_reporte_avance` para `id_proyecto = 16`:**
   * **`id_reporte_avance = 22`**: `id_equipo = 33`, `estado_reporte = 'JORNADA_EN_CURSO'`, `creado_en = '2026-10-15 10:23:37'`, `fecha_reporte = '2026-10-20'`, `horometro_inicial = 4467`.
   * **`id_reporte_avance = 19, 20, 23, 26, 27`**: Reportes cerrados (`VALIDADO_FES`) en los días `13-10`, `14-10`, `15-10`, `16-10` y `19-10`, todos con `id_equipo = 33`, y los tres últimos con `dia_correlativo = 1` repetido.

---

## 4. Causa Raíz de Arquitectura (Doble Defecto Estructural)

### Causa Raíz #1: Desalineación de `id_equipo` entre Consola (`Surveys.vue`), Guardado de Inicio y Consulta de Reingreso
1. En `getReportsPendientesUsuario` (`reportDiarioController.js`), la consulta principal hacía `LEFT JOIN tequ_log_desplazamiento v ON p.id_proyecto = v.id_proyecto AND v.tipo_trayecto = 'IDA'` tomando `v.id_equipo` (`45`, camión tracto del flete) por encima de la grúa asignada a la OT en `tpry_rel_equipo` (`33`).
2. Al abrir la tarjeta desde `Surveys.vue`, la PWA navegaba a `/report-diario/16?id_equipo=45`.
3. Al montar `ReportDiarioIzaje.vue`, el frontend sobrescribía `form.value.id_equipo` con `equipos[0].id_equipo` (`33`, único equipo en `tpry_rel_equipo`), por lo que el `POST /operaciones/report/inicio-jornada` guardaba la jornada con **`id_equipo = 33`**.
4. Al reingresar en la tarde a `/report-diario/16?id_equipo=45`, `onMounted` enviaba `GET /operaciones/report/contexto/16?id_equipo=45`, y el backend ejecutaba:
   ```sql
   SELECT * FROM tedp_reporte_avance
   WHERE id_proyecto = 16 AND id_equipo = 45 AND estado_reporte = 'JORNADA_EN_CURSO'
   ```
   Como la jornada se había guardado bajo `id_equipo = 33`, la consulta con `id_equipo = 45` devolvía **0 filas** (`jornada_activa: null`), forzando a la PWA a mostrar el **Momento 1 en blanco** y con `dia_sugerido = 1` (pues el equipo `45` tenía `0` reportes previos).

### Causa Raíz #2: Reciclaje Infinito del Registro Huérfano `id_reporte_avance = 22`
1. En `guardarInicioJornada`, la búsqueda de jornada existente (`existSql`) filtraba por `WHERE id_proyecto = $1 AND id_equipo = $2 AND estado_reporte = 'JORNADA_EN_CURSO'` **sin filtrar por fecha ni descartar huérfanos de días ya cerrados**.
2. Como el registro `id_reporte_avance = 22` quedó en `JORNADA_EN_CURSO` el 15-oct (cuando la tarde del 15-oct se cerró creando un `INSERT` nuevo `id = 23` porque la PWA había reingresado en Momento 1 sin `id_reporte_avance`), cada mañana subsiguiente (`16-oct`, `19-oct`, `20-oct`) `guardarInicioJornada` hacía `UPDATE` sobre el mismo `id_reporte_avance = 22` cambiando su `fecha_reporte` al día actual.

---

## 5. Solución Estructural Definitiva (`REQ-1060` / `SPEC-088` / PWA `v1.0.53`)

1. **Función Canónica Única `resolverJornadaActiva` en Backend (`reportDiarioController.js`):**
   * Unifica la resolución de equipo y jornada en `getReportContexto`, `getReportsPendientesUsuario`, `guardarInicioJornada` y `guardarReportDiario`.
   * **Validación de Pertenencia (`INV-4`):** Si el `id_equipo` recibido en la URL no pertenece a las grúas de la OT (`tpry_rel_equipo` / `lineas_servicio` de tipo grúa) y existe una única grúa en la OT (`33`), el backend autocorrige `id_equipo_seleccionado = 33` (`equipo_corregido: true`) y busca la jornada activa sobre el equipo canónico.
   * **Ignorado Determinista de Huérfanos Confirmados (`INV-2`):** Todo registro `JORNADA_EN_CURSO` de una fecha anterior a hoy (zona horaria `America/Santiago`) para el cual **ya existe un reporte cerrado en la misma OT, equipo y fecha** es ignorado automáticamente por el motor de resolución.
   * **Adopción de Jornada Abierta en Cierre (`INV-7`):** Si `POST /operaciones/report/guardar` llega sin `id_reporte_avance`, busca y adopta mediante `UPDATE` la jornada abierta del mismo día, impidiendo la creación de duplicados y nuevos huérfanos.
   * **Cero Fallbacks Silenciosos (`INV-5`):** Eliminados `|| 1`, `|| 55`, `SELECT ... FROM tequ_equipo ORDER BY id_equipo ASC LIMIT 1` y patentes hardcodeadas.

2. **Sincronización Canónica y Respaldo Local en PWA (`ReportDiarioIzaje.vue` y `Surveys.vue`):**
   * `Surveys.vue` envía `id_reporte_avance` en la navegación (`abrirReportDiario(idProyecto, idEquipo, idReporteAvance)`).
   * `ReportDiarioIzaje.vue` adopta siempre `d.id_equipo_seleccionado`, corrige la URL con `router.replace`, persiste respaldo local `gsp_jornada_activa_<id_proyecto>` en `localStorage`, bloquea el paso a Momento 2 sin `id_reporte_avance` confirmado por servidor, y muestra tarjeta de reintento explícita ante fallos de red al cargar contexto.

3. **Suite Automatizada de Pruebas E2E (`scripts/qa_e2e_jornada_req1060.cjs`):**
   * 14 casos de prueba deterministas (`TC-01` a `TC-14`) ejecutados contra DEV con resultado **14/14 PASA (100%)** antes del despliegue a Producción.
