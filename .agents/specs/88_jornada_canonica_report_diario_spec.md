# SPEC-088: Identidad canónica de la jornada del Report Diario (cierre garantizado)

- **Requerimiento:** `REQ-1060`
- **Caso origen:** `CASO-20261020-01` (Robert Rodríguez, OT `GSP-2610-233-016`, grúa `DZXL.21-0` id 33). Antecedentes: `CASO-20261007-01`, `CASO-20261008-01`, `CASO-20261014-01`.
- **Versiones objetivo:** PWA `v1.0.53` + Backend API (controller `reportDiarioController.js`).
- **Estado:** Aprobado por el usuario ("aplica el plan que propones", 2026-10-20 22:08).
- **Checkpoint previo:** commit `261e436`, tag `checkpoint-pre-req1060-jornada-canonica`.

---

## 1. Problema (evidencia empírica)

### 1.1 Logs nginx PROD del 20-10-2026 (operador id 49)
| Hora | Llamada | Observación |
|---|---|---|
| 16:02:09 | `GET /reports/usuario/pendientes?id_user=49` | La consola resuelve la OT 16 con `id_equipo=45` (viaje `vj-16-45-nr3c3`, IDA/ASIGNADO) |
| 16:02:23 | `GET /operaciones/report/contexto/16?id_equipo=45` | La vista busca la jornada por equipo 45 |
| 16:02:59 | `POST /operaciones/report/inicio-jornada` | Se guarda con equipo **33** (`equipoSeleccionado` cae a `equipos[0]` porque 45 no está en `tpry_rel_equipo`) |
| 19:18:49 | `GET /operaciones/report/contexto/16?id_equipo=45` | `WHERE id_equipo = 45 AND JORNADA_EN_CURSO` = 0 filas, así que muestra **Momento 1 en blanco** |
| 19:24:44 | `POST /operaciones/report/inicio-jornada` | El operador reingresa el inicio y se sobrescribe el registro 22 |
| 19:29:54 | `POST /operaciones/report/guardar` | Cierra el registro 22 |

### 1.2 Estado de la OT 16 en PROD
| id | Fecha | Día | Observación |
|---|---|---|---|
| 16 | 13-10 | 1 | OK |
| 17 | 14-10 | 2 | Regularizado a mano el 14-10 |
| 23 | 15-10 | **1** | Creado por INSERT al cerrar; dejó huérfano al registro 22 |
| 26 | 16-10 | **1** | INSERT al cerrar (mismo patrón) |
| 27 | 19-10 | **1** | INSERT al cerrar (mismo patrón) |
| 22 | 20-10 | **1** | Creado el **15-10 10:23** como huérfano y reciclado cada mañana por `inicio-jornada` (UPDATE sin filtro de fecha) |

**Conclusión:** el problema ocurrió **todos los días** desde el 15-10. Además, `dia_correlativo` quedó en 1 porque se calcula con los reportes del equipo 45, que no tiene ninguno.

### 1.3 Causa raíz
1. Hay tres definiciones distintas de "jornada activa": la consola filtra solo por OT, la vista por OT + equipo de la URL, y el guardado de inicio por OT + equipo del selector.
2. Hay tres fuentes distintas de `id_equipo`: el viaje del chofer, `lineas_servicio` del CRM y `tpry_rel_equipo`.
3. Hay valores por defecto silenciosos: `equipos[0]`, el equipo inventado `BGDF.90-4`, "el primer equipo de la flota", `id_user_operador || 1` y `|| 55`.
4. `/report/guardar` sin `id_reporte_avance` siempre hace INSERT, aunque exista una jornada abierta. Eso genera duplicados y huérfanos.
5. Ninguna búsqueda filtra por fecha, así que una jornada huérfana se recicla otro día.

---

## 2. Definiciones canónicas (invariantes)

