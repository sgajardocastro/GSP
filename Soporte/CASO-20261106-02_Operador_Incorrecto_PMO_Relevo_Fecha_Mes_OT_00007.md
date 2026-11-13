# CASO-20261106-02: Operador de Relevo No Visible en Tarjeta PMO por Error de Mes en Fecha de Inicio de Turno (OT GSP-2611-00007)

---

## 1. Ficha del Incidente

- **ID del Caso:** `CASO-20261106-02`
- **Fecha / Hora:** 2026-11-06 12:55:00 (Hora Chile)
- **Operador / Usuario Afectado:** Ernesto Israel Ríos (`id_user = 9`) / Claudio Alexi Gallardo (`id_user = 62`).
- **Negocio / OT:** `GSP-2611-00007` (Proyecto `id_proyecto = 36`), Mandante: *METTCO SPA*, Obra: *PLANTA FERRERO - FUNDO CARACAS*.
- **Equipo Involucrado:** Camión Pluma `RSPL.82-3` (`id_equipo = 56`, Sinotruk C7H8X4 440 EV Forestal).
- **Ambiente:** Producción (`PROD`).
- **Severidad:** Media / Operacional (Visualización incorrecta en Torre de Control PMO y Ribbon de seguimiento en vivo).
- **Estado:** `RESUELTO Y NORMALIZADO EN PRODUCCIÓN`

---

## 2. Síntoma Reportado por Terreno / Jefatura de Operaciones

Al revisar el panel de **Control Operativo en Vivo (PMO)** para la fecha del día (`06-11-2026`), la tarjeta del servicio `GSP-2611-00007` y el día seleccionado mostraban como operador a **Claudio Alexi Gallardo**, cuando según la planificación de relevos ingresada en la OT correspondía que a partir de hoy asumiera el operador **Ernesto Israel Ríos**.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

1. **Inspección de la Asignación en `sch_leangsp_prod.tpry_proyecto` (Proyecto 36):**
   Al consultar el arreglo de `turnos_operadores` dentro de la línea de servicio y en `tripulacion_asignada`:
   ```json
   "turnos_operadores": [
     {
       "operador_id": 62,
       "fecha_ini": "2026-11-04",
       "fecha_fin": "2026-11-05"
     },
     {
       "operador_id": 9,
       "fecha_ini": "2026-12-06",
       "fecha_fin": "2026-12-02"
     }
   ]
   ```
2. **Hallazgo de Causa Raíz:**
   - En el Turno 2 (Ernesto Israel Ríos), la fecha de inicio se registró por error con el mes **12 (Diciembre)** en lugar del mes **11 (Noviembre)**: `"2026-12-06"`.
   - Adicionalmente, quedó una inconsistencia cronológica donde la fecha de inicio (`06-12-2026`) superaba a la fecha de término (`02-12-2026`).

3. **Comportamiento del Motor del Backend (`controlVivoController.js`):**
   El método `resolverOperadorDeEquipo(idEq, fechaRef)` evalúa:
   - Para la fecha de hoy `2026-11-06`:
     - Turno 1 finalizó el `2026-11-05` (no coincide).
     - Turno 2 inicia el `2026-12-06` (el sistema determinó que no iniciaba hasta diciembre).
   - Al existir un vacío temporal sin turno cubierto para el 06 de noviembre, la lógica ejecutó el fallback al operador titular de la cabecera de la línea (`operador_asignado_id = 62`, Claudio Gallardo).

---

## 4. Causa Raíz de Arquitectura

El componente de asignación de turnos y relevos en `GestorOportunidades.vue` no contaba con una validación restrictiva que alertara o bloqueara si la fecha de inicio de un turno era posterior a su fecha de término (`fecha_ini > fecha_fin`), permitiendo que un error de tipeo en el mes (digitar `12` en vez de `11`) guardara una fecha invertida en el JSON del proyecto.

---

## 5. Plan de Mitigación y Resolución

Se ejecutó una actualización atómica en la base de datos de producción (`sch_leangsp_prod`) corrigiendo la fecha de inicio del Turno 2 al `06-11-2026`:

```sql
BEGIN;

UPDATE sch_leangsp_prod.tpry_proyecto
SET json_field = jsonb_set(
  jsonb_set(
    json_field,
    '{crm_v1,lineas_servicio,0,turnos_operadores,1,fecha_ini}',
    '"2026-11-06"'::jsonb
  ),
  '{ejecucion_v1,tripulacion_asignada,1,fecha_plan_ini}',
  '"2026-11-06"'::jsonb
)
WHERE id_proyecto = 36;

COMMIT;
```

### Verificación Empírica Inmediata (`getControlVivo` para `2026-11-06`):
```text
s.operador: Ernesto Rios
s.telefono_operador: +56989827155
eq[0].operador: Ernesto Rios
Franja hoy (2026-11-06): {
  dia: 3,
  fecha: '2026-11-06',
  operador: 'Ernesto Rios',
  telefono: '+56989827155',
  es_hoy: true
}
```

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operaciones

> *"Se corrigió la fecha del Turno 2 en la base de datos. Había quedado registrada con fecha de inicio 06-12-2026 (mes de diciembre en lugar de noviembre). Al ingresar nuevamente a la pantalla de Control Operativo en Vivo (PMO) o refrescar la vista, la tarjeta de la OT GSP-2611-00007 y el Ribbon del día de hoy ya reflejan correctamente a Ernesto Israel Ríos (+56989827155)."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Validación Frontend de Rango en Relevos:**
   En `GestorOportunidades.vue`, se debe incorporar validación en tiempo real en los inputs de fecha de los turnos (`T1`, `T2`, etc.) para impedir que `fecha_ini` sea superior a `fecha_fin`.
2. **Detección Automática de Huecos en Turnos:**
   En el motor de `controlVivoController.js`, si una fecha de consulta cae entre el fin de un turno y el inicio del siguiente, generar una alerta visual de "Turno no cubierto" en lugar de hacer fallback silencioso al operador titular anterior.
