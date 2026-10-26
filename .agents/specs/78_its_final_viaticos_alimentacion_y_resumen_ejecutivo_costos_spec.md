# SPEC-078: Incorporación de Tab Viático Alimentación y Apertura Detallada de Costos en Resumen Ejecutivo de ITS Final

- **ID Requerimiento:** `REQ-1040`, `REQ-1041`
- **Fecha:** 2026-10-14
- **Estado:** APROBADO PARA IMPLEMENTACIÓN
- **Módulos Afectados:**
  - `ejecucion/backend_remoto/src/controllers/itsController.js`
  - `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`
  - `ejecucion/backend_remoto/src/services/itsPdfService.js`

## 1. Alcance Funcional
1. **Tab `Viático Alimentación` en Sección 3 de Costos (`ModalITS.vue`):**
   - Se incorpora como un tab adicional (`alimentacion`, etiqueta `Viático Alimentación`) en la Sección 3 (*Costos Operacionales Directos de Terreno*), pasando el indicador de auditoría de 9 a **10 Categorías** (`Auditoría: X/10 Categorías`).
   - **No se modifica en absoluto la pestaña `Pensiones`**.
   - La tabla de `Viático Alimentación` replica el formato de `ItsTransicionView.vue`:
     - `Fecha` (`date`)
     - `Personal` (`nombre_personal`)
     - `Concepto / Detalle` (`concepto_detalle`, placeholder `"Alimentación Operador"`)
     - `Monto ($)` (`monto_total`)
     - `Acción` (eliminar ítem)
   - Cumple las mismas reglas de las demás categorías: botón `Declarar Sin Costo` / `Confirmado Sin Costo`, `+ Agregar Ítem` y auto-cierre como `Sin Costo` al firmar FES si no tiene registros.
2. **Persistencia en Backend (`itsController.js`):**
   - `getITS` inicializa `costos.alimentacion = []` y mapea los registros con `categoria = 'ALIMENTACION'` desde `tits_costo_operacional`.
   - `guardarITS` incluye `{ key: 'alimentacion', dbCat: 'ALIMENTACION', calc: 'MONTO_DIRECTO' }` en `catMapping`.
3. **Apertura Detallada del Resumen Ejecutivo en `ModalITS.vue` (Sección 4) e `itsPdfService.js`:**
   - En la Sección 4 de `ModalITS.vue` y en el PDF oficial (`itsPdfService.js`), el bloque de costos operacionales muestra la apertura línea por línea de cada categoría con su **Monto ($)** y su **porcentaje sobre la venta (`% s/ Venta`)**, homologando el Resumen Ejecutivo del ITS de Transición.

## 2. Integración de Tarifas de Operador, Regla de Traslado y Auditoría de Control de Gestión (Yara)

- **ID Requerimiento:** `REQ-1042`, `REQ-1043`
- **Origen de Tarifas:** `Contabilidad/VALOR_HORA_OPERADOR_2026-10-26.xlsx`

### 2.1 Matriz Maestra de Tarifas por Tipo de Equipo y Tonelaje (19 Categorías)
| ID | Categoría / Equipo Maestro | Toneladas | Valor Hora Operador ($) |
|---|---|---|---|
| 1 | GRUAS TELESCOPICAS 40 TON | 40 | $5.000 |
| 2 | GRUAS TELESCOPICAS 50 TON | 50 | $5.000 |
| 3 | GRUAS TELESCOPICAS 55 TON | 55 | $5.000 |
| 4 | GRUAS TELESCOPICAS 60 TON | 60 | $6.000 |
| 5 | GRUAS TELESCOPICAS 70 TON | 70 | $6.000 |
| 6 | GRUAS TELESCOPICAS 75 TON | 75 | $6.000 |
| 7 | GRUAS TELESCOPICAS 80 TON | 80 | $6.000 |
| 8 | GRUAS TELESCOPICAS 90 TON | 90 | $6.000 |
| 9 | GRUAS TELESCOPICAS 100 TON | 100 | $7.000 |
| 10 | GRUAS TELESCOPICAS 120 TON | 120 | $7.000 |
| 11 | GRUAS TELESCOPICAS 150 TON | 150 | $10.000 |
| 12 | GRUAS TELESCOPICAS 160 TON | 160 | $10.000 |
| 13 | GRUAS TELESCOPICAS 220 TON | 220 | $13.000 |
| 14 | GRUAS TELESCOPICAS 250 TON | 250 | $13.000 |
| 15 | GRUA TELESCOPICA 300 TON | 300 | $13.000 |
| 16 | GRUAS TELESCOPICAS 400 TON | 400 | $20.000 |
| 17 | CAMION PLUMA | 0 | $3.500 |
| 18 | MANIPULADOR TELESCÓPICO | 0 | $3.000 |
| 19 | GRUA HORQUILLA | 0 | $3.000 |

### 2.2 Regla de Negocio para Traslados
- **Tarifa Idéntica:** La tarifa por hora de traslado del operador es **estrictamente idéntica** a la tarifa de servicio de la máquina asignada (ejemplo: si la máquina asignada es Grúa 50t a $5.000/hr de faena, su traslado se liquida a razón de $5.000/hr; si es Camión Pluma, a $3.500/hr).

### 2.3 Auditoría y Trazabilidad de Modificaciones por Control de Gestión (Yara)
- En `ModalITS.vue`, en la categoría `costo_hora_operador`, el sistema precarga automáticamente la tarifa sugerida según el equipo asignado y las horas del reporte/servicio.
- Si Control de Gestión (Yara) edita el valor de la tarifa (`precio_unitario`), el sistema no la sobreescribe en conciliaciones reactivas y activa la trazabilidad de auditoría:
  - `tarifa_modificada: true`
  - `tarifa_sugerida: <valor_original_sugerido>`
  - `modificado_por: 'Yara'`
- **Alertas Visuales en Interfaz:**
  - Banner general en el tab: `⚠️ Tarifa Modificada por Control de Gestión` con indicador de auditoría `Auditoría: Yara`.
  - Badge individual en la fila: `⚠️ Modificado` con el valor original sugerido tachado.
  - El campo numérico de tarifa se resalta con borde ámbar (`border-amber-500/50`) y fondo distintivo.

