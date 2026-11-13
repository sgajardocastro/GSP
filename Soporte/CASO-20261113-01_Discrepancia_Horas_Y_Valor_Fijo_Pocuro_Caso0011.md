# CASO-20261113-01: Discrepancia en Liquidación de Estado de Pago por Coexistencia de Horas y Valor Fijo (Negocio 0011 / Constructora Pocuro)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261113-01`
- **Fecha / Hora:** `2026-11-13 10:17 CLT` (Resuelto y certificado a las `12:00 CLT`)
- **Operador / Usuario Afectado:** Yiara Mendoza (`id_user = 65`, Control de Gestión) / Sergio Gajardo (`id_user = 55`, Dirección)
- **Negocio / OT:** Negocio `0011` (Fecha Inicio `11-11-2026`) — Constructora Pocuro SpA (`GSP-2611-00031`, `id_proyecto = 77`)
- **Equipo Involucrado:** Grúa Telescópica 50 Ton `VCTR.81-9` (Operador: Nicolás Ceballos)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`)
- **Severidad:** **Alta** (bloqueo en firma FES de Carátula EDP e impedimento de facturación DTE)

---

## 2. Síntoma Reportado por Terreno / Administración
Durante la reunión matutina de validación de pagos del 13 de noviembre (10:17 CLT), la analista de Control de Gestión Yiara Mendoza reportó una discrepancia crítica al revisar el servicio finalizado el día anterior para Constructora Pocuro (Obra San Sebastián). El servicio incluía 18.5 horas operadas de grúa (a $80.000/hr) y un cargo cerrado de $200.000 por reparación de neumáticos.
Al abrir la Carátula de Estado de Pago, el sistema calculaba un monto drásticamente menor: le restaba 2.5 horas de sobretiempo y mezclaba indebidamente las líneas de cobro por hora con el valor fijo, mostrando únicamente $200.000 en el subtotal. Ante este error, Yiara se negó a estampar su firma FES para no distorsionar la facturación.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Reportes en Base de Datos (`sch_leangsp_prod.tedp_reporte_avance`):**
   - Reporte 66 (11-nov): 9.5 horas facturables (8.0 base + 1.5 sobretiempo).
   - Reporte 69 (12-nov): 9.0 horas facturables (8.0 base + 1.0 sobretiempo).
   - Total horas reales y validadas: **18.5 horas** (16.0 base + 2.5 sobretiempo).
2. **Causa de la Mezcla de Líneas:**
   En `reportDiarioController.js` (`getResumenEDP`), al recorrer las líneas comerciales, la presencia de la línea de neumáticos con `unidad = 'Valor Fijo'` encendía la variable booleana global `esValorFijoComercial = true`. Al ser una variable a nivel de todo el proyecto, el motor asumía que todo el servicio era a suma alzada de $200.000, asignando $200.000 al Día 1 y $0 al Día 2, y sobreescribiendo el subtotal de la grúa a $200.000 en vez de liquidar las 18.5 horas ($1.480.000).
3. **Causa de las 2.5 horas omitidas:**
   La línea de grúa en la cotización registraba `cantidad: 2` (días cotizados). En el recálculo alternativo de la interfaz, el sistema multiplicaba `cant × 8 hrs = 16.0 horas`, omitiendo las 2.5 horas efectivas de sobretiempo acumuladas en terreno.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
Acoplamiento del estado comercial `esValorFijoComercial` como bandera de alcance de proyecto en lugar de evaluarse de forma discriminada por línea de servicio en el controlador de reportes y carátula EDP.

---

## 5. Plan de Mitigación y Resolución
1. **Respaldo Físico Previo de Seguridad:**
   Creación de la tabla `sch_leangsp_prod._backup_caso0011_proyecto77` conteniendo el registro íntegro previo del proyecto 77 para garantizar rollback instantáneo.
2. **Aplicación de Datafix Focalizado en `PROD`:**
   Ajuste en `sch_leangsp_prod.tpry_proyecto` reclasificando la línea de reparación de neumáticos a cobro logístico único (`tipo: 'TRASLADOS'`, `unidad: 'TRASLADO'`, manteniendo su descripción intacta: `"REPARACION DE NEUMATICOS"` y su valor cerrado de `$200.000`).
3. **Certificación Empírica de la API en Producción:**
   Verificación directa de `GET /api/operaciones/reports/edp/resumen/77`:
   - Horas facturables totales: **18.5 hrs**.
   - Monto Grúa neto: **$1.480.000**.
   - Monto Reparación Neumáticos neto: **$200.000**.
   - **Total Neto:** **$1.680.000**.
   - **IVA 19%:** **$319.200**.
   - **Total Bruto:** **$1.999.200**.
   - Generación de PDF oficial (`/api/operaciones/edp/proyecto/77/pdf`): **HTTP 200 OK (66 KB)**.
4. **Blindaje Estructural en DEV:**
   La discriminación de valor fijo por línea sin banderas booleanas globales queda agendada para incorporarse formalmente en la rama activa de desarrollo.

---

## 6. Verificación & Certificación
- Cuadratura matemática verificada al 100% en la API de Producción.
- PDF del Estado de Pago generado exitosamente y disponible en la plataforma.
- Habilitación inmediata para que Yiara Mendoza estampe su firma electrónica simple FES Hito 1.

---

## 7. Referencias & Trazabilidad
- **Tabla de Respaldo Rollback:** `sch_leangsp_prod._backup_caso0011_proyecto77`
- **Proyecto Involucrado:** `id_proyecto = 77` (`GSP-2611-00031` / Obra San Sebastián Pocuro)
- **Acta de Reunión:** [Transcripción Google Meet](https://docs.google.com/document/d/1_UwpQAMeOfOHH5uh5ap7HUE4yswjAONevBwaaclkKqM/edit?usp=drive_web&tab=t.73xrtj67oc5o) (13-nov-2026 10:17 GMT-03:00)
