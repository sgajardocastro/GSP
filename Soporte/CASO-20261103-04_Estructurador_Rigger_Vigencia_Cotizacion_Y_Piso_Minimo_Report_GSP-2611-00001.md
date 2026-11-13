# Ficha de Soporte Operacional — CASO-20261103-04

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261103-04`
- **Fecha / Hora:** 03-Nov-2026
- **Operador / Usuario Afectado:** Wilson Navarrete (`wnavarrete@arriendosanpablo.cl`, Ejecutivo Comercial) / Yiara Mendoza (`id_user = 65`, Analista PMO) / José Luis Vergara (`id_user = 94`, Operador) / Carlos Alberto Acuña (`id_user = 13`, Rigger)
- **Negocio / OT:** `GSP-2611-00001` (`id_proyecto = 30`) — `FERROCARRILES DE PACIFICO S.A.` (`PLANTA FEPASA`)
- **Equipo Involucrado:** Grúa Telescópica 70 Ton (`TWDR. 80- K`, `id_equipo = 39`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** Alta (Inconsistencia entre cotizaciones v1/v2, re-inyección automática de línea de Rigger en Estructurador y piso mínimo de 8.00 hrs en Report Diario cuando lo pactado eran 9.00 hrs)

---

## 2. Síntoma Reportado por Terreno
1. **Cotización v1 vs. Cotización v2 y Línea Duplicada en el Estructurador:**
   - La **Cotización v1** (`GSP-2611-00001V1-55.pdf`, `id_doc = 1326`), enviada el `02/11/2026 11:10:40`, contenía 1 ítem de `GRUAS TELESCOPICAS — GRUA 70 TON` (`1 Día x 9 hrs/día`, `$120.000/hr`, `$1.080.000`), pero bajo ese encabezado figuraba la glosa `"Servicio de Rigger Certificado"`.
   - La **Cotización v2** (`GSP-2611-00001V2-58.pdf`, `id_doc = 1504`), generada el `03/11/2026 17:47:24` (y no enviada al cliente), tenía corregida la glosa a `"HORAS MINIMAS DIARIAS GRUA 70 TONELADAS"`, pero en el Estructurador de Servicios aparecían **2 líneas** (la Grúa 70 Ton y una segunda línea de `PERSONAL CERTIFICADO — RIGGER` en `$0`).
2. **Horas Mínimas a Facturar en el Report Diario (`8.00 hrs` vs. `9.00 hrs`):**
   - El Report Diario (`id_reporte_avance = 10`, fecha `27/10/2026`, `10:00` a `15:30`, `4.50 hrs` operadas) registraba `horas_minimas = 8.00` y `horas_facturables = 8.00`, cuando la cotización pactaba **9 horas mínimas diarias** (`1 Día x 9 hrs/día`).

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Secuencia Forense en `tpry_proyecto` (`id_proyecto = 30`) y Archivos PDF (`id_doc = 1326` y `id_doc = 1504`):**
   - Al marcar `Requiere Rigger = SÍ` (`opportunity.requiere_rigger = true`) en Preventa, el watcher de `GestorOportunidades.vue` creó automáticamente la fila `{ tipo: "PERSONAL CERTIFICADO", subcategoria: "RIGGER", descripcion: "Servicio de Rigger Certificado" }`.
   - En lugar de eliminar esa fila y crear una nueva para la grúa, el ejecutivo comercial reutilizó esa misma fila cambiando `Categoría = GRUAS TELESCOPICAS` y `Subcategoría = GRUA 70 TON`. Como `onTipoChange()` no limpiaba `line.descripcion`, quedó el texto `"Servicio de Rigger Certificado"` en la Cotización v1 (`id_doc = 1326`).
   - Posteriormente, al abrir nuevamente el negocio en el Gestor, el watcher `watch(() => opportunity.value.requiere_rigger)` (`L12040` de `GestorOportunidades.vue`) carecía del guard `if (isHydrating.value) return`. Al no encontrar ninguna línea con `subcategoria === 'RIGGER'` ni la palabra `'rigger'`, inyectó automáticamente una segunda línea de `RIGGER` en `$0` al rehidratar el formulario.
2. **Creación del Report Diario desde Control en Vivo (`controlVivoController.overrideHitoActividad`):**
   - El reporte `id_reporte_avance = 10` fue creado desde la Matriz PMO (`origen: "TORRE_CONTROL"`, `modificado_por: "Yiara Mendoza"`). En `controlVivoController.js` (`L1686` y `L1728`) y en `reportDiarioController.regularizarReporteManual` (`L3408`), el cálculo de inserción tenía `8.0` fijo en vez de consultar `pisoMinimo` / `cantidad_horas` de la línea comercial vigente.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Ausencia de Guard `isHydrating` en Watchers de Rigger y Prevencionista (`GestorOportunidades.vue`):**
   - `watch(() => opportunity.value.requiere_rigger)` y `watch(() => opportunity.value.requiere_prevencionista)` se disparaban durante la carga inicial (`cargarDatosCotizacion`), re-inyectando líneas de Rigger/Prevencionista que el comercial había decidido eliminar del itemizado.
2. **Persistencia de Descripción Por Defecto al Cambiar Categoría (`onTipoChange` / `onSubcategoriaChange`):**
   - Cambiar una línea de `PERSONAL CERTIFICADO` a `GRUAS TELESCOPICAS` reseteaba `subcategoria`, pero mantenía `descripcion = "Servicio de Rigger Certificado"`.
3. **Falta de Gobernanza de Vigencia de Cotizaciones en Servicios en Operación (`id_proyecto_estado >= 3`):**
   - El bloque `2. Control de Versiones & Envíos` estaba dentro de `<fieldset :disabled="isModoOperaciones">`, impidiendo enviar una nueva versión de cotización cuando el servicio ya estaba en operación, y no existía separación explícita entre un borrador no enviado (`BORRADOR_NO_ENVIADO`) y la cotización enviada vigente en operaciones (`ENVIADA_VIGENTE`).
4. **Hardcode de `8.0` en `controlVivoController.overrideHitoActividad` y `reportDiarioController.regularizarReporteManual`:**
   - No consultaban dinámicamente `pisoMinimo` / `cantidad_horas` de la cotización enviada vigente.

---

## 5. Plan de Mitigación y Resolución (`REQ-1100` / `SPEC-016 v4.2.0`)
1. **Datafix Aplicado en Producción (`sch_leangsp_prod`, `id_proyecto = 30`, `id_reporte_avance = 10`):**
   - Depuración de `json_field.crm_v1.lineas_servicio` dejando únicamente la línea válida `GRUAS TELESCOPICAS — GRUA 70 TON` (`1 Día x 9 hrs/día`, `pisoMinimo: 9`, `$120.000/hr`, `$1.080.000`, `equipo_asignado_id: 39`, `operador_asignado_id: 94`, `rigger_asignado_id: 13`).
   - Actualización de `tedp_reporte_avance` (`id_reporte_avance = 10`) a `horas_minimas = 9.00`, `horas_facturables = 9.00`, `horas_operadas = 4.50`, `id_user_rigger = 13`, y regeneración del PDF oficial (`id_doc_pdf = 1526`).
2. **Solución Estructural (`REQ-1100` — `GestorOportunidades.vue`, `proyectoModel.js`, `controlVivoController.js`, `reportDiarioController.js`):**
   - Guard `if (isHydrating.value) return` en watchers de `requiere_rigger` y `requiere_prevencionista`, permitiendo que el comercial elimine libremente el registro del Estructurador sin desmarcar el requerimiento operativo y sin re-inyección automática al reabrir.
   - Limpieza y sugerencia automática de `line.descripcion` en `onTipoChange` y `onSubcategoriaChange`.
   - Habilitación de edición comercial y envío de nuevas versiones de cotización en servicios en operación (`id_proyecto_estado >= 3`) sin retroceder estado ni reiniciar flujo, con alerta explícita de borrador sin validez operativa hasta su envío formal (`[ENVIAR COTIZACIÓN]`) y sincronización en caliente (`hot-sync`) al enviar.
   - Resolución unificada de `pisoMinimo` en `controlVivoController.overrideHitoActividad` y `reportDiarioController.regularizarReporteManual`.

---

## 6. Protocolo de Respuesta y Guía al Usuario
- El negocio `GSP-2611-00001` (`PLANTA FEPASA`) y su Report Diario (`id_reporte_avance = 10`) se encuentran regularizados con su estructura de 1 línea (`GRUA 70 TON`, `9 hrs mínimas`, `$120.000/hr`) y su PDF oficial actualizado (`9.00 hrs` mínimas a facturar).
- Cuando se modifique comercialmente una cotización de un servicio en operación, la nueva versión debe ser enviada al cliente mediante `[ENVIAR COTIZACIÓN]` para entrar en vigencia operativa.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Todo watcher que inyecte filas por defecto en un estructurador debe aislarse de la hidratación inicial (`isHydrating`) para respetar las decisiones comerciales de exclusión de cobro.
- Toda vía de creación de reportes (PWA, Regularización Manual y Matriz PMO) debe consumir el mismo resolvedor canónico de piso mínimo contractual (`resolverPisoMinimoContractualOT`).
