# 📋 Especificación de Formulario: Visita a Terreno (Site Visit)

Este documento define la estructura oficial, secciones, campos y lógica de validación para el formulario digital de **Visita a Terreno (Site Visit)** de Grúas San Pablo (GSP), adaptado directamente del formato físico en papel.

---

## 🗺️ Estructura Completa del Formulario (9 Secciones)

### 1. Datos de la Empresa (Cliente)
*   **1.1 Razón Social:** Texto (`textField`) - Obligatorio.
*   **1.2 RUT:** Texto (`textField`) - Validador de RUT chileno.
*   **1.3 Giro:** Texto (`textField`) - Opcional.
*   **1.4 Quién Solicita:** Texto (`textField`) - Persona de contacto.
*   **1.4.1 N° Teléfono:** Teléfono (`textField`) - Formato numérico.
*   **1.5 Correo Electrónico Cliente:** Email (`textField`) - Validador de email.

### 2. Datos Generales del Servicio
*   **2.1 Nombre de la Obra:** Texto (`textField`) - Obligatorio.
*   **2.2 Dirección de la Obra:** Texto (`textField`) - Dirección física.
*   **2.3 Referencia de la Dirección:** Texto (`textArea`) - Indicaciones auxiliares de acceso.
*   **2.4 Visitado Por:**
    *   **Nombre Vendedor:** Texto (`textField`).
    *   **Nombre Operador:** Texto (`textField`).
*   **2.5 Contacto en Terreno:** Texto (`textField`) - Persona receptora.
    *   **N° Teléfono:** Teléfono (`textField`).
*   **2.6 Correo Electrónico Contacto:** Email (`textField`).

### 3. Datos Específicos del Servicio
*   **3.1 Equipo a Definir:** Combo/Texto (`comboBox`) - Grúa o maquinaria sugerida para la maniobra.
*   **3.2 El Servicio Requiere de un Rigger:** Selección única (`radioButton` - SI / NO).

### 4. Datos Técnicos de la Ruta
*   **4.1 Ruta Visita a Terreno:**
    *   **Desde:** Texto (`textField`).
    *   **Hasta:** Texto (`textField`).
*   **4.2 Existencia de Romanas en el Trayecto:** Booleano (`radioButton` - SI / NO).
*   **4.3 Cuestas Pronunciadas:** Booleano (`radioButton` - SI / NO).
*   **4.4 Asfalto:** Booleano (`radioButton` - SI / NO) + **Cantidad Kilómetros** (`number` si SI).
*   **4.5 Ripio:** Booleano (`radioButton` - SI / NO) + **Cantidad Kilómetros** (`number` si SI).
*   **4.6 Puentes de Madera a Considerar (en el trayecto o dentro de la obra):**
    *   **¿Existen Puentes?:** Booleano (`radioButton` - SI / NO).
    *   **Cantidad de Puentes:** Número (`number` si SI).
    *   **Dimensiones:** Texto (`textField` si SI).
    *   **Material de Vigas:** Texto (`textField` si SI).
*   **4.7 Existencia de Ramas de Árboles y/o Árboles en la Ruta:** Booleano (`radioButton` - SI / NO) + **Altura/Medidas** (`textField` si SI).
*   **4.8 Existencia de Cables de Tendido Eléctrico Bajo en la Ruta:** Booleano (`radioButton` - SI / NO).
*   **4.9 Camino Forestal:** Booleano (`radioButton` - SI / NO).
*   **4.10 La Obra está Ubicada en la Macrozona Sur:** Booleano (`radioButton` - SI / NO).
*   **4.11 Zona Roja:** Booleano (`radioButton` - SI / NO).
*   **4.12 Superficie de Acceso al Servicio se Encuentra en Buenas Condiciones:** Booleano (`radioButton` - SI / NO).
*   **4.13 Se Recomienda un Mejoramiento o Refuerzo para los Accesos:** Booleano (`radioButton` - SI / NO).
*   *Evidencia:* **Fotografías de Accesos y Puentes** (Módulo de captura de fotos `photo`).

### 5. Datos Técnicos del Espacio de Trabajo
*   **5.1 Espacio de Trabajo Cuenta con Espacio Suficiente para Realizar el Servicio:** Booleano (`radioButton` - SI / NO).
*   **5.2 Condiciones del Terreno son Favorables:** Booleano (`radioButton` - SI / NO).
*   **5.3 Tipo de Suelo en el que se Posicionará el Equipo:** Selección única (`comboBox`):
    *   *Natural*
    *   *Asfalto*
    *   *Hormigón*
    *   *Base Estabilizadora Compactada*
    *   *Otro* (Habilita campo de especificación).
