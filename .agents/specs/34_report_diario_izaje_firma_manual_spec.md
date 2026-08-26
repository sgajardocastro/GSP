# 📐 Especificación Técnica: Report Diario Digital de Izaje, Firma Manual Mandante y Ciclo de Vida Multi-Equipo (Spec 34)

**Documento:** `34_report_diario_izaje_firma_manual_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 5 - Ejecución del Servicio en Faena (`id_proyecto_estado = 5` / En Ejecución)  
**Estado:** `ESPECIFICACIÓN FORMAL - IMPLEMENTADA & VERIFICADA EN PRODUCCIÓN`  
**Fecha de Actualización:** 25 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Alcance

El presente documento consolida y formaliza la arquitectura, modelo de datos, lógica de negocio y experiencia de usuario (UX) del módulo **Report Diario Digital de Izaje**. Este sistema permite registrar, calcular, firmar y auditar la operación diaria de la flota de grúas y maquinaria pesada en terreno, soportando operaciones multi-día y servicios complejos multi-recurso con despacho escalonado independiente.

### 🎯 Principios Rectores:
1. **Ciclo Diario Recurrente e Inmutable:** Cada jornada de faena culmina con la emisión de un Report Diario individual sellado con la firma manuscrita del mandante en terreno.
2. **Aislamiento Multi-Equipo (Spec 35 Integrada):** En servicios con múltiples grúas o camiones asignados, el cálculo de días correlativos (`Día 1, Día 2, ...`), horómetros iniciales/finales y horas facturables se gestiona de forma estrictamente aislada por máquina (`id_equipo`).
3. **Resolución Determinística del Mandante:** La Razón Social y el RUT del cliente mandante se resuelven exclusivamente mediante `LEFT JOIN` relacional a `sch_leangsp.tpar_empresas` vía `p.id_empresa_cliente`, eliminando fallbacks genéricos.
4. **Firma Manuscrita Táctil (Touchscreen Canvas - Sin FES):** El supervisor mandante en obra firma directamente en pantalla táctil mediante componente Canvas (`SignatureField.vue`). No requiere enrolamiento previo, PIN ni certificado FES.
5. **Cálculo Reactivo de Tiempos y Cobros:** Cálculo automático en cliente y backend de horas efectivas, colación, horas mínimas base pactadas y sobretiempo devengado.
6. **Auditoría y Validación en Torre de Control:** Los analistas de operaciones disponen de un visor documental formal (`ModalVisorReport.vue`) y compuerta de validación con 1 clic en el Gestor de Oportunidades CRM.

---

## 2. 🔄 Diagrama del Flujo Operativo y Ciclo de Vida

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CICLO DIARIO DE IZAJE EN TERRENO (PWA MÓVIL)                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
  1. ACCESO & PRECARGA                      ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Operador accede desde la PWA a la OT activa: /reportDiario?id_proyecto=XX         │
  │  • Backend consulta OT y resuelve:                                                  │
  │    - Razón Social real del Mandante (sch_leangsp.tpar_empresas)                     │
  │    - Equipos únicos asignados (DISTINCT ON id_equipo)                               │
  │    - Tripulación (Operador, Rigger, Prevencionista)                                 │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  2. SELECTOR MULTI-MÁQUINA (Si OT tiene > 1 equipo)
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  [ 🚜 PTE-87 (ZS0808AC-LI) ]       [ 🏗️ BGDF.90-4 (LTM-1220) ]                       │
  │  • Al seleccionar equipo:                                                            │
  │    - Recalcula Día Correlativo específico para esa máquina                           │
  │    - Sugiere Horómetro Inicial = Horómetro Final del último report de ESE equipo     │
  │    - Muestra Badge de Micro-Estado (🟢 EN FAENA / 🟡 EN RUTA / ⚪ EN PATIO)          │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  3. REGISTRO DE JORNADA & CÁLCULO REACTIVO
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Hora Inicio (ej. 08:00) / Hora Término (ej. 18:30)                                │
  │  • Selector rápido de Colación: [ Sin Colación (0h) ] [ 30m ] [ 45m ] [ 60m ] [ 90m ]│
  │  • Horómetros: Inicio (precargado) y Término (manual)                                │
  │  • 📸 Evidencia fotográfica del horómetro/tablero                                    │
  │  ─────────────────────────────────────────────────────────────────────────────────── │
  │  FÓRMULAS REACTIVAS:                                                                 │
  │  • Horas Efectivas   = (Hora Término - Hora Inicio) - Horas Colación                 │
  │  • Horas Facturables = max(Horas Efectivas, Horas Mínimas OT)                        │
  │  • Sobretiempo       = max(0, Horas Efectivas - Horas Mínimas OT)                   │
  │  • Δ Horómetro Motor = Horómetro Término - Horómetro Inicio                          │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  4. OBSERVACIONES TÉCNICAS & MANIOBRAS
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Tipos de izaje, tonelajes maniobrados, radios, interferencias, condiciones climáticas│
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
  5. FIRMA MANUSCRITA MANDANTE & SELLADO GPS
  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │  • Nombre, RUT y Cargo del Supervisor Mandante (ej. ITO / Jefe de Terreno)           │
  │  • Lienzo táctil Canvas (SignatureField.vue) -> Captura PNG Base64                   │
  │  • Geocodificación GPS inmutable (latitud, longitud, precisión en metros)            │
  │  • [ 🟢 SELLAR Y TRANSMITIR REPORT DÍA N ]                                           │
  └─────────────────────────────────────────┬────────────────────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     TORRE DE CONTROL CRM (GESTIÓN Y VALIDACIÓN)                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
  │
  ├─► Subpestaña "6. Ejecución & Reports":
  │   • Filtro por equipo: [ TODOS ] [ 🚜 PTE-87 ] [ 🏗️ BGDF.90-4 ]
  │   • Tabla cronológica con días, horarios, facturables, sobretiempo y firmante
  │   • Tarjetas KPI consolidadas: Horas Totales, Sobretiempo Acumulado, Rango Horómetros
  │
  ├─► Modal Visor Formal (ModalVisorReport.vue):
  │   • Visualización del documento con membrete GSP, datos del mandante, desglose y firma
  │
  └─► Compuerta de Calidad:
      • Botón [ ✅ Validar Report ] -> Transición a estado VALIDADO_ANALISTA
```

