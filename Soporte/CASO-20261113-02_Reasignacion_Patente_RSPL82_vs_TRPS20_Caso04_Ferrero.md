# CASO-20261113-02: Reasignación Retroactiva de Patente RSPL.82-3 vs TRPS.20-8 y Regeneración Física de PDFs (Negocio 04 — Planta Ferrero)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261113-02`
- **Fecha / Hora:** `2026-11-13 12:08 CLT` (Resuelto y regenerado a las `12:17 CLT`)
- **Operador / Usuario Afectado:** Omar Garrido (`id_user = 97`, Operador Camión Pluma) / Jorge Ponce (`id_user = 3`, Operaciones) / Sergio Gajardo (`id_user = 55`, Dirección)
- **Negocio / OT:** Negocio `04` — Planta Ferrero, Fundo Caracas (`GSP-2611-00004`, `id_proyecto = 33`, arriendo mensual `29-oct` al `28-nov`)
- **Equipo Involucrado:** Camión Pluma Sinotruk `RSPL.82-3` (`id_equipo = 56`) vs Volkswagen Constellation `TRPS.20-8` (`id_equipo = 57`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`)
- **Severidad:** **Alta** (distorsión de patente en reportes oficiales entregados al cliente mandante y en la carátula de estado de pago)

---

## 2. Síntoma Reportado por Terreno / Administración
Durante reunión de coordinación operativa del 13 de noviembre, Jorge Ponce expuso una discrepancia en la facturación y asignación de flota que impactaba al cliente Planta Ferrero. En el servicio mensual del Negocio 04 (iniciado el 29 de octubre), se había mantenido registrado en el sistema el camión pluma `TRPS.20-8`.
Sin embargo, producto de un intercambio operativo de máquinas coordinado en faena, a partir del **6 de noviembre** el operador Omar Garrido pasó a operar efectivamente el camión pluma `RSPL.82-3`, mientras que el equipo `TRPS.20-8` fue derivado a otro servicio.
Como los reportes diarios continuaban emitiéndose con la patente `TRPS.20-8`, los documentos oficiales y el estado de pago presentaban un equipo distinto al que físicamente prestó el servicio en faena a partir del 6 de noviembre, arriesgando el rechazo de la facturación por parte del mandante.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Auditoría de Reportes en Base de Datos (`sch_leangsp_prod.tedp_reporte_avance`):**
   - El Negocio 04 (`id_proyecto = 33`) registraba 13 reportes diarios (D1 al D13).
   - Todos los 13 reportes tenían asignado `id_equipo = 57` (`TRPS.20-8`).
   - Los Días 1 al 6 (`2026-10-29` al `2026-11-05`) correspondieron legítimamente a `TRPS.20-8`.
   - A partir del Día 7 (`2026-11-06`) hasta el Día 13 (`2026-11-13`), los 7 reportes debían reflejar la patente real `RSPL.82-3` (`id_equipo = 56`).
2. **Inspección de Archivos Físicos y Repositorio de Documentos (`tfmg_file`):**
   - Los reportes de los Días 7, 8, 9, 10, 11 y 13 contaban con PDFs compilados previamente en el storage oficial `/u05/LeanDocs/GSP/prod/reports/2026/11/`.
   - Una simple modificación en la base de datos habría generado una inconsistencia de integridad, ya que los PDFs ya descargados o compartidos seguirían mostrando la patente `TRPS.20-8`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
Ausencia de una herramienta en la interfaz de gestión operativa para registrar relevos o traspasos físicos de maquinaria a mitad de un arriendo mensual continuo, lo que provocó que el operador emitiera sus reportes diarios heredando la asignación inicial de la orden de trabajo.

---

## 5. Plan de Mitigación y Resolución
1. **Respaldo Atómico de Seguridad:**
   Creación de la tabla `sch_leangsp_prod._backup_caso_negocio04_reportes` con copia de los 7 reportes del proyecto 33 previo a la intervención.
2. **Actualización Relacional en Base de Datos:**
   - En `tedp_reporte_avance`, actualización a `id_equipo = 56` (`RSPL.82-3`) para todos los reportes de `id_proyecto = 33` con `fecha_reporte >= '2026-11-06'`.
   - En `tpry_rel_equipo`, segmentación formal de la vigencia:
     * Fila 9 (`TRPS.20-8`): Acotada con `fecha_plan_fin = '2026-11-05 23:59:59-03'`.
     * Nueva asignación (`RSPL.82-3`): Registrada con vigencia `'2026-11-06 00:00:00-03'` al `'2026-11-28 18:00:00-03'`.
   - En `tpry_proyecto.json_field`, alineación de la tripulación asignada a `equipo_asignado_id: 56`.
3. **Regeneración Física Automatizada de Documentos PDF:**
   - Ejecución de script en el servidor de producción mediante Node.js e invocación de `reportDiarioPdfService.generarPdfReportDiario`.
   - Recompilación con Puppeteer inyectando la patente **`RSPL.82-3`** y el modelo **`C7H8X4 440 EV FORESTAL`**, preservando firmas, horómetros y observaciones intactas.
   - Sobreescritura física de los 6 archivos PDF oficiales en `/u05/LeanDocs/GSP/prod/reports/2026/11/`.

---

## 6. Verificación & Certificación
- **Auditoría de API de Estado de Pago (`GET /api/operaciones/reports/edp/resumen/33`):**
  * Días 1 al 6: Patente `TRPS.20-8` (*Volkswagen Constellation*).
  * Días 7 al 13: Patente `RSPL.82-3` (*Sinotruk C7H8X4 440 EV Forestal*).
- **Archivos Físicos:**
  * Reporte 41 (D7 — 199 KB): Actualizado con `RSPL.82-3`.
  * Reporte 45 (D8 — 188 KB): Actualizado con `RSPL.82-3`.
  * Reporte 51 (D9 — 194 KB): Actualizado con `RSPL.82-3`.
  * Reporte 59 (D10 — 188 KB): Actualizado con `RSPL.82-3`.
  * Reporte 64 (D11 — 173 KB): Actualizado con `RSPL.82-3`.
  * Reporte 83 (D13 — 33 KB): Actualizado con `RSPL.82-3`.

---

## 7. Referencias & Trazabilidad
- **Tabla de Respaldo Rollback:** `sch_leangsp_prod._backup_caso_negocio04_reportes`
- **Proyecto Involucrado:** `id_proyecto = 33` (`GSP-2611-00004` — Planta Ferrero, Fundo Caracas)
- **Acta de Reunión:** [Transcripción Google Docs](https://docs.google.com/document/d/1EM2Hc4JXkPfEm8RdNWzRLzM2eqJHdXghcNXcj67kkqE/edit?tab=t.o527wx75602y#heading=h.33tg45rrf6a) (13-nov-2026)
