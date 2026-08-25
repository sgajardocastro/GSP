# 📐 Especificación Técnica: Report Diario Digital de Izaje, Firma Manual de Cliente y Ciclo Multi-Día (Spec 34)

**Documento:** `34_report_diario_izaje_firma_manual_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 5 - Ejecución del Servicio en Faena (`id_proyecto_estado = 5` / En Ejecución en Faena)  
**Estado:** `ESPECIFICACIÓN FORMAL - IMPLEMENTADA & VERIFICADA`  
**Fecha:** 25 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo

El presente documento especifica el módulo de **Report Diario Digital de Izaje** que permite al Operador en terreno generar un parte diario por cada jornada de servicio, con precarga automática de la OT, cálculo reactivo de horas efectivas/sobretiempo, observaciones de maniobras, **firma manual manuscrita del cliente mandante en pantalla táctil** (Touchscreen Canvas, sin FES) y geolocalización GPS inmutable.

### 🎯 Principios de Diseño:
1. **Ciclo Diario Recurrente:** Un servicio de N días genera N reports independientes, cada uno firmado por el cliente en terreno al cierre de esa jornada.
2. **Zero-Friction para el Operador:** Todos los datos de la OT (cliente, obra, equipo, tripulación, horas mínimas) vienen precargados. El operador solo registra horarios y firma.
3. **Firma Manual del Mandante (Sin FES):** El supervisor del cliente firma directamente con el dedo en el Canvas táctil. No se requiere PIN ni certificado FES.
4. **Acceso Exclusivo vía PWA Autenticada:** El operador accede al report diario desde la PWA con sesión activa. No se utiliza token web público.
5. **Trazabilidad 360° en Torre de Control:** Los reports se visualizan como tabla cronológica multi-día en el Gestor de Oportunidades, con validación formal del Analista de Operaciones.

---

## 2. 🔄 Diagrama del Ciclo Diario Operativo

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CICLO DIARIO EN FAENA (Se repite cada jornada)              │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                            │
  DÍA N: El Operador abre la PWA / Token   ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  1. PRECARGA AUTOMÁTICA DE LA OT                                      │
  │     • Cliente, Obra, Equipo, Operador, Rigger, Horas Mínimas          │
  │     • Horómetro sugerido = Horómetro Final del Día N-1                │
  └────────────────────────────┬───────────────────────────────────────────┘
                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  2. REGISTRO DE TIEMPOS Y MANIOBRAS                                   │
  │     • Hora Inicio (ej. 08:00) / Hora Término (ej. 18:00)             │
  │     • Colación: [ 30m ] [ 45m ] [ 60m ] [ 90m ]                      │
  │     • Horómetro Inicio (faena) / Horómetro Término (faena)            │
  │     ─────────────────────────────────────────────────────────────      │
  │     CÁLCULO REACTIVO EN VIVO:                                         │
  │     Horas Efectivas = (Término - Inicio) - Colación                   │
  │     Horas Facturables = max(Efectivas, Horas Mínimas OT)              │
  │     Sobretiempo = max(0, Efectivas - Horas Mínimas OT)               │
  └────────────────────────────┬───────────────────────────────────────────┘
                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  3. OBSERVACIONES DE LA JORNADA                                       │
  │     • Descripción de maniobras, tonelajes, radios, clima              │
  └────────────────────────────┬───────────────────────────────────────────┘
                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  4. FIRMA MANUAL DEL MANDANTE EN TERRENO (Touch Canvas / Sin FES)     │
  │     • Nombre del Supervisor del Cliente                               │
  │     • RUT del Supervisor                                              │
  │     • Cargo en Obra (ej. ITO, Jefe de Obra, Encargado)               │
  │     • [════════ LIENZO TÁCTIL DE FIRMA MANUSCRITA ════════]           │
  │     • Botón: [ 🟢 SELLAR Y TRANSMITIR REPORT DÍA N ]                │
  │     • Captura automática de GPS (lat, lng) + Timestamp inmutable      │
  └────────────────────────────┬───────────────────────────────────────────┘
                               ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  5. TORRE DE CONTROL (Analista de Operaciones)                        │
  │     • Report Día N aparece inmediatamente en la tabla multi-día       │
  │     • Analista revisa, compara horas vs OT y presiona:                │
  │       [ ✅ VALIDAR REPORT DÍA N ]                                    │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 📱 Implementación Técnica en PWA

### 3.1. Componente Reutilizado: `SignatureField.vue`
El ecosistema LeanGlobal/GSP ya dispone del componente `SignatureField.vue` (en `ejecucion/pwa/src/components/`) con:
- Canvas HTML5 táctil (`mousedown/touchstart`, `mousemove/touchmove`).
- Trazo con `strokeStyle: '#0f172a'`, `lineWidth: 3`, `lineCap: 'round'`.
- Botón `🗑️ Limpiar Firma` y placeholder visual.
- Emite `update:modelValue` con el `toDataURL('image/png')` del trazo completo.

**Decisión:** Se reutiliza **directamente** el componente `SignatureField.vue` existente en la PWA sin necesidad de copiar ni adaptar, ya que el Report se construye dentro del mismo codebase PWA.

### 3.2. Acceso Exclusivo vía PWA Autenticada

| Vía | Ruta | Autenticación | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **PWA Autenticada** | `/reportDiario?id_proyecto=XX` | Sesión JWT del Operador (`meta: { requireAuth: true }`) | El operador accede desde su bandeja de la PWA a la OT activa en ejecución. |

### 3.3. Vista Móvil: `ReportDiarioIzaje.vue` [NUEVO]
**Ubicación:** `ejecucion/pwa/src/views/ReportDiarioIzaje.vue`

**Estructura UX (3 Bloques Paso a Paso):**

#### Bloque A – Tarjeta de Servicio Precargada (Solo Lectura)
- Código OT / Proyecto, Razón Social del Cliente, Faena/Obra.
- Equipo (Patente + Modelo), Operador y Rigger asignados.
- Día correlativo detectado automáticamente: `DÍA 3 de ejecución`.

#### Bloque B – Registro de Tiempos y Maniobras
- `input[type=time]`: Hora Inicio / Hora Término.
- Botones rápidos de colación: `[30m] [45m] [60m] [90m]`.
- `input[type=number]`: Horómetro Inicio y Término (sugerencia automática del último horómetro registrado).
- **Panel Reactivo de Cálculo:** Horas Efectivas, Horas Facturables, Sobretiempo (con indicador visual amarillo si hay extras).
- `<textarea>`: Observaciones de trabajo realizado.

#### Bloque C – Firma Manual del Mandante
- Inputs: Nombre, RUT y Cargo del firmante del cliente.
- Componente `<SignatureField>` con Canvas Táctil (reutilizado directamente).
- Botón sellado: `🟢 SELLAR Y TRANSMITIR REPORT DÍA N`.

### 3.4. Ruta en Router PWA (`pwa/src/router/index.js`)
Se registra ruta autenticada:
```javascript
{
  path: '/reportDiario',
  name: 'ReportDiarioIzaje',
  component: () => import('../views/ReportDiarioIzaje.vue'),
  meta: { requireAuth: true }
},
```

---

## 4. 🗄️ Modelo de Datos en PostgreSQL

### Tabla Base: `sch_leangsp.tedp_reporte_avance` (Ampliación DDL)
Se extiende la tabla existente `tedp_reporte_avance` (creada en migración `20260810_tedp_reportes_edp_costos.sql`) para unificar el reporte diario de terreno con el devengado operativo y el posterior flujo de Estado de Pago (EDP).

```sql
-- Migración: ejecucion/backend_remoto/src/database/20260825_alter_tedp_reporte_avance.sql
ALTER TABLE sch_leangsp.tedp_reporte_avance 
  ADD COLUMN IF NOT EXISTS id_equipo          INT REFERENCES sch_leangsp.tequ_equipo(id_equipo),
  ADD COLUMN IF NOT EXISTS id_user_rigger     INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS dia_correlativo    INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS horometro_inicio   NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS horometro_termino  NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS horas_minimas      NUMERIC(5, 2) DEFAULT 4.00,
  ADD COLUMN IF NOT EXISTS horas_facturables  NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS horas_sobretiempo  NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_report       VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS accuracy_firma     NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS id_user_validador  INT REFERENCES sch_leangsp.tsec_users(id_user),
  ADD COLUMN IF NOT EXISTS fecha_validacion   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS obs_validador      TEXT;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_proy ON sch_leangsp.tedp_reporte_avance(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_eq   ON sch_leangsp.tedp_reporte_avance(id_equipo);
CREATE INDEX IF NOT EXISTS idx_tedp_reporte_fec  ON sch_leangsp.tedp_reporte_avance(id_proyecto, fecha_reporte);
```

---

## 5. 🔌 Endpoints API Backend

### Controlador: `reportDiarioController.js` [NUEVO]

| Método | Endpoint | Body / Params | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/operaciones/report/proyecto/:id_proyecto` | `id_proyecto` (URL) | Retorna todos los reports diarios de una OT (`tedp_reporte_avance`), ordenados cronológicamente por `fecha_reporte`. |
| `GET` | `/api/operaciones/report/contexto/:id_proyecto` | `id_proyecto` (URL) | Obtiene datos precargados de la OT (cliente, faena, equipos, operadores) + último report previo para sugerir día correlativo y horómetro inicial. |
| `POST` | `/api/operaciones/report/guardar` | `id_proyecto`, `id_equipo`, `id_user_operador`, `id_user_rigger`, `fecha_reporte`, `hora_inicio`, `hora_termino`, `horas_colacion`, `horas_operadas`, `horas_facturables`, `horas_sobretiempo`, `horometro_inicio`, `horometro_termino`, `observacion_trabajo`, `cliente_nombre`, `cliente_rut`, `cliente_cargo`, `cliente_firma_canvas_base64`, `latitud_inicio_servicio`, `longitud_inicio_servicio`, `accuracy_firma` | Guarda y sella un report diario con firma manual Canvas en `tedp_reporte_avance`. |
| `POST` | `/api/operaciones/report/:id/validar` | `id_user_validador`, `obs_validador` | Analista de Operaciones valida formalmente el report (transición a `VALIDADO_ANALISTA`). |

### Registro de Rutas: `routes/index.js`
```javascript
app.use('/api/operaciones/report', require('./reportDiarioRoutes.js'));
```

---

## 6. 🖥️ Integración en Torre de Control (CRM / Gestor de Oportunidades)

### 6.1. Nueva Subpestaña: `6. Ejecución & Reports`
* **Condición de visibilidad:** `estado DB >= 5` (proyecto con equipos asignados y preparación de salida activa).
* **Identificador:** `operacionesSubTab === 'reports'`.
* **Registro en `MIN_ESTADO_FOR_SUBTAB`:** `'reports': 5`.

### 6.2. Panel Cronológico Multi-Día
Tabla DataGrid compacta con una fila por cada Report Diario emitido desde la PWA:

| Fecha | Día # | Horario | Horas Efectivas | Facturables | Sobretiempo | Horómetros | Firmante Mandante | Estado | Acciones |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| 24/08 | 1 | 08:00-18:00 | 9.0h | 9.0h | +1.0h | 3240→3249 | J. Pérez (ITO) | ✅ Validado | 👁️ Ver |
| 25/08 | 2 | 08:00-17:30 | 8.5h | 8.5h | +0.5h | 3249→3257 | J. Pérez (ITO) | ⏳ Pendiente | ✅ Validar / 👁️ |

### 6.3. Tarjetas de Resumen Acumulado
* **Días de Operación:** `N días reportados`
* **Horas Totales Acumuladas:** `Σ horas_facturables` | **Sobretiempo Total:** `Σ horas_sobretiempo`
* **Horas Motor (Horómetro):** `Horómetro Día 1 Inicio → Horómetro Día N Final`
* **Conformidad Documental:** `X validados • Y pendientes de validación`

### 6.4. Modal Visor de Report: `ModalVisorReport.vue` [NUEVO]
* Renderizado formal del documento digital con logo GSP, datos del servicio, desglose de horas, observaciones y estampa de firma manuscrita del cliente con mapa de ubicación GPS de la firma.

---

## 7. 📁 Inventario de Archivos a Crear / Modificar

| Acción | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **[NUEVO]** | `ejecucion/backend_remoto/src/database/20260825_alter_tedp_reporte_avance.sql` | Script DDL para extender `sch_leangsp.tedp_reporte_avance`. |
| **[NUEVO]** | `ejecucion/backend_remoto/src/controllers/reportDiarioController.js` | Controlador API REST para guardar, consultar y validar reports. |
| **[NUEVO]** | `ejecucion/backend_remoto/src/routes/reportDiarioRoutes.js` | Rutas Express para endpoints de report. |
| **[MODIFY]** | `ejecucion/backend_remoto/src/routes/index.js` | Registrar `app.use('/api/operaciones/report', ...)`. |
| **[NUEVO]** | `ejecucion/pwa/src/views/ReportDiarioIzaje.vue` | Vista móvil PWA táctil para emisión del report con firma manual Canvas (`SignatureField.vue`). |
| **[MODIFY]** | `ejecucion/pwa/src/router/index.js` | Agregar ruta autenticada `/reportDiario`. |
| **[MODIFY]** | `ejecucion/pwa/src/views/Surveys.vue` | Agregar acceso/banner a Report Diario de la OT activa. |
| **[NUEVO]** | `ejecucion/frontend/src/components/Operaciones/ModalVisorReport.vue` | Modal visor del report con firma, mapa y datos formales en Torre de Control. |
| **[MODIFY]** | `ejecucion/frontend/src/views/CRM/GestorOportunidades.vue` | Agregar subpestaña "Ejecución & Reports", panel multi-día y botón de validación. |

---

## 8. 🧪 Plan de Verificación

| ID | Caso de Prueba | Criterio de Aceptación |
| :--- | :--- | :--- |
| **QA-34-01** | Precarga de OT en PWA | Al abrir `/reportDiario?id_proyecto=XX`, los datos de cliente, obra, equipo, operador y horas mínimas aparecen precargados. |
| **QA-34-02** | Cálculo Reactivo | Al ingresar Hora Inicio 08:00, Término 18:00 y Colación 60min, el sistema muestra: Efectivas=9.0h, Facturables=9.0h, Sobretiempo=+1.0h (si mínimas=8.0h). |
| **QA-34-03** | Firma Manual Canvas PWA | El cliente dibuja su firma en `SignatureField.vue`, el sistema captura PNG Base64, coordenadas GPS y timestamp. |
| **QA-34-04** | Día Correlativo Auto | Al emitir el segundo report del servicio, el sistema detecta automáticamente `Día 2` y sugiere horómetro inicial = horómetro final del Día 1. |
| **QA-34-05** | Persistencia PostgreSQL | Los datos persisten correctamente en `sch_leangsp.tedp_reporte_avance` con todos los campos validados. |
| **QA-34-06** | Panel Multi-Día CRM | En la Torre de Control, la subpestaña "Ejecución & Reports" muestra la tabla cronológica con todos los reports y las tarjetas de resumen acumulado. |
| **QA-34-07** | Validación del Analista | El Analista presiona `[✅ Validar Report]` y el estado transiciona a `VALIDADO_ANALISTA` con registro de fecha, usuario e id_validador. |
| **QA-34-08** | Visor Modal del Report | Al presionar `👁️ Ver Report`, el modal renderiza el documento formal con firma manuscrita, mapa GPS y desglose de horas. |

