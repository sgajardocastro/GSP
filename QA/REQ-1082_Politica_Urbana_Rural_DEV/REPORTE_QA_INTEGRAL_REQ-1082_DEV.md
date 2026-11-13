# Reporte de Certificación QA Integral — REQ-1082 / SPEC-016 v3.8.0 (Ambiente DEV)

**Fecha de Ejecución:** 30 de Octubre de 2026  
**Ambiente Certificado:** DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)  
**Motor de Base de Datos:** PostgreSQL (`138.255.103.18:1295`, BD `postgres`, Esquema `sch_leangsp`)  
**Especificaciones Auditadas:** `SPEC-016 v3.8.0` (Torre de Control Operativa y Flujo B2B), `SPEC-078` (Tarifario de Incentivo Operador y Fletes), `SPEC-106` (Liquidación Diaria de Personal en Report Diario e ITS)  
**Estado General de la Suite:** **APROBADO (19/19 Aserciones Deterministas Cumplidas — 100% PASS)**  
**Política de Datos de Prueba:** **NO TEARDOWN** (Los 3 Proyectos Testigo permanecen vivos en `sch_leangsp` para inspección directa del usuario)

---

## 1. Resumen Ejecutivo

Se ejecutó la suite automatizada reproducible de ciclo completo de negocio [`run_qa_req1082_dev.cjs`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/run_qa_req1082_dev.cjs) contra el entorno remoto **DEV**, verificando empíricamente en base de datos (`sch_leangsp`), capa de servicios REST (`/lg-gsp-dev/api`) e interfaz gráfica real en navegador (Puppeteer) los cinco pilares de **REQ-1082**:

1. **Autonomía del Estructurador Comercial en Preventa (Etapa 1):**
   - Eliminación total del antiguo selector guiado de 4 tarjetas comerciales.
   - Estructuración libre de líneas de servicio (`GRUAS TELESCOPICAS`, `CAMIONES`, `TRASLADOS`, etc.).
   - Registro obligatorio del campo **Distancia Estimada a la Obra (`distancia_km`, km ida)** como antecedente técnico-comercial para Operaciones, persistido tanto en el proyecto como en el snapshot de cotizaciones PDF.
2. **Definición Obligatoria de Política Operacional (`URBANO` / `RURAL`) en Verificación de Operaciones (Etapa 2):**
   - Ningún proyecto que ingresa a estado `3` (`VERIFICACIÓN OPERACIONES`) trae preseleccionada automáticamente la política operacional, incluso si `distancia_km > 30` (`55 km`).
   - El sistema inicializa `regimen_operacional = ""` y `regimen_operacional_confirmado = false`, mostrando el bloque de advertencia obligatoria y bloqueando la aprobación hacia Asignación OT hasta que Operaciones seleccione explícitamente **Política Urbana (`URBANO`)** o **Política Rural (`RURAL`)**.
3. **Flujo de Rechazo / Devolución desde Operaciones a Preventa Comercial (`POST /api/proyectos/:id/reversar-a-cotizacion`):**
   - Validación estricta de motivo obligatorio (`>= 5` caracteres; rechaza con `HTTP 400` cualquier motivo vacío o corto).
   - Retorno transaccional del proyecto a `id_proyecto_estado = 2` (`COTIZANDO`), registrando `motivo_reverso_verificacion`, `fecha_reverso_verificacion` (ISO-8601), `usuario_reverso_verificacion` y acumulando el evento en `historial_reversos_verificacion` (tanto en `crm_v1` como en `ejecucion_v1`), además de reiniciar la confirmación de política operacional (`regimen_operacional = ""`, `regimen_operacional_confirmado = false`).
   - Despacho de notificaciones multicanal (`EMAIL` y `WHATSAPP`) auditadas en `sch_leangsp.tnot_notification_log` bajo el evento `PROYECTO_REVERSADO_A_COMERCIAL`.
   - Visualización inmediata del banner rojo de alerta en Preventa Comercial y del antecedente histórico de devolución al re-enviar a Operaciones.