---

## 3. 🗄️ Modelo de Datos PostgreSQL

### 3.1. Extensión de la Tabla `sch_leangsp.tedp_reporte_avance`

```sql
-- DDL Idempotente de Extensión
ALTER TABLE sch_leangsp.tedp_reporte_avance
  ADD COLUMN IF NOT EXISTS id_equipo INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
  ADD COLUMN IF NOT EXISTS id_user_rigger INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS dia_correlativo INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS horometro_inicio NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS horometro_termino NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS horas_minimas NUMERIC(5, 2) DEFAULT 4.00,
  ADD COLUMN IF NOT EXISTS horas_facturables NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_sobretiempo NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_report VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS accuracy_firma NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS id_user_validador INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS obs_validador TEXT;

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_proy  ON sch_leangsp.tedp_reporte_avance(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_eq    ON sch_leangsp.tedp_reporte_avance(id_equipo);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_fec   ON sch_leangsp.tedp_reporte_avance(id_proyecto, fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_token ON sch_leangsp.tedp_reporte_avance(token_report);
```

### 3.2. Diccionario de Datos del Report Diario

| Campo | Tipo | Nullable | Descripción |
| :--- | :--- | :---: | :--- |
| `id_reporte_avance` | `SERIAL PRIMARY KEY` | No | Identificador único del reporte. |
| `id_proyecto` | `INT REFERENCES tpry_proyecto` | No | Proyecto / OT asociada. |
| `id_equipo` | `INT REFERENCES tequ_equipo` | No | Equipo/Grúa específico al que corresponde el reporte. |
| `id_user_operador` | `INT REFERENCES tsec_users` | No | Operador responsable de la máquina y emisor del parte. |
| `id_user_rigger` | `INT REFERENCES tsec_users` | Sí | Rigger o señalero asignado en terreno. |
| `dia_correlativo` | `INTEGER` | No | Número correlativo de día para ESE equipo (ej. 1, 2, 3...). |
| `fecha_reporte` | `DATE` | No | Fecha de ejecución de la jornada. |
| `fecha_inicio_servicio` | `TIMESTAMPTZ` | No | Hora exacta de inicio de la jornada en faena. |
| `fecha_termino_servicio` | `TIMESTAMPTZ` | No | Hora exacta de término de la jornada en faena. |
| `horas_colacion` | `NUMERIC(4,2)` | No | Horas de descanso/colación (0, 0.5, 0.75, 1.0, 1.5). |
| `horas_operadas` | `NUMERIC(5,2)` | No | Horas netas efectivas trabajadas = (Término - Inicio) - Colación. |
| `horas_minimas` | `NUMERIC(5,2)` | No | Horas mínimas base garantizadas por contrato (ej. 4.0 u 8.0 hrs). |
| `horas_facturables` | `NUMERIC(5,2)` | No | Horas finales a cobrar = `max(horas_operadas, horas_minimas)`. |
| `horas_sobretiempo` | `NUMERIC(5,2)` | No | Horas extra devengadas = `max(0, horas_operadas - horas_minimas)`. |
| `horometro_inicio` | `NUMERIC(10,2)` | Sí | Lectura del horómetro del motor al inicio del día. |
| `horometro_termino` | `NUMERIC(10,2)` | Sí | Lectura del horómetro del motor al término del día. |
| `foto_horometro` | `TEXT` | Sí | URI/Ruta de la fotografía de evidencia del tablero. |
| `observacion_trabajo` | `TEXT` | Sí | Detalle descriptivo de las maniobras realizadas. |
| `cliente_nombre` | `VARCHAR(255)` | No | Nombre del supervisor mandante firmante en terreno. |
| `cliente_rut` | `VARCHAR(30)` | Sí | RUT del supervisor mandante firmante. |
| `cliente_cargo` | `VARCHAR(100)` | Sí | Cargo del supervisor mandante en obra. |
| `cliente_firma_canvas_base64` | `TEXT` | No | Trazo PNG Base64 de la firma manual manuscrita. |
| `latitud_inicio_servicio` | `NUMERIC(10,7)` | Sí | Coordenada GPS Latitud al momento del sellado. |
| `longitud_inicio_servicio` | `NUMERIC(10,7)` | Sí | Coordenada GPS Longitud al momento del sellado. |
| `accuracy_firma` | `NUMERIC(6,2)` | Sí | Precisión en metros del GPS del dispositivo móvil. |
| `token_report` | `VARCHAR(64)` | Sí | Hash criptográfico único de trazabilidad e integridad. |
| `estado_reporte` | `VARCHAR(40)` | No | Estado: `EMITIDO`, `PENDIENTE_VALIDACION`, `VALIDADO_ANALISTA`. |
| `id_user_validador` | `INT REFERENCES tsec_users` | Sí | Analista de la Torre de Control que aprobó el reporte. |
| `fecha_validacion` | `TIMESTAMPTZ` | Sí | Timestamp de validación formal en CRM. |
| `obs_validador` | `TEXT` | Sí | Observaciones ingresadas por el analista al validar. |