*   **5.4 Existencia de Tuberías Subterráneas en Zona para Armar Equipo (Agua, alcantarillado, lluvias):** Booleano (`radioButton` - SI / NO).
*   **5.5 Bases Estabilizadoras Estándar son las Adecuadas:** Booleano (`radioButton` - SI / NO).
*   **5.6 Existe Tendido Eléctrico en el Radio del Servicio (Trabajo/Tránsito):** Booleano (`radioButton` - SI / NO).
*   **5.7 Se Cuenta con Iluminación Suficiente en el Área:** Booleano (`radioButton` - SI / NO).
*   **5.8 Existen Árboles, Vegetación o Elementos que Dificulten el Servicio:** Booleano (`radioButton` - SI / NO).
*   **5.9 Existen Elementos que Dificulten la Visibilidad de la Maniobra:** Booleano (`radioButton` - SI / NO).
*   **5.10 Es Condicionante el Clima Según el Servicio a Realizar:** Booleano (`radioButton` - SI / NO).

### 6. Datos Técnicos de Izaje
*   **6.1 Tipo de Carga:** Texto/Combo (`textField` - Ej: Container, Estanque, Estructura Metálica, etc.).
*   **6.2 Peso de la Carga:** Número (`number` en toneladas o kilos) - Proporcionado por el cliente.
*   **6.3 Volumen de la Carga (Verificado por GSP):**
    *   **Largo:** Número (`number` en metros).
    *   **Ancho:** Número (`number` en metros).
    *   **Alto:** Número (`number` en metros).
*   **6.4 Radio Mínimo de Trabajo:** Número (`number` en metros).
*   **6.5 Radio Máximo de Trabajo:** Número (`number` en metros).
*   **6.6 Altura de Trabajo:** Número (`number` en metros).
*   **6.7 Puntos y Tomas de Izaje:**
    *   **¿La carga cuenta con tomas de izaje?:** Booleano (`radioButton` - SI / NO).
    *   *Si SI:* **Estado de Tomas** (`comboBox` - Bueno / Regular / Malo) + **Medidas para Grilletes** (`textField`).
    *   *Si NO:* **Forma en que se Tomará la Carga** (`textArea`) + **Puntos de Amarre** (`textArea` - Para evitar daños).
    *   **Tipo de Maniobra de Izaje a Realizar:** Texto/Combo (`textField`).
*   **6.8 Maniobra a Realizar es Maniobra Tándem:** Booleano (`radioButton` - SI / NO).
    *   *Si SI:* **Radios Mínimos/Máximos de Cada Grúa** (`textArea`).
*   *Evidencia:* **Fotografías de Tomas, Cáncamos y Puntos de Izaje** (`photo`).

### 7. Croquis Adicional
*   **7.1 Dimensiones de la Carga:** Croquis/Fotografías de dimensiones (`photo`).
*   **7.2 Radio de Trabajo e Interferencia:** Croquis de posicionamiento de estabilizadores (`photo`).
*   *Evidencia:* **Fotografías Generales de la Carga** (`photo`).

### 8. Datos de Implementos para el Servicio
*   **8.1 Estrobos:** Booleano (`radioButton` - SI / NO) + **Capacidad/Largo/Cantidad** (`textField` si SI).
*   **8.2 Pulpo Cadena:** Booleano (`radioButton` - SI / NO) + **Capacidad/Cant. Ramales/Largo** (`textField` si SI).
*   **8.3 Eslingas:** Booleano (`radioButton` - SI / NO) + **Capacidad/Largo/Cantidad** (`textField` si SI).
*   **8.4 Grilletes:** Booleano (`radioButton` - SI / NO) + **Capacidad/Cantidad** (`textField` si SI).
*   **8.5 Accesorios:** Booleano (`radioButton` - SI / NO) + **Tipo de Accesorio** (`textField` si SI).

### 9. Recomendación y Pactos con el Cliente
*   **Observaciones / Recomendaciones:** Área de texto largo (`textArea`).
*   *Evidencia:* **Fotografías de Mejoras a Realizar** (ej: despeje de ramas, compactación) (`photo`).
*   **Firmas de Conformidad:**
    *   **Firma del Vendedor/Operador GSP:** Panel de Firma digital (`signature`) + Nombre completo + RUT.
    *   **Firma del Cliente/Mandante:** Panel de Firma digital (`signature`) + Nombre completo + Cargo + RUT.
