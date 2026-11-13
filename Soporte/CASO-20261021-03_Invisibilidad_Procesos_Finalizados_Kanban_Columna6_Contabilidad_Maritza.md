# CASO-20261021-03 — Invisibilidad de Procesos Finalizados en Columna 6 (Contabilidad / Finalización) del Kanban

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261021-03` |
| **Fecha / Hora** | `2026-10-21 19:15 CL` (Cierre: `2026-10-21 19:46 CL`) |
| **Usuarios Afectados** | **Maritza Seguel** (`mseguel@arriendosanpablo.cl`, `id_user = 61`, Rol `GSP_CONTA`) y **Sergio Gajardo** (`sgajardoc@gmail.com`, `id_user = 55`, Rol `Admin`) |
| **Negocios / OTs Involucradas** | **7 OTs finalizadas en Producción:** `GSP-2610-4851-001` (`#1`), `GSP-2610-4671-002` (`#2`), `GSP-2610-766-003` (`#3`), `GSP-2610-233-004` (`#4`), `GSP-2610-4853-007` (`#7`), `GSP-2610-4853-011` (`#11`) y `GSP-2610-193-012` (`#12`) |
| **Equipo Involucrado** | Múltiples equipos asignados a OTs finalizadas (Kanban de Operaciones y Liquidación Contable) |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`) |
| **Severidad** | **Alta** (Bloqueo de visibilidad en etapa de facturación y cierre contable en `Torre.vue`) |
| **Estado** | `RESUELTO Y DESPLEGADO EN PROD Y DEV` |

---

## 2. Síntoma Reportado por Terreno

1. **Maritza Seguel** (Contadora, rol `GSP_CONTA`) reporta que al ingresar al tablero Kanban (`Torre.vue`), en su etapa final (**Columna 6 — Finalizado / Contabilidad**) visualiza **únicamente 1 proceso** (`GSP-2610-233-004`, `planta ferrero`), a pesar de existir más órdenes de trabajo terminadas o con ITS emitido.
2. **Sergio Gajardo** (`sgajardoc@gmail.com`, `Admin`) reporta que desde su sesión visualiza **2 procesos** en la misma Columna 6 (`GSP-2610-233-004` y `GSP-2610-4671-002`), faltando aún el resto de las OTs con operación concluida (como `GSP-2610-766-003` — Finning Puerto Montt).

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### 3.1. Por qué Maritza veía 1 proceso mientras Sergio veía 2
Al auditar la base de datos de producción (`sch_leangsp_prod.tpry_proyecto`) y el directorio de activos compilados en `/var/www/html/lg-gsp-prod/assets/`:

- En `sch_leangsp_prod.tpry_proyecto`, solo 2 registros tenían `id_proyecto_estado >= 6`:
  - `id_proyecto = 4` (`GSP-2610-233-004` — `planta ferrero`): **`id_proyecto_estado = 6`**, `id_its = 3` (`ITS-GSP-2610-233-004-001`, `CONCLUIDO`).
  - `id_proyecto = 2` (`GSP-2610-4671-002` — `OF SAN PABLO ALTUMAQ`): **`id_proyecto_estado = 7`** (`Facturado / Cerrado`), `id_its = 1` (`ITS-GSP-2610-4671-002-001`, `CONCLUIDO`).
- En `/var/www/html/lg-gsp-prod/assets/` coexistían **16 bundles históricos huérfanos** junto al bundle vigente:
  - El bundle antiguo `index-91B0HBcN.js` (`2026-10-21 11:15 CL`), aún en caché en la sesión del navegador de Maritza, evaluaba la Columna 6 con `p.id_proyecto_estado === 6` (excluyendo `id_proyecto_estado === 7`), por lo que ocultaba la OT `#2` (`ALTUMAQ`) y mostraba **solo 1 tarjeta (`#4`)**.
  - El bundle activo `index-DHzSOkRr.js` (`2026-10-21 13:52 CL`), cargado en la sesión de Sergio, incluía `esFinalizadoOperacional(p)` (`st === 6 || st === 7 || st === 8`), mostrando **2 tarjetas (`#4` y `#2`)**.

