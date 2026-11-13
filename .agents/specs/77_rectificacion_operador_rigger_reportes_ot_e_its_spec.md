# 🛡️ SPEC-077: Mecanismo Integral de Rectificación y Reemplazo de Operador y Rigger en Reportes Diarios, OT e ITS

**Estado:** APROBADO PARA IMPLEMENTACIÓN  
**Fecha:** 14 de Octubre de 2026  
**Requerimientos Asociados:** `REQ-1043`  
**Módulos Impactados:**
- Backend: `reportDiarioController.js`, `operacionesRoutes.js`, `itsController.js`
- Frontend Web: `ModalVisorReport.vue`, `GestorOportunidades.vue`, `ItsTransicionView.vue`

---

## 1. Contexto y Problema de Negocio (Caso Tensacon)
En la operación real de Grúas San Pablo ocurren dos situaciones frecuentes con la tripulación asignada (**Operador** y **Rigger**):
1. **Corrección de Error Humano en Asignación:** Se asignó por error a un trabajador en la OT (ej. *Claudio Canío* en lugar de *José Regad* en un servicio de Tensacon) y los reportes diarios, controles o borradores de ITS ya fueron iniciados o validados con el nombre equivocado.
2. **Reemplazo / Relevo por Fecha en Terreno:** Durante un servicio multi-día, un Operador o Rigger ejecuta los primeros días y otro trabajador lo releva en fechas específicas.

Anteriormente, las llaves foráneas `id_user_operador` e `id_user_rigger` en `tedp_reporte_avance`, el documento PDF compilado (`id_doc_pdf`) y el snapshot en `tits_transicion_historial` quedaban congelados, impidiendo rectificar el nombre en reportes ya generados.

---

## 2. Arquitectura de la Solución (3 Niveles)

### 2.1. Nivel 1: Rectificación Granular por Reporte / Día (`ModalVisorReport.vue` & `validarReportDiario`)
1. **Desbloqueo de Edición en Torre de Control (`GestorOportunidades.vue`):**
   - El componente `<ModalVisorReport>` invocado en el Sub-tab 6 (`Ejecución & Reports`) pasa de `:readonly="true"` a `:readonly="false"` para permitir la auditoría y rectificación directa.
2. **Selectores de Tripulación en Modo Edición (`ModalVisorReport.vue`):**
   - Al activar `✏️ Editar Datos Terreno` (`modoAjuste = true`), las celdas de **👷 Operador Asignado** y **🦺 Rigger / Asistente** se convierten en selectores `<select>` poblados desde `/servicio/leanglobal/obtenerUsuarios`.
   - El bloque de **🦺 Rigger / Asistente** es siempre visible en `modoAjuste` (incluso si el reporte se originó sin Rigger), permitiendo asignar un Rigger omitido o quitar uno asignado por error (`Sin Rigger`).
   - `formAjustes` incorpora `id_user_operador` y `id_user_rigger`.
   - `hayModificaciones` detecta cambios en `id_user_operador` o `id_user_rigger` respecto a los valores originales del reporte.
3. **Persistencia, Trazabilidad y Re-Compilación de PDF (`reportDiarioController.validarReportDiario`):**
   - El endpoint `POST /api/operaciones/report/:id/validar` recibe `ajustes.id_user_operador` y `ajustes.id_user_rigger`.
   - Registra en `ajustes_analista.valores_originales` y `ajustes_analista.valores_ajustados` los IDs y nombres completos (`operador_nombre`, `rigger_nombre`) antes y después del ajuste.
   - Actualiza las columnas `id_user_operador` e `id_user_rigger` en `tedp_reporte_avance`.
   - Consulta en `tsec_users` los nombres actualizados (`op_nombre`, `op_apellido`, `rig_nombre`, `rig_apellido`) y **regenera obligatoriamente el PDF oficial (`id_doc_pdf`)** mediante `generarPdfReportDiario`, actualizando la referencia en `tedp_reporte_avance.id_doc_pdf` y en `tpry_proyecto.json_field.dossier_documentos`.

---

### 2.2. Nivel 2: Propagación Retroactiva por Lote o Fecha desde la OT (`Sub-tab 2`)
1. **Endpoint de Rectificación Masiva / Por Fecha (`POST /api/operaciones/report/proyecto/:id_proyecto/rectificar-tripulacion`):**
   - Recibe:
     ```json
     {
       "id_equipo": 12,
       "id_user_operador": 45,
       "id_user_rigger": 67,
       "fecha_desde": "2026-10-10",
       "fecha_hasta": null,
       "motivo": "Rectificación de asignación OT"
     }
     ```
   - Actualiza `id_user_operador` e `id_user_rigger` en `tedp_reporte_avance` para el proyecto y equipo indicados (filtrando por `fecha_reporte >= fecha_desde` y `<= fecha_hasta` si se especifican).
   - Actualiza `id_user_chofer` en `tequ_log_desplazamiento` del equipo correspondiente.
   - Reemplaza limpiamente la asignación activa en `tpry_rel_persona` para evitar duplicidad de registros históricos obsoletos.
   - Para cada reporte en estado `VALIDADO_ANALISTA` afectado por el cambio, **re-compila automáticamente su PDF oficial (`id_doc_pdf`)** con los nombres corregidos y actualiza el Dossier de la OT.
2. **Integración en `guardarCambiosAsignacion` (`GestorOportunidades.vue`):**
   - Cuando el usuario guarda cambios de asignación en `Sub-tab 2` y existen reportes o viajes ya registrados para el proyecto, el sistema ofrece propagar el nuevo Operador/Rigger a los reportes existentes (todos los reportes de la OT o a partir de una fecha específica) e invoca el endpoint de rectificación.
3. **Ordenamiento Determinista en `getReportContexto`:**
   - La consulta de fallback a `tpry_rel_persona` para Rigger y Operador ordena explícitamente por `id_rel_persona DESC LIMIT 1` para garantizar que siempre tome la última reasignación vigente.

---

### 2.3. Nivel 3: Sincronización y Edición de Tripulación en ITS (Nativo y Transición)
1. **ITS Nativo (`itsController.js`):**
   - Al inicializar o sincronizar los costos de mano de obra (`tits_costo_operacional`), se eliminan nombres estáticos por defecto y se leen los Operadores y Riggers reales desde `tedp_reporte_avance` y `tpry_rel_persona`.
2. **ITS Transición (`ItsTransicionView.vue`):**
   - En la sección de Tripulación / Mano de Obra, se habilita la edición directa del nombre del Operador y Rigger y un botón `🔄 Sincronizar Tripulación` para refrescar los nombres desde las planillas/OT sin perder el resto del borrador guardado en `tits_transicion_historial`.
