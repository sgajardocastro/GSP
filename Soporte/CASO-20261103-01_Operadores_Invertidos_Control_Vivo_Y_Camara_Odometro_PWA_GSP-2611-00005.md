# 🛠️ CASO-20261103-01: Operadores Invertidos en PWA, Equipo Sin Operador en Control en Vivo PMO y Reinicio de Pestaña Android al Capturar Foto de Odómetro en `GSP-2611-00005`

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261103-01` |
| **Fecha / Hora** | `2026-11-03 09:11 - 10:30 (-03:00)` |
| **Operador / Usuario Afectado** | **Claudio Gallardo** (`id_user = 62`, `claudiogallardo1984@gmail.com`, Chofer Cama Baja) e **Isis Osses** (`id_user = 93`, `rupayanbelen@gmail.com`, Operadora Grúa Horquilla) |
| **Negocio / OT** | `GSP-2611-00005` (`id_proyecto = 34`, Obra: **PARQUE COSTANERA**, Mandante: **MALL PARQUE COSTANERA**) |
| **Equipos Involucrados** | 1) **Grúa Horquilla 3 Ton** (`id_equipo = 58`, Patente `KKFG-50- 6`, Modelo `30 DT-7`, asignada a Isis Osses)<br>2) **Camión Plataforma / Cama Baja #1** (`id_equipo = 75`, Patente `DRCX. 62- 6`, Modelo `M2 106`, asignado a Claudio Gallardo) |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`) |
| **Severidad** | **Crítica** (Inversión de máquina asignada en la PWA, pérdida de visibilidad de operador en PMO Control en Vivo y pérdida de formulario por reinicio de pestaña Chrome Android al usar la cámara nativa) |
| **Estado** | `RESUELTO, NORMALIZADO EN BD Y DESPLEGADO EN PROD Y DEV (Web/Backend v1.0.185 / PWA v1.0.60 / REQ-1097)` |

---

## 2. Síntoma Reportado por Terreno

1. **Inversión de Operadores y Patentes en la APP PWA:**
   - En el negocio `GSP-2611-00005`, los dos equipos están correctamente asignados en el negocio (`Isis Osses` en Grúa Horquilla `KKFG-50- 6` y `Claudio Gallardo` en Camión Plataforma `DRCX. 62- 6`), pero en la APP móvil los operadores ven invertida la máquina o el operador.
2. **Equipo Sin Operador en PMO Control en Vivo:**
   - En la vista **Control en Vivo PMO**, uno de los dos equipos de la OT `GSP-2611-00005` (`KKFG-50- 6`) aparece como `SIN OPERADOR`.
3. **Reinicio en Blanco y Pérdida de Odómetro al Tomar Foto en Registro de Viaje (`ViajeConductor.vue`):**
   - Evidenciado en el video `Soporte/App no asigna Odometro - WhatsApp Video 2026-11-03 at 09.11.34.mp4`:
     - El chofer Claudio Gallardo ingresa a su viaje (`DRCX. 62- 6`), digita `Odómetro de Salida (km) = 423625` y pulsa `Tomar Foto Tablero (Obligatoria)`.
     - Al abrirse la actividad nativa de Cámara de Android (`<input type="file" capture="environment">`) y confirmar la foto (`✓`), el sistema operativo Android (Low Memory Killer / OOM) mata el proceso en segundo plano de la pestaña de Chrome.
     - Al regresar a Chrome, el navegador recarga la URL desde cero (pantalla blanca de carga durante ~5 segundos), perdiendo el valor `423625` digitado y la fotografía recién tomada.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### 3.1. Inspección de Base de Datos (`sch_leangsp_prod`, `id_proyecto = 34`)
- **`tpry_rel_equipo`:**
  - `id_equipo = 58` (`KKFG-50- 6`, `GRUA HORQUILLA`, `30 DT-7`)
  - `id_equipo = 75` (`DRCX. 62- 6`, `CAMIONES`, `M2 106`)
- **`tpry_rel_persona`:**
  - `id_rel_persona = 58`: `id_user = 93` (`ISIS OSSES`, `rol_asignado = 'OPERADOR'`)
  - `id_rel_persona = 59`: `id_user = 62` (`CLAUDIO GALLARDO`, `rol_asignado = 'OPERADOR'`)
