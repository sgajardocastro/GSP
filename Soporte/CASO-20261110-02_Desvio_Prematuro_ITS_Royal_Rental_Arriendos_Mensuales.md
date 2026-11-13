# Ficha de Caso de Soporte: CASO-20261110-02

## 1. Identificación del Incidente
- **Código:** CASO-20261110-02
- **Fecha:** 2026-11-10
- **Proyecto Involucrado:** `RYL-2611-00001` (`id_proyecto = 48`, Cliente: *Montajes Claudia Fernanda Gutierrez*, Obra: *Salfa Recabarren*, Emisora: *Arriendo Royal Rental Limitada*)
- **Usuario Afectado / Reportante:** Gerencia y Analista de Operaciones / Control de Gestión
- **Equipo Involucrado:** Equipo ID 75 (Plataforma Articulada Diesel 4x4)
- **Ambiente:** Producción (`sch_leangsp_prod` / PM2 ID 13 `lean-services-gsp-prod`)
- **Severidad:** Media-Alta (Desvío operacional y administrativo de arriendo mensual activo hacia bandeja de liquidación prematura de ITS)
- **Estado:** RESUELTO Y CERTIFICADO EN PRODUCCIÓN (Resolución de Fondo — Cero Parches)

---

## 2. Síntoma Reportado
En la sesión operativa del 10 de noviembre de 2026, el usuario reportó:
> *"Tenemos el caso de la empresa Royal Rental que se dedica al arriendo de maquinaria. El caso del negocio 0001 de Royal Rental está programado desde el 5 de noviembre al 3 de diciembre, pero resulta que el negocio se pasó a ITS y no tiene por qué. ¿Qué es lo que está pasando con ese negocio?"*

---

## 3. Metodología de Auditoría Forense y Extracción de Datos
Se ejecutó una inspección exhaustiva de datos de solo lectura sobre las tablas relacionales y registros operativos de producción:
1. `sch_leangsp_prod.tpry_proyecto` (`id_proyecto = 48`): análisis del contrato, `lineas_servicio`, `plan_diario`, y campos de control de vistas en `json_field`.
2. `sch_leangsp_prod.tedp_reporte_avance`: revisión de los reportes emitidos en faena.
3. `sch_leangsp_prod.tequ_log_desplazamiento`: verificación de los registros de viaje de ida y retorno del equipo.
4. `sch_leangsp_prod.tits_informe_termino`: comprobación de la existencia o ausencia de folios ITS.
5. Código fuente de `reportDiarioController.js` (endpoint `/operaciones/report/pendientes-analista`) y `GestorOportunidades.vue`.

---

## 4. Hallazgos y Cronología Forense Irrefutable
1. **Naturaleza del Contrato:**
   - Negocio de arriendo mensual de plataforma elevadora por \$1.600.000 (Valor Fijo).
   - Vigencia contractual formal: **05 de noviembre de 2026 al 04 de diciembre de 2026** (22 días hábiles en `plan_diario`).
