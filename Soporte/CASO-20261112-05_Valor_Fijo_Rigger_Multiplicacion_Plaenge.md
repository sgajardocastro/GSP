# CASO-20261112-05: Multiplicación Indebida de Valor Fijo en Carátula EDP e ITS en $0 (Negocio 002 Plaenge)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261112-05`
- **Fecha / Hora:** `2026-11-12 17:15 CLT` (Resuelto y certificado a las `18:40 CLT`)
- **Operador / Usuario Afectado:** Sergio Gajardo (`id_user = 55`) / Control de Gestión (Yiara Mendoza, `id_user = 65`) / Comercial (Jorge Ponce)
- **Negocio / OT:** Negocio `002` — Inversiones Plaenge (`GSP-2611-00002`, `id_proyecto = 31`)
- **Equipo Involucrado:** No Aplica (Servicio de Personal Certificado: Rigger a Valor Fijo)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** **Alta** (distorsión de montos en Carátula EDP, PDF de Estado de Pago y P&L de ITS)

---

## 2. Síntoma Reportado por Terreno / Administración
En el negocio 002 de Inversiones Plaenge, se contrató un Rigger certificado por dos días a un valor cerrado a suma alzada de \$300.000 (`Valor Fijo`). Para fines de control de viáticos y registro en faena, se emitieron 2 reportes diarios manuales.
Al liquidar el Estado de Pago y generar el PDF oficial, el sistema multiplicó el valor acordado de \$300.000 por los 2 días trabajados, arrojando un total liquidado de \$600.000 en el PDF. Simultáneamente, al revisar el Informe de Término de Servicio (ITS), el servicio aparecía con ingreso facturable en \$0 debido a que no registraba orómetros u horas máquina devengadas.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Base de Datos (`sch_leangsp_prod.tpry_proyecto`, `id_proyecto = 31`):**
   - En `json_field.crm_v1.lineas_servicio` y `lineas_operativas_vigentes`, la línea de Rigger tenía `tipo = 'OTROS'`, `unidad = 'Valor Fijo'`, `valorUnitario = 300000`, pero `cantidad = 2`, `subtotal = 600000` y `subtotal_calculado = 600000`.
2. **Lógica de Carátula EDP y Generación de PDF:**
   - Tanto `ModalCaratulaEDP.vue` como `estadoPagoController.js` (`generarPdfEdp`) y `reportDiarioController.js` calculaban el subtotal de líneas no horarias multiplicando `cantidad × valorUnitario` o bien `días_trabajados × valorUnitario`. Al tener `cantidad = 2` y 2 reportes, el PDF liquidaba \$600.000.
3. **Cómputo en ITS (`itsController.js` y `ModalITS.vue`):**
   - El ITS evaluaba únicamente jornadas con desglose horario de turnos (`horas_facturables > 0`). Al ser un servicio de personal a valor alzado sin horas máquina, el ingreso facturable quedaba evaluado en \$0.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Falta de Invariante Estructural para Líneas de Cobro Único:**
   No existía una regla en backend y frontend que obligara a que los servicios bajo modalidad `Valor Fijo` tuvieran de forma fija e inmutable `cantidad = 1`, con `subtotal = valorUnitario`, independientemente del número de días u orómetros reportados para efectos de control operacional o viáticos.
2. **Carencia de Normalización en Generadores de PDF e ITS:**
   Tanto la carátula como el ITS dependían del recuento de jornadas reportadas para acumular montos, en lugar de reconocer el precio cerrado contractual pactado en la cotización.

---

## 5. Plan de Mitigación y Resolución
1. **Creación del Módulo Canónico de Cobro Único (`lineaCobroUnico.js`):**
   Implementación de `isLineaCobroUnico`, `normalizarLineaCobroUnico` y `calcularSubtotalLinea`, garantizando que para cualquier línea de modalidad `Valor Fijo` (o tipo `TRASLADOS`):
   - `cantidad = 1` siempre.
   - `subtotal = valor_unitario` siempre.
2. **Protección en Modelos y Controladores Backend:**
   - En `proyectoModel.js`, normalización obligatoria antes de guardar proyectos y al generar snapshots de cotizaciones/OTs.
   - En `estadoPagoController.js` y `reportDiarioController.js`, forzado de cobro a `1 × valor_unitario` para líneas de cobro único.
   - En `itsController.js`, reconocimiento íntegro del valor pactado en ingresos facturables sin requerir desglose horario.
3. **Blindaje en Frontend:**
   - En `EstructuradorArbolServicios.vue` y `GestorOportunidades.vue`, ocultado el input de cantidad y desplegado de etiqueta "Cobro Único".
   - En `ModalCaratulaEDP.vue` y `ModalITS.vue`, ajuste del subtotal a valor fijo.
4. **Saneamiento en Base de Datos:**
   Actualización atómica en `sch_leangsp_prod.tpry_proyecto` para el proyecto 31 (Plaenge), ajustando `cantidad = 1`, `subtotal = 300000` y `subtotal_calculado = 300000` tras respaldo de seguridad en `_backup_spec128_proyectos`.

---

## 6. Verificación & Certificación
- Validación exitosa en entorno de base de datos verificando `cantidad = 1` y `subtotal = 300000`.
- Certificación de generación de PDF de Estado de Pago cuadrando exactamente en \$300.000 neto.
- Verificación del P&L en ITS reflejando \$300.000 en ingresos facturables.

---

## 7. Referencias & Trazabilidad
- **Especificación Técnica:** [SPEC-128 (`.agents/specs/128_lineas_cobro_unico_valor_fijo_y_traslados_spec.md`)](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/.agents/specs/128_lineas_cobro_unico_valor_fijo_y_traslados_spec.md)
- **Requerimiento Asociado:** `REQ-1166`
- **Versión de Liberación:** `v1.0.223`
- **Tabla de Auditoría:** `sch_leangsp_prod._backup_spec128_proyectos`