### 3.2. Por qué las otras 5 OTs finalizadas seguían atrapadas en Columna 5 (`En Ejecución`)
La auditoría cruzada entre `tpry_proyecto`, `tedp_reporte_avance`, `tequ_log_desplazamiento` y `tits_informe_termino` en `sch_leangsp_prod` reveló que **5 órdenes de trabajo con operación 100% concluida** permanecían con `id_proyecto_estado = 5`:

| `id_proyecto` | Código Negocio | Proyecto / Faena | Cliente | `id_proyecto_estado` en BD | Días Plan | Reports Cerrados | Reports en Curso | Viajes (`tequ_log_desplazamiento`) | ITS (`tits_informe_termino`) |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **3** | `GSP-2610-766-003` | SUCURSAL FINNING PUERTO MONTT | FINNING CHILE S.A. | `5` | `1` | `1` (`VALIDADO_ANALISTA`) | `0` | `IDA: ARRIBADO`, `RETORNO: ARRIBADO` | `id_its = 2` (`ITS-GSP-2610-766-003-001`, `EN_REVISION_OPERACIONES`) |
| **1** | `GSP-2610-4851-001` | TEst prod | LeanGlobal Spa | `5` | `1` | `1` (`VALIDADO_ANALISTA`) | `0` | `IDA: ARRIBADO` | Sin ITS |
| **7** | `GSP-2610-4853-007` | FAENA DE PRUEBA | RAZON social prueba | `5` | `1` | `1` (`CERRADO_DIGITAL`) | `0` | `IDA: ARRIBADO`, `RETORNO: ASIGNADO` | Sin ITS |
| **11** | `GSP-2610-4853-011` | OBRA PRUEBA COTIZADOR EXPRESS | RAZON social prueba | `5` | `1` | `1` (`CERRADO_DIGITAL`) | `0` | `IDA: ARRIBADO`, `RETORNO: EN_RUTA` | Sin ITS |
| **12** | `GSP-2610-193-012` | OFICINA CENTRAL EVOLTS | EVOLTS LTDA | `5` | `1` | `1` (`CERRADO_DIGITAL`) | `0` | `IDA: ARRIBADO` | Sin ITS |

