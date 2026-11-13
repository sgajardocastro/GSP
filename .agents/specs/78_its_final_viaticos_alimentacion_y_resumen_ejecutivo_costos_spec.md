# SPEC-078: Precálculo Automático Día a Día de Liquidación de Personal (Hora Operador y Viático Alimentación) desde Report Diario, Traspaso al ITS y Resumen Ejecutivo

- **ID Requerimiento:** `REQ-1040`, `REQ-1041`, `REQ-1042`, `REQ-1043`, `REQ-1079`, `REQ-1081`
- **Fecha Actualización:** 2026-10-28
- **Estado:** APROBADO E IMPLEMENTADO EN PRODUCCIÓN (`v1.0.170`)
- **Tablas PostgreSQL (`sch_leangsp` & `sch_leangsp_prod`):**
  - `tpar_tarifa_operador` (Tabla paramétrica maestra de 19 categorías de valor hora operador)
  - `tequ_log_desplazamiento` (Registros de viaje de ida y retorno)
  - `tedp_reporte_avance` (Reportes diarios de operación en terreno con `ajustes_analista.liquidacion_personal_dia`)
  - `tits_informe_termino`, `tits_jornada_detalle`, `tits_costo_operacional`
- **Módulos Afectados:**
  - `ejecucion/backend_remoto/src/services/tarifasOperadorService.js`
  - `ejecucion/backend_remoto/src/controllers/reportDiarioController.js`
  - `ejecucion/frontend/src/components/Operaciones/ModalVisorReport.vue`
  - `ejecucion/backend_remoto/src/controllers/itsController.js`
  - `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`
  - `ejecucion/backend_remoto/src/services/itsPdfService.js`
  - `ejecucion/frontend/public/proceso_financiero_integral_y_protocolo_pruebas_gsp.html`, `ejecucion/frontend/public/manual_contabilidad_edp_y_facturacion_gsp.html` y `ejecucion/frontend/public/centro_documentacion_gsp.html` (Documentación Web del Sistema)

## 1. Origen de Tiempos Reales y Consolidación Diaria por Movimiento

1. **Prohibición de Valores Fijos y Datos en Duro:**
   - Queda estrictamente prohibido utilizar horarios fijos (`08:30`, `19:00`) o personas/patentes por defecto (`JORGE PONCE`, `VCTR.81-9`) en `itsController.js` y `ModalITS.vue`.
2. **Cruce Relacional por Día de Movimiento (Sección 2 y Sección 3):**
   - Cada día en que exista movimiento del equipo (**Registro de Viaje** en `tequ_log_desplazamiento` y/o **Report Diario** en `tedp_reporte_avance`) consolida un registro diario auditable:
     - `Salida` (planta GSP): `fecha_salida_patio` desde `tequ_log_desplazamiento` (trayecto `IDA` o `IDA_Y_VUELTA`).
     - `Llegada` (a obra): `fecha_llegada_faena` desde `tequ_log_desplazamiento`.
     - `Inicio` y `Término` (operación en obra): `fecha_inicio_servicio` (`hora_inicio`) y `fecha_termino_servicio` (`hora_termino`) desde `tedp_reporte_avance` (respetando `ajustes_analista` cuando hayan sido validados).
     - `Retorno` (llegada a planta GSP): `fecha_llegada_patio` desde `tequ_log_desplazamiento` (trayecto `RETORNO` o `IDA_Y_VUELTA`).
     - `Colación`: valor exacto registrado en `tedp_reporte_avance.horas_colacion` (respetando `0` cuando el report informa `0`, sin forzar 60 minutos).
     - `Stand By San Pablo`: `tedp_reporte_avance.horas_standby_gsp`.
     - `Stand By Cliente`: `tedp_reporte_avance.horas_standby_cliente`.

## 2. Reglas de la Pestaña `Hora Operador` (`costo_hora_operador`)

- **ID Requerimiento:** `REQ-1042`, `REQ-1043`, `REQ-1079`
- **Fuente Oficial de Tarifas en BD:** Tabla PostgreSQL `tpar_tarifa_operador` (`sch_leangsp` / `sch_leangsp_prod`)

