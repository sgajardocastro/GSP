# SPEC-128: Líneas de Cobro Único (`Valor Fijo` y `TRASLADOS`) — Invariante `cantidad = 1`, Cálculo Único y Saneamiento

- **Estado:** BORRADOR PARA APROBACIÓN DEL USUARIO (no se escribe código ni se toca BD hasta aprobación explícita).
- **Fecha:** 2026-11-12
- **Casos origen:** Negocio `GSP-2611-00002` (id 31, Inversiones Plaenge, rigger a Valor Fijo 300.000) y Negocio `GSP-2611-00005` (id 34, Besalco, `TRASLADOS` con cantidad 6).
- **Regla constitucional aplicable:** Rule 15 (Cero Parches: 4 niveles + barrido SQL histórico).

---

## 1. Problema

Una línea comercial de cobro único se multiplica por `cantidad` en algunas pantallas y en otras no, y además el ITS desaparece cuando los reports no tienen horas. Cada módulo calcula el subtotal con su propia fórmula.

### 1.1 Evidencia empírica (solo lectura sobre `sch_leangsp_prod`, 2026-11-12)

**Negocio 002 (id 31):**
- Línea en `lineas_servicio` y `lineas_operativas_vigentes`: `tipo OTROS`, `subcategoria OTROS`, `unidad "Valor Fijo"`, `valorUnitario 300000`, **`cantidad 2`**, sin `subtotal` ni `subtotal_calculado`.
- Cotizaciones: V3 (valor 300000, cantidad 1, fechas 03-nov a 03-nov), V4 (valor 150000, cantidad 2, fechas 02-nov a 03-nov, rigger asignado), V5 vigente (valor 300000, cantidad 2). El motor de cotización ignora `cantidad` en Valor Fijo (V4 = 150.000, V5 = 300.000).
- 2 reports (02 y 03 nov) en `JORNADA_EN_CURSO`, 0 horas, sin equipo, sin EDP.
- `tits_informe_termino`, `tedp_estado_pago`, `tedp_estado_pago_detalle`: 0 filas. Todo se calcula al vuelo desde el JSON.
- No existe tabla de auditoría del JSON del proyecto: no se puede probar qué acción dejó `cantidad = 2`.

**Negocio 005 (id 34):** `TRASLADOS` a 160.000 con `cantidad 6` (ver diagnóstico del caso 005: ITS parte `valorFletePactado / 2` en `FLE-IDA` y `FLE-RET`; EDP muestra 6 × 160.000).

### 1.2 Cálculos independientes de la misma línea (hallazgo de fondo)

| Módulo | Archivo | Comportamiento con Valor Fijo y `cantidad = 2` |
|---|---|---|
| Modal EDP mandante (datos) | `backend_remoto/src/controllers/reportDiarioController.js` L2998-3001, L3136-3137 | `valorFijoPactado += precio` (ignora cantidad): 300.000 |
| PDF oficial EDP | `backend_remoto/src/controllers/estadoPagoController.js` L273-275 | `subtotal_calculado \|\| subtotal \|\| valUnit*cant`: **600.000** |
| Perspectiva Contabilidad | `estadoPagoController.js` L2122-2130, L2196-2204 | misma cadena con `valUnit*cant`: 600.000 |
| ITS (borrador) | `backend_remoto/src/controllers/itsController.js` L394-397, L1502-1505 | `valorFijoPactado += precio` asignado a jornada 0 |
| ITS (pantalla) | `frontend/src/components/Operaciones/ModalITS.vue` L2865-2919 | suma `j.subtotal` de las jornadas |
| ITS filtro de reports | `itsController.js` L648-657 | descarta reports con 0 horas y sin `hora_termino`: sin jornadas, el total sale 0 |
| EDP modal front | `frontend/src/components/Operaciones/ModalCaratulaEDP.vue` L1404-1427 | `valUnit * cant` si no viene `subtotal_calculado` |
| Estructurador | `frontend/src/components/CRM/EstructuradorArbolServicios.vue` L847-865 | Valor Fijo = valor; TRASLADOS = `cant * valor` |

### 1.3 Por qué `cantidad` queda en 2

El invariante `Valor Fijo => cantidad = 1` se aplica en un solo punto: el evento de cambio de unidad (`GestorOportunidades.vue` L12616-12623 y `EstructuradorArbolServicios.vue` L982-989). Al hidratar una OT, `GestorOportunidades.vue` L13361-13368 trata toda unidad no reconocida como `'Valor Fijo'` y conserva `Number(l.cantidad) || 1`. Las líneas de Operaciones nacen como `unidad 'Diario'` (L10104) y copian días a `cantidad` (L700, L7545). El backend nunca normaliza. Hipótesis más probable (no probada): línea armada como Diario por 2 días a 150.000 y luego pasada a Valor Fijo sin pasar por el evento de cambio.

