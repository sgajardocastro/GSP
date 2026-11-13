# Ficha de Caso de Soporte: CASO-20261104-03

## 1. Identificación del Incidente
- **Código:** CASO-20261104-03
- **Fecha:** 2026-11-04
- **Proyecto Involucrado:** `GSP-2611-00012` (`id_proyecto = 44`, `PORTAL TEMUCO`)
- **Usuario Afectado / Reportante:** Jonatan Castillo
- **Severidad:** Crítica (Bloqueo operacional de reverso a preventa comercial)
- **Estado:** RESUELTO

---

## 2. Síntoma Reportado por el Usuario
Jonatan Castillo tiene el servicio `00012` en etapa de **Ejecución**, intenta devolverlo a **Preventa Comercial** ingresando el comentario de motivo en el modal correspondiente. El sistema le indica que la operación fue exitosa y lo posiciona visualmente en Preventa; sin embargo:
1. Al intentar volver al Kanban, la interfaz le advierte que tiene cambios sin guardar.
2. Al presionar "Guardar en Preventa" y volver al Kanban, el servicio continúa posicionado en la columna **En Ejecución** (`id_proyecto_estado = 5`).

---

## 3. Causa Raíz Técnica
1. **Colisión del Candado Anti-Regresión con `reversarACotizacion`:**
   En la versión `v1.0.195` se implementó un candado en `proyectoModel.js` (`updateProyecto`) para evitar que pestañas obsoletas de CRM retrocedieran estados avanzados (`estadoEntrante < estadoDB`). No obstante, el controlador oficial `reversarACotizacion` invoca internamente `proyecto.updateProyecto(id, mergedPayload)` sin suministrar un flag de bypass explícito (`allowStateRegression: true`). Al recibir `id_proyecto_estado = 2`, el candado interceptó el guardado, preservó `id_proyecto_estado = 5` en base de datos y retornó HTTP 200.
2. **Reactivación asíncrona de `isDirty` en el Frontend:**
   En `GestorOportunidades.vue`, dentro de `confirmarReversoACotizacion`, se seteaba `isDirty.value = false` inmediatamente antes de mutar `opportunity.value.id_proyecto_estado = ESTADOS_DB.COTIZANDO`. Dicha mutación disparaba el watcher profundo de Vue en el siguiente tick, reactivando `isDirty.value = true` y gatillando la alerta de "cambios sin guardar" al pulsar "Volver al Kanban".
3. **Persistencia del Bloqueo en Guardado Manual:**
   Al presionar "Guardar en Preventa" manualmente (`PUT /api/proyectos/:id`), como el registro en base de datos seguía en estado 5, el candado volvía a rechazar la regresión a estado 2.

---

## 4. Solución Aplicada
1. **Backend (`proyectosController.js`):**
   Se añadió `allowStateRegression: true` en el payload construido por `reversarACotizacion`.
2. **Modelo Backend (`proyectoModel.js`):**
   Se condicionó el bloqueo anti-regresión para respetar `data.allowStateRegression === true`. Asimismo, se permitió que las banderas de régimen operacional se limpien limpiamente durante una devolución autorizada.
3. **Frontend (`GestorOportunidades.vue`):**
   Se reestructuró `confirmarReversoACotizacion` para mutar el estado, aguardar `await nextTick()`, actualizar `initialSnapshot.value` y随后 limpiar `isDirty` e `isDirtyAsignacion`.
4. **Base de Datos (`sch_leangsp_prod`):**
   Se actualizó de forma atómica el registro del proyecto `44` (`GSP-2611-00012`) a `id_proyecto_estado = 2` y se reiniciaron los servicios PM2 en producción.

---

## 5. Archivos Intervenidos
- `ejecucion/backend_remoto/src/controllers/proyectosController.js`
- `ejecucion/backend_remoto/src/models/proyectoModel.js`
- `ejecucion/frontend/src/views/CRM/GestorOportunidades.vue`
- Base de datos: `sch_leangsp_prod.tpry_proyecto`

---

## 6. Verificación y Resultados
- Consulta SQL directa confirmó `id_proyecto_estado = 2` para `GSP-2611-00012` en `sch_leangsp_prod`.
- PM2 de producción (`lean-services-gsp-prod`, id 13) y desarrollo (id 10) reiniciados y operativos.
- Frontend compilado y desplegado en `/var/www/html/lg-gsp-prod`.

---

## 7. Lecciones Aprendidas y Medidas Preventivas
- Toda regla transversal de inmutabilidad o bloqueo de transiciones de estado en la capa modelo debe contemplar mecanismos explícitos de delegación (`allowStateRegression`) para endpoints transaccionales debidamente auditados (como reversos, anulaciones o reaperturas).
