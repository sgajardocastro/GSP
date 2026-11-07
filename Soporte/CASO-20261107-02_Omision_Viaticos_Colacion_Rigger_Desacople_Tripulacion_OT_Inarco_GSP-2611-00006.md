# Ficha de Caso de Soporte: CASO-20261107-02

## 1. Identificación del Incidente
- **Código:** CASO-20261107-02
- **Fecha:** 2026-11-07
- **Proyecto Involucrado:** `GSP-2611-00006` (`id_proyecto = 35`, Constructora Inarco S.A.) y barrido sistemático sobre OTs activas (`id_proyecto = 30, 31, 32, 44, 51, 62`)
- **Usuario Afectado / Reportante:** Yiara Mendoza (Jefatura de Operaciones) / Alfonso Maldonado (Rigger, `id_user = 21`) / Equipo de Contabilidad
- **Equipo Involucrado:** Grúa Telescópica 70 Ton (`VPSR.26-1`, ID `42`) y cuadrillas de izaje con Rigger asignado
- **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`)
- **Severidad:** Alta (Impacto financiero en liquidación de viáticos de personal e inconsistencia en costos ITS Sección 4)
- **Estado:** RESUELTO (v1.0.202 / REQ-1128 / SPEC-117)

---

## 2. Síntoma Reportado
Al liquidar la operación en el Informe de Término de Servicio (ITS) para la OT `GSP-2611-00006` (Constructora Inarco S.A.), el Rigger asignado en la tripulación (Alfonso Maldonado) aparecía sin monto de viático de alimentación en los costos sugeridos de la Sección 4 ("Viáticos de Alimentación y Alojamiento").
A pesar de haber trabajado jornadas de 9 horas diarias en faena los días 02, 03, 04 y 05 de noviembre de 2026, su viático figuraba en `$0`, requiriendo digitación manual o provocando el no pago del estipendio acordado ($8.000 por jornada diaria >= 8 hrs).

---

## 3. Causa Raíz Técnica
1. **Desacople en la Captura de Datos Terreno (Nivel 1 - Incepción):**
   En la aplicación móvil PWA, el Report Diario era emitido habitualmente por el Operador del equipo (`id_user_operador`). Cuando el operador no seleccionaba explícitamente al Rigger en el selector móvil de la cuadrilla, el registro en `tedp_reporte_avance` se persistía con `id_user_rigger = NULL` y `rigger_nombre = NULL`.
2. **Omisión de Enlace con la Asignación de Tripulación (Nivel 2 - Lógica Intermedia):**
   La tripulación oficial ya estaba formalmente designada y aprobada en la Orden de Trabajo (`tpry_proyecto.json_field->'ejecucion_v1'->'tripulacion_asignada'`). Sin embargo, el motor de liquidación diaria (`reportDiarioController.js:construirLiquidacionPersonalDiaReport`) y el consolidador de ITS (`itsController.js:consolidarMovimientosProyecto`) leían exclusivamente los campos planos `id_user_rigger` de `tedp_reporte_avance`. Al encontrar `NULL`, saltaban el cálculo de viático para el rigger.
3. **Persistencia Histórica en Base de Datos (Nivel 3 - DB):**
   De 34 reportes analizados en producción, 32 tenían `id_user_rigger IS NULL`, perpetuando el error en todos los cierres operacionales.

---

## 4. Solución Aplicada (Resolución de Fondo en 4 Niveles - Cero Parches)
1. **Nivel 1 - Incepción y Persistencia Automática:**
   Al crear o actualizar reportes diarios, si la tripulación de la OT tiene un Rigger asignado (`rol = 'RIGGER'`), se resuelve automáticamente su `id_user` y nombre, vinculándolo a la fila del reporte.
2. **Nivel 2 - Lógica Intermedia Resiliente en Controladores:**
   - En `reportDiarioController.js` (`construirLiquidacionPersonalDiaReport`), si `id_user_rigger` es `NULL`, se consulta la cuadrilla asignada en `ejecucion_v1.tripulacion_asignada`. Se obtiene el ID y nombre del Rigger y se invoca determinísticamente la escala tabular `calcularViaticoAlimentacionDia(horas, baseViatico)`, asignando $8.000 para jornadas de 9h.
   - En `itsController.js` (`consolidarMovimientosProyecto` y `generarCostosSugeridosITS`), se sincronizó la misma lógica de fallback a la tripulación del proyecto para que la Sección 4 ("Viáticos") totalice correctamente los estipendios de ambos integrantes (Operador + Rigger).
3. **Nivel 3 - Saneamiento Integral en Base de Datos de Producción y Desarrollo:**
   Se ejecutó script SQL de datafix que recorrió todos los reportes de `tedp_reporte_avance` cruzando con `tpry_proyecto.json_field->'ejecucion_v1'->'tripulacion_asignada'`. Se actualizaron las columnas `id_user_rigger` y `rigger_nombre`, y se regeneró el JSONB `ajustes_analista->'liquidacion_personal_dia'` para la OT 35 (Alfonso Maldonado, 4 días a $8.000 = $32.000) y demás OTs activas (30, 31, 32, 44, 51, 62).
4. **Nivel 4 - Consolidación y Visualización:**
   `ModalITS.vue` ahora renderiza de forma consistente el detalle diario y acumulado de viáticos de operador y rigger tanto en la interfaz interactiva como en el PDF de liquidación.

---

## 5. Archivos Intervenidos
- `ejecucion/backend_remoto/src/controllers/reportDiarioController.js`
- `ejecucion/backend_remoto/src/controllers/itsController.js`
- `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`
- Base de Datos: `sch_leangsp_prod.tedp_reporte_avance`, `sch_leangsp.tedp_reporte_avance`
- Especificación: `.agents/specs/117_viaticos_personal_rer_rigger_its_spec.md`

---

## 6. Verificación y Resultados
- **Auditoría API Backend PROD:**
  Llamada a `itsController.getITS` para OT 35 responde **HTTP 200 OK**.
- **Resultado Cuadratura Matemática:**
  - Días 02, 03, 04 y 05 de noviembre de 2026: Alfonso Maldonado (Rigger) figura con 9.0 horas y viático de `$8.000` por día.
  - Total viáticos RER Rigger acumulados: `$32.000`.
  - Total viáticos Operador acumulados: `$32.000`.
  - Total general viáticos alimentación: `$64.000`.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Ningún subproceso downstream (ITS, EDP, Facturación, Liquidación de Sueldos) debe depender exclusivamente de que un campo opcional haya sido capturado en un dispositivo móvil offline.
- Debe existir siempre una cadena de fallback determinista hacia los datos contractuales y de planificación maestra del proyecto (`tpry_proyecto.json_field`).