4. **Regla de Negocio — Política Urbana (`URBANO`) en Report Diario, EDP Mandante e Incentivo RRHH / ITS:**
   - **Cobro al Cliente (EDP / ITS):** El tiempo de servicio se contabiliza desde la **hora de salida de la base (`hora_salida_patio`)** hasta el **término en obra (`hora_termino`)**, descontando colación, y aplicando el piso de horas mínimas pactadas (`MAX(horas_base_a_termino, horas_minimas)`).
   - **Incentivo al Trabajador (RRHH / ITS `COSTO_HORA_OPERADOR`):** En régimen `URBANO` **no se paga traslado (`horas_flete_pagar = 0`, `monto_flete_total = 0`)**; el operador percibe únicamente las horas reportadas del servicio (`horas_faena_pagar = horas_reales_equipo`).
5. **Regla de Negocio — Política Rural (`RURAL`) en Report Diario, EDP Mandante e Incentivo RRHH / ITS:**
   - **Cobro al Cliente (EDP / ITS):** El tiempo de operación se mide desde el **inicio en obra (`hora_inicio`)** hasta el **término en obra (`hora_termino`)**, descontando colación, aplicando el piso mínimo (`MAX(horas_obra, horas_minimas)`) más el ítem comercial de **Traslado (`TRASLADOS`)** pactado.
   - **Incentivo al Trabajador (RRHH / ITS `COSTO_HORA_OPERADOR`):** Se garantiza el piso mínimo de horas de faena (`horas_faena_pagar = MAX(horas_reales_obra, horas_minimas)`) y opera la **regla de absorción de brecha para el traslado**:
     - Si `horas_reales_obra < horas_minimas`, la brecha no trabajada absorbe primero las horas de traslado: `horas_flete_pagar = MAX(0, (horas_reales_obra + horas_traslado_bruto) - horas_minimas)`.
     - Si `horas_reales_obra >= horas_minimas`, el operador recibe el 100% de las horas reales de obra más el 100% de las horas de traslado (`horas_flete_pagar = horas_traslado_bruto`).

---

## 2. Inventario de los 3 Proyectos Testigo Vivos en DEV (`NO TEARDOWN`)

