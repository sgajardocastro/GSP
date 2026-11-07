# SPEC-119 / REQ-1131: Imputación de Combustible en Vehículos Complementarios por OT y Corrección de Duplicidad 18:00 en Exportación Excel

---

## 1. Identificación y Estado

- **Código Requerimiento:** `REQ-1131`
- **Código Especificación:** `SPEC-119`
- **Fecha:** 2026-11-07
- **Autor / Arquitectura:** Antigravity / LeanGlobal
- **Ambientes:** Desarrollo (`DEV`) y Producción (`PROD`)
- **Impacto Backend:** `ejecucion/backend_remoto/src/controllers/combustibleController.js`, `ejecucion/backend_remoto/src/controllers/reportesController.js`
- **Impacto Base de Datos:** `sch_leangsp_prod.tflt_cargas_combustible`, `sch_leangsp_prod.tedp_reporte_avance`
- **Estado:** `PROPUESTA FORMAL / PENDIENTE DE APROBACIÓN DE DIFF`

---

## 2. Definición del Problema & Congruencia Operacional

### 2.1. Síntomas Detectados (Reunión 2026-11-07 con Alfonso Porperrello)
1. **Pérdida de Imputación de Combustible en Equipos de Apoyo / Camiones de Traslado (Caso Besalco):**
   - En faenas complejas (ej. Besalco), la grúa principal es trasladada por un camión rampla / tractocamión complementario.
   - Las cargas de combustible y los consumos asociados a estos vehículos de apoyo quedan registrados únicamente a nivel de la patente del vehículo en Flota 360, sin asociarse al ID de la Orden de Trabajo (`id_proyecto`).
   - Consecuencia: La rentabilidad real de la OT y el costo del servicio en el ITS no reflejan el costo de combustible del convoy completo.
2. **Duplicidad Horaria Fija a las 18:00 en Exportación Excel de Hitos:**
   - Al exportar el historial y los reportes operativos a planillas Excel para auditoría contable, todas las horas de los hitos registrados en terreno aparecen duplicadas o forzadas a las `18:00` horas.
   - Consecuencia: Se rompe la secuencia cronológica real del servicio (Salida de base, Llegada a faena, Inicio faena, Fin faena, Retorno a base).

### 2.2. Mandato Operacional
> *"Ajustar la imputación de combustible para que reconozca los vehículos complementarios asociados a la OT y corregir el formateo horario en la exportación Excel para mantener la fidelidad cronológica de los hitos."* (Minuta Ejecutiva 2026-11-07).

---

## 3. Causa Raíz de Arquitectura

1. **Combustible:** En el registro de cargas de combustible, el selector de OT solo filtra la maquinaria principal asignada (`id_equipo`), omitiendo los equipos asignados como escolta, flete o apoyo en `tpry_proyecto_recursos`.
2. **Exportación Excel:** En la función de generación de celdas de Excel (`exceljs` o `xlsx`), los campos timestamp con zona horaria UTC se convierten de forma estática o se les aplica una máscara con hora fija `18:00` (o `toIsoString().split('T')[0] + ' 18:00'`) en lugar de extraer la hora efectiva del hito (`toTimeString()` o formateador local de Chile `America/Santiago`).

---

## 4. Especificación Canónica de la Solución

### 4.1. Asociación Multiequipo de Combustible a la OT
- Permitir imputar cargas de combustible seleccionando la OT activa y cualquiera de los vehículos involucrados en el convoy (`id_equipo_principal` o equipos en `tpry_proyecto_recursos`).
- Incluir en los reportes de costos de la OT la sumatoria de combustible tanto del equipo matriz como de los vehículos de soporte.

### 4.2. Formateo Determinista de Hitos en Excel
- Reemplazar cualquier fallback de hora fija por la hora real almacenada en los hitos de la jornada:
  - Formato estricto: `HH:mm` en zona horaria de Chile (`America/Santiago`).
  - Cada hito preserva su valor individual sin sobreescritura arbitraria.

---

## 5. Criterios de Aceptación (QA Determinista)

1. Una carga de combustible ingresada a la rampla de traslado queda imputada a la OT de Besalco.
2. El Excel descargado muestra las horas reales de cada hito (ej. Salida 07:30, Llegada 08:35, Término 13:00, Retorno 13:51) sin forzar las 18:00 horas.
