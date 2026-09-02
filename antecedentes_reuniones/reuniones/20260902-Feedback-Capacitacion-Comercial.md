# 📝 Compilación de Feedback y Hallazgos: Capacitación y Prueba Comercial en Vivo

**Fecha:** 2026-09-02 (11:00 - 12:10 hrs)  
**Contexto:** Sesión de capacitación funcional, enrolamiento y prueba del flujo comercial de cotización y asignación a operaciones.  
**Participantes:**  
*   **Sergio Gajardo** (LeanGlobal)  
*   **Jorge Ponce** (Asesor Externo - Grúas San Pablo)  
*   **Natalia Giselini** (Ejecutiva Comercial / Ventas - Grúas San Pablo)  
*   **Richard Jara** (Coordinador de Operaciones / Logística - Grúas San Pablo)  

---

## 📊 Matriz Consolidada de Hallazgos y Requerimientos

| # | Categoría | Hallazgo / Requerimiento | Impacto / Solución Propuesta | Estado |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Gestión de Contactos** | Al escribir un contacto nuevo en el formulario (sin seleccionarlo del selector), no se guarda en la base maestra. | Debe ejecutarse un **auto-guardado (Upsert)** en la libreta de contactos del cliente (`tpar_contactos` / `tclt_contactos`) para que quede disponible en futuras cotizaciones. | `🔴 Pendiente` |
| **2** | **Ergonomía de Preventa** | El volumen de la carga no es claro para el ejecutivo comercial. | Desglosar el input en **3 campos explícitos e independientes**: **Largo (m) × Ancho (m) × Alto (m)** con cálculo reactivo de \( \text{m}^3 \). | `🟡 Pendiente` |
| **3** | **Visita a Terreno** | En el módulo de Visita a Terreno se pide ingresar el contacto nuevamente. | **Precargar por defecto** el contacto principal ingresado al inicio de la cotización (Pestaña 1), permitiendo editarlo solo si es una persona distinta en obra. | `🟡 Pendiente` |
| **4** | **Validación & Diff (Pestaña 2)** | Traza de diferencias excesiva y ruidosa en pantalla (cajas rojas tachadas `Orig: ...` sobre cada campo). | Ocultar etiquetas diff en líneas agregadas desde cero o cotizaciones nuevas, y simplificar el indicador visual a un borde o tooltip sutil. | `🔴 Corrección UX` |
| **5** | **Despacho de Dossier (Pestaña 4)** | Al enviar el Dossier de Acreditaciones al mandante, el correo electrónico llega en blanco. | Corregir la plantilla HTML en el backend (`acreditacionController` / `messageModel`) para que inyecte el resumen de tripulación/equipos y el link de descarga. | `🔥 Bug Crítico` |
| **6** | **Iniciativa de Producto** | El estructurador actual resulta muy denso para arriendos simples o servicios spot de 1 día. | Desarrollar la modalidad **"Cotizador Light / Express"** en 3 pasos rápidos (< 2 min) con switch para alternar con el Estructurador Pro. | `🚀 Propuesta de Mejora` |

---

## 🛠️ Detalle Técnico de los Puntos Levantados

### 1. Auto-Guardado de Contactos Nuevos (Pestaña 1 - Preventa)
* **Comportamiento Actual:** Si el usuario ingresa manualmente un nombre, teléfono o correo en los inputs de contacto, los valores solo viajan dentro del JSON del proyecto (`json_field.datos_generales.contacto_*`).
* **Mejora a Implementar:** En el backend (`proyectoController` / `contactoModel`), si el `id_contacto` viene nulo pero los campos de texto tienen valor, realizar un `INSERT INTO tpar_contactos (id_empresa, nombre, telefono, email)` asociado al cliente.

### 2. Dimensionamiento Explícito de la Carga (Pestaña 1 - Datos de Carga)
* **Comportamiento Actual:** Campo único o etiqueta ambigua de volumen.
* **Mejora a Implementar:** Crear un bloque visual de 3 columnas:
  ```
  ┌─────────────────┬─────────────────┬─────────────────┐
  │   Largo (m)     │    Ancho (m)    │    Alto (m)     │
  │   [ 12.50 ]     │    [ 2.40 ]     │    [ 3.10 ]     │
  └─────────────────┴─────────────────┴─────────────────┘
  👉 Volumen Total Calculado: 93.00 m³
  ```

### 3. Precarga Automática de Contacto en Visita Técnica
* **Comportamiento Actual:** El subformulario de asignación de visita técnica abre con campos vacíos.
* **Mejora a Implementar:** Al activar el checkbox *"Requiere Visita a Terreno"*, inicializar automáticamente:
  `visita.contacto_nombre = form.contacto_nombre`  
  `visita.contacto_telefono = form.contacto_telefono`  
  `visita.contacto_email = form.contacto_email`

### 4. Limpieza de Traza Visual en "2. Validación & Diff"
* **Comportamiento Actual:** La función `hasDiff()` evalúa campo a campo comparando con el snapshot comercial inicial. Si una línea no existía o fue modificada íntegramente, renderiza hasta 5 cajas rojas superpuestas (`Orig: TRASLADOS`, `Orig: CAMA BAJA`, etc.).
* **Mejora a Implementar:** 
  - Si la línea es nueva (`is_new_line`), no mostrar etiquetas de tachado `Orig:`.
  - Reemplazar las cajas de texto tachado por un borde sutil ámbar/azul y un badge consolidado `[ Modificado vs Preventa ]`.

### 5. Corrección de Despacho de Dossier de Acreditación (Pestaña 4)
* **Comportamiento Actual:** La API envía el correo pero el body HTML va `undefined` o vacío.
* **Mejora a Implementar:** Configurar la plantilla HTML oficial en `acreditacionController.despacharDossierCliente` con:
  - Membrete Grúas San Pablo.
  - Tabla resumen con los operadores, riggers y grúas acreditadas.
  - Botón de acción directo `[ 📥 Descargar Dossier PDF de Acreditación ]`.

### 6. Diseño del "Cotizador Light / Express"
* **Propósito:** Permitir a ejecutivos comerciales cotizar servicios estándar (ej. 1 Grúa 70 Ton por 2 días en Temuco) en menos de 2 minutos.
* **Estructura en 3 Pasos:**
  1. *Paso 1: Mandante y Faena* (RUT/Razón Social + Comuna).
  2. *Paso 2: Equipo y Días* (Selector de Grúa con sugerencia de tarifa diaria y tripulación incluida).
  3. *Paso 3: Emisión Inmediata* (Botón para generar PDF de propuesta formal y enviar por correo).
* **Selector de Modo:** Toggle superior `[ Modo Express / Light ]` ⇄ `[ Modo Estructurador Pro ]`.

---

## 🎯 Plan de Acción Recomendado

1. **Sprint Inmediato (Hotfixes y Usabilidad - 1 a 2 horas):**
   - Resolver el bug del correo vacío de acreditaciones (Ítem 5).
   - Limpiar la traza visual de diff en Pestaña 2 (Ítem 4).
   - Implementar la precarga de contacto en Visita a Terreno y desglose de volumen (Ítems 2 y 3).
   - Añadir el auto-guardado de contactos (Ítem 1).
2. **Sprint de Producto:**
   - Diseñar y maquetar el componente `CotizadorLight.vue` (Ítem 6).
