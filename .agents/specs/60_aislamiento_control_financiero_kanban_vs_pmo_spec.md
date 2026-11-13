# Especificación Técnica: Aislamiento de Control Financiero (Kanban Solo Lectura vs Edición Exclusiva en PMO)

**Código:** `SPEC-60`  
**Requerimiento Backlog:** `REQ-038`  
**Versión:** `1.0.74`  
**Fecha:** 2026-10-02  
**Autor:** Sergio Gajardo / Antigravity AI  
**Estado:** `IMPLEMENTADO / CERTIFICADO`  

---

## 1. Contexto y Justificación del Negocio

En la gobernanza de Grúas San Pablo (GSP), se ha establecido una regla arquitectónica y operativa inquebrantable:
> **"En el Tablero Kanban y Gestor Comercial, la información financiera (Reports validados, ITS, EDP, OCs y Facturación) SOLO SERÁ VISIBLE (Modo Solo Lectura / Auditoría). Toda edición contable, ajuste de tarifas, carga documental y registro de facturación DTE reside y opera EXCLUSIVAMENTE EN LA TORRE DE CONTROL PMO (Cockpit del Analista de Control de Gestión)."**

### Problema Detectado
Previamente, el sub-tab de Liquidación & Cierre dentro del `GestorOportunidades.vue` (accesible desde el Kanban comercial) exponía formularios interactivos de subida de OC, imputación manual de factura y el botón maestro de cierre contable (`Declarar Facturada & Cerrar`), permitiendo que usuarios comerciales u operativos modificaran o concluyeran procesos contables fuera del control del Analista PMO y de Tesorería.

---

## 2. Definición Arquitectónica

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLERO KANBAN / CRM                     │
│               (Comercial, Operaciones, Jefatura)            │
│  - GestorOportunidades.vue -> Subtab D: Liquidación         │
│    • Paso 1 (ITS): ModalITS (readonly = true)              │
│    • Paso 2 (EDP): ModalCaratulaEDP (solo-lectura = true)   │
│    • Paso 3 (OC): Visualización solo lectura de PDFs de OC   │
│    • Paso 4 (Factura DTE): Ficha resumen solo lectura        │
│    • Inmutabilidad financiera: Sin inputs ni botones cierre │
└──────────────────────────────┬──────────────────────────────┘
                               │ Auditoría Visual
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TORRE DE CONTROL PMO                      │
│            (Analista de Control de Gestión, Pamela, Sergio) │
│  - Torre.vue -> Sub-vista 3: Pipeline EDP & Facturación    │
│    • Botón de acción: [ 🧾 Carátula & Facturar PMO ]        │
│    • ModalCaratulaEDP (solo-lectura = false)                │
│    • Ajuste de Tarifas y Descuentos (Pamela / Sergio)       │
│    • Subida física y vinculación de OCs (PDF)               │
│    • Emisión DTE, ingreso N° Factura y PDF Oficial          │
│    • Botón formal: [ 🏁 Declarar Facturado & Concluir ]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Modificados

### 3.1 `ModalCaratulaEDP.vue`
- **Nuevo Prop:** `soloLectura: { type: Boolean, default: false }`.
- **Comportamiento en `soloLectura = true` (Kanban):**
  - Banner superior: *"Modo Consulta / Auditoría (Kanban): Visualización de tarifas y respaldos en modo solo lectura. La edición de tarifas, carga documental de OC y registro de Facturación DTE se realizan exclusivamente desde la Torre de Control PMO."*
  - Bloqueo total de modo edición de tarifas (`modoAjusteTesoreria` y botón `Ajustar Tarifas` ocultos).
  - Bloque 1 (OC): Se transforma en tarjeta informativa con N° OC, fecha, monto neto y enlace `📄 Ver Respaldo OC (PDF)`. Oculta botones de subida física y botón `Sin OC (Asumir EDP)`.
  - Bloque 2 (Factura DTE): Se transforma en tarjeta informativa con N° Factura, fecha, monto bruto y enlace `🧾 Ver DTE Factura (PDF)`. Oculta inputs de texto y botones de guardado o conclusión.
- **Comportamiento en `soloLectura = false` (Torre PMO):**
  - Mantiene plenas facultades para perfiles autorizados (Pamela / Tesorería y Sergio Gajardo / Admin) para ajustar tarifas, subir archivos y concluir el servicio.

### 3.2 `GestorOportunidades.vue` (Subtab Liquidación en Kanban)
- **ModalCaratulaEDP:** Invocado explícitamente con `:solo-lectura="true"`.
- **Paso 3 (Órdenes de Compra):**
  - Se eliminan los botones interactivos `[ + Adjuntar OC ]`, `[ 📄 Cliente Sin OC ]` y los botones de eliminación `[ 🗑️ ]`.
  - Se añade banner identificador de Modo Solo Lectura.
  - Se muestra el listado de OCs registradas con visualización de montos y descarga de PDF.
- **Paso 4 (Facturación DTE):**
  - Se eliminan todos los inputs interactivos de edición (`factura_numero`, `fecha_facturacion`, `hes_oc_numero`, `observaciones`).
  - Se elimina el botón `Declarar Facturada & Cerrar`.
  - Se implementa tarjeta de estado:
    - Si está facturado: Badge verde con N° DTE, fecha, HES/OC asociada, total devengado y observaciones contables.
    - Si está pendiente: Badge ámbar con indicación de devengado neto y mensaje de derivación a la Torre PMO.

### 3.3 `Torre.vue` (Torre de Control PMO)
- En Sub-vista 3 (`pendientes_edp`), el botón `Facturar en CRM ➔` fue reemplazado por `[ 🧾 Carátula & Facturar PMO ➔ ]`, el cual invoca `abrirCaratulaEdpPMO(id)` directamente en la interfaz del Analista/Tesorería sin redirigir al CRM.
- Se mantiene el botón iconográfico `🏢` para abrir la OT en CRM en modo auditoría si se requiere consultar antecedentes comerciales.
- Invocación de `ModalCaratulaEDP` con `:solo-lectura="false"`.

---

## 4. Matriz de Roles y Accesos (RBAC Financiero)

| Vista / Interfaz | Rol de Usuario | Visualización Financiera | Edición Tarifas / OCs / Factura |
| :--- | :--- | :--- | :--- |
| **Kanban / Gestor Comercial** | Cualquier rol (Comercial, Operaciones, Admin) | **Habilitado (Solo Lectura)** | **Bloqueado (Inmutable)** |
| **PMO (Torre de Control)** | Analista PMO | **Habilitado** | **Auditoría / Revisión** |
| **PMO (Torre de Control)** | Tesorería (Pamela Seguel) | **Habilitado** | **Habilitado Pleno (Edición y Cierre)** |
| **PMO (Torre de Control)** | Administrador (Sergio Gajardo) | **Habilitado** | **Habilitado Pleno (Edición y Cierre)** |