### 2.1 Consolidación Diaria por Persona (Operador y Rigger)
1. **Filas Precalculadas por Día de Movimiento:**
   - Por cada día de movimiento y equipo, el sistema genera automáticamente un registro diario para el **Operador** (`id_user_operador`) y, cuando el equipo cuenta con Rigger en el report, un registro diario para el **Rigger** (`id_user_rigger`).
   - **Regla del Rigger:** El Rigger tiene sueldo fijo y **no tiene costo por hora asociado en el ITS** (`precio_unitario = 0`, `monto_total = 0`, etiqueta `No aplica ($0)`), pero se incluye obligatoriamente en la tabla con todos sus tiempos diarios consolidados para análisis posterior de **Contabilidad y RRHH** (evaluación de horas e incentivos).
2. **Columnas Desplegadas por Registro Diario:**
   - `Fecha`, `Equipo (Patente)`, `Persona / Rol` (`Operador` o `Rigger`), `Salida`, `Llegada`, `Término`, `Retorno`, `Colación`, `Hrs Reales Equipo`, `SB San Pablo`, `SB Cliente`, `Hrs a Pagar` (o `Hrs Medidas` para Rigger), `Hrs Flete`, `Valor Hora ($)`, `Total Costo ($)`, `V°B°`, `Acción`.
3. **Reglas de Colación, Stand By y Cálculo de Horas:**
   - **Colación:** **No se paga** ni como hora de servicio ni como viático; se descuenta siempre según el tiempo real informado en el report.
   - **Stand By:** **Sí se paga al trabajador independientemente de quién lo genere (Cliente o GSP)**. Ambas columnas se muestran para auditoría sin descontarse de las horas a pagar.
   - **Régimen Urbano ($\le 30\text{ km}$):** $\text{Hrs a Pagar} = \max(0, (\text{Término} - \text{Salida}) - \text{Colación})$, con $\text{Hrs Flete} = 0$.
   - **Régimen Rural ($> 30\text{ km}$):**
     - $\text{Hrs Faena} = \max(\text{Mínimo Cotizado}, (\text{Término} - \text{Llegada}) - \text{Colación})$.
     - $\text{Hrs Flete} = \max(0, (\text{Retorno} - \text{Salida}) - \text{Colación} - \text{Hrs Faena})$.

### 2.2 Tabla PostgreSQL `tpar_tarifa_operador` (19 Categorías Maestras) y Criterio Comercial Mandante
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

- **Manda el Criterio Comercial (Tonelaje Cotizado en Venta):** El valor hora del Operador se resuelve desde `tpar_tarifa_operador` en función del **equipo/tonelaje comprometido comercialmente en la venta (`crm_v1.lineas_servicio`)**, y **no** por la grúa física enviada a terreno por restricción operacional (ejemplo: si se vendió una grúa de 70T y se envió una de 140T, se liquida a tarifa de 70T = `$6.000/hr`).
- **Tarifa de Traslado Idéntica:** Las horas de traslado/flete del operador se liquidan exactamente al mismo valor hora determinado para el servicio.

## 3. Reglas de la Pestaña `Viático Alimentación` (`alimentacion` — Precalculada Día a Día)

1. **Consolidación Diaria por Persona (Operador y Rigger):**
   - Tanto el **Operador** como el **Rigger** reciben viático de alimentación. El sistema presenta la pestaña `Viático Alimentación` precalculada por defecto con un registro por cada día de movimiento y persona.
   - **No se modifica en absoluto la pestaña `Pensiones`**.
2. **Cálculo de Horas Reales Efectivas (Independiente del Flete, Descontando Colación del Report):**
   - **Equipo sale y retorna en el mismo día:** $(\text{Retorno a planta} - \text{Salida de planta}) - \text{Colación}$.
   - **Día de salida (equipo queda en obra varios días):** $(\text{Término en obra} - \text{Salida de planta}) - \text{Colación}$.
   - **Día intermedio (equipo permanece en obra):** $(\text{Término en obra} - \text{Inicio en obra}) - \text{Colación}$.
   - **Día de retorno (equipo regresa desde obra a planta):** Tiempo en obra + desplazamiento de retorno = $(\text{Retorno a planta} - \text{Inicio en obra}) - \text{Colación}$.
   - **Redondeo:** Las fracciones sobre las horas efectivas se redondean al entero (`Math.round(horasEfectivas)`).
