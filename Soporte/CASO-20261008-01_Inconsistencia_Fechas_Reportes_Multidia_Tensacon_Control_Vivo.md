# 🛠️ CASO-20261008-01: Inconsistencia de Fechas en Reportes Multi-Día (Tensacon OT-4) en Control en Vivo PMO

---

## 1. Ficha del Incidente

| Parámetro | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261008-01` |
| **Fecha / Hora** | 2026-10-08 09:30 CLT (Hora Oficial de Chile) |
| **Operador / Usuario Afectado** | Robert Rodríguez (ID User: 49) / Antonio Cartes (Mandante Tensacon) |
| **Negocio / OT** | `GSP-2610-233-004` (ID Proyecto: 4, Negocio: NEG-4) |
| **Cliente / Faena** | Sociedad de Constructores Tensacon S.A. / Planta Ferrero |
| **Equipo Involucrado** | Grúa Telescópica Liebherr LTM-1090 (`PJYY.20-1`) |
| **Ambiente** | Producción (`PROD` - Base de datos `sch_leangsp_prod`) |
| **Severidad** | **Alta** (Inconsistencia de trazabilidad operacional en Control en Vivo PMO y duplicación de jornada) |
| **Estado** | **RESUELTO EN PRODUCCIÓN (REGULARIZACIÓN SQL) / TRASPASADO A DESARROLLO (REQ-1004)** |

---

## 2. Síntoma Reportado por Operaciones / PMO

En la pantalla de **Control Operativo en Vivo** de la Torre de Control (PMO), la tarjeta correspondiente a la OT de Tensacon (`GSP-2610-233-004`) presentaba una anomalía visual y de datos:
* Aparecían como reportados simultáneamente los días **D1, D2 y D3**.
* El operador Robert Rodríguez había completado el término de la jornada anterior (Día 2) en la tarde/noche anterior con firma del mandante Antonio Cartes.
* Sin embargo, el Report Diario del Día 2 se grabó en el sistema con fecha `2026-10-08` (HOY) en vez de `2026-10-07` (AYER).
* Como resultado, al consultar la fecha de hoy (08-10-2026), Control en Vivo mostraba que el Día 3 ya tenía las actividades y reportes consumidos, impidiendo a la Torre auditar el estado real de la jornada de hoy.

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### A. Inspección en Base de Datos PostgreSQL (`sch_leangsp_prod`)
Se ejecutó la consulta sobre la tabla de reportes de avance:

```sql
SELECT 
    id_reporte_avance, 
    id_proyecto, 
    dia_correlativo, 
    fecha_reporte, 
    estado_reporte, 
    creado_en 
