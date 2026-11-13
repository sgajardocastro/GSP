# REPORTE DE CERTIFICACIÓN QA INTEGRAL DE CICLO COMPLETO (E2E) — REQ-1083

---

## 1. Ficha de Ejecución y Veredicto Global

| Campo | Detalle |
| :--- | :--- |
| **Requerimiento / Especificación** | **REQ-1083** (`SPEC-016 v3.9.0` — Nuevo Formato de Serial del Negocio `[PREFIJO]-[YYMM]-[SECUENCIAL_5_DIGITOS]` con secuencia continua histórica `00001..99999`) |
| **Entorno Certificado** | **DEV** (`https://servidor.leanglobal.cl/lg-gsp-dev/` — Versión UI `v1.0.172`) |
| **Base de Datos Auditada** | PostgreSQL `138.255.103.18` — Base `postgres`, Esquema `sch_leangsp` |
| **Fecha / Hora de Ejecución** | `2026-11-02T02:08:13.487Z` |
| **Script Automatizado E2E** | [`QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/run_qa_req1083_dev.cjs`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/run_qa_req1083_dev.cjs) |
| **Resultado de Aserciones** | **17 / 17 PASS (100% Exitoso — 0 Fallos)** |
| **Política de Persistencia** | **CERO TEARDOWN** — Los Proyectos Testigo de `REQ-1083` (`167`, `168`, `169`) y los de `REQ-1082` (`158`, `159`, `160`) permanecen vivos e íntegros en `sch_leangsp` |
| **Veredicto Final** | **CERTIFICADO SIN OBSERVACIONES PARA PASO A QA OFICIAL** |

---

## 2. Registro de Proyectos Testigo Vivos en Base de Datos (`sch_leangsp`)

Se ejecutaron y certificaron los **4 Casos de Negocio** exigidos por `REQ-1083` (`SPEC-016 v3.9.0`), cuyos registros permanecen activos en `sch_leangsp.tpry_proyecto` para inspección en vivo desde la Torre de Control (`https://servidor.leanglobal.cl/lg-gsp-dev/torre`):

| Caso | `id_proyecto` | `codi_proyecto` | `nombre_proyecto` | Empresa Emisora (`id_empresa`) | Cliente (`id_empresa_cliente`) | Estado Final (`id_proyecto_estado`) | Documentos y Folios Derivados |
| :--- | :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| **Caso 1 (Primer Negocio Post-Reinicio — Ciclo Completo E2E)** | **`167`** | **`GSP-2611-00001`** | `[QA-REQ1083-C1-GSP00001] Izaje Industrial Planta Prolesur Temuco` | `9` (`GRÚAS SAN PABLO`) | `13` (`PROLESUR S.A.`) | **`6`** (`FINALIZADO / CONTABILIDAD`) | Cotización: `GSP-2611-00001V1-220.pdf`<br>OT: `OT-GSP-2611-00001V1-22.pdf`<br>Report Diario: `id_reporte_avance = 78` (`FES-REP-78-MVYME57K`)<br>Folio ITS: **`ITS-GSP-2611-00001-001`** |
| **Caso 2 (Segundo Negocio Correlativo Continuo — Distinto Cliente)** | **`168`** | **`GSP-2611-00002`** | `[QA-REQ1083-C2-GSP00002] Montaje Estructural Cliente Corporativo Sur` | `9` (`GRÚAS SAN PABLO`) | `12` (`CONSTRUCTORA PARRA LTDA`) | **`2`** (`REQUERIMIENTO REGISTRADO / PREVENTA`) | Cotización: `GSP-2611-00002V1-221.pdf` |
| **Caso 3 (Otra Empresa del Holding — Bestmaq)** | **`169`** | **`BMQ-2611-00001`** | `[QA-REQ1083-C3-BMQ00001] Maniobra Camión Pluma Bestmaq Planta Osorno` | `7` (`BESTMAQ`) | `13` (`PROLESUR S.A.`) | **`3`** (`EN VERIFICACIÓN OPERACIONES`) | Correlativo independiente `(BMQ, 0000, 1)` |
| **Caso 4 (Retrocompatibilidad Histórica 3 Dígitos)** | **`158`** | **`PRY-2610-13-019`** | `[QA-REQ1082-DEVUELTO] Montaje Industrial Planta Osorno` | `null` (`PRY`) | `13` (`PROLESUR S.A.`) | **`2`** (`DEVUELTO A PREVENTA COMERCIAL`) | Preserva intacto su código histórico de 3 dígitos tras `PUT /api/proyectos/158` |

---

## 3. Matriz de Aserciones y Verificación E2E de Ciclo Completo

Todas las aserciones fueron verificadas empíricamente contra la API real (`https://servidor.leanglobal.cl/lg-gsp-dev/api`) y auditadas directamente en PostgreSQL (`sch_leangsp`):