3. **Umbral Mínimo de 8 Horas Reales y Escala Tabular Diaria:**
   - **Menos de 8 horas reales efectivas ($\text{round}(\text{horasEfectivas}) < 8$):** **No se paga viático (`$0`)**. Cuando el servicio y viaje duran menos del mínimo de 8 horas reales (con o sin viaje según corresponda, descontada colación), no devenga viático.
   - **Desde 8 horas reales efectivas ($\text{round}(\text{horasEfectivas}) \ge 8$):**
     - **8 horas reales:** **$7.000** base.
     - **Cada hora adicional sobre 8 horas:** **+$1.000 adicionales por hora**.
     - **Tope máximo diario:** **$18.000** (alcanzado a las 19 horas reales).
     - Fórmula: $\text{Viático} = \text{horasRedondeadas} < 8 \;?\; 0 \;:\; \min\left(18000,\; 7000 + (\text{horasRedondeadas} - 8) \times 1000\right)$.
4. **Columnas Desplegadas en `Viático Alimentación`:**
   - `Fecha`, `Equipo (Patente)`, `Persona / Rol`, `Condición Día` (`Ida y Regreso`, `Salida a Obra`, `Permanencia en Obra`, `Retorno a Planta`), `Desde`, `Hasta`, `Colación`, `Hrs Efectivas`, `Monto Viático ($)`, `V°B°`, `Acción`.

## 4. Anticipación en el Report Diario, Traspaso al ITS, Resumen Ejecutivo y Documentación Web (`REQ-1081`)

1. **Verificación Anticipada en cada Report Diario (`ModalVisorReport.vue` / `reportDiarioController.js`):**
   - El cálculo y verificación de `Hora Operador`, `Rigger` y `Viático Alimentación` se ejecuta en tiempo real dentro de cada **Report Diario** (Sección 3 del Visor de Report) al momento en que Yiara valida el report con su PIN FES (SLA: antes de las 13:00 hrs del día hábil siguiente), persistiendo los montos y horas verificadas en `tedp_reporte_avance.ajustes_analista.liquidacion_personal_dia` (`validado_rrhh: true`).
   - Esto habilita que **RRHH / Remuneraciones (Tesalia Malatesta)** liquide las remuneraciones el último día de cada mes directamente desde los Reports Diarios validados, sin bloquearse cuando un servicio multi-día continúa en el mes siguiente y su ITS aún no ha concluido.
2. **Traspaso Automático al ITS y Edición por Excepción con Trazabilidad (`✓ Report` / `V°B°`):**
   - Al abrir el ITS (`itsController.js` / `ModalITS.vue`), las pestañas `Hora Operador` y `Viático Alimentación` reciben automáticamente las horas, tarifas y viáticos ya verificados en los Reports Diarios (`liquidacion_report`), mostrando el distintivo esmeralda **`✓ Report`**.
   - Los valores permanecen editables en el ITS solo por excepción: si Yiara edita un valor en el ITS, el sistema preserva el cambio sin sobreescribirlo en recargas posteriores y activa `tarifa_modificada: true`, `tarifa_sugerida: <valor_original>`, `modificado_por: 'Yara'`, mostrando el badge ámbar `⚠️ Modificado`.
3. **Apertura Detallada del Resumen Ejecutivo (`ModalITS.vue` Sección 4 e `itsPdfService.js`):**
   - Muestra el desglose línea por línea de las 10 categorías de costos operacionales con su **Monto ($)** y **`% s/ Venta`**.
4. **Documentación Web del Sistema:**
   - Se incorpora la especificación operativa, la verificación anticipada en el Report Diario, el traspaso al ITS, el criterio comercial de `tpar_tarifa_operador`, el registro de horas de Rigger para RRHH/Contabilidad y la escala tabular de Viático Alimentación en la documentación interactiva del sistema (`proceso_financiero_integral_y_protocolo_pruebas_gsp.html`, `manual_contabilidad_edp_y_facturacion_gsp.html`, `manual_perspectiva_contabilidad_bi_y_facturacion_gsp.html` y `centro_documentacion_gsp.html`).

## 5. Prioridad de Horas Validadas, Retorno a Planta y Suma Reactiva Manual en ITS (`REQ-1117`)

1. **Prioridad Determinista de Horarios Validados sobre Marcaciones Crudas:**
   - En `itsController.js`, al consolidar `movimientosDiarios` y reconciliar borradores ITS, los horarios validados por Operaciones en el Report Diario (`ajustes_analista.valores_ajustados` y `ajustes_analista.liquidacion_personal_dia`) y los overrides de Torre de Control (`control_vivo_overrides`) tienen prioridad estricta sobre la marcación GPS cruda del chofer/operador, manteniendo el `TO_CHAR` local de PostgreSQL sin desfase horario.