FROM sch_leangsp_prod.tedp_reporte_avance 
WHERE id_proyecto = 4 
ORDER BY dia_correlativo ASC;
```

**Resultado obtenido:**
* **Report ID 8:** `dia_correlativo = 1`, `fecha_reporte = '2026-10-06'`, `estado_reporte = 'VALIDADO_ANALISTA'`. *(Correcto: Martes 06-Oct)*.
* **Report ID 9:** `dia_correlativo = 2`, `fecha_reporte = '2026-10-08'`, `estado_reporte = 'VALIDADO_FES'`. *(INCORRECTO: Día 2 fue ejecutado el Miércoles 07-Oct, pero quedó registrado con fecha 08-Oct)*.

### B. Inspección de la API de Control en Vivo
Al invocar `GET /api/operaciones/control-vivo?fecha=2026-10-08`:
* El controlador asociaba el Report ID 9 al Día 2 pero evaluaba la fecha consultada (`2026-10-08`), marcando el Día 3 como activo pero con los datos y horas de término del Día 2 (08:00 a 17:00), produciendo una contradicción directa con la realidad de faena.

---

## 4. Causa Raíz de Arquitectura (Software & Timezone)

1. **Desfase Horario UTC en Asignación Automática de Fecha:**
   En la PWA (`ReportDiarioIzaje.vue`), la fecha de reporte se asignaba inicialmente mediante:
   ```javascript
   form.fecha_reporte = new Date().toISOString().split('T')[0]
   ```
   En Chile Continental (UTC-3), cualquier registro o guardado realizado después de las 21:00 horas locales se convierte a UTC sumando 3 horas, pasando inmediatamente a la fecha del día siguiente (`2026-10-08`).

2. **Inexistencia de Validación de Fecha y Secuencia en PWA:**
   * La aplicación no permitía al operador confirmar o corregir la fecha de la jornada ejecutada en caso de no haber tenido señal o haber transmitido con retraso.
   * No existía una regla dura que verificara la correlación cronológica entre `dia_correlativo` y las fechas efectivas de servicio.

3. **Falta de Interactividad en la Tarjeta de Control en Vivo:**
   * En el frontend web (`ControlOperativoVivo.vue`), los badges `[✓ D1]`, `[✓ D2]`, `[▶ D3]` eran puramente estáticos. La Torre de Control no tenía forma de hacer clic en D1 o D2 para inspeccionar el historial y detectar qué reporte correspondía a cada fecha sin consultar directamente la base de datos.

---

## 5. Regularización Ejecutada en Base de Datos de Producción

Para corregir la distorsión operativa sin afectar la firma electrónica ni la validez del documento FES ya sellado con el mandante, se regularizó la fecha de la jornada en el servidor de producción:

```sql
UPDATE sch_leangsp_prod.tedp_reporte_avance 
SET fecha_reporte = '2026-10-07' 
WHERE id_reporte_avance = 9 AND id_proyecto = 4;
```

### Verificación Empírica Inmediata (API Producción):
Se ejecutó la consulta contra el backend oficial en puerto 3016:
```bash
curl -s "http://127.0.0.1:3016/api/operaciones/control-vivo?fecha=2026-10-08"
```
**Respuesta JSON confirmada:**
* **Día 1 (`2026-10-06`):** `tiene_report: true`, `es_hoy: false` ➔ `[✓ D1]`
* **Día 2 (`2026-10-07`):** `tiene_report: true`, `es_hoy: false` ➔ `[✓ D2]`
* **Día 3 (`2026-10-08`):** `tiene_report: false`, `es_hoy: true` ➔ `[▶ D3]` *(En curso hoy)*
* **Día 4 (`2026-10-09`):** `tiene_report: false`, `es_fin: true` ➔ `[ D4 FIN ]`

La tarjeta de Tensacon en Control en Vivo volvió a reflejar con total exactitud la situación real de terreno: Día 1 y Día 2 concluidos conforme, Día 3 pendiente de ejecución hoy.

---

## 6. Acciones Preventivas y Traspaso al Core del Proyecto (REQ-1004)

Este incidente evidenció la necesidad de realizar mejoras estructurales en la plataforma, las cuales se desacoplan de este ticket de soporte y se transfieren al **Backlog Oficial del Proyecto (`Gestión/tareas.md`)**:

1. **Normalización Horaria de Fechas (Timezone Chile):**
   * Sustituir todo uso de `.toISOString().split('T')[0]` por `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' })` en PWA y Backend.
2. **Selector de Fecha Flexible pero Acotado en Terreno:**
   * Fecha por defecto: **HOY**.
   * Permitir seleccionar fechas pasadas ($\le \text{HOY}$) para cubrir faenas sin cobertura de red.
   * Prohibir fechas futuras ($> \text{HOY}$).
3. **Hard Gate de Secuencia Cronológica:**
   * Bloquear el inicio de la jornada del Día $N$ si el Día $N-1$ se encuentra pendiente de reporte o cierre.
4. **Ribbon Horizontal de Jornadas en Control en Vivo:**
   * Implementar franja superior de navegación tipo timeline (inspirada en vista de Jornadas de Trabajo), resaltando **HOY** y permitiendo auditar cualquier fecha con un clic.
5. **Navegación Multi-Día y Acceso Directo en Tarjetas:**
   * Permitir hacer clic en `[✓ D1]`, `[✓ D2]` para auditar las horas y actividades de días anteriores directamente en la tarjeta.
   * Incorporar accesos directos al visor de telemetría de viaje (`ModalMapaViaje.vue`) y al visor de reports diarios (`ModalVisorReport.vue`).

---

## 7. Cierre Formal del Incidente

* **Fecha de Cierre:** 2026-10-08 10:15 CLT
* **Responsable Técnico:** Agente Antigravity / LeanGlobal QA & Architecture
* **Acción Operativa:** Base de datos regularizada, monitor de Torre de Control validado en vivo.
* **Acción de Desarrollo:** Tarea `REQ-1004` catalogada en `Gestión/tareas.md` para implementación en nuevo ciclo de release.
