# 📋 SPEC-084: Ajustes Operacionales PWA Operador, Combustible en Patio, Horómetros Opcionales, Horas Standby y Extensión Comercial Multi-Día

## 📌 Metadatos y Control de Versión
* **Código de Especificación:** `SPEC-084`
* **Requerimiento Primario:** `REQ-1055`
* **Módulos Afectados:**
  * PWA Móvil: `Surveys.vue`, `ViajeConductor.vue`, `ReportDiarioIzaje.vue`.
  * Frontend Web CRM: `GestorOportunidades.vue`.
  * Backend API: `viajeController.js`, `reportDiarioController.js`, `proyectosController.js`.
  * Base de Datos: `sch_leangsp.tedp_reporte_avance`, `sch_leangsp.tequ_log_desplazamiento`.
* **Participantes Reunión de Alineación:** Jorge Ponce & Sergio Gajardo (16-Oct-2026).
* **Estado:** `APROBADO PARA IMPLEMENTACIÓN`

---

## 1. OBJETIVO DEL NEGOCIO
Optimizar y simplificar la experiencia operativa de terreno de los operadores y choferes en la aplicación móvil PWA, eliminando fricciones, bloqueos injustificados y ruido visual innecesario:
1. **Puntualización de Combustible en Patio:** Registrar el nivel de combustible (porcentaje y/o marcador con foto opcional) única y exclusivamente al **salir de patio (Base San Pablo)** y al **ingresar a patio (Llegada final del retorno)**, suprimiendo la toma de combustible en faena.
2. **Ergonomía de Ruta:** Simplificar la pantalla "En Ruta" a 3 controles concretos (Carga Copec, Llegada y Consulta sutil de salida).
3. **Superestructura Opcional Universal:** Dejar el horómetro de superestructura (cabina superior de izaje) como opcional por defecto en todos los equipos para evitar bloqueos a camiones pluma, grúas horquilla o máquinas que no utilicen doble motor de inmediato.
4. **Precarga Inmutable de Equipo y Tripulación:** Evitar que el reporte diario re-solicite elegir la grúa y exhibir con nitidez al Operador y Rigger asignados.
5. **Horas Standby Diferenciadas (Caso Robert):** Incorporar en el Report Diario la segregación estricta entre **Standby Cliente** (imputable/cobrable) y **Standby San Pablo** (atribuible a GSP/sin cobro), calculando reactivamente las horas efectivas y facturables.
6. **Inducción Determinista de Retorno:** Al sellar el reporte del último día planificado, activar de inmediato la Hoja de Ruta de retorno a patio.
7. **Extensión Comercial de Servicios:** Habilitar en el Gestor de Oportunidades un mecanismo para extender días de jornada sobre el mismo negocio/OT sin reiniciar el ciclo comercial.

---

## 2. ARQUITECTURA TÉCNICA Y ESQUEMA DE DATOS

### 2.1 Base de Datos PostgreSQL (`sch_leangsp` y `sch_leangsp_prod`)

#### A. Extensión en `tedp_reporte_avance` (Horas Standby & Justificación)
```sql
ALTER TABLE tedp_reporte_avance
  ADD COLUMN IF NOT EXISTS horas_standby_cliente NUMERIC(4,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS horas_standby_gsp NUMERIC(4,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS motivo_standby TEXT;

COMMENT ON COLUMN tedp_reporte_avance.horas_standby_cliente IS 'Horas detenido por causa imputable al cliente (clima, viento, sin permisos obra). Se cobran y computan al piso mínimo.';
COMMENT ON COLUMN tedp_reporte_avance.horas_standby_gsp IS 'Horas detenido por causa imputable a San Pablo (falta de equipo, falla mecánica, anemómetro). NO se cobran al cliente y se descuentan.';
COMMENT ON COLUMN tedp_reporte_avance.motivo_standby IS 'Detalle o justificación técnica de la detención en faena.';
```

#### B. Extensión en `tequ_log_desplazamiento` (Combustible en Salida de Base y Llegada a Base)
```sql
ALTER TABLE tequ_log_desplazamiento
  ADD COLUMN IF NOT EXISTS combustible_salida_base VARCHAR(20),
  ADD COLUMN IF NOT EXISTS foto_combustible_salida_base_path TEXT,
  ADD COLUMN IF NOT EXISTS combustible_llegada_patio VARCHAR(20),
  ADD COLUMN IF NOT EXISTS foto_combustible_llegada_patio_path TEXT;
```

---

## 3. ESPECIFICACIÓN POR PANTALLA Y COMPONENTE

### 3.1 PWA Home Operador ([`Surveys.vue`](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/pwa/src/views/Surveys.vue))
1. **Franja Superior Despejada:**
   * Reducir la saturación de badges superiores a un bloque compacto de estado operacional del día.
   * Ocultar el banner de "Taller & Mantenimiento Móvil" para usuarios con rol estrictamente de terreno (`GSP_EJEC` / Operador / Chofer), desplegándolo solo para mecánicos o administradores.
2. **Inspecciones de Patio (Template 79):**
   * Mantener visible el bloque de inspección de patio de entrada y salida, con estilo sobrio y sin competir visualmente con el servicio activo de faena.

### 3.2 Hoja de Conductor y Desplazamiento ([`ViajeConductor.vue`](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue))
1. **Momento 1: Salida de Patio / Base GSP:**
   * Inputs requeridos:
     * Odómetro Salida (KM) + Foto.
     * Horómetro Camión/Chasis (HRS) + Foto.
     * **Nivel de Combustible al Salir de Base:** Selector de porcentaje (1% a 100%) + Foto del marcador (opcional/asistida).
     * PIN de Conductor (4 dígitos).