2. **Resolución Integral de `hora_retorno`:**
   - `hora_retorno` se resuelve evaluando en orden: `ajustes_analista.valores_ajustados.hora_llegada_base`, `ajustes_analista.hora_retorno`, `control_vivo_overrides[fecha][idEq].LLEGADA_BASE.hora_real`, `ret.hora_llegada_patio`, `control_vivo_overrides[fecha][idEq].VIAJE_RETORNO.hora_real` y `ret.hora_salida_faena`.
3. **Suma Reactiva en Edición e Inserción Manual (`ModalITS.vue`):**
   - Al editar horarios en la tabla de Jornadas (Sección 2), se recalcula reactivamente `horas_reales`; en filas manuales (`!j.id_reporte_avance`) se iguala `horas_report = horas_reales`, mientras que en filas vinculadas a un Report validado nunca se reduce `horas_report` por debajo del mínimo facturable validado. En la pestaña `Hora Operador` (Sección 3), se habilita la edición reactiva de horarios y `Hrs Flete` (`horas_flete_pagar`), sumando automáticamente `horas_faena_pagar + horas_flete_pagar` en `cantidad_unidades` y `monto_total`, y preservando filas manuales en `itsController.js`.
4. **Formato de Visualización de Horas en Reloj `HH:mm` (`REQ-1121`):**
   - Todas las duraciones y sumatorias de horas en `ModalITS.vue`, `ItsTransicionView.vue`, `ModalVisorReport.vue` e `itsPdfService.js` se despliegan en formato sexagesimal `HH:mm` (`formatHorasHHMM(val)`, ej.: `5.5` $\rightarrow$ `05:30 hrs`, `9` $\rightarrow$ `09:00 hrs`), manteniendo el valor numérico decimal exacto para los cálculos matemáticos de tarifas y subtotales.

## 6. Marcador Urbano/Rural, Columnas `HRS SERVICIO` y `HRS VIÁTICOS`, y Paridad Web-PDF en ITS Real (`REQ-1124`)

1. **Marcador de Régimen Comercial en Encabezado de Sección 2 (`ModalITS.vue` e `itsPdfService.js`):**
   - Al lado del badge `[ # Jornadas Activas ]` en la Sección 2 de `ModalITS.vue` (y en el título de la Sección 3 del PDF), se despliega el marcador explícito **`Servicio Urbano`** (`tipo_contexto = 'URBANO'`) o **`Servicio Rural`** (`tipo_contexto = 'RURAL'`).
2. **Columna `HRS SERVICIO` (reemplaza `HRS REALES`) según Política Comercial Urbano vs. Rural:**
   - **Servicio Urbano (`tipo_contexto === 'URBANO'`):** Se calcula desde **`SALIDA` (Salida de Planta San Pablo)** hasta **`TÉRMINO` (Término de faena en obra)** menos **`COLACIÓN`**, con precisión de 2 decimales (`.toFixed(2)`) para preservar el minuto exacto en reloj `HH:mm` (ej. `GSP-2611-00001`: `13:00 - 07:30 - 0m = 05:30 hrs` / `5.50` hrs).
   - **Servicio Rural (`tipo_contexto === 'RURAL'`):** Se calcula desde **`LLEGADA` (Llegada a obra)** hasta **`TÉRMINO` (Término de faena en obra)** menos **`COLACIÓN`**.
3. **Nueva Columna `HRS VIÁTICOS` (Política Puerta a Puerta Universal):**
   - Independientemente de si el servicio es Urbano o Rural, se incorpora la columna **`HRS VIÁTICOS`** entre `HRS SERVICIO` y `HRS REPORT`, calculada desde **`SALIDA` (Salida de Planta San Pablo)** hasta **`RETORNO` (Retorno a Planta San Pablo)** menos **`COLACIÓN`** (ej. `GSP-2611-00001`: `13:51 - 07:30 - 0m = 06:21 hrs` / `6.35` hrs).
4. **Paridad Exacta en el PDF Oficial del ITS (`itsPdfService.js`):**
   - Se corrige la evaluación de `colacion_minutos` (`j.colacion_minutos !== null && j.colacion_minutos !== undefined ? Number(j.colacion_minutos) : 0`) eliminando el fallback erróneo `|| 60` cuando la colación es `0m`.
   - Se normalizan las horas de hitos a formato `HH:mm` (sin `:00` de segundos) y se incorpora la columna **`RETORNO`** después de `TÉRMINO`, junto con las columnas **`HRS SERVICIO`** y **`HRS VIÁTICOS`** y sus respectivos subtotales en la Sección 3 y Anexo 7 del PDF.


