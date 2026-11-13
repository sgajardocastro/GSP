# CASO-20261112-03: Persistencia de Horas a Facturar en PDF/Visor y Segmentación de Observaciones de Validación vs Observaciones para Mandante (Caso 005 Besalco)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261112-03`
- **Fecha / Hora:** 2026-11-12 12:20:00 CLT (-03:00)
- **Operador / Usuario Afectado:** Yara Mendoza (Analista de Control de Gestión / Contabilidad), Alfonso Porperrello (Jefe de Operaciones), Claudio Alexi Gallardo (Operador)
- **Negocio / OT:** `GSP-2611-00007` (Planta Ferrero - Fundo Caracas / Día 1 #20) y `GSP-2611-00005` (Caso 005 Besalco - Día 09-11-2026)
- **Equipo Involucrado:** Flota General (Grúas Móviles Telescópicas, Camiones Pluma)
- **Ambiente:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Severidad:** Alta (Inconsistencia en montos facturables en PDF oficial del cliente y mezcla de notas internas con observaciones al mandante)

---

## 2. Síntoma Reportado por Terreno / Gestión
1. **Descarte de Horas Facturables Manuales en PDF y Visor:**
   - La analista de gestión edita las "Horas a Facturar" en el Visor de Report Diario Digital (`ModalVisorReport.vue`) y guarda ajustes mediante certificación FES con PIN de 4 dígitos.
   - Sin embargo, el PDF Oficial emitido continúa mostrando el cálculo automático de terreno ignorando el ajuste manual.
   - Al volver de la previsualización del PDF o recargar el reporte, la tarjeta del visor modal revierte el valor manual y vuelve a mostrar las horas anteriores.
2. **Caso 005 Besalco (Día 09-11-2026):**
   - Se acordó contractualmente un piso mínimo de 8.0 horas, pero debido a un pinchazo que detuvo la faena operativa hasta las 13:00 hrs, el total facturable convenido con el mandante fue de 5.0 horas.
   - El sistema no contaba con un espacio diferenciado para que la analista incorpore las observaciones destinadas al cliente en el PDF sin exponer las justificaciones internas de auditoría y contabilidad.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Causa Raíz en Servicio PDF (`reportDiarioPdfService.js` L130):**
   - En contratos con modalidad mensual o sin mínimo diario (`esSinMinimoDiario = true`), la plantilla PDF ejecutaba:
     `const horasFacturables = esSinMinimoDiario ? horasOperadas : Number(report.horas_facturables || horasOperadas).toFixed(1);`
     lo que forzaba las horas operadas en terreno y descartaba silenciosamente cualquier ajuste manual en `report.horas_facturables` o `report.ajustes_analista`.
2. **Causa Raíz en Visor Modal (`ModalVisorReport.vue` L2053):**
   - La propiedad computada `horasFacturablesCalculadas` solo retornaba `formAjustes.value.horas_facturables` si `modoAjuste.value` era `true`.
   - Al guardar con PIN FES o al abrir el reporte en modo lectura/validado, `modoAjuste.value` pasa a `false`, disparando el fallback `Math.max(baseMinima, horasComputablesCliente)` que recalculaba automáticamente las horas de faena y borraba de la pantalla el valor ajustado.
3. **Carencia de Segmentación de Observaciones:**
   - Solo existía el campo `obs_validador`, el cual se utilizaba indistintamente para auditoría interna FES y no existía un canal específico para redactar notas dirigidas al mandante en el segmento *"4. Detalle de Maniobras de Izaje & Observaciones"*.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
- **Falta de Precedencia Jerárquica en Motor PDF:** El servicio PDF no consultaba la propiedad `ajustes_analista.valores_ajustados.horas_facturables`, priorizando en su lugar la condición `esSinMinimoDiario ? horasOperadas : ...`.
- **Desacople de Estado en Frontend:** El visor modal dependía exclusivamente de la bandera volátil `modoAjuste` en lugar de verificar la presencia de un ajuste manual consolidado en el objeto del reporte (`reportLocal.value.ajustes_analista?.valores_ajustados?.horas_facturables ?? reportLocal.value.horas_facturables`).
- **Inexistencia de Campo Dual de Observaciones:** Ausencia de persistencia y renderizado para `observaciones_cliente` independiente de `obs_validador`.

---

## 5. Plan de Mitigación y Resolución
1. **Servicio PDF (`reportDiarioPdfService.js`):**
   - Evaluación prioritaria de `report.ajustes_analista?.valores_ajustados?.horas_facturables ?? report.horas_facturables`.
   - Inyección en la Sección 4 (*"4. Detalle de Maniobras de Izaje & Observaciones"*) del bloque *"Observaciones para el Mandante / Control de Gestión"* cuando `observaciones_cliente` esté presente.
2. **Visor Modal (`ModalVisorReport.vue`):**
   - Modificación de `horasFacturablesCalculadas` para priorizar el ajuste manual persistido tanto en modo edición como en modo lectura/validado.
   - Creación del nuevo campo *"Observaciones para el Cliente (Visible en PDF Oficial)"* debajo de las notas de validación interna.
   - Actualización de los comparadores de modificación (`esHorasFacturablesModificadas`, `esObservacionesClienteModificadas`) y sincronización tras la respuesta HTTP de validación con PIN FES.
3. **Controlador Backend (`reportDiarioController.js`):**
   - Inclusión de `observaciones_cliente` en el payload de validación FES, almacenamiento en `ajustes_analista` y paso directo al buffer del generador de PDF.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- Para ajustar las horas a facturar (por ejemplo en el caso de 5.0 hrs por pinchazo en Besalco con mínimo pactado de 8.0 hrs):
  1. Abrir el Report Diario desde el Cockpit PMO.
  2. En la tarjeta "💰 A Facturar", ingresar `5.0`.
  3. En la tarjeta "Control de Gestión / Auditoría FES", ingresar la justificación interna en el primer campo y la nota para el cliente en el campo "Observaciones para el Cliente (Visible en PDF Oficial)".
  4. Presionar "Guardar Ajustes con PIN FES" e ingresar los 4 dígitos.
  5. El visor mantendrá visible `05:00 HRS` y el PDF Oficial generado desplegará las 5.0 hrs y la nota aclaratoria en la Sección 4 sin exponer notas internas.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Inmutabilidad y Respeto a Ajustes de Gestión:** Toda regla de cálculo automático debe subordinarse siempre al override explícito validado por Control de Gestión cuando este exista en `ajustes_analista`.
- **Privacidad y Segregación de Notas:** Nunca mezclar la bitácora interna de auditoría o justificación FES con las notas comerciales o técnicas destinadas a la contraparte mandante.