---

## 2. Regla canónica

1. **Línea de cobro único** = (a) `unidad` contiene `FIJO` o `ALZADA`, o (b) `tipo = TRASLADOS` o `unidad` empieza con `TRASLADO`.
2. Una línea de cobro único **siempre** tiene `cantidad = 1` y `subtotal = valorUnitario`. La cantidad no existe para ella: no se muestra, no se edita, no multiplica.
3. Los reports de una línea de cobro único son **respaldo y control** (viáticos, trazabilidad). No determinan monto.
4. `TRASLADOS` solo ofrece `Unidad de Cobro` entre: `TRASLADO IDA`, `TRASLADO RETORNO` (etiqueta "Traslado Vuelta"), `TRASLADO IDA/VUELTA`. No se parte en mitades `FLE-IDA` y `FLE-RET`.
5. El subtotal de toda línea se calcula en **una sola función de backend**; el frontend solo muestra lo que entrega.

---

## 3. Diseño por nivel

### Nivel 1 — Origen (frontend CRM)

| Archivo | Cambio |
|---|---|
| `EstructuradorArbolServicios.vue` L368, L573 | Ocultar input `Cant:` también para `TRASLADOS`; mostrar badge fijo "Cobro Único". |
| `EstructuradorArbolServicios.vue` L1287-1294 (`case 'TRASLADO_GRUA'`) | `nuevaRama.cantidad = 1` (hoy 2). |
| `EstructuradorArbolServicios.vue` L847-865 (`calcularSubtotalLinea`) | `TRASLADOS` y Valor Fijo devuelven `val`. |
| `EstructuradorArbolServicios.vue` L1011 y L1029 (`onTipoPrimarioChange`, `onTipoRamaChange`) | Si `tipo = TRASLADOS`: `unidad` a la lista de 3 opciones, `cantidad = 1`. |
| `GestorOportunidades.vue` L673-773 y L4864-4960 | Quitar `<input v-model.number="line.cantidad">` para `TRASLADOS`; retirar opción `Traslado` genérica en categorías no traslado. |
| `GestorOportunidades.vue` L13338-13376 (hidratación) | Rama traslado y rama catch-all `Valor Fijo`: `cantidad = 1` forzado. |
| `GestorOportunidades.vue` L12600-12613 (cálculo) | `TRASLADOS` suma `val`. |

### Nivel 2 — Servicios intermedios (backend)

1. **Nuevo módulo** `backend_remoto/src/utils/lineaCobroUnico.js` con:
   - `esLineaCobroUnico(linea)`: clasificador único (reemplaza las condiciones duplicadas por tipo, unidad, descripción y subcategoría).
   - `normalizarLineaCobroUnico(linea)`: devuelve la línea con `cantidad = 1` y `subtotal_calculado = valorUnitario`.
   - `calcularSubtotalLinea(linea, ctx)`: única fórmula; las líneas de cobro único nunca multiplican.
2. **Guardado:** `proyectoModel.js` (guardado de `lineas_servicio` y `lineas_operativas_vigentes`, y `generarCotizacionVersion`) normaliza las líneas de cobro único antes de persistir y antes de snapshotear.
3. **ITS** (`itsController.js`): 
   - L390-397: `valorFletePactado` suma `valorUnitario` (sin `* cantidad`); `valorFijoPactado` suma `valorUnitario`.
   - L1333-1392 y L1653-1718: eliminar el reparto `valorFletePactado / 2` en `FLE-IDA` y `FLE-RET`; una fila por línea de traslado, según su modalidad.
   - L648-657: los montos de líneas de cobro único se arman desde la línea comercial; el filtro de reports incompletos solo afecta horas, no el monto.
4. **ITS pantalla** (`ModalITS.vue`, `recalcularTotales` L2865-2919): para servicio de cobro único, `total_ingresos_horas` toma `valor_fijo_pactado` y los traslados toman `valor_flete_pactado`, aunque no haya jornadas visibles.

### Nivel 3 — Integridad de datos (BD)