2. **Momento 2: Vista "En Ruta" Simplificada:**
   * La vista activa en ruta exhibirá únicamente:
     1. Botón `[ ⛽ Rendir Carga de Combustible (Copec) ]`.
     2. Botón prioritario `[ 🏁 CONFIRMAR LLEGADA A FAENA ]` (o `[ 🏁 CONFIRMAR LLEGADA A PATIO CENTRAL GSP ]` si es retorno).
     3. Enlace discreto al pie: `[ 👁️ Ver Datos Registrados de Salida ]` que despliega un modal de solo lectura con las lecturas y fotos de salida de patio.
3. **Momento 3: Llegada a Faena:**
   * Odómetro Llegada (KM) + Foto.
   * Horómetro Camión Llegada (HRS) + Foto.
   * **Horómetro Grúa (Superestructura):** Campo **opcional por defecto** (no obligatorio, no bloquea el botón de confirmar llegada).
   * **Combustible en Faena:** **ELIMINADO**. No se solicita combustible al llegar a faena.
4. **Momento 4: Llegada a Patio Central GSP (Término de Retorno):**
   * Odómetro de Llegada a Patio (KM) + Foto.
   * Horómetro de Camión a Patio (HRS) + Foto.
   * **Nivel de Combustible al Ingresar a Patio:** Selector de porcentaje (1% a 100%) + Foto del marcador (opcional).
   * Confirmación final y liberación del equipo a `DISPONIBLE`.

### 3.3 Report Diario Digital de Faena ([`ReportDiarioIzaje.vue`](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/pwa/src/views/ReportDiarioIzaje.vue))
1. **Equipo y Tripulación Asignada:**
   * La cabecera toma el equipo asignado directamente de la OT. Si la OT tiene 1 equipo, se selecciona de inmediato sin desplegar el botón selector multi-máquina.
   * La tripulación asignada (Operador y Rigger) se hidrata desde la OT (`tpry_rel_persona` y `crm_v1.lineas_servicio`), visualizando sus nombres reales y eliminando fallbacks genéricos.
2. **Horómetro de Superestructura Opcional:**
   * En Momento 1 y Momento 2, los campos de horómetro de superestructura son opcionales.
   * La validación para pasar al Report Mandante no exige foto de superestructura si el equipo no posee o no utilizó la grúa superior en la jornada.
3. **Campos de Horas Standby y Fórmulas:**
   * Incorporación en Momento 2 de:
     * `Horas Standby Cliente` (HRS, decimal).
     * `Horas Standby San Pablo` (HRS, decimal, sin cobro).
     * `Motivo / Detalle Standby` (Textarea).
   * **Fórmulas de Cálculo:**
     $$\text{Minutos Brutos} = (\text{Hora Término} - \text{Hora Inicio})$$
     $$\text{Horas Efectivas} = \max\left(0, \frac{\text{Minutos Brutos} - \text{Minutos Colación}}{60} - \text{Horas Standby GSP}\right)$$
     $$\text{Horas Facturables} = \max\left(\text{Piso Mínimo OT}, \text{Horas Efectivas} + \text{Horas Standby Cliente}\right)$$
     $$\text{Horas Sobretiempo} = \max\left(0, (\text{Horas Efectivas} + \text{Horas Standby Cliente}) - \text{Piso Mínimo OT}\right)$$
4. **Activación Automática de Retorno al Sellar:**
   * Al sellar con la firma del cliente mandante el día correlativo final (`diaCorrelativo >= totalDiasPlanificados`), el sistema despliega automáticamente el modal de retorno a patio con el botón directo para iniciar el viaje reverso.

### 3.4 Extensión Comercial de Servicios Multi-Día ([`GestorOportunidades.vue`](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/src/views/CRM/GestorOportunidades.vue))
1. **Botón de Extensión:**
   * En la cabecera y en el panel de ejecución de la OT, se incorpora el botón `[ ➕ Extender Servicio (Días Adicionales) ]`.
2. **Modal de Extensión:**
   * Permite indicar cuántos días adicionales se autorizan (ej: +1, +2 días) y la nueva fecha de término estimada.
   * Actualiza `fecha_plan_fin` en `tpry_proyecto` y agrega los días adicionales en `json_field.ejecucion_v1.plan_diario`.
   * El backend actualiza la cuota permitida en `calcularCupoDiasHabiles`, desbloqueando de forma instantánea a la PWA para registrar las jornadas extendidas sin generar un nuevo negocio.

---

## 4. CRITERIOS DE ACEPTACIÓN DETERMINÍSTICOS (QA GATES)
1. **Gate A (Combustible Patio):** La salida de base y el ingreso a patio solicitan nivel de combustible. En la llegada a faena ya no se solicita combustible.
2. **Gate B (Vista En Ruta):** La vista en ruta contiene únicamente el botón de Copec, el botón de llegada y el enlace de consulta de datos de salida.
3. **Gate C (Superestructura Opcional):** Un operador puede completar su reporte de jornada sin que el horómetro de superestructura sea bloqueante.
4. **Gate D (Tripulación y Equipo):** El reporte muestra directamente el equipo y la tripulación asignada sin obligar a re-seleccionar.
5. **Gate E (Horas Standby):** Se registran horas standby de cliente y San Pablo, descontando las de San Pablo de las efectivas e imputando las del cliente a la facturación.
6. **Gate F (Retorno Inducido):** Al firmar el último report de la OT se induce directamente el viaje de retorno a base GSP.
7. **Gate G (Compilación Limpia):** Vite build (Web) y Vue CLI build (PWA) compilan con 0 errores y 0 advertencias de tipos.