- **INV-1 (estado canónico):** una jornada está abierta si y solo si `estado_reporte = 'JORNADA_EN_CURSO'`. `estado_jornada` es informativo. Ejemplo: el registro 5 de la OT 2 está `VALIDADO_ANALISTA` y por lo tanto NO está abierto.
- **INV-2 (huérfano confirmado):** es una jornada abierta cuya `fecha_reporte` es anterior a hoy (America/Santiago) y para la que ya existe, en la misma OT y equipo, un reporte cerrado (`estado_reporte <> 'JORNADA_EN_CURSO'`) con la misma `fecha_reporte`. El resolvedor la ignora y la registra en log (`[REQ-1060][HUERFANO]`). No se borra ni se modifica (cero SQL manual).
- **INV-3 (identidad):** la identidad de la jornada es `id_reporte_avance`. El `id_equipo` canónico de una jornada es el de su propio registro.
- **INV-4 (equipo canónico de la OT):** el orden de prioridad es:
  1. el equipo de la jornada abierta resuelta;
  2. el `id_equipo` solicitado, si pertenece a la lista de equipos de la OT;
  3. el primer equipo de la lista de la OT, que se arma con `tpry_rel_equipo`, luego `ejecucion_v1.equipos_asignados` y luego `crm_v1.lineas_servicio[tipo GRUA].equipo_asignado_id`.
  
  Si no hay equipos, la lista queda vacía y la UI bloquea con un mensaje explícito. Se **elimina** el fallback "primer equipo de toda la flota".
- **INV-5 (no duplicados):** `/report/guardar` sin `id_reporte_avance` adopta la jornada abierta de la misma OT y equipo canónico (UPDATE) en vez de insertar otra.
- **INV-6 (no reciclar días):** `/report/inicio-jornada` solo actualiza una jornada abierta si es del **mismo `fecha_reporte`**. Si la jornada abierta es de un día anterior y no es un huérfano confirmado, responde `409 JORNADA_ANTERIOR_ABIERTA` con su fecha y su id para que se cierre primero.
- **INV-7 (fecha local):** toda fecha por defecto se calcula en `America/Santiago`; no se usa `toISOString().split('T')[0]` en este flujo.
- **INV-8 (usuario real):** `id_user_operador` sale de la persona con rol OPERADOR de la OT; si no hay, se usa el usuario autenticado de la PWA (`localStorage.perfil.id_user`). Nunca `1` ni `55`. Si el backend no puede resolverlo, responde 400.

---

## 3. Diseño

### 3.1 Backend: función única `resolverJornadaActiva(id_proyecto, { id_reporte_avance, id_equipo, id_user })`
1. Si viene `id_reporte_avance` y la fila es de la OT y está abierta, la retorna.
2. Obtiene todas las jornadas abiertas de la OT (INV-1), con `fecha_reporte_str` (`YYYY-MM-DD`) y `hora_inicio_str` (`HH24:MI` en America/Santiago). Descarta los huérfanos confirmados (INV-2).
3. Elige en este orden:
   - la que coincide con `id_equipo`;
   - si queda una sola, esa (corrige el equipo);
   - si hay varias, la del operador `id_user`;
   - si sigue siendo ambiguo, retorna `null` y la lista `abiertas`.
4. Retorna `{ jornada, abiertas, huerfanos }`, con la marca `es_dia_anterior` según la fecha local.

La usan `getReportContexto`, `getReportsPendientesUsuario`, `guardarInicioJornada` y `guardarReportDiario`.

### 3.2 Backend: endpoints
- **`GET /operaciones/report/contexto/:id_proyecto?id_equipo&id_reporte_avance&id_user`**
  - Equipo canónico según INV-4; `dia_sugerido` se calcula con el equipo canónico.
  - Nuevos campos de respuesta: `id_equipo_solicitado`, `equipo_corregido` (boolean), `jornadas_abiertas` (array) y `fecha_hoy` (America/Santiago).
- **`GET /reports/usuario/pendientes`**
  - Una fila por OT (se deduplica por `id_proyecto`).
  - El `id_equipo` del ítem se toma, en orden, de: jornada abierta, `tpry_rel_equipo`, viaje y CRM.
  - Nuevo campo `id_reporte_avance_activo`; `jornada_datos` incluye `id_equipo`.
- **`POST /operaciones/report/inicio-jornada`**
  - Valida `id_equipo` (400 si falta).
  - Usa el resolvedor por OT + equipo. Si hay una jornada abierta del mismo día, hace UPDATE (idempotente). Si es de un día anterior, responde 409 `JORNADA_ANTERIOR_ABIERTA` (INV-6). Si no hay, hace INSERT.
- **`POST /operaciones/report/guardar`**
  - Sin `id_reporte_avance`, adopta la jornada abierta (INV-5) y lo registra en log `[REQ-1060][ADOPCION]`.
  - Se reemplaza `|| 55` por un 400.
  - La fecha por defecto pasa a ser local.

