# ⏱ Especificación de Formulario: Registro Diario de Horómetros

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **Registro Diario de Horómetros** en la App del Operador.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const horometrosData = {
  id: "HR-20260621-SRV041", // Formato: HR-YYYYMMDD-[ServiceNumber]
  serviceId: "#SRV-2026-041",
  operatorId: "usr-uuid-123",
  cranePlate: "GZBC-58",
  engineHoursStart: 6864.0,
  engineHoursEnd: 6870.5,
  operationHoursToday: 6.5, // Calculado automáticamente: End - Start
  litersFuelCharged: 45.0,
  observations: "Operación de montaje normal. CMPC Laja."
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `HR-`
- **Destino en LocalStorage:** `gsp_buffered_horometros`
- **Endpoint del API:** `POST /api/operator/horometros`
- **Mapeo a PDF:** Los datos de este formulario alimentan de forma directa el `Reporte_Horometros_SRV041.pdf` que se visualiza en la Consola de Despacho.

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Validación de Rango:** El campo `engineHoursEnd` debe ser estrictamente mayor que `engineHoursStart`. La interfaz mostrará un mensaje de error si es igual o menor, impidiendo el envío.
- **Cálculo en Tiempo Real:** El valor de `operationHoursToday` se calcula y muestra en pantalla dinámicamente a medida que el operador edita la hora de término.


---

## 4. Actualización v1.2 (REQ-1077 / 26-Oct-2026): Control de Triple Reloj contra Última Mantención Realizada (Ciclos 250 hrs y 10.000 km)
- **Doctrina Técnica (Estándar Kaufmann / Liebherr / ISO 14224):** La diferencia ($\Delta$) se calcula exclusivamente entre la **Lectura Actual Acumulada** y la **Lectura de la Última Mantención Realizada (Base PM)** en los 3 relojes independientes:
  1. **Horómetro Grúa (Superestructura / Izaje — Ciclo `250 hrs`):**
     - $\Delta\text{Uso Grúa} = \text{horometro\_grua\_acumulado} - \text{ult\_mant\_horometro\_grua}$
     - $\text{Faltante Grúa} = 250 - \Delta\text{Uso Grúa}$
  2. **Horómetro Chasis (Motor Inferior / PTO — Ciclo `250 hrs`):**
     - $\Delta\text{Uso Chasis} = \text{horometro\_chasis\_acumulado} - \text{ult\_mant\_horometro\_chasis}$
     - $\text{Faltante Chasis} = 250 - \Delta\text{Uso Chasis}$
  3. **Odómetro Ruta (Tren Motriz — Ciclo `10.000 km`):**
     - $\Delta\text{Recorrido Km} = \text{odometro\_acumulado} - \text{ult\_mant\_odometro\_km}$
     - $\text{Faltante Odómetro} = 10000 - \Delta\text{Recorrido Km}$
- **Resolución de Base Última Mantención (`ult_mant_*`):** Cascada `GREATEST` entre el último cierre de OTM en `tmnt_ot` (`estado = 'CERRADA'`) y la línea base configurada en `tequ_equipo.json_data` (`ult_mant_horometro_grua`, `ult_mant_horometro_chasis`, `ult_mant_odometro_km`).
- **Separación Arquitectónica en Menú `Gestión de Flota` (`v1.3`):**
  1. **`Vista Equipos 360` (`/vista360` — `Vista360.vue`):** Enfocada exclusivamente en el Maestro de Activos, Documentación Legal (Permiso de Circulación, Revisión Técnica, SOAP), Documentación General/Certificaciones e Inspecciones (sin columnas de horómetros/odómetros en la tabla principal).
  2. **`Radar Horómetros & Odómetros` (`/radar-flota` — Menú dedicado en `Sidebar.vue`):** Vista independiente de primer nivel bajo `Gestión de Flota` que presenta para cada activo el desglose completo de los 3 relojes (`GRÚA 250h`, `CHASIS 250h`, `ODÓMETRO 10.000 km`): **Lectura Actual**, **Última Mantención**, **Diferencia / Uso Acumulado ($\Delta$)** y **Cuánto Falta (`250 hrs` / `10.000 km`)** con semáforo preventivo y acción directa para programar OT o abrir Hoja de Vida.
     - **KPIs BI Interactivos (*Click-to-Filter*) Exclusivos del Radar:** Reemplaza los KPIs de Taller por 6 tarjetas ejecutivas de ciclo preventivo: `Total Flota en Radar`, `🟢 Máquinas Al Día`, `🟡 Próximas a Mantener (≤ 50h / ≤ 2.000 km)`, `🔴 Mantenimiento Vencido (> 250h / > 10.000 km)`, `🔧 En Mantención (Taller)` y `📡 Salud Preventiva %`.
     - **Alertas Ejecutivas de Ciclo Preventivo:** Oculta las alertas de OTs de Taller y muestra únicamente alertas de equipos con ciclo preventivo vencido sin OT activa y equipos próximos a mantener.
     - **Buscador y Filtro Rápido:** Búsqueda por patente/marca/modelo y filtrado por estado de ciclo (`TODOS`, `OK`, `PROXIMO`, `VENCIDO`, `EN_TALLER`).
  3. **`Órdenes de Trabajo (OTs)` (`/mantenimiento` — `MantenimientoView.vue`):** Consola pura de ejecución de taller (Bandeja de OTs, Avisos de Avería, Hallazgos Técnicos y Parámetros Operacionales), sin el submenú de Flota y Horómetros.