En contraste, las únicas 2 OTs con actividad de terreno realmente abierta o parcial en Columna 5 eran:
- **OT `#16` (`GSP-2610-233-016` — `PLANTA FERRERO `)**: `7` reports cerrados de `10` días contratados en `crm_v1.lineas_servicio` -> debe permanecer en Columna 5.
- **OT `#23` (`GSP-2610-4192-021` — `ZE413 BARRIO LOS CONQUISTADORES`)**: `1` report en estado `JORNADA_EN_CURSO` y `0` cerrados -> debe permanecer en Columna 5.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **`ProyectoModel.getProyectos` no enriquecía las OTs con datos de ITS ni evaluaba término operativo real:**
   - En [`ejecucion/backend_remoto/src/models/proyectoModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/models/proyectoModel.js#L15-L27), la consulta SQL de `GET /api/proyectos` seleccionaba únicamente `tpry_proyecto`, `tpar_empresas`, `tpry_estado` y `tpry_tipo`.
   - No realizaba `LEFT JOIN` hacia `tits_informe_termino` (`id_its`, `folio_its`, `estado_its`), por lo que el frontend (`Torre.vue`) recibía `p.id_its = undefined` y `p.estado_its = undefined` salvo cuando habían sido estampados manualmente dentro de `p.json_field`.
2. **Desacople de transición `5 -> 6` cuando el cierre ocurre fuera del flujo de arribo de retorno o antes del fix de generación de ITS:**
   - La OT `#3` (`Finning Puerto Montt`) había generado su ITS (`id_its = 2`) antes de que `itsController.generarITS` actualizara `id_proyecto_estado = 6`.
   - Las OTs `#1, #7, #11, #12` habían completado el 100% de sus reports diarios contratados (`1/1`) sin jornadas abiertas (`reports_abiertos = 0`), o ya contaban con despacho de viaje de `RETORNO`, pero su columna física `id_proyecto_estado` seguía en `5`.

---

## 5. Plan de Mitigación y Resolución

### 5.1. Modificación en Backend (`ejecucion/backend_remoto/src/models/proyectoModel.js`)
Se actualizó `ProyectoModel.getProyectos` para incorporar `LEFT JOIN LATERAL` hacia `tits_informe_termino`, `tedp_reporte_avance`, `tequ_log_desplazamiento` y las líneas/cupos contratados (`crm_v1.lineas_servicio` / `planificacion_operativa.cupos`), proyectando:
- `id_its`, `folio_its` y `COALESCE(its.estado_its, p.json_field->>'estado_its') AS estado_its`.
- Promoción determinista `id_proyecto_estado = 6` cuando `p.id_proyecto_estado = 5` y la OT ya tiene ITS emitido (`its.id_its IS NOT NULL`), viaje de `RETORNO` activo/arribado, o el 100% de sus reports diarios contratados cerrados sin jornadas en curso.

### 5.2. Regularización de Datos en `sch_leangsp_prod`
```sql
UPDATE sch_leangsp_prod.tpry_proyecto
SET id_proyecto_estado = 6
WHERE id_proyecto IN (1, 3, 7, 11, 12)
  AND id_proyecto_estado = 5;

UPDATE sch_leangsp_prod.tpry_proyecto p
SET json_field = jsonb_set(
  jsonb_set(COALESCE(p.json_field, '{}'::jsonb), '{id_its}', to_jsonb(i.id_its), true),
  '{estado_its}', to_jsonb(i.estado_its::text), true
)
FROM sch_leangsp_prod.tits_informe_termino i
WHERE p.id_proyecto = i.id_proyecto
  AND p.id_proyecto = 3;
```

### 5.3. Limpieza de Bundles Obsoletos en `/var/www/html/lg-gsp-prod/assets/`
Se eliminaron los 16 archivos `index-*.js` e `index-*.css` huérfanos en producción, conservando únicamente los referenciados en `/var/www/html/lg-gsp-prod/index.html` (`index-DHzSOkRr.js` e `index-RoC_iPVR.css`).

---

## 6. Protocolo de Respuesta y Guía al Usuario

> *"Maritza, se regularizó el estado de término operativo de las órdenes concluidas y se actualizaron los servicios de consulta del Kanban en Producción. Por favor recarga la página con `Ctrl + F5` (o cierra y vuelve a abrir la pestaña del sistema): ahora verás los 7 procesos finalizados en la columna final de Contabilidad, incluyendo sus folios y estados de ITS."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Enriquecimiento Canónico en `GET /api/proyectos`:** La vista Kanban (`Torre.vue`) no debe depender exclusivamente de banderas cacheadas dentro de `json_field` para conocer la existencia o estado del ITS; el backend ahora expone `id_its`, `folio_its` y `estado_its` directamente desde `tits_informe_termino`.
2. **Evaluación de Duración Contratada Real (`crm_v1.lineas_servicio`):** Al evaluar si una OT en ejecución completó sus jornadas, debe considerarse el máximo entre `tpry_proyecto.duracion_plan`, `crm_v1.lineas_servicio` (`cantidad_dias` / `cantidad`) y `planificacion_operativa.cupos` (`duracion_dias`), evitando promover prematuramente OTs multi-día en curso (como la OT `#16` con 7 de 10 jornadas).
3. **Higiene de Bundles en Despliegues Frontend:** Al publicar compilaciones Vite en `/var/www/html/lg-gsp-prod/assets/`, deben purgarse los `index-*.js` anteriores para evitar diagnósticos ambiguos o sesiones con código obsoleto.