### 3.3 PWA: consola `Surveys.vue`
- `abrirReportDiario(idProyecto, idEquipo, idReporteAvance)` agrega `&id_reporte_avance=` cuando existe. Todos los botones de Report pasan `r.id_reporte_avance_activo`.

### 3.4 PWA: `ReportDiarioIzaje.vue`
1. Lee `route.query.id_reporte_avance`. Si no viene, usa el respaldo local `gsp_jornada_activa_<id_proyecto>`.
2. `cargarContexto` envía `id_equipo`, `id_reporte_avance` e `id_user`. **Siempre** adopta `d.id_equipo_seleccionado` como equipo canónico y hace `router.replace` del query.
3. Hidrata `form.fecha_reporte` y `form.hora_inicio` desde `fecha_reporte_str` y `hora_inicio_str` de la jornada. Si `es_dia_anterior`, muestra un aviso con la fecha.
4. Si falla el contexto, muestra un estado de error con el botón **Reintentar**, y Momento 1 y Momento 2 quedan deshabilitados (`errorContexto`). No se muestran valores por defecto que puedan confundir al operador.
5. `equipoSeleccionado` ya no inventa equipos: retorna el canónico o `null`. La UI muestra "OT sin equipo asignado" y bloquea el guardado.
6. Al guardar el inicio, persiste el respaldo local `{ id_reporte_avance, id_equipo, fecha_reporte }`. Al sellar el report, lo elimina.
7. Ir a Momento 2 sin `idReporteAvanceActivo` queda bloqueado con el mensaje "Primero guarda el Inicio de Jornada". Es un bloqueo de identidad, no de datos: el horómetro y la foto siguen siendo opcionales según SPEC-084.
8. `id_user_operador` según INV-8. La fecha por defecto es local (INV-7).
9. Si hay varias `jornadas_abiertas` y ninguna resuelta, muestra un aviso para elegir el equipo con los chips.

---

## 4. Fuera de alcance (requieren decisión del usuario)
- Índice único parcial en BD (opción B, no autorizada).
- Corrección de `dia_correlativo` histórico de la OT 16 (registros 22, 23, 26 y 27).
- Cierre administrativo del registro 21 (OT 23, operador 62, abierto desde el 15-10, sin reporte cerrado ese día): con esta versión se le presentará al operador para cerrarlo.
- Cambios en la consola web (`ViajeConductor.vue`, que aún envía `|| 55` desde el cliente).

---

## 5. Criterios de aceptación / prueba E2E (`scripts/qa_e2e_jornada_req1060.cjs`, contra DEV)
Fixture aislado en `sch_leangsp`: OT de prueba `QA-REQ1060-E2E`, equipo A en `tpry_rel_equipo` y viaje del operador con equipo B distinto (reproduce el CASO-14 y el CASO-20). Al terminar se limpia.

| TC | Escenario | Esperado |
|---|---|---|
| TC-01 | Consola: pendientes del operador | 1 fila por OT; `id_equipo` = A (no B) |
| TC-02 | Contexto con `id_equipo=B` (equipo del viaje) | `id_equipo_seleccionado`=A, `equipo_corregido`=true, sin jornada |
| TC-03 | Inicio de jornada con A | 200, `JORNADA_EN_CURSO` |
| TC-04 | **Reingreso** con contexto `?id_equipo=B` (sin id) | `jornada_activa.id_reporte_avance` = el del TC-03 |
| TC-05 | Reingreso con `?id_reporte_avance` | Misma jornada |
| TC-06 | Consola tras el inicio | `id_reporte_avance_activo` = el del TC-03 |
| TC-07 | Doble inicio el mismo día | Mismo id (UPDATE), 1 sola abierta |
| TC-08 | Guardar sin `id_reporte_avance` | Adopta (mismo id), 0 abiertas, 0 duplicados |
| TC-09 | Huérfano confirmado de un día anterior | Ignorado por el resolvedor |
| TC-10 | Abierta de un día anterior no huérfana + inicio de hoy | 409 `JORNADA_ANTERIOR_ABIERTA` |
| TC-11 | Inicio sin `id_equipo` | 400 |
| TC-12 | Guardar sin `id_user_operador` resoluble | 400 (no 55) |
| TC-13 | Día siguiente | `dia_sugerido` = día anterior + 1 |

Gate: **100% PASA** en DEV antes de desplegar a PROD. Además: build de la PWA con 0 errores y HTTP 200 en DEV y PROD.