| Código Aserción | Etapa del Ciclo | Descripción de la Verificación | Estado | Evidencia Técnica / Resultado |
| :--- | :--- | :--- | :---: | :--- |
| `CORR-TRUNCATE-INIT` | Preparación BD | Reinicio de `sch_leangsp.tpry_correlativos` en `0` antes del primer negocio del nuevo formato | **PASS** | `COUNT(*) = 0` en `sch_leangsp.tpry_correlativos` |
| `C1-CREATE-SERIAL-5DIG` | Caso 1 — Preventa | Creación con `id_empresa=9` (`GSP`) e `id_empresa_cliente=13` genera **`GSP-2611-00001`** (5 dígitos, sin `id_cliente` incrustado) | **PASS** | `HTTP 201`, `id_proyecto = 167`, `codi_proyecto = "GSP-2611-00001"` |
| `C1-DB-CORRELATIVO-1` | Caso 1 — Base de Datos | Registro en `sch_leangsp.tpry_correlativos` usa clave continua `anio_mes = '0000'` con `ultimo_valor = 1` | **PASS** | `(prefijo = 'GSP', anio_mes = '0000', ultimo_valor = 1)` |
| `C1-IMMUTABLE-CLIENT-CHANGE` | Caso 1 — Inmutabilidad | Edición (`PUT /api/proyectos/167`) cambiando `id_empresa_cliente` de `13` a `12` y de vuelta a `13` preserva `GSP-2611-00001` sin consumir correlativo | **PASS** | `HTTP 200`, `codi_proyecto = "GSP-2611-00001"`, `ultimo_valor = 1` |
| `C1-COT-PDF-SERIAL` | Caso 1 — Cotización PDF | Emisión de cotización (`POST /api/proyectos/167/cotizaciones`) genera archivo con serial derivado `GSP-2611-00001V1-...` | **PASS** | `nombre_archivo = "GSP-2611-00001V1-220.pdf"`, `id_doc = 1614` |
| `C1-STATE3-GOVERNANCE` | Caso 1 — Operaciones | Transición a estado `3` conserva `GSP-2611-00001` y exige selección manual de Política Urbana/Rural (`regimen_operacional = ""`) | **PASS** | `id_proyecto_estado = 3`, `codi_proyecto = "GSP-2611-00001"`, `confirmado = false` |
| `C1-OT-PDF-SERIAL` | Caso 1 — Orden de Trabajo | Confirmación de `URBANO` y generación de OT (`POST /api/proyectos/167/generar-ot`) produce `OT-GSP-2611-00001V1-...` | **PASS** | `nombre_archivo = "OT-GSP-2611-00001V1-22.pdf"`, `id_doc = 1615` |
| `C1-REPORT-SAVE` | Caso 1 — Report Diario | Registro de Report Diario (`POST /api/operaciones/reports`) en régimen `URBANO` (08:00 a 17:00 - 1.0h colación = 8.0h facturables) | **PASS** | `HTTP 201`, `id_reporte_avance = 78`, `horas_facturables = 8.00` |
| `C1-REPORT-VALIDAR-FES` | Caso 1 — Firma FES | Validación FES (`PUT /api/operaciones/reports/78/validar`) con PIN `1234` liquida 8.0h faena y 0h flete (`$48.000`) | **PASS** | `estado_reporte = "VALIDADO_ANALISTA"`, `codigo_validacion_fes = "FES-REP-78-MVYME57K"` |
| `C1-ITS-FOLIO-AND-MATH` | Caso 1 — ITS / EDP | `GET /api/proyectos/167/its` expone folio **`ITS-GSP-2611-00001-001`**, `numero_ot = "GSP-2611-00001"`, ingreso `$680.000` y costo operador `$48.000` | **PASS** | `folio_its = "ITS-GSP-2611-00001-001"`, `total_ingresos_facturables = 680000` |
| `C2-CREATE-SERIAL-00002` | Caso 2 — Correlativo | Creación de segundo negocio (`id_empresa=9`, `id_empresa_cliente=12`) genera **`GSP-2611-00002`** continuo | **PASS** | `HTTP 201`, `id_proyecto = 168`, `codi_proyecto = "GSP-2611-00002"` |
| `C2-DB-CORRELATIVO-2` | Caso 2 — Base de Datos | `sch_leangsp.tpry_correlativos` incrementa `(GSP, 0000)` a `ultimo_valor = 2` sin particionar por cliente ni mes | **PASS** | `(prefijo = 'GSP', anio_mes = '0000', ultimo_valor = 2)` |
| `C2-COT-PDF-00002` | Caso 2 — Cotización PDF | Emisión de cotización (`POST /api/proyectos/168/cotizaciones`) genera `GSP-2611-00002V1-...` | **PASS** | `nombre_archivo = "GSP-2611-00002V1-221.pdf"`, `id_doc = 1618` |
| `C3-CREATE-BMQ-00001` | Caso 3 — Holding BMQ | Creación de oportunidad con `id_empresa=7` (`BESTMAQ`) genera **`BMQ-2611-00001`** iniciando en `00001` | **PASS** | `HTTP 201`, `id_proyecto = 169`, `codi_proyecto = "BMQ-2611-00001"` |
| `C3-DB-CORRELATIVO-BMQ` | Caso 3 — Base de Datos | `sch_leangsp.tpry_correlativos` mantiene secuencias independientes por empresa: `(BMQ, 0000, 1)` y `(GSP, 0000, 2)` | **PASS** | `BMQ -> 1`, `GSP -> 2` |
| `C4-RETROCOMPAT-3DIG` | Caso 4 — Retrocompatibilidad | Actualización (`PUT /api/proyectos/158`) de proyecto histórico con serial de 3 dígitos preserva `PRY-2610-13-019` | **PASS** | `HTTP 200`, `codi_proyecto = "PRY-2610-13-019"` (sin sobrescritura) |
| `FINAL-WITNESSES-ALIVE` | Persistencia Final | Verificación SQL final de que los proyectos `158`, `167`, `168` y `169` permanecen vivos en `sch_leangsp.tpry_proyecto` | **PASS** | 4 registros activos confirmados en BD |

