# CASO-20261113-03: Reasignación Retroactiva de Patente TRPS.20-8 vs RSPL.82-3 y Regeneración Física de PDFs (Negocio 007 — Planta Ferrero)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261113-03`
- **Fecha / Hora:** `2026-11-13 12:28 CLT`
- **Operador / Usuario Afectado:** Ernesto Ríos (`id_user = 9`, Operador Camión Pluma) / Claudio Gallardo (`id_user = 62`, Operador Inicial D1-D2) / Jorge Ponce (`id_user = 3`, Operaciones) / Sergio Gajardo (`id_user = 55`, Dirección)
- **Negocio / OT:** Negocio `007` — Planta Ferrero, Fundo Caracas (`GSP-2611-00007`, `id_proyecto = 36`, arriendo mensual `04-nov` al `02-dic`)
- **Equipo Involucrado:** Camión Pluma Volkswagen Constellation `TRPS.20-8` (`id_equipo = 57`) vs Sinotruk `RSPL.82-3` (`id_equipo = 56`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`)
- **Severidad:** **Alta** (cruce de equipos en terreno con impacto directo en facturación, estados de pago y reportes auditables del mandante METTCO SPA)

---

## 2. Síntoma Reportado por Terreno / Administración
En conjunto con el Negocio 04, durante la reunión de coordinación operativa del 13 de noviembre se identificó el intercambio recíproco de flota en faena:
1. El Negocio 007 inició el 4 de noviembre operando durante dos días (`04-nov` y `05-nov`, Días 1 y 2) con el operador Claudio Gallardo a bordo del camión pluma `RSPL.82-3`.
2. A partir del **6 de noviembre**, Ernesto Ríos asumió la operación del servicio para el resto del mes. Al producirse el intercambio de máquinas entre faenas, Ernesto pasó a operar efectivamente el camión pluma `TRPS.20-8` (proveniente del Negocio 04), mientras que el `RSPL.82-3` fue transferido al Negocio 04 con Omar Garrido.
3. No obstante este enroque operativo, los reportes diarios emitidos en la plataforma desde el 6 de noviembre continuaron registrándose bajo la patente inicial `RSPL.82-3`. Esto generaba una colisión documental directa frente al mandante, pues el mismo camión figuraba operando simultáneamente en dos contratos o con discrepancia entre la máquina física en planta y los reportes firmados.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Auditoría de Reportes Diarios (`tedp_reporte_avance`):**
   - El Negocio 007 (`id_proyecto = 36`) contaba con 9 reportes generados a la fecha (D1 al D9):
     * D1 (`2026-11-04`, Rep 20): Claudio Gallardo con `id_equipo = 56` (`RSPL.82-3`) — **Correcto**.
     * D2 (`2026-11-05`, Rep 29): Claudio Gallardo con `id_equipo = 56` (`RSPL.82-3`) — **Correcto**.
     * D3 (`2026-11-06`, Rep 42) a D9 (`2026-11-13`, Rep 82): Ernesto Ríos con `id_equipo = 56` — **Erróneo**, debían reflejar `id_equipo = 57` (`TRPS.20-8`).
2. **Inspección de Archivos Físicos y Repositorio Documental (`tfmg_file`):**
   - Los reportes D3 (Rep 42, `id_doc = 1710`), D4 (Rep 43, `id_doc = 1714`) y D5 (Rep 50, `id_doc = 1805`) contaban con PDFs compilados físicamente en el storage `/u05/LeanDocs/GSP/prod/reports/2026/11/`.
   - Los reportes D6, D7, D8 y D9 aún no tenían documento PDF emitido en `tfmg_file`.
3. **Asignación Relacional (`tpry_rel_equipo`):**
   - Existía un único registro histórico (`id_rel_equipo = 13`) asociando `RSPL.82-3` por la duración íntegra del mes (`04-nov` al `02-dic`), sin contemplar el traspaso al camión `TRPS.20-8` desde el `06-nov`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
Ausencia de un mecanismo transaccional de traspaso o relevo de equipos inter-proyectos a mitad de servicio continuo. Al no existir la segmentación temporal en `tpry_rel_equipo`, los reportes diarios creados por el operador heredaban de forma estática la asignación inicial del contrato.

---

## 5. Plan de Mitigación y Resolución
1. **Respaldo Atómico Preventivo:**
   Creación de la tabla `sch_leangsp_prod._backup_caso_negocio07_reportes` con copia fiel del estado previo de los reportes del proyecto 36 desde el `06-nov`.
2. **Actualización Relacional en Base de Datos:**
   - En `tedp_reporte_avance`, actualización a `id_equipo = 57` (`TRPS.20-8`) para los 7 reportes comprendidos entre el 6 y el 13 de noviembre (Rep 42, 43, 50, 58, 65, 71, 82).
   - En `tpry_rel_equipo`, partición cronológica formal:
     * Fila 13 (`RSPL.82-3`): Acotada formalmente al término de la jornada del `2026-11-05 23:59:59-03`.
     * Nueva fila 51 (`TRPS.20-8`): Insertada con vigencia desde `'2026-11-06 00:00:00-03'` hasta el término del servicio el `'2026-12-02 18:00:00-03'`.
   - En `tpry_proyecto.json_field`, sincronización espejo de los overrides de Torre de Control (`control_vivo_overrides`) para garantizar que los ajustes manuales de horario ingresados por Control de Gestión sigan vigentes bajo el nuevo identificador de equipo (`57`).
3. **Regeneración Física Automatizada de Documentos PDF:**
   - Recompilación determinista mediante Puppeteer y `reportDiarioPdfService` de los reportes D3 (Rep 42), D4 (Rep 43) y D5 (Rep 50), inyectando la patente **`TRPS.20-8`** y el modelo **`CONSTELLATION 32.360 DC 4580 MM AZ12 8X4`**.
   - Sobreescritura física exitosa de los 3 archivos en `/u05/LeanDocs/GSP/prod/reports/2026/11/`.
4. **Verificación Empírica de API:**
   - Consulta a `GET /api/operaciones/reports/edp/resumen/36`:
     * Días 1 y 2: `RSPL.82-3` (Claudio Gallardo).
     * Días 3 al 9: `TRPS.20-8` (Ernesto Ríos).

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- Se informa a Operaciones (Jorge Ponce) y Control de Gestión (Yiara Mendoza) que ambos servicios de Planta Ferrero (Negocio 04 y Negocio 007) se encuentran 100% cuadrados y sincronizados.
- Para el Negocio 007:
  * Los reportes del 4 y 5 de noviembre conservan a Claudio Gallardo con la patente `RSPL.82-3`.
  * Los reportes a partir del 6 de noviembre figuran con Ernesto Ríos y la patente `TRPS.20-8`.
  * Todos los PDFs descargables y la carátula de estado de pago reflejan exactamente esta distribución de equipos sin mezclas ni distorsiones.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Gobernanza Relacional:** Los relevos de operadores o traspasos de maquinaria en arriendos mensuales no deben ser tratados como simples ediciones de cabecera, sino mediante segmentación temporal en `tpry_rel_equipo` y `tpry_rel_persona`.
- **Integridad Documental:** Todo cambio de patente en base de datos debe acompañarse mandatoriamente de la regeneración física de los PDFs compilados para evitar descalces entre la vista digital y los documentos probatorios entregados al mandante.