---

## 4. 🔌 Especificación de la API Backend

**Controlador:** `ejecucion/backend_remoto/src/controllers/reportDiarioController.js`  
**Rutas:** `ejecucion/backend_remoto/src/routes/reportDiarioRoutes.js` (`/api/operaciones/report/*`)

### 4.1. `GET /api/operaciones/report/contexto/:id_proyecto[?id_equipo=X]`
* **Descripción:** Obtiene los datos precargados para iniciar el report. Resuelve la Razón Social real del cliente vía `tpar_empresas`, deduplica la flota asignada y calcula el día correlativo y horómetro sugerido específicamente para el equipo solicitado.
* **Query SQL Clave (Resolución de Cliente & Equipos Únicos):**
```sql
-- Proyecto con Razón Social real de Empresa Cliente
SELECT 
  p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado, p.json_field,
  COALESCE(clt.razon_social, clt.name_empresa, 'Cliente Mandante') AS cliente_nombre,
  COALESCE(clt.rut_empresa, '') AS cliente_rut,
  COALESCE(p.json_field->>'obra_nombre', p.json_field->'crm_v1'->>'obra_nombre', p.nombre_proyecto) AS obra_nombre,
  COALESCE(p.json_field->>'obra_direccion', p.json_field->'crm_v1'->>'obra_direccion', 'Faena en Terreno') AS obra_direccion
FROM sch_leangsp.tpry_proyecto p
LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
WHERE p.id_proyecto = $1;

-- Equipos Deduplicados con Micro-Estado Operacional de Viaje/Faena
SELECT DISTINCT ON (re.id_equipo)
  re.id_rel_equipo, re.id_equipo, re.rol_equipo,
  e.patente, e.modelo, e.marca,
  COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
  COALESCE((e.json_data->>'horometro')::numeric, 0) AS horometro_base,
  COALESCE(v.estado_trayecto, 'ASIGNADO') AS estado_operativo,
  v.token_viaje, v.km_inicial, v.km_final,
  v.horometro_inicial AS horometro_viaje_salida,
  v.horometro_final AS horometro_viaje_llegada
FROM sch_leangsp.tpry_rel_equipo re
JOIN sch_leangsp.tequ_equipo e ON re.id_equipo = e.id_equipo
LEFT JOIN LATERAL (
  SELECT estado_trayecto, token_viaje, km_inicial, km_final, horometro_inicial, horometro_final
  FROM sch_leangsp.tequ_log_desplazamiento
  WHERE id_proyecto = re.id_proyecto AND id_equipo = re.id_equipo
  ORDER BY id_log_desplazamiento DESC LIMIT 1
) v ON TRUE
WHERE re.id_proyecto = $1
ORDER BY re.id_equipo, re.id_rel_equipo DESC;
```

