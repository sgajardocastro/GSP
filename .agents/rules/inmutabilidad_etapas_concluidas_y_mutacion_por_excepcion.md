# 🛡️ Regla de Arquitectura: Inmutabilidad de Etapas Concluidas y Mutación por Excepción

## 1. Principio Fundamental
> **"Toda etapa del proceso operativo que haya sido confirmada y aprobada pasa inmediatamente a estado INMUTABLE (Read-Only). Queda prohibida la modificación directa de datos en pestañas o controles de etapas concluidas."**

---

## 2. Reglas de Control de Flujo (Gobernanza de Pantalla)

### 2.1. Bloqueo de Pestañas Concluidas (`Read-Only Mode`)
- **Desencadenante:** Al presionar el botón de confirmación de un hito (ej. `Confirmar Asignación OT ➔ Preparación Salida`).
- **Comportamiento:**
  - Las Sub-tabs previas (**1. Validación**, **2. Asignación de Recursos**, **3. Acreditaciones Iniciales**) permanecen accesibles **ÚNICAMENTE para consulta visual**.
  - Todos los controles interactivos (`<select>`, `<input>`, checkboxes, botones de eliminación de tripulación o equipos) en dichas sub-tabs deben renderizarse deshabilitados (`disabled` / `pointer-events-none`).
  - Se debe desplegar un indicador visual en el encabezado de las pestañas concluidas:
    `🔒 Etapa Concluida y Aprobada (Solo Lectura)`.

### 2.2. Navegación Visual Monótona (Sin Regresión de Kanban)
- **Principio:** Navegar o hacer clic en una pestaña previa para consultar datos **NUNCA** puede modificar el campo `subtab_activa` ni alterar la posición del proyecto en las columnas del Kanban.
- **Implementación:**
  - `subtab_actual_view`: Registra la pestaña que el usuario está mirando actualmente en pantalla.
  - `subtab_activa`: Registra el **hito macro más alto alcanzado por la OT**. Esta variable solo puede avanzar (`newRank > currentRank`), nunca retroceder.

---

## 3. Manejo de Excepciones Operativas (Modificaciones en Faena/Patio)

### 3.1. Único Punto de Mutación: Sub-tab 5 (Preparación de Salida / Patio)
Toda contingencia real (falla técnica de equipo, reemplazo de operador, o adición de camión de apoyo) **debe gestionarse exclusivamente en la Sub-tab 5** mediante el panel de **Excepciones de Flota**:

1. **Reemplazo por Falla Técnica / Incapacidad:**
   - Desasigna el recurso defectuoso guardando el motivo en la bitácora (`DESASIGNADO_POR_FALLA`).
   - Asigna el nuevo recurso en estado `🔴 PENDIENTE_ACREDITACION_DELTA`.
2. **Adición de Recurso Extra:**
   - Incorpora un nuevo equipo/persona en estado `🔴 PENDIENTE_ACREDITACION_DELTA`.

### 3.2. Protocolo de Acreditación Delta (Re-evaluación Focalizada)
- El sistema evalúa automáticamente los documentos del nuevo recurso contra la matriz exigida por el cliente.
- Si el recurso está al día ➔ Transiciona inmediatamente a `🟢 ACREDITADO`.
- Si faltan documentos ➔ Bloquea la **Inspección de Patio (Template 76)** únicamente para ese recurso específico, sin afectar la preparación del resto de la flota.

---

## 4. Criterio de Aceptación & Verificación Empírica (QA)
- **Prueba 1:** Entrar a un proyecto en estado *Preparación de Salida*, abrir la Sub-tab 2 (Asignación) y verificar que los `<select>` de grúas y tripulantes estén bloqueados (`disabled`).
- **Prueba 2:** Navegar a la Sub-tab 4 (Acreditaciones), cerrar el modal y verificar en la Torre de Control que el proyecto permanezca intacto en la columna **"EN PREPARACION OPERACIONES"**.

---

## 5. Gobernanza Financiera: Protocolo de Regularización de Jornadas (Control en Vivo ➔ ITS ➔ EDP)
*Gobernado canónicamente por [Spec 63 §12](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/.agents/specs/63_control_operativo_vivo_hibrido_spec.md#L279).*

### 5.1. Frontera entre Monitoreo Operativo y Título Ejecutivo de Cobro
1. **Monitoreo (Control en Vivo):** Registrar o corregir horas en Torre de Control gestiona SLAs y semáforos matinales, pero **no sustituye la fe pública del Report Diario**.
2. **Prohibición de Facturación "en el Aire":** Ninguna jornada puede liquidarse en el Estado de Pago (EDP) ni enviarse a Facturación sin contar con uno de los **3 Linajes Probatorios Exclusivos**:
   - `🟢 FES Digital:` Reporte emitido desde PWA con firma canvas de mandante, geolocalización y código FES.
   - `📄 Doc Físico Regularizado:` Reporte administrativo generado por Analista de Gestión (Yiara) con respaldo obligatorio adjunto (PDF/foto de boleta física firmada por ITO o correo formal de aprobación).
   - `⚖️ Piso Mínimo Contractual:` Imputación formal de horas mínimas pactadas en cotización CRM (ej. 8 horas de standby) por causa imputable al mandante sin firma de terreno.

### 5.2. Conciliación Obligatoria en la Mesa del ITS
- Es responsabilidad estricta del **Analista de Gestión de Operaciones (Yiara)** regularizar las jornadas sin report en la apertura del ITS.
- El sistema detectará las brechas entre la planificación y las emisiones de terreno, ofreciendo los dos caminos de resolución (Vía B: Respaldo Físico / Vía C: Piso Mínimo) antes de consolidar el ITS y generar la Carátula del EDP.
- Una vez emitido el ITS, las jornadas quedan **selladas e inmutables**. Cualquier modificación posterior exige una Solicitud de Cambio RFC formal aprobada por Administración.