- **`tpry_proyecto.json_field`:**
  - `ejecucion_v1.tripulacion_asignada`:
    - `{ id: 93, nombre: "ISIS OSSES", rol: "Operador", equipo_asignado_id: 58, equipo_patente: "KKFG-50- 6" }`
    - `{ id: 62, nombre: "CLAUDIO GALLARDO", rol: "Chofer Cama Baja #1", equipo_asignado_id: 75, equipo_patente: "DRCX. 62- 6" }`
  - `crm_v1.lineas_servicio`:
    - Línea 0 (`GRUA HORQUILLA`): tenía `equipo_asignado_id: null, operador_asignado_id: null` (solo estaba en `tripulacion_asignada` e `inspecciones_patio`).
    - Línea 1 (`CAMIONES`): tenía `equipo_asignado_id: 75, chofer_asignado_id: 62, operador_asignado_id: 62`.
- **`tequ_log_desplazamiento` (`id_proyecto = 34`):**
  - Filas `7, 8, 9, 10` tenían la columna `patente = NULL` en la tabla `tequ_log_desplazamiento`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Por qué se invertían las patentes y operadores en la PWA (`Surveys.vue` + `viajeModel.js` + `reportDiarioController.js`):**
   - En `viajeModel.getViajeActivoPorUsuario`, la consulta SQL seleccionaba `v.patente` directamente desde `tequ_log_desplazamiento` (donde era `NULL`) en vez de `COALESCE(v.patente, e.patente, 'S/P')`.
   - En `reportDiarioController.getReportsPendientesUsuario`, el equipo de la OT se resolvía con `SELECT re.id_equipo, e.patente FROM tpry_rel_equipo re WHERE re.id_proyecto = $1 ORDER BY re.id_equipo ASC LIMIT 1`, lo que devolvía **siempre** el equipo de menor ID (`58` — `KKFG-50- 6`, la grúa horquilla de Isis Osses) para todos los usuarios del proyecto, incluido Claudio Gallardo (`id_user = 62`).
   - En `Surveys.vue` (línea 1953), la tarjeta principal calculaba `patente: v?.patente || r?.patente || 'S/P'`. Como `v.patente` venía `null` y `r.patente` venía con `'KKFG-50- 6'`, a Claudio Gallardo le aparecía en pantalla la patente **`KKFG-50- 6`** (de Isis Osses) en su tarjeta de operación.
   - Adicionalmente, en `reportDiarioController.getReportContexto`, `equipos` se ordenaba por `id_equipo ASC` (`[58, 75]`) mientras `personas` se ordenaba por `id_rel_persona DESC` (`[62 (Claudio Gallardo), 93 (Isis Osses)]`), provocando que al abrir el equipo `58` (`KKFG-50- 6`), `personas.find(OPERADOR)` tomara al primer registro (`Claudio Gallardo`).
2. **Por qué `KKFG-50- 6` aparecía `SIN OPERADOR` en Control en Vivo (`controlVivoController.js`):**
   - `controlVivoController.js` resolvía el operador del equipo buscando únicamente en `crm.lineas_servicio` (`operador_asignado_id`) o en `ejec.equipo_id == idEqNum`. Como la Línea 0 de `crm.lineas_servicio` tenía `equipo_asignado_id: null` y la asignación de Isis Osses al equipo `58` estaba en `ejec.tripulacion_asignada` (`equipo_asignado_id: 58`) y en `ejec.preparacion_salida.inspecciones_patio`, el controlador no la encontraba y devolvía `SIN OPERADOR`.
3. **Por qué Android borraba el odómetro al tomar la foto (`ViajeConductor.vue`):**
   - El uso de `<input type="file" accept="image/*" capture="environment">` delega la captura a una Activity externa del sistema operativo Android. En dispositivos con gestión agresiva de RAM, Android suspende y recicla el proceso del renderer de Chrome mientras la cámara nativa está en primer plano; al volver, Chrome recarga la página desde cero y el estado reactivo en memoria (`formSalida.odometro_salida`) se pierde.

---

## 5. Plan de Mitigación y Resolución Aplicado

