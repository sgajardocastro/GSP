# Especificación Técnica Integral: Torre de Control Operativa y Comercial

## 1. Objetivo y Alcance
La Torre de Control no es un simple Kanban de operaciones; es el cerebro de ejecución End-to-End del ecosistema Grúas San Pablo. Gobierna todo el ciclo de vida de un requerimiento: desde el modelamiento técnico, la cotización formal con control de versiones, el despacho al cliente con traza de auditoría, hasta la ejecución física y cierre en terreno.

---

## 2. Ciclo de Vida y Máquina de Estados (FSM `faseActual`)

El flujo transaccional se compone de 6 estados duros. El paso entre estados está gobernado por reglas estrictas de negocio que QA debe certificar.

### 🔴 FASE 1: COTIZACIÓN Y GESTIÓN COMERCIAL (Estado 1)
- **Generador de Cotizaciones (PDF Engine):** El sistema toma los datos técnicos (Site Visit, Equipos, Personal, Hitos de Facturación) y compila un Dossier/Cotización Formal en PDF.
- **Control de Versiones:** Cada vez que se modifica una cotización, el sistema incrementa la versión (ej. `v1.0` -> `v1.1`). La BD mantiene el historial inmutable.
- **Despacho B2B y Traza:** Las cotizaciones se envían directamente desde el sistema (`/message`). Genera una traza de auditoría: Cuándo se envió, a quién, y si el cliente lo abrió (Tracking).
- **Transición:** Al aprobarse la cotización, la oportunidad pasa a "Ganada" y entra al Kanban operativo (Fase 2).

### 🟠 FASE 2: VALIDACIÓN DIFF Y ACREDITACIÓN (Estado 2)
El Jefe de Operaciones recibe el proyecto ganado e ingresa al Tablero de Operaciones.
- **Análisis de Brechas (Diff):** El sistema muestra 3 columnas comparativas: "Datos Servicio Cotizado" vs "Recursos Reales Necesarios". El Jefe debe conciliar la teoría comercial con la práctica logística.
- **Marcado de Diferencias (Aprobación con Observaciones):** Si los recursos comerciales difieren de los necesarios (ej. se requiere una grúa más grande), el Jefe selecciona el modo de aprobación `"CON_OBSERVACIONES"`.
- **Notificaciones Automáticas (Email):** Al aprobar con observaciones, el sistema dispara correos electrónicos automatizados (`POST /message`) al Ejecutivo Comercial responsable y a los integradores enrolados (FES).
- **Traza Inalterable:** Todo correo disparado queda registrado en una bitácora inalterable (`Traza Inalterable de Notificaciones & Envíos`).
- **Checklist de Acreditaciones (Hard-Stop):** El sistema despliega la grilla de exigencias (F30, SOAP, Exámenes). No se permite pasar a Fase 3 hasta marcar 100% de cumplimiento (OK).

### 🟡 FASE 3: ASIGNACIÓN DE RECURSOS (Estado 3)
Fase crítica de Hard-Allocation. La tarjeta de proyecto no puede avanzar si no cumple:
- **Regla de Asignación Física:** Se debe vincular explícitamente al menos un Equipo (identificado por su Patente única) y al menos un Operador/Rigger (identificado por su RUT de usuario).
- **Estructura de Datos Exigida:** El avance a "Preparación de Patio" se bloquea a menos que el array `json_field.operaciones_v1.recursos` contenga objetos válidos que referencien `id_user` y `id_equipo`.

### 🟢 FASE 4: PREPARACIÓN DE PATIO (Estado 4)
- Fase logística interna (Lavado, check pre-operacional, estiba).

### 🔵 FASE 5: EN FAENA (Estado 5)
- **Bloqueo Hacia Atrás:** Un proyecto jamás puede retroceder de "En Faena" a "Asignación". Solo puede avanzar a Terminado o ser pausado por un "Incidente" (el cual dispara correos y altera la traza).
- **Generación de PPD:** Se habilitan los endpoints para que los operadores en terreno envíen sus Partes de Producción Diaria (FES) hacia el sistema central.

### ⚫ FASE 6: TERMINADO (Estado 6)
Cierre comercial y paso a facturación.

---

## 3. Renderizado Asíncrono
La vista de Torre de Control requiere re-renderización optimizada. Cualquier actualización (Drag & Drop) dispara un request `PUT /api/proyectos/:id` y, de ser exitoso, actualiza el estado optimista en el frontend.