1. **Auditoría de solo lectura** en `sch_leangsp_prod` y luego `sch_leangsp`: todo `tpry_proyecto` con alguna línea de cobro único cuya `cantidad` sea distinta de 1 o sin `subtotal_calculado`, en `lineas_servicio`, `lineas_operativas_vigentes` y `cotizaciones_historicas[].lineas_snapshot`; además ITS y EDP persistidos con montos distintos al valor de la línea.
2. **Datafix** (con autorización escrita posterior, tras ver el resultado de la auditoría): `cantidad = 1` en las líneas afectadas (casos 002 y 005 incluidos); recalcular ITS y EDP no firmados; EDP firmados o enviados se listan y se decide caso a caso.
3. Respaldo previo de los `json_field` afectados antes de cualquier `UPDATE`.

### Nivel 4 — Consolidación y salida

| Archivo | Cambio |
|---|---|
| `reportDiarioController.js` L2985-3010 y L3125-3148 | Usa `utils/lineaCobroUnico.js`; `subtotal_calculado` coherente por línea. |
| `estadoPagoController.js` L246-286 (`generarPdfEdp`) y L2110-2230 (perspectiva Contabilidad) | Usa `utils/lineaCobroUnico.js`; sin `valUnit * cant` en cobro único. |
| `ModalCaratulaEDP.vue` L492-517 y L1404-1427 | Cobro único: muestra modalidad en `Unidad` (`TRASLADO IDA`, `TRASLADO RETORNO`, `TRASLADO IDA/VUELTA`, `Valor Fijo`) y `Cant. = 1`; subtotal = valor. |
| `itsPdfService.js` | Líneas de cobro único con `Cant. = 1` y valor; sin partición. |

---

## 4. Criterios de aceptación

| # | Caso | Resultado esperado |
|---|---|---|
| CA-1 | 002: ITS, modal EDP, PDF EDP y perspectiva Contabilidad | Todos muestran 300.000 neto para la línea del rigger |
| CA-2 | 002: 2 reports sin horas | El ITS sigue mostrando 300.000; los reports quedan como respaldo |
| CA-3 | 005: ITS | Una fila de traslado de 160.000, sin `FLE-IDA` ni `FLE-RET` |
| CA-4 | 005: EDP y PDF | Traslado 160.000, `Cant. = 1`, modalidad visible; total = arriendo + 160.000 |
| CA-5 | Estructurador, TRASLADOS | No hay input de cantidad; 3 unidades de cobro disponibles |
| CA-6 | Hidratar OT con línea cobro único y `cantidad = 6` | Se carga con `cantidad = 1` |
| CA-7 | Guardar línea cobro único con `cantidad = 6` vía API | El backend persiste `cantidad = 1` |
| CA-8 | Barrido de BD | 0 líneas de cobro único con `cantidad <> 1` en `PROD` y `DEV` |
| CA-9 | Líneas por hora y diario (no cobro único) | Sin cambios de comportamiento (prueba de regresión) |

Verificación empírica obligatoria (Rule 7): build Vite 0 errores, HTTP 200 en endpoints de EDP/ITS, capturas de UI y consulta SQL antes y después.

---

## 5. Plan de ejecución (cada paso requiere autorización explícita)

1. Aprobación de esta spec.
2. Código, un archivo por turno (Rule 12), con diff presentado y aprobado antes de cada edición (Rule 11) y `git diff` crudo después (Rule 13).
3. Auditoría SQL de solo lectura (PROD y DEV) con tabla de afectados.
4. Datafix en PROD con respaldo previo; luego DEV.
5. Release (versión, `RELEASE_LOG.md`, `Gestión/tareas.md`, sincronización `tcfg_backlog` y `tcfg_releases`), despliegue en PROD y DEV con `git pull` y `pm2 restart` autorizados.
6. Fichas en `Soporte/` para los casos 002 y 005 y fila en `Soporte/README.md`.

---

## 6. Riesgos y decisiones abiertas

1. **EDP ya firmados o enviados** con montos inflados: se listan tras la auditoría; corregir o emitir nota de ajuste lo decide el usuario caso a caso.
2. **Etiqueta de `TRASLADO RETORNO`:** se propone conservar el valor interno `TRASLADO RETORNO` y mostrar "Traslado Vuelta". Pendiente de confirmar.
3. **Valor Diario Fijo** (por día, p. ej. 150.000 x días): fuera de alcance; solo si el usuario lo pide.
4. **Datos comerciales en JSON:** esta spec no migra las líneas a tablas relacionales; eso pertenece al frente de remediación relacional ya abierto y se coordina con esa spec para no duplicar trabajo.
5. **Cantidad de archivos afectados** (frontend, backend, nuevo util): el despliegue se hace en un solo release tras pasar todos los criterios.