Los siguientes 3 proyectos permanecen activos en `sch_leangsp.tpry_proyecto` dentro del ambiente DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`):

| # | Rol de Prueba | `id_proyecto` | Código (`codi_proyecto`) | Nombre del Proyecto (`nombre_proyecto`) | Estado Final BD (`id_proyecto_estado`) | Distancia (`distancia_km`) | Política (`regimen_operacional`) | Confirmado (`confirmado`) | Report Diario (`id_reporte_avance`) | Folio ITS |
| :-: | :--- | :-: | :---: | :--- | :---: | :-: | :---: | :-: | :-: | :---: |
| **1** | **Devuelto a Preventa** | **`158`** | `PRY-2610-13-019` | `[QA-REQ1082-DEVUELTO] Montaje Industrial Planta Osorno` | `2` (`COTIZANDO`) | `22 km` | `""` (Pendiente) | `false` | N/A | N/A |
| **2** | **Ciclo Completo Urbano** | **`159`** | `PRY-2610-13-020` | `[QA-REQ1082-URBANO] Izaje Urbano Parque Industrial Temuco` | `6` (`EN_EJECUCION`) | `15 km` | `URBANO` | `true` | `74` (`VALIDADO_ANALISTA`) | `ITS-PRY-2610-13-020-001` |
| **3** | **Ciclo Completo Rural** | **`160`** | `PRY-2610-13-021` | `[QA-REQ1082-RURAL] Montaje Estructural Faena Rural Loncoche` | `6` (`EN_EJECUCION`) | `55 km` | `RURAL` | `true` | `76` (`VALIDADO_ANALISTA`) | `ITS-PRY-2610-13-021-001` |

---

## 3. Matriz de Aserciones Ejecutadas (19/19 PASS)

| Código | Descripción de la Aserción | Resultado | Evidencia Empírica Clave |
| :--- | :--- | :---: | :--- |
| `P1-CREATE` | Creación de Proyecto Testigo 1 en Preventa (`estado 2`) con `distancia_km=22` y estructurador libre | **PASS** | `HTTP 201`, `id_proyecto = 158`, `codi_proyecto = PRY-2610-13-019` |
| `P1-COT-PDF` | Emisión de cotización formal en PDF con `condiciones_pdf` y `distancia_km=22` | **PASS** | `HTTP 200`, `id_cotizacion = 213`, archivo `PRY-2610-13-019V1-213.pdf` (`/api/archivo/ver/1592`) |
| `P1-STATE-3` | Avance de Proyecto Testigo 1 a estado `3` (`VERIFICACIÓN OPERACIONES`) sin preselección de política | **PASS** | `HTTP 200`, transición a `id_proyecto_estado = 3` |
| `P1-DB-STATE3-PENDING` | En estado `3` el proyecto exige selección manual (`regimen_operacional=""` y `confirmado=false`) | **PASS** | `id_proyecto_estado = 3`, `regimen_ejec = ""`, `confirmado_ejec = false` |
| `P1-REVERSO-400` | Rechazo `HTTP 400` al intentar devolver a Preventa Comercial con motivo `< 5` caracteres (`"abc"`) | **PASS** | `HTTP 400`: `"El motivo de la devolución es obligatorio (mínimo 5 caracteres)."` |
| `P1-REVERSO-200` | Devolución exitosa de Proyecto Testigo 1 a Preventa Comercial (`HTTP 200` -> `id_proyecto_estado=2`) | **PASS** | `HTTP 200`, `id_proyecto_estado = 2` |
| `P1-DB-REVERSO-AUDIT` | Auditoría BD post-reverso en `tpry_proyecto` (`estado=2`, motivo, fecha ISO, usuario, `historial>=1` y reset de política) | **PASS** | `crm_fecha = 2026-10-30T21:03:58.796Z`, `crm_hist_len = 1`, `crm_regimen = ""`, `crm_confirmado = false` |
| `P1-DB-NOTIF-LOG` | Auditoría BD en `sch_leangsp.tnot_notification_log` para evento `PROYECTO_REVERSADO_A_COMERCIAL` | **PASS** | `id_log` `784..789` (`EMAIL` y `WHATSAPP` a Comercial, Jefatura Operaciones y Control Flota) |
| `P2-CREATE` | Creación de Proyecto Testigo 2 (`URBANO`, `distancia_km=15`, `6h` mínimas a `$85.000/hr`) | **PASS** | `HTTP 201`, `id_proyecto = 159`, `codi_proyecto = PRY-2610-13-020` |
| `P2-COT-PDF` | Emisión de cotización PDF para Proyecto Testigo 2 | **PASS** | `HTTP 200`, `id_cotizacion = 214`, archivo `PRY-2610-13-020V1-214.pdf` (`/api/archivo/ver/1593`) |
| `P2-REVERSO-1` | Devolución de Proyecto Testigo 2 a Preventa Comercial con motivo `"Ajustar descripción de maniobra urbana"` | **PASS** | `HTTP 200`, `id_proyecto_estado = 2` |
| `P2-RESEND-STATE3` | Re-envío de Proyecto Testigo 2 a estado `3` preservando `historial_reversos_verificacion` y exigiendo política manual | **PASS** | `HTTP 200`, `historial_reversos_verificacion.length = 1` |
| `P3-CREATE` | Creación de Proyecto Testigo 3 (`RURAL`, `distancia_km=55`, `8h` mínimas a `$95.000/hr` + Traslado `$350.000`) | **PASS** | `HTTP 201`, `id_proyecto = 160`, `codi_proyecto = PRY-2610-13-021` |
| `P3-COT-PDF` | Emisión de cotización PDF para Proyecto Testigo 3 | **PASS** | `HTTP 200`, `id_cotizacion = 215`, archivo `PRY-2610-13-021V1-215.pdf` (`/api/archivo/ver/1594`) |
| `P3-DB-STATE3-PENDING` | En estado `3`, a pesar de tener `55 km`, el proyecto NO preselecciona `RURAL` automáticamente | **PASS** | `id_proyecto = 160`, `distancia_km = "55"`, `regimen_ejec = ""`, `confirmado_ejec = false` |
| `P2-REPORT-SAVE` | Guardado de Report Diario en Proyecto Testigo 2 (`URBANO`: `08:00` base -> `17:00` término - `1.0h` colación = `8.0h` facturables) | **PASS** | `id_reporte_avance = 74`, `horas_minimas = 6.00`, `horas_facturables = 8.00`, `horas_sobretiempo = 2.00` |
| `P2-REPORT-VALIDAR-FES` | Validación FES de Report Diario Urbano y cálculo de liquidación RRHH (`horas_flete_pagar=0`, `monto_flete_total=0`, `horas_faena_pagar=8.0`) | **PASS** | `estado_reporte = VALIDADO_ANALISTA`, `horas_faena_pagar = 8`, `horas_flete_pagar = 0`, `monto_flete_total = 0`, `monto_faena_total = 48000` |
| `P2-ITS-CONCILIACION` | Conciliación ITS Proyecto Testigo 2 (`URBANO`): Cliente `8.0 hrs` (`$680.000`) y Operador `8.0 hrs` faena + `0 hrs` flete (`$48.000`) | **PASS** | `total_ingresos_horas = 680000`, `total_ingresos_fletes = 0`, `horas_faena_pagar = 8`, `horas_flete_pagar = 0`, `monto_total = 48000` |
| `P2-SUBCASO-URBANO-MENOR-MIN` | Subcaso `URBANO` (`4.0 hrs < 6.0 hrs` mín): Cliente paga piso mínimo (`6.0 hrs`) y Operador recibe `0 hrs` flete y `4.0 hrs` reportadas | **PASS** | `cobro_cliente_horas = 6.0`, `horas_faena_pagar = 4.0`, `horas_flete_pagar = 0`, `horas_totales_pagar = 4.0` |
| `P3-REPORT-SAVE` | Guardado de Report Diario en Proyecto Testigo 3 (`RURAL`: `6.0h` reales en obra -> aplica piso mínimo `8.0h` facturables al cliente) | **PASS** | `id_reporte_avance = 76`, `horas_operadas = 6.00`, `horas_minimas = 8.00`, `horas_facturables = 8.00`, `horas_sobretiempo = 0.00` |
| `P3-REPORT-VALIDAR-FES` | Validación FES de Report Diario Rural y regla de absorción de brecha: `horas_faena_pagar=8.0`, `horas_flete_pagar=(6.0+3.0)-8.0=1.0 hr` | **PASS** | `estado_reporte = VALIDADO_ANALISTA`, `horas_faena_pagar = 8`, `horas_flete_pagar = 1`, `horas_totales_pagar = 9`, `monto_total_hora_operador = 54000` |
| `P3-ITS-CONCILIACION` | Conciliación ITS Proyecto Testigo 3 (`RURAL`): Cliente `8.0h` (`$760.000`) + Flete (`$350.000`) = `$1.110.000` y Operador `8.0h` faena + `1.0h` flete = `9.0h` (`$54.000`) | **PASS** | `total_ingresos_horas = 760000`, `total_ingresos_fletes = 350000`, `total_ingresos_facturables = 1110000`, `cantidad_unidades = 9`, `monto_total = 54000` |
| `P3-SUBCASO-RURAL-A` | Subcaso `RURAL A` (`4.0h` reales + `2.5h` flete = `6.5h <= 8.0h` mín): `horas_faena_pagar=8.0`, `horas_flete_pagar=0` | **PASS** | `horas_reales_equipo = 4`, `horas_faena_pagar = 8`, `horas_flete_pagar = 0`, `horas_totales_pagar = 8` |
| `P3-SUBCASO-RURAL-B` | Subcaso `RURAL B` (`9.0h` reales `>= 8.0h` mín + `3.0h` flete): `horas_faena_pagar=9.0`, `horas_flete_pagar=3.0`, `totales=12.0` | **PASS** | `horas_reales_equipo = 9`, `horas_faena_pagar = 9`, `horas_flete_pagar = 3`, `horas_totales_pagar = 12` |
| `FINAL-3-WITNESSES-ALIVE` | Los 3 Proyectos Testigo permanecen vivos en `sch_leangsp` (`DEV`) en sus estados objetivo (`2`, `6` y `6`) | **PASS** | `id_proyecto IN (158, 159, 160)` verificados en `sch_leangsp.tpry_proyecto` |

---

## 4. Auditoría de Base de Datos (`sch_leangsp`) y Notificaciones

### 4.1 Trazabilidad de Devolución en `sch_leangsp.tpry_proyecto` (Proyecto Testigo 1 — `id_proyecto = 158`)

```json
{
  "id_proyecto": 158,
  "codi_proyecto": "PRY-2610-13-019",
  "nombre_proyecto": "[QA-REQ1082-DEVUELTO] Montaje Industrial Planta Osorno",
  "id_proyecto_estado": 2,
  "distancia_km": 22,
  "motivo_reverso_verificacion": "Rechazado por Operaciones: Se requiere agregar flete de contrapesos adicionales y ajustar ventana horaria de ingreso a planta.",
  "fecha_reverso_verificacion": "2026-10-30T21:03:58.796Z",
  "usuario_reverso_verificacion": "{\"nombre\": \"Operaciones\", \"id_user\": null}",
  "historial_reversos_len": 1,
  "regimen_operacional": "",
  "regimen_operacional_confirmado": false
}
```

### 4.2 Registro en `sch_leangsp.tnot_notification_log` (`PROYECTO_REVERSADO_A_COMERCIAL`)

Al ejecutar `POST /api/proyectos/158/reversar-a-cotizacion`, el motor de notificaciones registró los despachos multicanal en `sch_leangsp.tnot_notification_log`:

| `id_log` | `evento` | `canal` | `destinatario` | `fecha_registro` |
| :-: | :--- | :---: | :--- | :--- |
| `789` | `PROYECTO_REVERSADO_A_COMERCIAL` | `WHATSAPP` | `+56968320225` | `2026-10-30T18:03:59.841951` |
| `788` | `PROYECTO_REVERSADO_A_COMERCIAL` | `EMAIL` | `controlflota@arriendosanpablo.cl` | `2026-10-30T18:03:59.825011` |
| `787` | `PROYECTO_REVERSADO_A_COMERCIAL` | `WHATSAPP` | `+56994437725` | `2026-10-30T18:03:59.736884` |
| `786` | `PROYECTO_REVERSADO_A_COMERCIAL` | `EMAIL` | `omar.ghiselini@arriendosanpablo.cl` | `2026-10-30T18:03:59.546910` |
| `785` | `PROYECTO_REVERSADO_A_COMERCIAL` | `WHATSAPP` | `+56977501322` | `2026-10-30T18:03:59.457120` |
| `784` | `PROYECTO_REVERSADO_A_COMERCIAL` | `EMAIL` | `j.poncenavarrete@gmail.com` | `2026-10-30T18:03:59.439812` |

---

## 5. Conciliación Matemática Integral: Cobro al Cliente (EDP) vs. Incentivo al Trabajador (RRHH / ITS)

### 5.1 Tabla Comparativa de Proyectos Testigo 2 (`URBANO`) y 3 (`RURAL`)

| Dimensión / Métrica | Proyecto Testigo 2 (`id_proyecto = 159` — `URBANO`) | Proyecto Testigo 3 (`id_proyecto = 160` — `RURAL`) |
| :--- | :--- | :--- |
| **Código OT / Folio ITS** | `PRY-2610-13-020` / `ITS-PRY-2610-13-020-001` | `PRY-2610-13-021` / `ITS-PRY-2610-13-021-001` |
| **Equipo / Tonelaje Comercial** | `LIEBHERR LTM-1070` (`STDD.68-4`) — `70 TON` | `LIEBHERR LTM-1090` (`DZXL.25-3`) — `90 TON` |
| **Distancia Vial de Ida (`distancia_km`)** | `15 km` | `55 km` |
| **Política Confirmada por Operaciones** | **`URBANO`** (`confirmado = true`) | **`RURAL`** (`confirmado = true`) |
| **Piso Mínimo Contractual (`horas_minimas`)** | `6.0 hrs` | `8.0 hrs` |
| **Tarifa Hora Cliente / Flete Pactado** | `$85.000 / hr` (Sin línea de flete: `$0`) | `$95.000 / hr` + Línea `TRASLADOS` (`$350.000`) |
| **Hitos Horarios del Día (`2026-10-30`)** | Salida Base: `08:00` \| Inicio Obra: `08:45` \| Término Obra: `17:00` \| Retorno Base: `17:45` \| Colación: `1.0 hr` | Salida Base: `07:00` \| Inicio Obra: `08:30` \| Término Obra: `14:30` \| Retorno Base: `16:00` \| Colación: `0.0 hr` |
| **Cálculo Horas Facturables al Cliente (EDP)** | Desde salida de base (`08:00`) a término en obra (`17:00`) - `1.0h` colación = **`8.0 hrs`** (`6.0h` base + `2.0h` sobretiempo) | Desde inicio en obra (`08:30`) a término en obra (`14:30`) = `6.0 hrs` reales `< 8.0h` mín -> aplica piso mínimo **`8.0 hrs`** |
| **Facturación Neta Cliente (`total_ingresos_facturables`)** | `8.0 hrs x $85.000` = **`$680.000`** | `(8.0 hrs x $95.000) + $350.000` = **`$1.110.000`** (`$760.000` hrs + `$350.000` flete) |
| **Tarifa Bono Operador (`SPEC-078`, Tramo 70T–90T)** | `$6.000 / hr` | `$6.000 / hr` |
| **Horas Faena Operador (`horas_faena_pagar`)** | **`8.0 hrs`** (Horas del servicio urbano reportadas) | **`8.0 hrs`** (Garantía de piso mínimo contractual) |
| **Horas Flete Operador (`horas_flete_pagar`)** | **`0.0 hrs`** (Política Urbana: sin pago de traslado) | **`1.0 hr`** (`(6.0h reales + 3.0h flete) - 8.0h mín = 1.0h` excedente tras absorber brecha de `2.0h`) |
| **Total Horas Pagadas al Operador (`cantidad_unidades`)** | **`8.0 hrs`** | **`9.0 hrs`** (`8.0h` faena + `1.0h` flete) |
| **Incentivo Hora Operador (`monto_total`)** | `8.0 hrs x $6.000` = **`$48.000`** (`monto_flete_total = $0`) | `9.0 hrs x $6.000` = **`$54.000`** (`$48.000` faena + `$6.000` flete) |
| **Viático Alimentación (`monto_viatico_operador`)** | `$8.000` (`08:00` a `17:45` - `1h` colación = `8.75h` -> `9h`) | `$8.000` (`07:00` a `16:00` = `9.0h`) |
| **Costo Total Día Operador en ITS** | **`$56.000`** | **`$62.000`** |

### 5.2 Verificación de Todos los Subcasos Matemáticos de `URBANO` y `RURAL`

| Subcaso | Régimen | Horas Mínimas | Horas Servicio / Obra | Horas Traslado Bruto | Cobro al Cliente (EDP) | `horas_faena_pagar` (RRHH) | `horas_flete_pagar` (RRHH) | `horas_totales_pagar` (RRHH) | Regla Verificada |
| :--- | :---: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :--- |
| **Urbano >= Mínimo** (Proyecto Testigo 2) | `URBANO` | `6.0 hrs` | `8.0 hrs` (`08:00` a `17:00` - `1h`) | `1.5 hrs` (`0.75h` ida + `0.75h` vuelta) | **`8.0 hrs`** (`6.0h` + `2.0h` extra) | **`8.0 hrs`** | **`0.0 hrs`** | **`8.0 hrs`** | En Urbano se cobra al cliente desde salida de base a término en obra; el operador recibe `0 hrs` de flete |
| **Urbano < Mínimo** (`P2-SUBCASO-URBANO-MENOR-MIN`) | `URBANO` | `6.0 hrs` | `4.0 hrs` (`08:00` a `12:00`) | `1.0 hr` | **`6.0 hrs`** (Piso mínimo cliente) | **`4.0 hrs`** | **`0.0 hrs`** | **`4.0 hrs`** | Cliente paga piso mínimo (`6.0 hrs`); operador urbano recibe las horas reportadas (`4.0 hrs`) y `0 hrs` de flete |
| **Rural Absorción Parcial** (Proyecto Testigo 3) | `RURAL` | `8.0 hrs` | `6.0 hrs` (`08:30` a `14:30`) | `3.0 hrs` (`1.5h` ida + `1.5h` vuelta) | **`8.0 hrs`** + Flete (`$350.000`) | **`8.0 hrs`** | **`1.0 hr`** | **`9.0 hrs`** | Brecha de `2.0 hrs` absorbe `2.0 hrs` del flete; se paga solo la diferencia positiva `(6.0 + 3.0) - 8.0 = 1.0 hr` |
| **Rural Absorción Total** (`P3-SUBCASO-RURAL-A`) | `RURAL` | `8.0 hrs` | `4.0 hrs` (`08:30` a `12:30`) | `2.5 hrs` (`1.25h` ida + `1.25h` vuelta) | **`8.0 hrs`** + Flete | **`8.0 hrs`** | **`0.0 hrs`** | **`8.0 hrs`** | Como `4.0 + 2.5 = 6.5 hrs <= 8.0 hrs`, la brecha absorbe el 100% del traslado (`horas_flete_pagar = 0`) |
| **Rural Sobre el Mínimo** (`P3-SUBCASO-RURAL-B`) | `RURAL` | `8.0 hrs` | `9.0 hrs` (`08:30` a `17:30`) | `3.0 hrs` (`1.5h` ida + `1.5h` vuelta) | **`9.0 hrs`** + Flete | **`9.0 hrs`** | **`3.0 hrs`** | **`12.0 hrs`** | Como `9.0 hrs >= 8.0 hrs`, no existe brecha ociosa y se paga el 100% de la obra (`9.0h`) + el 100% del flete (`3.0h`) |

---

## 6. Hallazgos Detectados y Correcciones Aplicadas en DEV

Durante la ejecución de la auditoría determinista de ciclo completo se identificaron y corrigieron en el backend de DEV (`/home/nodeadmin/proyectos/lean-services-gsp/`, PM2 proceso `10`) los siguientes defectos de integración:

1. **[`tarifasOperadorService.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/services/tarifasOperadorService.js) (`calcularLiquidacionHorasDia`):**
   - **Causa Raíz:** En régimen `URBANO` (`!esRural`), la función medía el tiempo de faena desde `hora_llegada || hora_inicio` hasta `hora_termino`, ignorando el tramo desde `hora_salida` (salida de base) cuando se invocaba desde la liquidación del Report Diario / ITS.
   - **Solución:** Se alineó el inicio del cómputo urbano a `hora_salida || hora_inicio || hora_llegada` hasta `hora_termino || hora_retorno` menos colación, garantizando `horas_flete_pagar = 0` y `monto_flete_total = 0`.
