# 🛠️ Caso de Soporte Operacional: CASO-20261112-01

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261112-01`
- **Fecha / Hora:** 12-Nov-2026 10:28 CLT
- **Operador / Usuario Afectado:** Wilson Navarrete (Comercial / Operaciones) / Claudio Gallardo Valenzuela (Operador asignado, `id_user = 62`)
- **Negocio / OT:** `GSP-2611-00027` (ID de Proyecto en Base de Datos: `73`)
- **Cliente / Faena:** Catamutun Energía / Planta Surlat Pitrufquén (Arturo Prat 419, Pitrufquén)
- **Equipo Involucrado:** Grúa Telescópica Liebherr LTM-1070 70 Ton (`TLXF.37-9`, `id_equipo = 39`) vs Grúa Liebherr LTM-1070 70 Ton (`SKYJ.61-8`, `id_equipo = 40`)
- **Ambiente:** Producción (`PROD` - `sch_leangsp_prod`)
- **Severidad:** Alta (Inconsistencia documental y de despacho entre la Orden de Trabajo PDF oficial y la Torre de Control / PWA móvil)

---

## 2. Síntoma Reportado por Terreno
En el negocio `GSP-2611-00027` (Planta Surlat Pitrufquén), correspondiente a Wilson Navarrete:
- Al revisar el PDF oficial de la Orden de Trabajo (versión 6 emitida, `OT-GSP-2611-00027V6-184.pdf`), el equipo asignado para el servicio de izaje correspondía formalmente a la grúa telescópica **`TLXF.37-9`**.
- Sin embargo, en el portal web (Control de Flota, Despacho y PWA móvil de conductores/operadores), el sistema desplegaba y vinculaba a la grúa **`SKYJ.61-8`**.
- Se evidenciaron múltiples emisiones previas de la OT (6 versiones sucesivas) y discordancia en las fechas operativas y estados de los equipos.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
Tras auditar forensemente los registros físicos y tablas de PostgreSQL en el servidor de producción:
1. **Auditoría de Versiones PDF de la OT (`/u05/LeanDocs/GSP/prod/ot/2026/11/`):**
   - V1 (19:19 CLT): Asignada `SKYJ.61-8`.
   - V2 (19:53 CLT): Asignada `SKYJ.61-8`.
   - V3 (20:12 CLT): Asignada `SKYJ.61-8`.
   - V4 (20:15 CLT): Reasignada a `TLXF.37-9`.
   - V5 (20:44 CLT): Reasignada transitoriamente a `SKYJ.61-8`.
   - V6 (20:48 CLT): Emitida con **`TLXF.37-9`** (Operador: Claudio Gallardo Valenzuela, Rigger: Matías Barrales, fecha faena 12-11-2026 08:00 - 18:00).
2. **Auditoría en Tablas Relacionales:**
   - En `tpry_rel_equipo` solo existía el registro histórico `id_rel_equipo = 47` con `id_equipo = 40` (`SKYJ.61-8`). Nunca se actualizó el registro relacional al equipo 39 (`TLXF.37-9`).
   - En `tequ_log_desplazamiento` existían dos registros vinculados a la grúa 40 (`SKYJ.61-8`): Log #68 (ASIGNADO) y Log #70 (ARRIBADO en faena a las 07:48 CLT).
   - En `tequ_equipo`, la grúa `TLXF.37-9` figuraba administrativamente con `estado = 'EN_MANTENCION'`, lo que generaba advertencias operativas en despacho.

---

## 4. Causa Raíz de Arquitectura
1. **Desacople en Generación de la OT vs Persistencia Relacional:**
   - El generador de PDF de la OT (`proyectoModel.js` -> `generarOTVersion`) construía la tabla de equipos leyendo atributos desde los objetos JSON `crm_v1.lineas_servicio` y `ejecucion_v1.equipo_id`.
   - Mientras tanto, el módulo de Control de Flota, Despacho (`controlVivoController.js`) y la PWA móvil leen directamente las tablas relacionales maestras (`tpry_rel_equipo` y `tequ_log_desplazamiento`).
2. **Falta de Reemplazo Atómico en Asignación:**
   - Al modificarse el equipo en la interfaz comercial/operativa para generar una nueva OT, el endpoint no aplicó una sincronización limpia o reemplazo determinista sobre `tpry_rel_equipo`, dejando la grúa `SKYJ.61-8` como la única físicamente asignada en base de datos.

---

## 5. Plan de Mitigación y Resolución
### Fase 1: Contingencia Inmediata Ejecutada en Base de Datos (12-Nov-2026)
Bajo autorización explícita del usuario, se ejecutó una transacción atómica en `sch_leangsp_prod`:
1. **Actualización Relacional en `tpry_rel_equipo`:**
   - Se actualizó el registro `id_rel_equipo = 47` de `id_equipo = 40` (`SKYJ.61-8`) a `id_equipo = 39` (`TLXF.37-9`), fijando el rango operativo acordado (`2026-11-12 06:30` a `2026-11-12 18:00`).
2. **Actualización de Despachos en `tequ_log_desplazamiento`:**
   - Se migraron los registros de viaje #68 y #70 al `id_equipo = 39` con patente `TLXF.37-9`.
3. **Alineación de JSON en `tpry_proyecto`:**
   - Se homologaron los atributos `equipo_asignado_id: 39` en `crm_v1.lineas_servicio`, `ejecucion_v1.equipo_id: 39` y en la tripulación asignada (`ejecucion_v1.tripulacion_asignada`).
4. **Habilitación de Estado Operativo:**
   - Se actualizó `tequ_equipo` para la grúa 39 (`TLXF.37-9`) pasando de `EN_MANTENCION` a `OPERATIVO`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- La grúa oficial asignada al negocio `GSP-2611-00027` (Planta Surlat Pitrufquén) es la **`TLXF.37-9`**, en total concordancia con la OT versión 6 entregada al mandante.
- En la Torre de Control, Control de Flota y PWA móvil, el servicio y sus registros de despacho quedaron regularizados con la patente `TLXF.37-9` y el operador Claudio Gallardo.
- La grúa `SKYJ.61-8` quedó liberada de este proyecto y disponible en base de operaciones.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Tarea de Fondo Programada (`REQ-1160`):** Durante la jornada de la tarde se implementará la solución estructural en el backend:
  1. Modificar `asignacionRecursosController.js` para que todo cambio de equipo reemplace limpiamente en `tpry_rel_equipo` sin dejar activos zombis.
  2. Modificar `proyectoModel.js` (`generarOTVersion`) para que la tabla de equipos del PDF consulte obligatoriamente la tabla relacional `tpry_rel_equipo`, cerrando toda brecha entre el PDF y la Torre de Control.
