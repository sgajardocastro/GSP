# Reporte Automatizado Capa 2 — 10 Arquetipos Dorados en Vivo (`DEV`)

- **Fecha Ejecucion:** `2026-11-15T01:10:04.189Z`
- **Endpoint API:** `https://servidor.leanglobal.cl/lg-gsp-dev/api`
- **Esquema BD:** `sch_leangsp` (100% Solo Lectura en QA: `13` SELECTs, `0` mutaciones SQL)
- **Llamadas HTTP Auditadas:** `115` (`0` errores HTTP >= 500)
- **Gate Negativo SPEC-129:** `9/9` combinaciones descartadas rechazadas con `HTTP 400`
- **Diferencia Matematica Maxima:** `$0 CLP` (Tolerancia exigida: `$0 CLP`)
- **Veredicto Global Capa 2:** **`10/10 PASS`**

## Tabla de Cuadratura Financiera y Casos Testigo Vivos (`G8` Cero Teardown)

| Codigo | ID Proyecto DEV | Folio OT | Cotizacion Base | Esperado Final | ITS Facturable | EDP Neto | Dif. CLP | PDF Auditado | Estado |
| :--- | :---: | :--- | ---: | ---: | ---: | ---: | ---: | :--- | :---: |
| `ARQ-01` | `168` | `GSP-2611-00110` | `$1.000.000` | `$1.000.000` | `$1.000.000` | `$1.000.000` | `$0` | `ARQ01_EDP_168.pdf` | **PASS** |
| `ARQ-02` | `169` | `GSP-2611-00111` | `$1.680.000` | `$1.680.000` | `$1.680.000` | `$1.680.000` | `$0` | `ARQ02_EDP_169.pdf` | **PASS** |
| `ARQ-03` | `170` | `GSP-2611-00112` | `$1.080.000` | `$1.080.000` | `$1.080.000` | `$1.080.000` | `$0` | `ARQ03_EDP_170.pdf` | **PASS** |
| `ARQ-04` | `171` | `GSP-2611-00113` | `$7.500.000` | `$7.500.000` | `$7.500.000` | `$7.500.000` | `$0` | `ARQ04_EDP_171.pdf` | **PASS** |
| `ARQ-05` | `172` | `RYL-2611-00011` | `$1.850.000` | `$2.154.000` | `$2.154.000` | `$2.154.000` | `$0` | `ARQ05_EDP_172.pdf` | **PASS** |
| `ARQ-06` | `173` | `RYL-2611-00012` | `$780.000` | `$780.000` | `$780.000` | `$780.000` | `$0` | `ARQ06_EDP_173.pdf` | **PASS** |
| `ARQ-07` | `174` | `GSP-2611-00114` | `$920.000` | `$920.000` | `$920.000` | `$920.000` | `$0` | `ARQ07_EDP_174.pdf` | **PASS** |
| `ARQ-08` | `175` | `GSP-2611-00115` | `$300.000` | `$300.000` | `$300.000` | `$300.000` | `$0` | `ARQ08_EDP_175.pdf` | **PASS** |
| `ARQ-09` | `176` | `INT-2611-00021` | `$0` | `$0` | `$0` | `$0` | `$0` | `ARQ09_EDP_176.pdf` | **PASS** |
| `ARQ-10` | `177` | `GSP-2611-00116` | `$2.350.000` | `$1.680.000` | `$1.680.000` | `$1.680.000` | `$0` | `ARQ10_EDP_177.pdf` | **PASS** |