2. **[`reportDiarioController.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/controllers/reportDiarioController.js) (`construirLiquidacionPersonalDiaReport`, `guardarReportDiario`, `validarReportDiario`):**
   - **Causa Raíz 1:** `tequ_log_desplazamiento` almacena marcas `TIMESTAMPTZ` (`fecha_salida_patio`, `fecha_llegada_faena`, `fecha_salida_faena`, `fecha_llegada_patio`), mientras que `construirLiquidacionPersonalDiaReport` buscaba propiedades `HH:MM` (`hora_salida_patio`, `hora_llegada_patio`) que no estaban normalizadas en la consulta SQL de `validarReportDiario`.
   - **Causa Raíz 2:** En `guardarReportDiario`, la consulta de salida de patio para `URBANO` referenciaba una columna inexistente (`fecha_viaje`) en `tequ_log_desplazamiento`, y al emitir el último report diario, `viajeModel.crearViajeRetorno` insertaba un segundo registro `RETORNO` vacío que eclipsaba el `hora_llegada_patio` del registro `IDA_Y_VUELTA`.
   - **Solución:** Se normalizaron todos los timestamps en zona horaria `America/Santiago`, se corrigió la consulta de `tequ_log_desplazamiento`, se sincronizó automáticamente la bitácora de desplazamiento al recibir `hora_salida_patio` / `hora_llegada_patio` en `guardarReportDiario`, y se priorizaron los registros con marcas horarias pobladas tanto en `reportDiarioController.js` como en [`viajeModel.js`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/backend_remoto/src/models/viajeModel.js).

---

## 7. Galería de Evidencia Visual Real en Navegador (9 Capturas en DEV)

Todas las capturas fueron tomadas con Puppeteer en resolución `1536x960` contra `https://servidor.leanglobal.cl/lg-gsp-dev/` y se encuentran almacenadas en `QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/`:

1. **[`01_preventa_estructurador_libre_distancia.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/01_preventa_estructurador_libre_distancia.png):** Preventa Comercial (`PRY-2610-13-019`) mostrando la pestaña `Estructurador de Servicios` en modalidad autónoma libre, sin tarjetas de 4 casos guiados, con líneas de servicio editables y acuerdos comerciales.
2. **[`02_preventa_datos_servicio_distancia.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/02_preventa_datos_servicio_distancia.png):** Pestaña `Datos Servicio & Visita` en Preventa Comercial mostrando el campo obligatorio `Distancia Estimada a la Obra (km ida) *: 22 km ida` como antecedente para Operaciones.
3. **[`03_operaciones_politica_obligatoria_pendiente.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/03_operaciones_politica_obligatoria_pendiente.png):** Etapa `2. Validación & Diff` (`PRY-2610-13-020`) mostrando `Política Operacional: PENDIENTE (OBLIGATORIO)`, el bloque `DEFINICIÓN DE POLÍTICA OPERACIONAL (URBANA / RURAL) * — RESPUESTA OBLIGATORIA DE OPERACIONES`, el antecedente de devolución previa y las dos tarjetas (`Política Urbana` y `Política Rural`) sin preselección.
4. **[`04_operaciones_modal_rechazo_motivo_y_fecha.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/04_operaciones_modal_rechazo_motivo_y_fecha.png):** Modal `DEVOLVER REQUERIMIENTO A PREVENTA COMERCIAL` mostrando `FECHA DE DEVOLUCIÓN`, campo obligatorio `Motivo de Rechazo / Devolución a Comercial *` y aviso de notificación interna por correo y WhatsApp.
5. **[`05_preventa_banner_rechazo_operaciones.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/05_preventa_banner_rechazo_operaciones.png):** Banner rojo en `1. Preventa Comercial` (`PRY-2610-13-019`) mostrando `REQUERIMIENTO DEVUELTO / RECHAZADO POR OPERACIONES`, `Fecha Devolución`, `Responsable: Operaciones` y el `Motivo de Rechazo`.
6. **[`06_operaciones_politica_urbana_confirmada.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/06_operaciones_politica_urbana_confirmada.png):** Etapa `2. Validación & Diff` (`PRY-2610-13-020`, `15 km`) con `Política Urbana` explícitamente confirmada (`✓ RESPONDIDA: URBANO` / `SELECCIONADA`).
7. **[`07_operaciones_politica_rural_confirmada.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/07_operaciones_politica_rural_confirmada.png):** Etapa `2. Validación & Diff` (`PRY-2610-13-021`, `55 km`) con `Política Rural` explícitamente confirmada (`✓ RESPONDIDA: RURAL` / `SELECCIONADA`).
8. **[`08_ejecucion_report_e_its_urbano.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/08_ejecucion_report_e_its_urbano.png):** Vista `7. Valorización, ITS & Facturación` de Proyecto Testigo 2 (`PRY-2610-13-020`, `ITS-PRY-2610-13-020-001`) mostrando régimen `Urbano`, `6 hrs` mínimas, tarifa `$85.000/hr`, flete `$0`, `Venta Neta Proyectada: $680.000` (`8.0 hrs`) y `15 km (Ida desde Base)`.
9. **[`09_ejecucion_report_e_its_rural.png`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/evidencia/09_ejecucion_report_e_its_rural.png):** Vista `7. Valorización, ITS & Facturación` de Proyecto Testigo 3 (`PRY-2610-13-021`, `ITS-PRY-2610-13-021-001`) mostrando régimen `Rural`, `8 hrs` mínimas, tarifa `$95.000/hr`, flete `$350.000`, `Venta Neta Proyectada: $1.110.000` y `55 km (Ida desde Base)`.

---

## 8. Artefactos Reproducibles Entregados

- **Script Maestro Reproducible:** [`QA/REQ-1082_Politica_Urbana_Rural_DEV/run_qa_req1082_dev.cjs`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/run_qa_req1082_dev.cjs)
- **Volcado JSON de Auditoría BD + API:** [`QA/REQ-1082_Politica_Urbana_Rural_DEV/qa_audit_results.json`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/qa_audit_results.json)
- **Reporte Maestro de Certificación QA:** [`QA/REQ-1082_Politica_Urbana_Rural_DEV/REPORTE_QA_INTEGRAL_REQ-1082_DEV.md`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/QA/REQ-1082_Politica_Urbana_Rural_DEV/REPORTE_QA_INTEGRAL_REQ-1082_DEV.md)