---

## 4. Auditoría en Base de Datos (`sch_leangsp.tpry_correlativos` y `sch_leangsp.tpry_proyecto`)

### 4.1. Estado de `sch_leangsp.tpry_correlativos` (Secuencia Continua `anio_mes = '0000'`)

La consulta directa sobre `sch_leangsp.tpry_correlativos` certifica que el motor transaccional [`generarCodigoTransaccional`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/models/proyectoModel.js#L125-L173) utiliza la clave constante `anio_mes = '0000'` por prefijo de empresa del holding, garantizando numeración continua `00001..99999` sin reinicio mensual y sin depender de `id_empresa_cliente`:

| `prefijo` | `anio_mes` (Clave Continua) | `ultimo_valor` | Próximo Serial a Emitir |
| :---: | :---: | :---: | :---: |
| **`BMQ`** | `'0000'` | **`1`** | `BMQ-2611-00002` |
| **`GSP`** | `'0000'` | **`2`** | `GSP-2611-00003` |

### 4.2. Estado de `sch_leangsp.tpry_proyecto` y Documentos Derivados

| `id_proyecto` | `codi_proyecto` | Formato Regex Validado | Archivo Cotización PDF (`crm_v1.cotizaciones_historicas`) | Archivo OT PDF (`ejecucion_v1.ot_versiones`) | Folio ITS (`getITS`) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **`167`** | **`GSP-2611-00001`** | `5 dígitos (Nuevo)` | `GSP-2611-00001V1-220.pdf` (`/api/archivo/ver/1614`) | `OT-GSP-2611-00001V1-22.pdf` (`/api/archivo/ver/1615`) | `ITS-GSP-2611-00001-001` |
| **`168`** | **`GSP-2611-00002`** | `5 dígitos (Nuevo)` | `GSP-2611-00002V1-221.pdf` (`/api/archivo/ver/1618`) | *En etapa Preventa (Estado 2)* | *En etapa Preventa (Estado 2)* |
| **`169`** | **`BMQ-2611-00001`** | `5 dígitos (Nuevo)` | *En Verificación Operaciones (Estado 3)* | *En Verificación Operaciones (Estado 3)* | *En Verificación Operaciones (Estado 3)* |
| **`158`** | **`PRY-2610-13-019`** | `3 dígitos (Histórico)` | `PRY-2610-13-019V1-213.pdf` | *Devuelto a Preventa (Estado 2)* | *Devuelto a Preventa (Estado 2)* |

---

## 5. Matriz de Conciliación Financiera del Caso 1 (`GSP-2611-00001` / `ITS-GSP-2611-00001-001`)

Para certificar que el nuevo serial de 5 dígitos (`GSP-2611-00001`) fluye sin fricción hasta la valorización y liquidación final, el **Caso 1 (`id_proyecto = 167`)** completó todo el ciclo operativo hasta su Informe de Término de Servicio (**`ITS-GSP-2611-00001-001`**):

| Dimensión | Parámetros de Entrada | Fórmula Aplicada | Resultado Auditado en BD y API |
| :--- | :--- | :--- | :--- |
| **A. Cobro al Cliente (EDP)** | • Régimen confirmado: **`URBANO`** (`15 km`)<br>• Salida Base: `08:00` \| Inicio: `08:45` \| Término: `17:00` \| Retorno: `17:45`<br>• Colación: `1.0 hr`<br>• Piso Mínimo: `6.0 hrs` a `$85.000/hr` | $\text{Horas Base}\to\text{Término} = (17.0 - 8.0) - 1.0 = 8.0\text{ hrs}$<br>$\text{Facturable} = \max(8.0, 6.0) = 8.0\text{ hrs}$<br>$\text{Sobretiempo} = 8.0 - 6.0 = 2.0\text{ hrs}$ | • `numero_ot`: **`GSP-2611-00001`**<br>• `horas_facturables`: **`8.00 hrs`**<br>• `total_ingresos_horas`: **`$680.000`**<br>• `total_ingresos_fletes`: **`$0`**<br>• `total_ingresos_facturables`: **`$680.000`** |
| **B. Incentivo al Trabajador (RRHH)** | • Operador: `Omar Ghiselini` (`id_user = 66`)<br>• Equipo: `LTM-1070` (`STDD.68-4`, `70 TON`)<br>• Tarifa Catálogo (`tpar_tarifa_operador`): `$6.000/hr` | En **`URBANO`**, el traslado está contenido en las horas de servicio:<br>$\text{horas\_faena\_pagar} = 8.0\text{ hrs}$<br>$\text{horas\_flete\_pagar} = 0\text{ hrs}$ | • `horas_faena_pagar`: **`8.0 hrs`** (`$48.000`)<br>• `horas_flete_pagar`: **`0.0 hrs`** (`$0`)<br>• `monto_total_hora_operador`: **`$48.000`**<br>• `monto_viatico_operador`: **`$8.000`** (`Ida y Regreso`) |

---

## 6. Galería de Evidencia Visual Real en Navegador (`https://servidor.leanglobal.cl/lg-gsp-dev/`)

Todas las capturas fueron tomadas en navegador real (Puppeteer Chromium a `1536x960`) contra el entorno DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`):

### 6.1. Torre de Control Operativa con Tarjetas de 5 Dígitos (`GSP-2611-00001`, `GSP-2611-00002`, `BMQ-2611-00001`)
Archivo: [`QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/01_torre_control_serial_5_digitos.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/01_torre_control_serial_5_digitos.png)
- Se visualizan simultáneamente en el tablero Kanban los 3 negocios creados con el nuevo formato `[PREFIJO]-[YYMM]-[SECUENCIAL_5_DIGITOS]`: **`GSP-2611-00002`** en `REQUERIMIENTO REGISTRADO`, **`BMQ-2611-00001`** en `EN VERIFICACIÓN OPERACIONES` y **`GSP-2611-00001`** en `FINALIZADO / CONTABILIDAD`.

