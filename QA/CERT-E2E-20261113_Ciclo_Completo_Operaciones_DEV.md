# Certificación QA End-to-End: Ciclo Completo de Negocio en Operaciones (DEV)

- **ID Certificación:** `CERT-E2E-20261113-001`
- **Ambiente:** Servidor de Desarrollo DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Base de Datos:** PostgreSQL `sch_leangsp` (Puerto 5432)
- **Fecha de Ejecución:** 13 de Noviembre de 2026
- **Especialista QA Independiente:** Subagente Certificador QA E2E (`qa-business-specialist`)
- **Política de Persistencia:** CERO TEARDOWN (Todos los registros permanecen vivos para auditoría humana y validación en UI)

---

## 1. Resumen Ejecutivo del Ciclo Operativo Fáctico

Se ejecutó y validó de punta a punta la secuencia real de operaciones para el proyecto testigo de alta demanda de izaje industrial, recorriendo desde la aprobación y pase a operaciones, asignación jerárquica de recursos bajo SPEC-131, despacho y viaje de ida, emisión y validación de report diario de horas faena, pre-Estado de Pago (EDP) valorizado matemáticamente, hasta el Informe de Término de Servicio (ITS) con liquidación de costos y cálculo de rentabilidad.

| Hito Operativo | Entidad / Tabla BD | Identificador Fáctico | Estado Final |
| :--- | :--- | :--- | :--- |
| **Proyecto / OT** | `sch_leangsp.tpry_proyecto` | `id_proyecto = 82` <br> Folio OT: `GSP-2611-00034` | Estado 4 ("En Ejecución") |
| **Líneas de Servicio** | `sch_leangsp.tpry_linea_servicio` | `id_linea_servicio = 103` (Izaje 70T) <br> `id_linea_servicio = 104` (Flete Traslado) | Activas y Valorizadas |
| **Asignación Equipo** | `sch_leangsp.tpry_rel_equipo` | `id_rel_equipo = 45` <br> Equipo: `GPT-137` (`id_equipo = 42`, Patente `VPSR.26-1`) | Ligado a Línea `103`, 8 hrs plan |
| **Asignación Tripulación** | `sch_leangsp.tpry_rel_persona` | **Operador:** `id_rel_persona = 55` (`id_user = 34` Héctor Paredes) <br> **Rigger:** `id_rel_persona = 56` (`id_user = 22` Andrés Urra) | Ligados a Línea `103`, 8 hrs plan |
| **Viaje / Despacho** | `sch_leangsp.tequ_log_desplazamiento` | `id_log_desplazamiento = 67` <br> Trayecto: Base Temuco ➔ Planta Pitrufquén | `ARRIBADO` (32 km, 1.2 hrs horómetro) |
| **Report Diario Faena** | `sch_leangsp.tedp_reporte_avance` | `id_reporte_avance = 67` <br> Día 1: 8.00 hrs operadas, Horómetro 3451.20 a 3459.20 | `VALIDADO_ANALISTA` (Firmado cliente) |
| **Estado de Pago (EDP)** | `sch_leangsp.tedp_estado_pago` <br> `tedp_estado_pago_detalle` | `id_edp = 2` <br> Folio: `EDP-GSP-2611-00034-01` | `APROBADO_PARA_FACTURAR` <br> Neto: $1.630.000 + IVA: $309.700 = Total: $1.939.700 |
| **Término de Servicio (ITS)** | `sch_leangsp.tits_informe_termino` <br> `tits_costo_operacional` | `id_its = 11` <br> Folio: `ITS-GSP-2611-00034-001` | `CONCLUIDO` <br> Ingresos: $1.630.000, Costos: $18.000, Utilidad: $1.612.000 (Margen: 98.90%) |

---

## 2. Cuadratura Matemática y Financiera

### 2.1. Ingresos Facturables (EDP)
- **Servicio Base de Izaje:** 8.00 horas $\times$ $110.000/hr = **$880.000 CLP**
- **Flete y Movilización Grúa 70T:** 1 viaje global = **$750.000 CLP**
- **Subtotal Neto Facturable:** $880.000 + $750.000 = **$1.630.000 CLP**
- **IVA (19%):** $1.630.000 $\times$ 0.19 = **$309.700 CLP**
- **Monto Bruto Total a Facturar:** **$1.939.700 CLP**

### 2.2. Costos Operacionales y Margen de Explotación (ITS)
- **Alimentación Operador (Héctor Paredes):** $9.000 CLP
- **Alimentación Rigger (Andrés Urra):** $9.000 CLP
- **Total Costos Directos Imputados:** **$18.000 CLP**
- **Utilidad Bruta Operacional:** $1.630.000 - $18.000 = **$1.612.000 CLP**
- **Margen de Explotación:** $\frac{1.612.000}{1.630.000} \times 100 = \mathbf{98.90\%}$

---

## 3. URLs Directas para Verificación en Interfaz de Usuario (DEV)

El usuario y los coordinadores pueden consultar directamente cada etapa viva en la aplicación web:

1. **Torre de Control de Operaciones (Kanban, diff y seguimiento de la OT):**
   `https://servidor.leanglobal.cl/lg-gsp-dev/torre`
   *(Buscar OT `GSP-2611-00034` en columna "En Ejecución" o filtrar por cliente "Surlat")*

2. **Bandeja de Control de Gestión & PMO (Reports, EDPs listos para facturar e ITS):**
   `https://servidor.leanglobal.cl/lg-gsp-dev/torre` ➔ Activar pestaña **"Consola PMO"**
   *(Verificar KPI "EDP Listos a Facturar" y tabla de liquidación donde figura `ITS-GSP-2611-00034-001` en estado CONCLUIDO)*

3. **Portal Conductor / Desplazamiento del Equipo:**
   `https://servidor.leanglobal.cl/lg-gsp-dev/viaje/vj-82-42-e2e`

4. **Vista y Descarga del Documento Oficial PDF del EDP:**
   `https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/edp/proyecto/82/pdf`

5. **Vista y Descarga del Documento Oficial PDF del ITS:**
   `https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/preview-pdf/82`

---

## 4. Estado de Salud de la API DEV

Se realizaron comprobaciones HTTP directas contra el backend remoto en producción/dev (`138.255.103.18:1295`):
- `GET /api/operaciones/its/82` ➔ **HTTP 200 OK** (Payload JSON integro con proyecto, tripulación y costos)
- `GET /api/operaciones/report/edp/resumen/82` ➔ **HTTP 200 OK** (Resumen EDP conciliado)
- `GET /api/operaciones/report/pendientes-analista` ➔ **HTTP 200 OK** (KPI `edp_listos_facturar: 2`, OT 82 listada)
- `GET /api/operaciones/its/preview-pdf/82` ➔ **HTTP 200 OK** (`Content-Type: application/pdf`, generación PDF viva)
- `GET /api/operaciones/edp/proyecto/82/pdf` ➔ **HTTP 200 OK** (`Content-Type: application/pdf`, carátula oficial PDF viva)

**Conclusión:** La certificación QA End-to-End de ciclo completo de negocio está **100% aprobada y validada empíricamente**.
