# SPEC-115 / REQ-1125: Resolución Unificada de Piso Mínimo en Servicios Mensuales (Reports Diarios e ITS)

---

## 1. Identificación y Estado

- **Código Requerimiento:** `REQ-1125`
- **Código Especificación:** `SPEC-115`
- **Fecha:** 2026-11-06
- **Autor / Arquitectura:** Antigravity / LeanGlobal
- **Ambientes:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Impacto:** Backend (`controlVivoController.js`, `reportDiarioController.js`, `itsController.js`, `itsPdfService.js`, `reportDiarioPdfService.js`) y Base de Datos (`sch_leangsp_prod.tedp_reporte_avance`).
- **Estado:** `PROPUESTA FORMAL / PENDIENTE DE APROBACIÓN DE DIFF`

---

## 2. Definición del Problema & Congruencia Operacional

### 2.1. Síntoma en Terreno (Caso Inarco y Mettco)
En contratos de arriendo mensual de grúas y camiones pluma (ej. Inarco `GSP-2611-1830-001`, Inarco `GSP-2611-00006`, Mettco `GSP-2611-00007`), la Orden de Trabajo (OT) estipula un piso mínimo mensual de **170** o **180 hrs/mes** (`Horas Mes Minimas`), sin piso mínimo diario.
Sin embargo:
1. Al emitir o registrar la jornada (ej. hoy viernes 06-11-2026 en Inarco, donde el turno finalizó a las 14:00 hrs completando **6.0 hrs efectivas**), el sistema grabó en base de datos un piso mínimo diario de **8.0 hrs**.
2. El Report Diario impreso y en pantalla exhibe:
   `Piso Mínimo OT: 8.0 hrs base (según OT formal)` y `Total Facturable: 8.0 hrs` (o sobretiempos prematuros si supera 8 hrs), contradiciendo abiertamente la OT formal que tiene el cliente mandante en faena.
3. El Informe de Término de Servicio (ITS) arrastra las jornadas con 8.0 hrs diarias forzadas, e imprime en su PDF la leyenda fija:
   `Tarifa Base 8.0 hrs por Disponibilidad de Equipo`, impidiendo que Administración y Contabilidad (Yiara) puedan conciliar y facturar la cuota mensual contratada.

---

## 3. Causa Raíz de Arquitectura

1. **Fuga en Torre PMO (`controlVivoController.js:1790`):**
   ```javascript
   const val = Number(match?.pisoMinimo || match?.cantidad_horas || 0);
   return (val > 0 && val <= 24) ? val : 8.0;
   ```
   En servicios mensuales, `cantidad_horas` es 170 o 180. Al evaluar `val <= 24`, la condición falla y ejecuta el fallback forzado a `8.0`, guardando `horas_minimas = 8.00` en `tedp_reporte_avance`.
   Además, calcula:
   ```javascript
   horasFacturables = Math.max(horasOperadas, pisoMinimo);
   horasSobretiempo = Math.max(0, parseFloat((horasOperadas - pisoMinimo).toFixed(2)));
   ```
   forzando 8 horas facturables en turnos cortos y sobretiempo sobre 8 horas en turnos normales.
2. **Sobrecarga de `horas_minimas` en Regularización Manual (`reportDiarioController.js:3492`):**
   Si `req.body.horas_minimas` viene desde el cliente con 8.0 o el fallback se dispara, se almacena 8.0 en lugar de reconocer la modalidad mensual (`0.0`).
3. **Hardcoding en PDF de ITS (`itsPdfService.js:317`):**
   Posee el texto literal `Tarifa Base 8.0 hrs por Disponibilidad de Equipo` en lugar de evaluar si el servicio es diario o mensual.
4. **Acoplamiento Lineal en ITS (`itsController.js:859`):**
   Asume `hrsFact = r.horas_facturables || 8.0`, sumando días artificiales de 8 horas en lugar de acumular las horas reales operadas a la bolsa mensual.

---