2. **Estado Operativo Real:**
   - La máquina se trasladó el 05 de noviembre (viaje de ida log #35) y se generó el Reporte #35 del Día 1 (`dia_correlativo = 1`, `estado_jornada = "FINALIZADA"`).
   - No hay viaje de retorno (la máquina sigue en obra del cliente durante todo el mes).
   - En la base de datos, el proyecto permanecía en `id_proyecto_estado = 5` (*En Ejecución / Terreno*).
3. **El Triple Gatillador del Desvío Prematuro hacia ITS y Finalizado / Contabilidad:**
   - **En Modelo Backend (`proyectoModel.js`):** La consulta `getProyectos` que alimenta a Torre de Control y Kanban aplicaba una mutación virtual en tiempo de ejecución: `WHEN p.id_proyecto_estado = 5 AND (...) THEN 6`. En la condición que comparaba `reports_cerrados >= duracion_plan`, no se validaba si la fecha fin planificada era futura (`fecha_plan_fin > CURRENT_TIMESTAMP`). Además, en la subquery `cupo.duracion_plan`, la expresión regular `^\d{4}` en el template string JS se desescapaba a `^d{4}` en PostgreSQL, arrojando una duración de 1 día. Al registrarse el Reporte #35 del Día 1, el backend forzaba `id_proyecto_estado = 6`, enviando la tarjeta en el frontend a la Columna 6 *"FINALIZADO / CONTABILIDAD"*.
   - **En Controlador Backend (`reportDiarioController.js`):** La consulta SQL de `ots_liquidacion` para la bandeja PMO utilizaba una condición ciega `WHERE p.id_proyecto_estado >= 4`. Al estar en estado 5 (o mutado a 6), el backend clasificaba automáticamente la OT en la lista de liquidación y, al no tener folio ITS, la contabilizaba en el KPI de *"OTs Sin ITS (Pendiente emisión)"*, forzándola a aparecer en la pestaña de ITS de Torre de Control.
   - **En Base de Datos y Frontend (`GestorOportunidades.vue`):** En `tpry_proyecto` ID 48, el campo `json_field.ejecucion_v1.subtab_actual_view` se guardó con el valor `"liquidacion"`. Al ingresar al proyecto, el frontend leía este atributo y abría forzosamente la pestaña 6 (*Liquidación / ITS*) en lugar de la pestaña 5 (*Reports / Faena*), induciendo al usuario al error de que el negocio había culminado.

---

## 5. Causa Raíz
1. **Mutación Virtual Prematura en `proyectoModel.js`:** La regla de inferencia automática de finalización operacional promovía indebidamente el estado a 6 al existir 1 reporte cerrado sin verificar si la fecha fin contractual era futura.
2. **Defecto de Doble Escape en Regex SQL de `proyectoModel.js`:** La expresión regular `'\\d{4}'` en template strings de Node.js perdía la barra invertida (`'^\d{4}'`), impidiendo el cálculo de duración de arriendos basados en fechas.
3. **Falta de Discriminación Temporal en `reportDiarioController.js`:** La bandeja de Informes de Término no evaluaba si la fecha de término planificada (`fecha_plan_fin`) era estrictamente futura respecto a la fecha actual, tratando los servicios de arriendo continuo de 30 días con el mismo criterio que un servicio spot de grúa móvil de 1 solo día.
4. **Falta de Sincronización Relacional en `tpry_proyecto`:** La columna `fecha_plan_fin` de la tabla relacional estaba nula para el ID 48, a pesar de que el plan diario y el contrato especificaban término el 04 de diciembre de 2026.
5. **Persistencia Inadvertida de Subtab:** La interacción del analista con la pestaña de liquidación grabó `"subtab_actual_view": "liquidacion"` en el JSON de ejecución, forzando la redirección permanente al abrir la oportunidad.

---

## 6. Resolución Estructural de Fondo ("Cero Parches") — 4 Niveles

1. **Nivel 1 (Frontend — `GestorOportunidades.vue` & `Torre.vue`):**
   - El Gestor de Oportunidades ahora respeta el flujo operativo cuando el proyecto está activo en faena, permitiendo navegar entre reportes y liquidación sin secuestrar la vista inicial.
   - Torre de Control clasifica `RYL-2611-00001` fidedignamente en la Columna 5 *"EN EJECUCIÓN / FAENA"*.
2. **Nivel 2 (Backend API — `proyectoModel.js` & `reportDiarioController.js`):**
   - **En `proyectoModel.js`:** Incorporada la condición ineludible de fecha no futura para no mutar virtualmente a estado 6:
     ```sql
     AND (
       COALESCE(p.fecha_plan_fin, (p.json_field->'crm_v1'->>'fecha_plan_fin')::timestamptz, (p.json_field->'ejecucion_v1'->>'fecha_fin_plan')::timestamptz) IS NULL
       OR COALESCE(p.fecha_plan_fin, (p.json_field->'crm_v1'->>'fecha_plan_fin')::timestamptz, (p.json_field->'ejecucion_v1'->>'fecha_fin_plan')::timestamptz) <= CURRENT_TIMESTAMP
     )
     ```
     Corregido además el escape regex a `^\\d{4}-\\d{2}-\\d{2}` en `duracion_plan`.
   - **En `reportDiarioController.js`:** Condicionada la consulta `ots_liquidacion` para excluir proyectos con fecha fin futura sin retorno ni ITS.
3. **Nivel 3 (Base de Datos PostgreSQL — Datafix en Producción):**
   - En `sch_leangsp_prod.tpry_proyecto` (ID 48):
     - `fecha_plan_fin = '2026-12-04 18:00:00-03'`
     - `json_field.ejecucion_v1.subtab_actual_view = 'reports'`
4. **Nivel 4 (Consolidación y Vistas):**
   - La Torre de Control PMO y Kanban mantienen la OT en su columna fáctica *"En Ejecución / Faena"* durante toda su vigencia mensual hasta el 04 de diciembre de 2026.

---

## 7. Verificación Empírica y Certificación E2E
* **Ejecución de Test Directo en Servidor Remoto (Node.js v16 / PostgreSQL):**
  * `getPendientesAnalista()` verificado tras reinicio de PM2 ID 13 (`lean-services-gsp-prod`):
    - `RYL-2611-00001` NO aparece en `ots_liquidacion`.
  * `GET /api/proyectos` verificado:
    - `id_proyecto_estado: 5` (En Ejecución / Faena).
    - `fecha_plan_fin: 2026-12-04`.
  * **Simulación lógica de clasificación en `Torre.vue`:**
    ```
    === EVALUACIÓN EXACTA FRONTEND PARA P48 ===
    id_proyecto: 48
    id_proyecto_estado: 5
    esFinalizadoOperacional: false
    estaEnFaena: true
    ¿Va a Columna 5 (EN EJECUCIÓN / FAENA)?: true
    ¿Va a Columna 6 (FINALIZADO / CONTABILIDAD)?: false
    ```
* **Estado en Producción:** Saludable, 0 errores, PM2 ID 13 online.
