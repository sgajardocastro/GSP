# CASO-20261109-05: Rigger Fantasma en Preventa, Distorsión de Servicios Valor Fijo en ITS/PDF y Violación de Constraint al Guardar (`GSP-2611-00003`)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261109-05`
- **Fecha / Hora:** 2026-11-09 15:35 CLT
- **Operador / Usuario Afectado:** Yiara Mendoza (`id_user = 65`, Control de Gestión) / Jorge Ponce (`jponce@arriendosanpablo.cl`) / Sergio Gajardo (`sgajardoc@gmail.com`)
- **Negocio / OT:** `GSP-2611-00003` (`id_proyecto = 32` — Cliente: Gerard Barthou, Temuco) y `GSP-2611-00001` (`id_proyecto = 30` — Ferrocarriles del Pacífico S.A.)
- **Equipo Involucrado:** Grúa 90 Ton Liebherr LTM-1090 (`PJYY.20-1`, `id_equipo = 45`), Tracto Camión Sinotruk (`RWJL.23-K`, `id_equipo = 79`) y Semirremolque / Rampla (`JC.2796-2`, `id_equipo = 73`)
- **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`)
- **Severidad:** Crítica (Bloqueo de facturación e imposibilidad de guardar liquidación ITS)

---

## 2. Síntoma Reportado por Terreno / Control de Gestión
1. **Línea de Rigger Fantasma en Preventa y PDF:** En oportunidades con switch `"Requiere Rigger: SÍ"` (servicio *"Con Rigger"* incluido sin cobro adicional al cliente), el estructurador comercial inyectaba una línea `"Servicio de Rigger Certificado"` con valor `$0` que al rehidratarse mutaba a `"8 Horas Diarias Mínimas"` y en el PDF del ITS heredaba erróneamente el monto de `$1.000.000` de la grúa.
2. **Distorsión en Servicios a Valor Fijo (Suma Alzada):** En la OT 32 (`GSP-2611-00003`), pactada a `Valor Fijo` por `$1.000.000`, el PDF mostraba `VALOR FIJO: $0`, `HRS MÍNIMAS: 9 HORAS DIARIAS` y `VALOR HORA: $1.000.000`, mientras que la cabecera web del ITS mostraba `Horas Mínimas Base: 1` y `Valor Hora Pactado: $1.000.000`.
3. **Nombres del Personal, Patentes y Exclusión de Ramplas sin Motor en Sección 1 y 2:** La columna `PERSONAL Y CARGO ASIGNADO` imprimía roles genéricos repetidos sin nombres reales, y en los equipos aparecía la rampla/plataforma sin motor `JC.2796-2` (`SR 3M 309 14.2`) en lugar del **Tracto Camión motorizado `RWJL.23-K`** (`C7H 6X4 440 AT EV`) conducido por **Luis Mercado** que posee el **Registro de Viaje (`tequ_log_desplazamiento`)**.
4. **Desacople de Tarifa y Horas de Operador y Ausencia de Glosas de Costos en Sección 3 del PDF:** Tanto en OT 32 (`$15.780` / `$36.000`) como en OT 30 (`$54.000`), la tabla `COSTO VALOR HORA OPERADOR` en la interfaz web mostraba `$6.000/hr` y las horas reales, pero en el PDF imprimía `$0`, y las glosas (`concepto_detalle`) de las demás categorías de costos no aparecían en el PDF ni combinaban `Tipo de Movilización` + `Glosa / Ruta`, además de no permitir editar la `Condición de Movimiento Día` en viáticos de alimentación.
5. **Caída HTTP 500 al Guardar ITS y Re-inyección de Filas Eliminadas:** Al eliminar filas sobrantes de `costo_hora_operador` en la web y pulsar **Guardar**, el backend lanzaba error `500`: `el nuevo registro para la relación «tits_jornada_detalle» viola la restricción «check» «tits_jornada_detalle_tipo_servicio_check»`, y al refrescar la página las filas eliminadas volvían a aparecer.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
- **Inspección de Payload y Base de Datos (`sch_leangsp_prod`):**
  - En `tpry_proyecto` (`id_proyecto = 32`), `json_field->'crm_v1'->'lineas_operativas_vigentes'` contenía una segunda línea `{ tipo: "PERSONAL CERTIFICADO", subcategoria: "RIGGER", pisoMinimo: 8, valorUnitario: 0 }`.
  - La jornada generada para OT 32 viajaba con `"tipo_servicio": "Valor Fijo / Jornada"`, valor no incluido en el constraint `tits_jornada_detalle_tipo_servicio_check` de `tits_jornada_detalle`.

---

## 4. Causa Raíz de Arquitectura (4 Niveles)
1. **Nivel 1 (Origen en Preventa - `GestorOportunidades.vue`):** El watcher `watch(() => opportunity.value.requiere_rigger)` ejecutaba `lines.value.push({ tipo: 'PERSONAL CERTIFICADO', subcategoria: 'RIGGER', ... valorUnitario: 0 })` cuando `newVal === true`, y `cargarDatosCotizacion` convertía `unidad: 'Diario'` en `'Horas Diarias Minimas'` con `pisoMinimo: 8`.
2. **Nivel 2 (Modelo de Proyecto - `proyectoModel.js`):** En `updateProyecto`, `lineas_operativas_vigentes.find(l => Number(l.pisoMinimo) > 0)` saltaba la grúa a Valor Fijo (`pisoMinimo: 0`) y tomaba el `pisoMinimo: 8` de la línea fantasma del Rigger.
3. **Nivel 3 (Controlador ITS y BD - `itsController.js`):**
   - `getITS` asignaba el precio de `Valor Fijo` (`$1.000.000`) a `valorHoraPactado` y forzaba `horasMinimas = 1.0`.
   - `tits_jornada_detalle_tipo_servicio_check` rechazaba `'Valor Fijo / Jornada'`.
   - `getITS` re-ejecutaba `construirPropuestaPersonalDiaria` sobre borradores sin verificar si el usuario ya había guardado y depurado las filas de `costo_hora_operador`.
4. **Nivel 4 (Web ITS `ModalITS.vue` y PDF `itsPdfService.js`):**
   - `itsPdfService.js` leía `r.valor_hora` y `r.horas_report` en vez de `r.precio_unitario` y `r.horas_faena_pagar || r.cantidad_unidades` en la Sección 3, no filtraba líneas de personal `$0` en la Sección 1, y usaba `token_report.slice(0, 16)` como folio de reporte.

---

## 5. Plan de Mitigación y Resolución Aplicado
1. **Preventa (`GestorOportunidades.vue`):** Eliminada la inyección automática de línea comercial de Rigger a `$0` al activar `requiere_rigger` y añadido filtrado automático de líneas fantasma `$0` en `cargarDatosCotizacion`.
2. **Modelo y Controlador (`proyectoModel.js`, `itsController.js`):**
   - Filtrado de `esLineaRiggerFantasma(l)` en snapshots y `lineas_operativas_vigentes`.
   - Separación de `es_valor_fijo` y `valor_fijo_pactado` respecto de `valor_hora_pactado` y `horas_minimas_pactadas`.
   - Actualización del constraint `tits_jornada_detalle_tipo_servicio_check` en `sch_leangsp_prod` y `sch_leangsp` para admitir `'Valor Fijo / Jornada'` y `'Valor Fijo'`.
   - Persistencia de la marca `costos_guardados_usuario` para respetar las eliminaciones manuales de filas en `costo_hora_operador`.
3. **Web ITS (`ModalITS.vue`) y PDF (`itsPdfService.js`):**
   - Incorporación de input dedicado **Valor Fijo Pactado ($)** y badge `"No Aplica (Valor Fijo - 0 hrs)"` en `ModalITS.vue`.
   - Regla determinista de equipos motorizados en `itsController.js` e `itsPdfService.js`: se despliegan exclusivamente los equipos con `Report Diario` (`PJYY.20-1` con Robert Rodríguez y Matías Barrales) y con `Registro de Viaje` (`RWJL.23-K` con Luis Mercado), excluyendo semirremolques/ramplas sin motor (`JC.2796-2`).
   - En `Movilización` (`ModalITS.vue`, `itsController.js`, `itsPdfService.js`): persistencia y visualización simultánea de `Tipo de Movilización` (`UBER / TAXI`, `PASAJE BUS`, etc.) y `Glosa / Ruta` (`ruta_detalle`).
   - En `Viáticos de Alimentación` (`ModalITS.vue`, `itsController.js`, `itsPdfService.js`): conversión de la columna `Condición Movimiento Día` en un campo editable con `<datalist>` que se persiste en `tits_costo_operacional.concepto_detalle` y se imprime en el PDF.
   - En `Registros de Viaje` y `Hora Operador`: inclusión de `tipo_viaje` y `comentario_viaje` en las filas de `Registro de Viaje` (Web y PDF), y blindaje del rol `RIGGER` (`$0`) para Matías Barrales.
   - En `itsPdfService.js`: `TIPO DE SERVICIO: SERVICIO VALOR FIJO (SUMA ALZADA)`, `VALOR FIJO: $1.000.000`, `HRS MÍNIMAS: NO APLICA (VALOR FIJO)`, `VALOR HORA: — (VALOR FIJO)`, formato reloj `hh:mm` en todas las columnas y totales de jornadas (`02:38`, `03:40`, `07:21`), y visualización de `concepto_detalle` en las 10 categorías de costos operacionales.

---

## 6. Protocolo de Respuesta y Guía al Usuario
- Se informa a Control de Gestión (Yiara Mendoza) y Jefatura (Jorge Ponce) que pueden refrescar la consola web, eliminar las filas de hora operador que no correspondan, guardar el ITS de la OT 32 (`GSP-2611-00003`) y emitir el PDF definitivo para facturación.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Prohibición de Líneas Comerciales Ficticias para Flags Operativos:** Los requisitos de tripulación incluidos en la tarifa base (`requiere_rigger = true`) jamás deben materializarse como líneas comerciales a `$0` dentro de `lineas_servicio`.
- **Alineación Estricta entre Catálogos de Frontend/Controlador y Constraints CHECK de BD:** Toda modalidad de servicio generada por `itsController.js` debe estar formalmente declarada en el constraint DDL de `tits_jornada_detalle`.
