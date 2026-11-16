# 🛠️ Caso de Soporte: Depuración de Líneas Eliminadas en OT y PWA (Alfonso Porperrello)

## 📋 1. Ficha del Incidente
* **ID del Caso:** `CASO-20261116-02`
* **Fecha / Hora:** 16 de Noviembre de 2026, 11:40:00 CLT (GMT-03:00)
* **Operador / Usuario Afectado:** Alfonso Porperrello (`id_user = 10`)
* **Negocio / OT:** `GSP-2611-00139` (ID `204`, `id_proyecto_estado = 4`)
* **Equipo Involucrado:** Plataforma Articulada Diesel `PAD-33` (ID `142`) y Línea Suprimida de Izaje
* **Ambiente:** Desarrollo (`DEV`) — `https://servidor.leanglobal.cl/lg-gsp-dev/`
* **Severidad:** Alta (Persistencia de dotación y equipos cancelados en PDF oficial de OT y contexto operativo de PWA)

---

## 🔍 2. Síntoma Reportado por Terreno
Alfonso Porperrello se encontraba realizando pruebas en el entorno de desarrollo sobre el flujo de creación de una Orden de Trabajo (OT) con arriendo de plataforma (Rental) y traslado. Durante la prueba:
1. Creó un servicio Rental con traslado, asignándose a sí mismo como conductor del camión plataforma.
2. Agregó una segunda línea de servicio correspondiente a Izaje (grúa telescópica) y se asignó a sí mismo como operador de grúa, emitiendo la OT versión 1.
3. Al percatarse de que el servicio debía ser exclusivamente Rental, eliminó la línea de izaje en la fase de asignación de recursos (`id_proyecto_estado = 4`) y procedió a regenerar la OT (versiones 2 a 7).
4. **Comportamiento anómalo:** En el documento PDF de la OT continuaba apareciendo la línea de izaje eliminada y Alfonso Porperrello seguía figurando asignado como operador de grúa, además de mantenerse visible en el contexto de la aplicación móvil PWA.

---

## 🔬 3. Diagnóstico Técnico & Evidencia Empírica
Al realizar la auditoría forense integral en la base de datos PostgreSQL (`sch_leangsp`), backend Node.js y componentes Vue 3, se identificaron los siguientes hallazgos:
1. **Comportamiento de Claves Foráneas en `tpry_rel_persona`:**
   En la tabla relacional `tpry_rel_persona`, la fila `id_rel_persona = 215` vinculaba a Alfonso Porperrello (`id_user = 10`) con la línea de izaje eliminada. Al borrarse la línea en `tpry_linea_servicio`, la restricción `ON DELETE SET NULL` actualizó `tpry_rel_persona.id_linea_servicio = NULL`, pero el campo `estado_real` permaneció como `'PROGRAMADO'`.
2. **Generador de OT y PWA sin Filtro de Cancelación:**
   Tanto `proyectoModel.js` (`generarOTVersion`) como `reportDiarioController.js` (`getReportContexto`) consultaban las asignaciones activas sin filtrar registros cancelados (`estado_real NOT IN ('CANCELADO', 'REEMPLAZADO')`), leyendo el registro huérfano.
3. **Desconexión entre Árbol de Servicios y `lines` en Frontend:**
   En `AsignadorArbolRecursos.vue`, al eliminar una tarjeta mediante `eliminarServicioOperativo`, se modificaba el array reactivo de servicios pero no se purgabann las líneas hijas del array plano `props.lines`, provocando que en las siguientes peticiones HTTP se reenviaran líneas obsoletas.
4. **Falta de Sincronización Pre-OT:**
   En `GestorOportunidades.vue`, el método `generarPDFOT` ejecutaba un `PUT` del proyecto y directamente el `POST /generar-ot`, sin disparar previamente la sincronización atómica de asignaciones relacionales (`guardarCambiosAsignacion`).
5. **Restauración Automática en Backend (`anti-resurrección`):**
   En `proyectoModel.js` (`updateProyecto`), existía una lógica que restauraba `prevEjec.operador_id` ante valores nulos, reactivando al operador de la grúa a pesar de no existir líneas de izaje en el proyecto.
6. **Cortocircuito en Detección de Rental:**
   En `generarOTVersion`, la expresión `String(l.tipo || l.subcategoria || '').toUpperCase().includes('PLATAFORMA')` se cortocircuitaba en `l.tipo` (`'ALZA HOMBRES'`), omitiendo la subcategoría y los atributos `linea_servicio = 'RENTAL'` y `tipo_ot = 'OT-RENTAL'`, clasificando la plataforma con segmento `'Izaje Principal'`.

---

## 🏛️ 4. Causa Raíz de Arquitectura
Desalineación entre la mutación visual en la grilla del cliente, la serialización en los campos JSONB (`json_field.crm_v1` / `json_field.ejecucion_v1`) y el ciclo de vida relacional en las tablas de asignación (`tpry_linea_servicio`, `tpry_rel_equipo` y `tpry_rel_persona`). Al eliminarse un nodo padre o servicio operativo, la base de datos desvinculaba la FK pero dejaba activos los recursos humanos y mecánicos en estado `PROGRAMADO`.