### 6.2. Preventa Comercial y Estructurador de Servicios de `[GSP-2611-00001]`
Archivo: [`QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/02_preventa_cabecera_y_cotizacion_gsp_00001.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/02_preventa_cabecera_y_cotizacion_gsp_00001.png)
- Se observa la cabecera **`[GSP-2611-00001]`** en `1. PREVENTA COMERCIAL` junto con los datos del cliente (`PROLESUR S.A.`), la empresa emisora (`SAN PABLO`) y el Estructurador Comercial de Servicios.

### 6.3. Operaciones, Asignación de Recursos y Orden de Trabajo (`OT-GSP-2611-00001V1-22.pdf`)
Archivo: [`QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/03_operaciones_validacion_y_ot_gsp_00001.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/03_operaciones_validacion_y_ot_gsp_00001.png)
- Se visualiza la etapa `3. ASIGNACIÓN RECURSOS OT` de **`[GSP-2611-00001]`** con `POLÍTICA URBANA` confirmada (`15 km`), equipo `STDD.68-4 - LIEBHERR LTM-1070`, operador `Omar Ghiselini` y botón `Generar PDF OT` (`OT-GSP-2611-00001V1-22.pdf`).

### 6.4. Informe de Término de Servicio (`ITS-GSP-2611-00001-001`) y Conciliación Económica
Archivo: [`QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/04_its_folio_gsp_00001.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/evidencia/04_its_folio_gsp_00001.png)
- Se visualiza el módulo de Valorización e ITS de **`[GSP-2611-00001]`** con el badge oficial **`ITS-GSP-2611-00001-001 (v1)`**, subtítulo `OT: GSP-2611-00001 · Cliente: PROLESUR S.A.` y `VENTA NETA PROYECTADA $ 680.000`.

---

## 7. Comando de Reproducibilidad Determinista

Para volver a ejecutar la suite automatizada de ciclo completo en cualquier momento:

```powershell
node "QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/run_qa_req1083_dev.cjs"
```

Resultados estructurados JSON disponibles en:
- [`QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/qa_audit_results.json`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1083_Serial_Negocio_5_Digitos_DEV/qa_audit_results.json)
