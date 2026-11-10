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
- **Resolución de Base Última Mantención (`ult_mant_*`):** Cascada `GREATEST` entre el último cierre de OTM Preventiva en `tmnt_ot` (`estado = 'CERRADA' AND tipo_mantenimiento = 'PREVENTIVO'`) y la línea base configurada en `tequ_equipo.json_data` (`ult_mant_horometro_grua`, `ult_mant_horometro_chasis`, `ult_mant_odometro_km`). Las OTs de tipo `CORRECTIVO` actualizan la lectura acumulada actual del equipo, pero NO reinician el contador del ciclo preventivo de `250 hrs` / `10.000 km`.
- **Separación Arquitectónica en Menú `Gestión de Flota` (`v1.3`):**
  1. **`Vista Equipos 360` (`/vista360` — `Vista360.vue`):** Enfocada exclusivamente en el Maestro de Activos, Documentación Legal (Permiso de Circulación, Revisión Técnica, SOAP), Documentación General/Certificaciones e Inspecciones (sin columnas de horómetros/odómetros en la tabla principal).
  2. **`Radar Horómetros & Odómetros` (`/radar-flota` — Menú dedicado en `Sidebar.vue`):** Vista independiente de primer nivel bajo `Gestión de Flota` que presenta para cada activo el desglose completo de los 3 relojes (`GRÚA 250h`, `CHASIS 250h`, `ODÓMETRO 10.000 km`): **Lectura Actual**, **Última Mantención**, **Diferencia / Uso Acumulado ($\Delta$)** y **Cuánto Falta (`250 hrs` / `10.000 km`)** con semáforo preventivo y acción directa para programar OT o abrir Hoja de Vida.
     - **KPIs BI Interactivos (*Click-to-Filter*) Exclusivos del Radar:** Reemplaza los KPIs de Taller por 6 tarjetas ejecutivas de ciclo preventivo: `Total Flota en Radar`, `🟢 Máquinas Al Día`, `🟡 Próximas a Mantener (≤ 50h / ≤ 2.000 km)`, `🔴 Mantenimiento Vencido (> 250h / > 10.000 km)`, `🔧 En Mantención (Taller)` y `📡 Salud Preventiva %`.
     - **Alertas Ejecutivas de Ciclo Preventivo:** Oculta las alertas de OTs de Taller y muestra únicamente alertas de equipos con ciclo preventivo vencido sin OT activa y equipos próximos a mantener.
     - **Buscador y Filtro Rápido:** Búsqueda por patente/marca/modelo y filtrado por estado de ciclo (`TODOS`, `OK`, `PROXIMO`, `VENCIDO`, `EN_TALLER`).
  3. **`Órdenes de Trabajo (OTs)` (`/mantenimiento` — `MantenimientoView.vue`):** Consola pura de ejecución de taller (Bandeja de OTs, Avisos de Avería, Hallazgos Técnicos y Parámetros Operacionales), sin el submenú de Flota y Horómetros.

---

## 5. Actualización v1.4 (30-Oct-2026): Regla de Precarga Obligatoria, Sincronización Transaccional y No-Regresión Monotónica de Medidores
1. **Precarga Obligatoria del Último Registro Oficial (`tequ_equipo`):**
   - Todo formulario de apertura o recepción en **Mantenimiento (Taller Web y PWA)** y en **Operaciones (Bitácora de Viajes y Report Diario)** debe presentar precargados por defecto los valores acumulados vigentes en `tequ_equipo` (`horometro_grua_acumulado`, `horometro_chasis_acumulado`, `odometro_acumulado`) según la familia del activo.
   - En el modal de **Apertura de OT Taller (Consola Web y PWA)** se despliegan los 3 medidores con su valor actual precargado y la referencia visual del último registro oficial.
   - En las pestañas de **Recepción (Medidores de Entrada)** y **Cierre Técnico** del expediente de OT, si un medidor aún no tiene lectura superior registrada en la OT, se precarga con `GREATEST(lectura_ot, acumulado_equipo)` (nunca `0`).
2. **Regla de Monotonicidad Estricta (Prohibición de Disminución / No-Regresión):**
   - Ningún evento operativo o de mantenimiento puede registrar un valor de `horometro_grua`, `horometro_chasis` u `odometro` que sea **menor** al último valor acumulado vigente en `tequ_equipo` al momento de la apertura/recepción, ni menor a la lectura de inicio del propio documento al momento del cierre (`nuevo_valor >= valor_actual_acumulado` y `valor_cierre >= valor_inicio`).
   - Esta restricción se aplica en doble capa: bloqueo preventivo en interfaz (`:min` y validación cliente) y rechazo determinista en Backend (`HTTP 422 Unprocessable Entity`).