---

## 🛠️ 5. Plan de Mitigación y Resolución (Cero Parches)
La solución estructural se ejecutó de forma canónica en los 4 niveles del sistema:

1. **Nivel 1: Especificación Formal (`.agents/specs/131_arbol_operaciones_verificacion_diff_y_asignacion_recursos_ot_spec.md`)**
   * Se incorporó la sección `§2.3: Purgado Atómico por Supresión de Líneas y Sincronización Pre-OT (REQ-1180)`, estableciendo como regla inmutable que toda supresión de línea cancela en cascada sus recursos en BD y que la emisión de OT debe sincronizar la asignación relacional de forma previa e indivisible.
2. **Nivel 2: Backend y Modelos (`proyectoModel.js` & `reportDiarioController.js`)**
   * En `_sincronizarLineasServicioRelacional`: Se implementó el marcado atómico `estado_real = 'CANCELADO'` en `tpry_rel_equipo` y `tpry_rel_persona` para cualquier recurso asignado a una línea eliminada.
   * En `updateProyecto`: Se agregó el blindaje anti-resurrección para que `equipo_id`, `operador_id` y `rigger_id` solo se hereden si existe al menos una línea activa de izaje/grúa en el estructurador.
   * En `reportDiarioController.js`: Se añadió el filtro estricto `AND COALESCE(rp.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')` en `getReportContexto`.
   * En `generarOTVersion`: Se corrigió la evaluación de Rental considerando `tipo_ot`, `linea_servicio`, `linea_negocio`, `tipo`, `subcategoria` y `descripcion` tanto en la consulta relacional como en el fallback, asignando determinísticamente `Segmento: Rental / Arriendo` y `Sin Operador (Arriendo Sin Operador)`.
3. **Nivel 3: Frontend y Componentes (`AsignadorArbolRecursos.vue` & `GestorOportunidades.vue`)**
   * En `AsignadorArbolRecursos.vue`: `eliminarServicioOperativo` y `eliminarRamaOperativa` filtran y eliminan inmediatamente los identificadores suprimidos del array `props.lines`, emitiendo `update:lines` y evento `dirty`.
   * En `GestorOportunidades.vue`: `generarPDFOT` ejecuta de forma obligatoria y asíncrona `await guardarCambiosAsignacion(true)` antes de llamar a `/generar-ot`. Se habilitó además el guardado manual de asignación en `id_proyecto_estado = 4`.
4. **Nivel 4: Saneamiento Relacional en DEV y Verificación Empírica**
   * Se actualizó la fila 215 de `sch_leangsp.tpry_rel_persona` a `estado_real = 'CANCELADO'`.
   * Se compiló el frontend en DEV (`npm run build:dev`, 0 errores).
   * Se desplegó backend y frontend vía SSH y se reinició PM2 proceso 10.
   * Se emitió la OT Versión 9 (`OT-GSP-2611-00139V9-268.pdf`, Documento ID 2176), constatando mediante `pdftotext` la remoción total del operador y la grúa, y la correcta clasificación de `PAD-33` como `Rental / Arriendo`.

---

## 📢 6. Protocolo de Respuesta al Usuario
> **Estimado Alfonso:**
> Se ha resuelto de forma estructural y definitiva el comportamiento reportado en la OT `GSP-2611-00139`:
> 1. Al eliminar una línea de izaje o servicio en el asignador de operaciones, el sistema ahora purga y cancela atómicamente todos los operadores y equipos vinculados tanto en la base de datos relacional como en el documento PDF de la OT.
> 2. Al pulsar **"Generar OT"**, la plataforma guarda y sincroniza automáticamente las asignaciones vigentes antes de compilar el PDF oficial.
> 3. En la nueva **Versión 9** de tu OT, la línea de izaje eliminada y tu asignación como operador han desaparecido por completo. La plataforma `PAD-33` figura correctamente clasificada como **`Rental / Arriendo`** con la condición **`Sin Operador (Arriendo Sin Operador)`**, y la dotación humana registra **0 personas**.
> Puedes verificarlo directamente en el entorno DEV refrescando la consola.

---

## 📚 7. Lecciones Aprendidas y Acciones Preventivas
* **Mandato de Sincronización Previa Indivisible:** Las acciones de generación de documentos contractuales o de faena (OT, ITS, EDP) nunca deben operar sobre estados en memoria o llamadas desincronizadas; deben invocar siempre de forma obligatoria y síncrona el guardado del estado relacional en PostgreSQL antes de emitir la versión oficial.
* **Integridad por Purgado Activo:** Ante la eliminación de filas en tablas maestras o intermedias (`tpry_linea_servicio`), no basta con confiar en `ON DELETE SET NULL`; se debe marcar explícitamente el estado del recurso como `CANCELADO` para neutralizar su propagación hacia interfaces cliente y reportes móviles.