### 4.2. `GET /api/operaciones/report/proyecto/:id_proyecto`
* **Descripción:** Retorna todos los reports diarios de una OT ordenados cronológicamente por `dia_correlativo ASC, fecha_reporte ASC`, con joins a operadores, riggers, validador, equipo y razón social mandante.

### 4.3. `POST /api/operaciones/report/guardar`
* **Descripción:** Inserta un nuevo registro en `tedp_reporte_avance` con estado `PENDIENTE_VALIDACION`, generando un token criptográfico único y registrando coordenadas GPS inmutables.

### 4.4. `POST /api/operaciones/report/:id/validar`
* **Descripción:** Permite al Analista de la Torre de Control validar el report con 1 clic (`estado_reporte = 'VALIDADO_ANALISTA'`, `id_user_validador = $1`, `fecha_validacion = NOW()`, `obs_validador = $2`).

---

## 5. 📱 Interfaz Móvil PWA (`ReportDiarioIzaje.vue`)

* **Ubicación:** `ejecucion/pwa/src/views/ReportDiarioIzaje.vue`
* **Ruta PWA:** `#/reportDiario?id_proyecto=XX`
* **Módulos UX:**
  1. **Tarjeta de Encabezado:** OT, Razón Social Mandante, Nombre y Dirección de la Faena.
  2. **Botonera Multi-Equipo:** Selector reactivo de grúa si la OT tiene más de 1 máquina asignada, con badges de micro-estado operativo.
  3. **Tarjeta de Tripulación:** Operador titular y Rigger en terreno.
  4. **Panel de Tiempos y Horómetros:** Inputs HTML5 nativos para hora inicio/término, selector rápido de colación con botones táctiles de 48px mínimos, horómetros delta y cálculo reactivo en vivo de horas efectivas, facturables y sobretiempo.
  5. **Módulo de Observaciones:** Textarea para registro de maniobras, cargas y clima.
  6. **Módulo de Firma del Mandante:** Inputs para nombre, RUT y cargo del supervisor mandante + lienzo táctil Canvas (`SignatureField.vue`) con botón de limpieza y botón gigante de sellado y transmisión GPS.

---

## 6. 🖥️ Integración en Torre de Control CRM (`GestorOportunidades.vue`)