3. **Sincronización Transaccional Explícita en `tequ_equipo`:**
   - Además del trigger de base de datos `fn_sync_equipo_odohoro()`, los controladores/modelos de **Mantenimiento** (`crearOt`, `actualizarMedidoresInicio`, `cerrarOt`, `crearAviso`), **Viajes** (`registrarSalida`, `registrarLlegada`) y **Report Diario** (`guardarInicioJornada`, `guardarReportDiario`) actualizan transaccionalmente `tequ_equipo` mediante `GREATEST(COALESCE(acumulado, 0), nuevo_valor)`, registrando `fecha_ultima_lectura = CURRENT_TIMESTAMP` y `fuente_ultima_lectura`.

---

## 6. Actualización v1.5 (02-Nov-2026 — REQ-1476 / Web v1.0.181 / PWA v1.0.59): Blindaje Incremental Determinista en Backend, Consola Web y PWA
1. **Mantenimiento (`mantenimientoModel.js`, `MantenimientoView.vue`, `TallerOtDetalleView.vue`):**
   - `crearOt` y `actualizarMedidoresInicio` rechazan lecturas de `horometro_grua_inicio`, `horometro_chasis_inicio` u `odometro_inicio` que sean menores al acumulado vigente en `tequ_equipo`.
   - `cerrarOt` valida los 3 medidores (`horometro_cierre >= horometro_inicio`, `horometro_chasis_cierre >= horometro_chasis_inicio`, `odometro_cierre >= odometro_inicio`).
2. **Hoja de Viaje (`viajeModel.js` y `ViajeConductor.vue`):**
   - `getViajePorToken` retorna `odometro_acumulado` y `horometro_chasis_acumulado` de `tequ_equipo` para precargar y validar la salida.
   - `registrarSalida` y `ejecutarInicioViaje` validan que `km_inicial >= odometro_acumulado` y `horometro_inicial >= horometro_chasis_acumulado`, sincronizando `tequ_equipo` con `GREATEST`.
   - `registrarLlegada` y `ejecutarLlegadaFaena` validan estrictamente que `km_final >= km_inicial` y `horometro_final >= horometro_inicial`, sincronizando `tequ_equipo` con `GREATEST`.
3. **Report Diario de Faena (`reportDiarioController.js` y `ReportDiarioIzaje.vue`):**
   - `guardarInicioJornada` valida en cliente y servidor que `horometro_inicio` no sea menor al último horómetro registrado del equipo (`horometro_sugerido` / `horometro_grua_acumulado`).
   - `guardarReportDiario` y `regularizarReporteManual` validan en servidor que `horometro_termino >= horometro_inicio` y actualizan `tequ_equipo.horometro_grua_acumulado = GREATEST(...)`.

---

## 7. Actualización v1.6 (10-Nov-2026 — REQ-1143): Deshabilitación Temporal de Validación Bloqueante de Odómetro Incremental y Saneamiento Preventivo de Flota
1. **Contexto Operativo (Acuerdo Reunión Alfonso Porperrello / Jorge Ponce / Sergio Gajardo):**
   - Múltiples choferes experimentaron bloqueos ("Valor Incremental Inválido") al enviar salidas o llegadas de viaje debido a datos anómalos o irreales acumulados en `tequ_equipo` (ej. mock `99.999.999 km` en equipo 35 y `45.000 km` en alzahombres).
2. **Relajación Temporal en Backend (`reportDiarioController.js` y `viajeModel.js`):**
   - En `guardarJornadaInicio` y `guardarReportDiario`, se desactiva el rechazo HTTP 422 si `odometro_inicio < acumulado` u `odometro_termino < odometro_inicio`, emitiendo una advertencia en logs de servidor (`console.warn`) sin bloquear la persistencia.
   - En `viajeModel.registrarLlegada`, se relaja la excepción de odómetro de llegada menor al de salida.
3. **Relajación Temporal en PWA (`ViajeConductor.vue`):**
   - Se suprime el `return` bloqueante en `ejecutarInicioViaje` y en `ejecutarLlegadaFaena` para comparaciones de odómetro, permitiendo el despacho con valores digitados válidos `>= 0`.
   - Se protege la precarga automática: si `odometro_acumulado > 500.000 km`, no se autocompleta para evitar arrastrar cifras corruptas.
4. **Saneamiento Preventivo en Base de Datos (`tequ_equipo`):**
   - Auditoría SQL y reseteo a `0.00` de odómetros acumulados con valores demo o superiores a `300.000 km` en `sch_leangsp_prod` y `sch_leangsp`.