## 4. Solución Canónica y Reglas de Negocio

### 4.1. Regla de Piso Mínimo Diario en Servicios Mensuales
- **Invariante:** En todo servicio cuya línea comercial vigente tenga `unidad` que contenga `'MES'` (`Horas Mes Minimas`, `Horas Mensuales Minimas`, `Mensual`):
  1. `horas_minimas` diaria = `0.0`.
  2. `horas_facturables` diaria = `horas_operadas` reales del día (ej. 6.00 hrs hoy viernes en Inarco).
  3. `horas_sobretiempo` diaria = `0.0` (no existe sobretiempo diario en contratos mensuales; todo sobretiempo se liquida al cierre del mes sobre la bolsa contratada).
  4. `unidad_cobro` en `tedp_reporte_avance` = `'HRS_MES'`.

### 4.2. Presentación en Report Diario (PDF y Visor)
- Si `horas_minimas === 0.0` o `esUnidadMensual`:
  - En Sección *Recursos & Flota*: `Modalidad Mensual (${hrsMes} hrs contratadas — Acumula horas reales al mes)`.
  - En Sección *Liquidación de Jornada*: `Piso Mínimo OT: Sin mínimo diario (Bolsa Mensual)`.
  - Horas Efectivas = `horas_operadas` (ej. 6.0 hrs).
  - Total Facturable = `horas_operadas` (ej. 6.0 hrs).
  - Sobretiempo = `0.0 hrs`.

### 4.3. Presentación y Conciliación en ITS
- En la conciliación de jornadas del ITS:
  - Cada jornada expone sus horas reales operadas (`horas_report = horas_operadas`).
  - En la cláusula de disponibilidad del PDF:
    `Cláusula: Tarifa Base Mensual (${hrsMes} hrs pactadas según OT)`.
  - En el Resumen Económico:
    - Venta Neta = Venta Mensual Pactada ($\text{Meses} \times \text{Horas Mes} \times \text{Tarifa}$).
    - Horas Totales Operadas = Suma de horas reales de todos los reports.
    - Si $\text{Horas Reales} < \text{Horas Mes Minimas}$, el cobro garantizado es la cuota mensual pactada.

### 4.4. Saneamiento Histórico de Datos (Datafix)
Ejecutar un `UPDATE` en `sch_leangsp_prod.tedp_reporte_avance` para las OTs mensuales activas:
- OT 27 (Inarco): Actualizar días 1 a 5 con `horas_minimas = 0.00`, recalculando `horas_facturables = horas_operadas` (Día 5 = 6.00 hrs) y `horas_sobretiempo = 0.00`.
- OT 35 (Inarco 70 Ton): Actualizar reportes con `horas_minimas = 0.00`, `horas_facturables = horas_operadas`, `horas_sobretiempo = 0.00`.
- OT 36 (Mettco Camión Pluma): Actualizar reportes con `horas_minimas = 0.00`, `horas_facturables = horas_operadas`, `horas_sobretiempo = 0.00`.
- Regenerar los PDFs oficiales correspondientes en `tfmg_file` mediante `generarPdfReportDiario`.

---

## 5. Criterios de Aceptación (QA Determinista)

1. En la OT 27 (Inarco), el Reporte del Día 5 (hoy 06-11-2026) debe exhibir:
   - Horario: 08:00 a 14:00 (Sin colación).
   - Horas Efectivas: `6.0 hrs`.
   - Piso Mínimo OT: `Sin mínimo diario (Bolsa Mensual)`.
   - Total Facturable: `6.0 hrs`.
   - Sobretiempo: `0.0 hrs`.
2. Al ingresar o modificar horas desde la Torre PMO (`ControlOperativoVivo.vue`), ninguna jornada mensual debe volver a guardarse con `horas_minimas = 8.0`.
3. El ITS de Inarco y Mettco debe totalizar las horas reales de operación y reflejar la venta mensual garantizada sin duplicar ni forzar 8 horas diarias ficticias.