1. **Normalización de Datos en Producción (`sch_leangsp_prod`, `id_proyecto = 34`):**
   - Actualización de `tequ_log_desplazamiento` en `id_proyecto = 34`: asignación explícita de `patente = 'KKFG-50- 6', id_user_chofer = 93` para `id_equipo = 58` y `patente = 'DRCX. 62- 6', id_user_chofer = 62` para `id_equipo = 75`, eliminando los registros duplicados antiguos (`id_log_desplazamiento IN (7, 8)`).
   - Normalización de `json_field.crm_v1.lineas_servicio[0]` en `id_proyecto = 34` con `equipo_asignado_id = 58` y `operador_asignado_id = 93`.
2. **Resolución Determinista de Operador por Equipo en Backend (`controlVivoController.js`, `reportDiarioController.js`, `viajeModel.js`):**
   - **`controlVivoController.js`:** Implementada función `resolverOperadorDeEquipo(idEqNum)` que cruza en orden de especificidad: `crm.lineas_servicio`, `ejec.tripulacion_asignada` (`equipo_asignado_id`), `ejec.equipos_extra` (`chofer_id`), `ejec.preparacion_salida.inspecciones_patio`, `ejec.equipo_id -> operador_id`, `tpry_rel_persona` y `viajesEq` (`id_user_chofer`).
   - **`reportDiarioController.js`:** En `getReportContexto` y `getReportsPendientesUsuario`, construcción de mapa determinista `equipo <-> operador` (`eqToUserMap` / `userToEqMap`) para que cada usuario reciba y opere exclusivamente su máquina asignada, adjuntando `id_user_operador` y `operador_nombre` a cada equipo.
   - **`viajeModel.js`:** Uso de `COALESCE(v.patente, e.patente, 'S/P') AS patente` en `getViajeActivoPorUsuario` y `getViajesPorProyecto`, autocompletado de `patente` desde `tequ_equipo` en `crearOObtenerViaje` y deduplicación de viajes activos por `(id_proyecto, id_equipo, tipo_trayecto)`.
3. **Cámara WebRTC In-App y Persistencia Automática de Borrador en `ViajeConductor.vue` y `ReportDiarioIzaje.vue`:**
   - Implementado **Modal de Cámara WebRTC In-App** (`navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`) con captura directa a `<canvas>` JPEG comprimido (1280px, calidad 0.78), evitando que Android abandone el navegador Chrome al tomar fotografías de tablero o carga de combustible.
   - Implementada **persistencia instantánea en `localStorage`** (`gsp_borrador_viaje_${token}` y `gsp_borrador_viaje_pry_${id_proyecto}_eq_${id_equipo}`) mediante `watch(..., { deep: true })` sobre `formSalida`, `formLlegada` y `formCombustible`, restaurando automáticamente odómetro, horómetro y fotos ante cualquier recarga accidental.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador

> **Mensaje para Claudio Gallardo e Isis Osses (`GSP-2611-00005` — Parque Costanera):**
> 1. Cierren y vuelvan a abrir la aplicación móvil (o actualicen la pantalla principal deslizando hacia abajo).
> 2. **Claudio Gallardo** verá asignado exclusivamente su camión **`DRCX. 62- 6` (`M2 106`)** y al presionar **Tomar Foto Tablero** se abrirá la nueva cámara integrada dentro de la misma aplicación (sin salirse de la pantalla ni borrar el odómetro ingresado).
> 3. **Isis Osses** verá asignada exclusivamente su grúa horquilla **`KKFG-50- 6` (`30 DT-7`)**, y en **Control en Vivo PMO** ambos equipos figuran con su respectivo operador asignado.

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Prohibición de `ORDER BY id_equipo ASC LIMIT 1` en OTs Multi-Equipo:** Toda resolución de equipo para un operador autenticado debe cruzar primero el vínculo nominal `usuario <-> equipo` en `lineas_servicio`, `tripulacion_asignada`, `equipos_extra`, `inspecciones_patio` y `tequ_log_desplazamiento`.
2. **Captura Fotográfica In-App WebRTC + Persistencia Local Reactiva:** En formularios críticos de terreno en Android, la captura fotográfica debe ejecutarse dentro del DOM mediante WebRTC (`getUserMedia`) respaldada por persistencia reactiva del formulario en `localStorage` antes de abrir cualquier selector de archivos.