* **Subpestaña 6:** *"6. Ejecución & Reports"* (activada automáticamente en `estado >= 5`).
* **Filtros por Equipo:** Botones tipo píldora `[ TODOS ]` `[ 🚜 Patente 1 ]` `[ 🏗️ Patente 2 ]` para auditar la jornada de cada máquina por separado.
* **DataGrid Cronológico:** Tabla densa que exhibe: Día #, Fecha, Equipo/Grúa, Horario, Colación, Horas Efectivas, Horas Facturables (en oro ámbar), Sobretiempo, Horómetros (Inicio ➔ Término con icono de foto), Firmante Mandante, Badge de Estado (`✅ Validado` / `⏳ Pendiente`) y botón de acción `[ 👁️ Ver ]`.
* **Modal Visor Formal (`ModalVisorReport.vue`):** Modal en Dark Mode industrial que renderiza el documento completo, membrete corporativo, resumen de personal y grúa, desglose horario, observaciones, estampa con la firma manuscrita original del cliente mandante y coordenadas geográficas.

---

## 7. 🚀 Protocolo de Despliegue y Arquitectura de Servidor

Siguiendo la gobernanza estricta del proyecto, los despliegues de backend se realizan bajo el siguiente estándar:

* **Servidor Remoto:** `servidor.leanglobal.cl` (Puerto SSH: `1295`)
* **Usuario de Ejecución:** `nodeadmin`
* **Ruta de Código Backend:** `/home/nodeadmin/proyectos/lean-services-gsp/`
* **Gestor de Procesos:** PM2 (Proceso ID `10` / Nombre: `lean-services-gsp` / Puerto: `3006`)
* **Método de Despliegue:** Sincronización directa vía SCP de los controladores/modelos modificados, ajuste de permisos `chown nodeadmin:nodeadmin` y reinicio con:
  ```bash
  su - nodeadmin -c "pm2 restart 10"
  ```
* **Reverse Proxy Nginx:** `/lg-gsp/` ➔ `http://127.0.0.1:3006/`

---

## 8. 🧪 Matriz de Validación y Casos de Prueba (QA Determinístico)

| ID | Escenario | Criterio de Aceptación | Resultado |
| :--- | :--- | :--- | :---: |
| **QA-34-01** | Resolución de Razón Social Mandante | Al consultar OT 69 (`GSP-2608-4851-037`), `cliente_nombre` resuelve estrictamente **LeanGlobal Spa** y su RUT `78249226-8`. | ✅ APROBADO |
| **QA-34-02** | Deduplicación de Flota Asignada | Si `tpry_rel_equipo` tiene múltiples registros para la misma grúa, la API y la PWA devuelven exactamente 1 botón por máquina única. | ✅ APROBADO |
| **QA-34-03** | Conmutación Reactiva Multi-Máquina | Al cambiar de `PTE-87` a `BGDF.90-4` en la PWA, el día correlativo y el horómetro sugerido se actualizan al historial de esa máquina. | ✅ APROBADO |
| **QA-34-04** | Cálculo Reactivo de Horas & Sobretiempo | Jornada 08:00 a 18:30 con 60m colación y 8h base calcula: Efectivas = 9.5h, Facturables = 9.5h, Sobretiempo = +1.5h. | ✅ APROBADO |
| **QA-34-05** | Captura de Firma Manuscrita Canvas | El cliente dibuja su trazo en pantalla táctil, se valida contenido no vacío y se transmite como PNG Base64 con geolocalización GPS. | ✅ APROBADO |
| **QA-34-06** | Persistencia PostgreSQL | Registro insertado en `sch_leangsp.tedp_reporte_avance` con token único y estado `PENDIENTE_VALIDACION`. | ✅ APROBADO |
| **QA-34-07** | Filtrado Multi-Equipo en CRM | En Subpestaña 6 del CRM, al filtrar por una grúa específica, los KPIs y la tabla reflejan únicamente los reports de esa máquina. | ✅ APROBADO |
| **QA-34-08** | Visor Documental & Validación Analista | `ModalVisorReport.vue` renderiza la firma del mandante y el botón `[ ✅ Validar ]` actualiza el estado a `VALIDADO_ANALISTA`. | ✅ APROBADO |
