# Especificación Técnica N° 136: Blindaje Canónico Anti-Resurrección y Erradicación Integral del JSON en Toda la Cadena Operativa (OT, Reportes Diarios, EDP e ITS)

> [!IMPORTANT]
> **NOTA DE REMISIÓN CANÓNICA A SPEC-16 §28:**
> Todo el contenido, diagnóstico forense y soluciones técnicas de esta especificación han sido integrados y formalizados de manera canónica e integral en **[.agents/specs/16_crm_gestor_oportunidades_spec.md](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/.agents/specs/16_crm_gestor_oportunidades_spec.md#L1403-L1476) (Sección 28: Erradicación Integral de `json_field` desde Asignación hasta Facturación y Blindaje Canónico en 4 Niveles)**. La fuente canónica que rige el producto es `SPEC-16 §28`.

> **Regla de Oro Arquitectural:**  
> **"El JSON (`json_field`) es un histórico pasivo; JAMÁS una fuente de verdad para cálculos, asignaciones o validaciones operativas. Toda decisión de flota, tripulación, horas y valorizaciones se resuelve exclusivamente contra el modelo relacional (`tpry_rel_equipo`, `tpry_rel_persona`, `tedp_reporte_avance`)."**

---

## 1. Contexto, Diagnóstico y Causa Raíz Sistémica

### 1.1 Síntomas Operativos Detectados
1. **En la Orden de Trabajo (Caso OT 47):**  
   Al reemplazar una grúa mayor por la grúa programada (`VYRK.90-2`), la interfaz web resucitaba la patente reemplazada (`CPYW.52-2`) porque el endpoint auxiliar `/asignaciones/equipos` no filtraba registros en estado `REEMPLAZADO` y el cliente sobreescribía la vista.
2. **En Reportes Diarios y Regularización Manual (Caso OT 04 - Ferrero):**  
   El servicio inició con el camión `TRPS.20-8` (días 1 al 6) y luego tuvo un relevo programado al camión `RSPL.82-3` (a partir del día 7). Sin embargo, al regularizar manualmente el Día 12, el modal leyó el JSON original de la preventa (`equipo_asignado_id: 57`), preseleccionó la máquina inicial que ya no estaba en faena, y como la API no tenía restricción de unicidad, creó un **reporte duplicado (#88)** para el mismo día que ya estaba cerrado con el reporte legítimo (#72).
3. **Censo Forense en Base de Datos de Producción (`sch_leangsp_prod`):**
   - **1 caso crítico activo con reportes duplicados:** OT 20 (Proyecto 62), con dos reportes para el Día 1 (Reporte 46 con grúa 36 y Reporte 87 con camión 75).
   - **10 proyectos operativos con desalineación severa:** El JSON comercial difiere de las máquinas activas en `tpry_rel_equipo` (OTs 03, 04, 05, 07, 20, 29, 30, 47, INT-05, INT-10, RYL-01).
   - **6 proyectos con reportes emitidos a equipos que no coinciden con la asignación vigente a esa fecha.**

### 1.2 Causa Raíz
El sistema arrastra una deuda técnica híbrida: la base de datos registra las asignaciones en tablas relacionales (`tpry_rel_equipo` / `tpry_rel_persona`), pero los controladores de **Reportes Diarios**, **EDP** e **ITS** continúan leyendo propiedades congeladas dentro de `tpry_proyecto.json_field` (`crm_v1.lineas_servicio`, `ejecucion_v1.tripulacion_asignada`).

---

## 2. Mapa Arquitectónico de la Cadena Completa

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 AUTORIDAD RELACIONAL ÚNICA                              │
│                                                                                        │
│   tpry_rel_equipo                     tpry_rel_persona              tedp_reporte_avance │
│   - id_proyecto                       - id_proyecto                 - id_proyecto      │
│   - id_equipo                         - id_user                     - dia_correlativo  │
│   - fecha_plan_ini / fin              - rol_asignado                - fecha_reporte    │
│   - estado_real ('PROGRAMADO')        - estado_real ('PROGRAMADO')   - id_equipo        │
└───────────────┬───────────────────────────────┬───────────────────────────────┬────────┘
                │                               │                               │
                ▼                               ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
    │   1. ORDEN DE TRABAJO │       │   2. REPORTES DIARIOS │       │   3. CIERRE FINANCIERO│
    │      (Web / PDF)      │       │     (PWA / Control)   │       │       (EDP / ITS)     │
    │                       │       │                       │       │                       │
    │ - getAsignacionesEq:  │       │ - getReportContexto:  │       │ - Conciliación EDP:   │
    │   WHERE estado_real   │       │   Eq según fecha de   │       │   Cruza horas de rep. │
    │   != 'REEMPLAZADO'    │       │   la jornada en rel.  │       │   con tarifas de rel. │
    │ - Escudo Anti-Resurr. │       │ - Candado Unicidad:   │       │ - ITS P&L: Margen real│
    │   en updateProyecto   │       │   UQ(id_proy, dia)    │       │   por máquina operada │
    │ - PDF lee solo rel.   │       │ - Cero lectura a JSON │       │ - Cero lectura a JSON │
    └───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

---

## 3. Plan de Remediación y Especificación Técnica por Eslabón

### Eslabón 1: Orden de Trabajo (Web, Backend y PDF) — *Completado en PROD, pendiente en DEV*

1. **Backend (`asignacionRecursosController.js`):**
   - En `getAsignacionesEquipo`:
     ```sql
     SELECT re.*, e.patente, e.marca, e.modelo
     FROM tpry_rel_equipo re
     JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
     WHERE re.id_proyecto = $1 
       AND (re.estado_real IS NULL OR re.estado_real != 'REEMPLAZADO')
     ORDER BY re.fecha_plan_ini ASC, re.id_rel_equipo ASC;
     ```
2. **Backend Modelo (`proyectoModel.js`):**
   - En `getProyectoById`: Si `id_proyecto_estado >= 4`, consultar la grúa principal activa en `tpry_rel_equipo` y sobreescribir en memoria cualquier stale ID en `lineas_servicio[0].equipo_asignado_id` y `ejecucion_v1.equipo_id`.
   - En `updateProyecto`: Interceptar payloads entrantes; si el payload contiene un `id_equipo` que figure en `tpry_rel_equipo` con `estado_real = 'REEMPLAZADO'`, se descarta y se preserva el equipo activo en base de datos.
3. **Motor PDF de OT (`generarOTVersion`):**
   - La sección 3 (Flota & Convoy) y 4 (Tripulación) se construye consultando exclusivamente `tpry_rel_equipo` y `tpry_rel_persona` en estado `PROGRAMADO`.

---

### Eslabón 2: Reportes Diarios y Regularización Manual (`reportDiarioController.js`)

1. **Candado Duro de Unicidad en Base de Datos (Compuerta Relacional):**
   - Crear un índice único parcial en `tedp_reporte_avance` para hacer físicamente imposible la existencia de dos reportes activos para un mismo día en un proyecto:
     ```sql
     CREATE UNIQUE INDEX IF NOT EXISTS uq_tedp_proyecto_dia_correlativo 
     ON sch_leangsp_prod.tedp_reporte_avance (id_proyecto, dia_correlativo) 
     WHERE estado_reporte != 'ANULADO';
     ```
2. **Resolución Temporal de Flota en `getReportContexto`:**
   - Erradicar la búsqueda de equipo en `json_field.crm_v1.lineas_servicio`.
   - Resolver el equipo correspondiente al operador consultando la tabla relacional considerando la fecha de la jornada:
     ```sql
     SELECT re.id_equipo, e.patente, e.modelo
     FROM tpry_rel_equipo re
     JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
     WHERE re.id_proyecto = $1
       AND re.estado_real = 'PROGRAMADO'
       AND (
         $2::date BETWEEN re.fecha_plan_ini::date AND re.fecha_plan_fin::date
         OR re.fecha_plan_ini IS NULL
       )
     ORDER BY re.fecha_plan_ini DESC
     LIMIT 1;
     ```
3. **Blindaje en `regularizarReporteManual`:**
   - **Validación previa:** Si ya existe un reporte con `(id_proyecto, dia_correlativo)` en estado distinto a `ANULADO`, la API no crea una nueva fila. Actualiza la existente o responde `HTTP 409 Conflict` indicando que el día ya fue reportado.
   - **Resolución de Equipo por Defecto:** Si el usuario no selecciona explícitamente un equipo en el modal, el backend resuelve la máquina consultando `tpry_rel_equipo` para la `fecha_reporte` indicada, eliminando el fallback ciego al primer elemento de la cotización original.

---

### Eslabón 3: Estado de Pago / EDP (`estadoPagoController.js`)

1. **Conciliación de Horas contra Flota Real:**
   - Al agrupar las horas de los reportes diarios (`tedp_reporte_avance`), vincular cada reporte a su `id_equipo` real persistido en la fila del reporte.
2. **Cruce de Tarifas Relacional:**
   - La tarifa aplicable a cada máquina no debe buscarse por el índice del arreglo (`idx_0`, `idx_1`) en el JSON.
   - Si una máquina sustituyó a otra con tarifa respaldada o tarifa pactada, la tarifa base debe resolverse a través de la línea operativa asociada en `tpry_rel_equipo.id_linea_servicio`.

---

### Eslabón 4: Informe de Término de Servicio / ITS (`itsController.js`)

1. **P&L y Desviaciones de Costo:**
   - Las horas operadas provienen de la sumatoria de `tedp_reporte_avance`.
   - Los equipos que computan costos de combustible, desgaste y viáticos deben ser exactamente los que registran jornadas en `tedp_reporte_avance` y figuran en `tpry_rel_equipo`.
   - Eliminar el parseo de `lineasRaw` desde `crmV1.lineas_servicio` como fuente primaria de qué máquinas prestaron el servicio.

---

## 4. Plan de Limpieza de Casos Históricos en Producción (Data Fix)

Antes del despliegue del software blindado, se ejecutan las siguientes acciones en `sch_leangsp_prod`:

1. **Saneamiento Caso OT 20 (Proyecto 62):**
   - Auditar los reportes #46 y #87 del Día 1.
   - Consolidar la evidencia y anular el reporte duplicado espurio.
2. **Saneamiento de los 10 Proyectos Desfasados:**
   - Ejecutar script de homologación que alinee las cabeceras residuales con las asignaciones vivas de `tpry_rel_equipo`.
3. **Aplicación del Constraint de Unicidad:**
   - Ejecutar la creación del índice único `uq_tedp_proyecto_dia_correlativo`.

---

## 5. Checklist de Verificación y Homologación en `DEV`

Para que la conversación o el desarrollador en `DEV` aplique la solución sin fisuras:

- [ ] **BD:** Crear índice único `uq_tedp_proyecto_dia_correlativo` en `sch_leangsp`.
- [ ] **Backend (`reportDiarioController.js`):**
  - Implementar compuerta de unicidad en `regularizarReporteManual`.
  - Reemplazar lectura de JSON por consulta a `tpry_rel_equipo` por rango de fechas en `getReportContexto`.
- [ ] **Backend (`asignacionRecursosController.js`):**
  - Mantener filtro `WHERE estado_real != 'REEMPLAZADO'` en `getAsignacionesEquipo`.
- [ ] **Backend (`proyectoModel.js`):**
  - Asegurar el escudo anti-resurrección en `getProyectoById` y `updateProyecto`.
- [ ] **Frontend Web (`GestorOportunidades.vue`):**
  - En el modal de regularización manual, cargar la lista de equipos activos desde `tpry_rel_equipo` y preseleccionar según la fecha ingresada.
- [ ] **Verificación E2E:**
  1. Crear relevo de equipo en una OT (ej. Día 1 al 5 Equipo A, Día 6 al 10 Equipo B).
  2. Abrir reporte día 7 en PWA o regularización manual ➔ Debe asignar automáticamente el Equipo B.
  3. Intentar registrar dos veces el Día 7 ➔ Debe ser rechazado por la base de datos (HTTP 409 / Error de unicidad).
  4. Generar PDF de OT y PDF de Reporte ➔ Cero presencia del Equipo A en el Día 7.
