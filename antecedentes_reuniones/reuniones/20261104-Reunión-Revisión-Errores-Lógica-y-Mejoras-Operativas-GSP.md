# 📝 Minuta de Reunión: Revisión de Errores Funcionales, Ajuste de Reglas en Preventa/OT y Mejoras Operativas GSP

**Fecha:** 04 de Noviembre de 2026  
**Hora:** 09:58 CLT (GMT-03:00)  
**Proyecto:** Plataforma de Gestión Operativa, Comercial y Financiera — Grúas San Pablo (GSP)  
**Participantes Asistentes:**  
*   **Jorge Ponce** (Gerente General / Operaciones — Grúas San Pablo — `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Director de Proyecto / Arquitecto Senior — LeanGlobal — `sgajardoc@gmail.com`)  

**Stakeholders / Comité Mencionados:**  
*   **Yiara Mendoza** (Analista de Control de Gestión / PMO — Grúas San Pablo)  
*   **Remis** (Informática — Grúas San Pablo)  

**Enlaces y Registros Oficiales:**  
*   📄 [Transcripción Oficial de Google Docs](https://docs.google.com/document/d/1K7UKFD0wZXHpG6fnuEiFIQtxZnCZA9MeQibjvYrDqnQ/edit?usp=drive_web&tab=t.xt27p4sj35b8)

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Sesión de revisión crítica y control de calidad operativo entre la Gerencia de Operaciones de GSP (**Jorge Ponce**) y la Dirección de Proyecto de LeanGlobal (**Sergio Gajardo**), orientada a resolver desviaciones funcionales detectadas durante la operación diaria y blindar las validaciones de entrada en Preventa Comercial, Orden de Trabajo (OT), Reportes PDF y Aplicación Móvil PWA:

1. **Revisión y Cuadratura del Caso `00007`:** Análisis de la falla originada por lógica heredada previa a los indicadores explícitos de Rigger/Prevencionista que alteraba los montos del Informe de Término de Servicio (ITS); regeneración de la OT y verificación de cuadratura completa.
2. **Eliminación de Campos Prellenados en Web y PWA:** Acuerdo de dejar vacíos por defecto los campos críticos (`Condición del Servicio`, `Alimentación / Pensiones` y `Horómetro de Superestructura`) para erradicar errores por aceptación automática de valores sugeridos.
3. **Trazabilidad Comercial $\rightarrow$ Operativa en la Orden de Trabajo (OT):** Obligatoriedad de la descripción comercial del servicio con herencia automática hacia la OT para el operador, y ajuste del cálculo de horas mínimas y políticas de cobro por equipo/patente.
4. **Saneamiento de Textos Estáticos y Anexos Documentales en PDF:** Eliminación de la referencia incorrecta en el punto 5 de los servicios y configuración de anexo automático de documentos adjuntos al final del PDF oficial.
5. **Rediseño Estructural del Cotizador Comercial (Estructura de Árbol):** Compromiso de presentar una propuesta formal para organizar los ítems comerciales en jerarquía de árbol (Equipo Principal $\rightarrow$ Sublíneas de Traslado/Adicionales).

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

| Categoría | Decisión | Estado |
| :--- | :--- | :---: |
| **Preventa Comercial** | Eliminar prellenado y opción `"No aplica"` en Alimentación y Pensiones; exigir selección obligatoria (`Cliente` vs. `San Pablo`). | ✅ **Acordada (En Firme)** |
| **Preventa Comercial** | Dejar `"Condición del Servicio"` (`Programado` vs. `A Disposición`) en blanco por defecto y obligatoria. | ✅ **Acordada (En Firme)** |
| **Preventa $\rightarrow$ OT** | Hacer obligatorio el campo de Descripción del Servicio en preventa y heredarlo automáticamente a la OT del operador. | ✅ **Acordada (En Firme)** |
| **Orden de Trabajo (OT)** | Calcular y mostrar el piso mínimo / política de cobro por cada equipo/patente, excluyendo `Personal Certificado` y `Traslados`. | ✅ **Acordada (En Firme)** |
| **Orden de Trabajo (OT)** | Eliminar referencia incorrecta a tarjeta Copec en ruta / Carlos Mendoza en el Punto 5 de todos los servicios. | ✅ **Acordada (En Firme)** |
| **Reportes / PDF Oficial** | Anexar automáticamente todos los documentos adjuntos del servicio/reporte al final del PDF oficial (sin selector manual complejo). | ✅ **Acordada (En Firme)** |
| **App PWA Terreno** | Eliminar el prellenado del Horómetro de Superestructura para obligar al operador a digitar la lectura real. | ✅ **Acordada (En Firme)** |
| **Cotizador Comercial** | Reestructurar ítems comerciales en jerarquía de árbol (Equipo Principal $\rightarrow$ Sublíneas de Traslado/Accesorios). | ⏳ **Propuesta Estructurada (05-Nov-2026)** |

---

### 2.1. Eliminación de Prellenados y Opción `"No Aplica"` en Condiciones Comerciales y Alimentación
*   **Decisión / Regla de Negocio:**
    1. El estado de la condición del servicio (**`Programado`** o **`A Disponibilidad`**) debe iniciar en blanco (`''`) por defecto, marcado con alerta visual roja hasta que el vendedor lo seleccione explícitamente.
    2. Los 5 selectores de **Proyección de Costos de Pensiones / Alimentación** (`Alojamiento`, `Desayuno`, `Almuerzo`, `Cena`, `Traslado Personal`) no deben venir prellenados ni incluir la opción `"No aplica"`, obligando al ejecutivo comercial a definir para cada ítem si es **`Costeado por Cliente`** o **`Costeado por San Pablo`** antes de emitir la cotización.
*   **Impacto en Plataforma / Arquitectura (`SPEC-016`):** Actualización de `GestorOportunidades.vue` y validaciones de guardado/emisión en Preventa Comercial.

### 2.2. Obligatoriedad de la Descripción del Servicio en Preventa y Herencia a la OT
*   **Decisión / Regla de Negocio:** La descripción del servicio en Preventa Comercial debe ser un campo extendido y obligatorio, acompañado de una indicación explícita de que dicho texto se reflejará directamente en la **Orden de Trabajo (OT)** para el operador (detallando maniobra a realizar, viáticos, autorización de Uber, horas dobles, etc.).
*   **Impacto en Plataforma / Arquitectura (`SPEC-016` / `SPEC-033`):** Sincronización entre `opportunity.descripcion`, `siteVisit.detalle_servicio` y la sección de `Instrucciones & Descripción del Servicio` en `generarOrdenTrabajoVersion` (`proyectoModel.js`).

### 2.3. Regla de Visualización de Horas Mínimas y Políticas de Cobro por Equipo en la OT
*   **Decisión / Regla de Negocio:** Para evitar que la Orden de Trabajo muestre erróneamente piso diario cuando el servicio es mensual o tome la primera línea correspondiente a traslados o personal certificado (ej. caso Inarco `180 hrs`), el sistema debe:
    1. Filtrar exclusivamente las categorías de **Equipos** (excluyendo `Personal Certificado` y `Traslados`).
    2. Mostrar en la OT todos los equipos con sus respectivas políticas y unidades de cobro (`Horas Diarias Mínimas`, `Horas Mes Mínimas` o `Valor Fijo`) asociadas a cada patente.
*   **Impacto en Plataforma / Arquitectura (`SPEC-033`):** Ajuste en `generarOrdenTrabajoVersion` (`proyectoModel.js`) y vista de OT en `GestorOportunidades.vue`.

### 2.4. Eliminación de Referencia Estática en el Punto 5 de los Servicios
*   **Decisión / Regla de Negocio:** Eliminar de forma transversal la referencia estática incorrecta de autorización de tarjeta Copec en ruta / Carlos Mendoza en el punto 5 de todos los servicios.
*   **Impacto en Plataforma / Arquitectura:** Saneamiento en `proyectoModel.js` (`generarOrdenTrabajoVersion`), `GestorOportunidades.vue` y registros de base de datos si existiese algún texto persistido.

### 2.5. Anexado Automático de Documentos Adjuntos en el PDF Oficial
*   **Decisión / Regla de Negocio:** Todos los documentos o fotografías adjuntos a un reporte o servicio deben integrarse automáticamente como páginas de anexo al final del PDF oficial emitido (Report Diario / EDP), manteniendo el flujo simple de adjuntar archivos sin requerir selectores adicionales.
*   **Impacto en Plataforma / Arquitectura (`SPEC-057` / `SPEC-098`):** Integración automática de imágenes y páginas PDF adjuntas (`pdf-lib`) al compilar el PDF oficial en `reportDiarioPdfService.js` y `edpPdfService.js`.

### 2.6. Eliminación del Prellenado del Horómetro de Superestructura
*   **Decisión / Regla de Negocio:** El campo de **Horómetro de Superestructura** (tanto en inicio como en término de jornada) debe presentarse siempre vacío al operador para impedir que confirme valores sugeridos sin revisar el reloj físico de la máquina.
*   **Impacto en Plataforma / Arquitectura (`SPEC-049`):** Eliminación de la asignación automática de `horometro_sugerido` y `horometroPropuesto` sobre `form.horometro_inicio` y `form.horometro_termino` en `ReportDiarioIzaje.vue`.

### 2.7. Propuesta de Rediseño del Cotizador Comercial en Estructura de Árbol
*   **Decisión / Regla de Negocio:** Diseñar y presentar una propuesta estructurada donde el cotizador comercial agrupe jerárquicamente los ítems en forma de árbol (Equipo Principal como nodo raíz con sus sublíneas de traslado ida/retorno y accesorios vinculadas, separado de las líneas de Personal Certificado).

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Fecha Límite / Hito | Estado |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Configurar Condiciones de Servicio y Pensiones (`REQ-1103`):** Dejar `Condición del Servicio` (`Programado` / `A Disposición`) y los 5 campos de `Pensiones` en blanco por defecto, marcados en rojo si faltan, obligatorios y sin la opción `"No aplica"`. | Sergio Gajardo | LeanGlobal | 04-Nov-2026 | ✅ Completado (`v1.0.192`) |
| **2** | **Incluir Descripción Obligatoria hacia la OT (`REQ-1104`):** Hacer obligatorio el campo de descripción del servicio en Preventa (con aviso de visibilidad para el operador) y heredarlo automáticamente a la Orden de Trabajo (OT). | Sergio Gajardo | LeanGlobal | 04-Nov-2026 | ✅ Completado (`v1.0.192`) |
| **3** | **Corregir Horas y Políticas de Cobro en OT (`REQ-1105`):** Filtrar únicamente categorías de equipos (excluyendo personal certificado y traslados) e incluir en la OT todos los equipos con su política de cobro por patente (`Horas Diarias Mínimas`, `Horas Mes Mínimas` o `Valor Fijo`). | Sergio Gajardo | LeanGlobal | 04-Nov-2026 | ✅ Completado (`v1.0.193`) |
| **4** | **Eliminar Error en Punto 5 de Flota/Servicios (`REQ-1106`):** Eliminar la referencia incorrecta a tarjeta Copec en ruta / Carlos Mendoza en el punto 5 de todos los servicios. | Sergio Gajardo | LeanGlobal | 04-Nov-2026 | 🔄 En Ejecución |
| **5** | **Integrar Documentos Adjuntos al PDF Oficial (`REQ-1107`):** Configurar que los documentos adjuntos en el reporte/servicio se integren automáticamente al final del PDF oficial como anexo. | Sergio Gajardo | LeanGlobal | 04-Nov-2026 | 🔄 En Ejecución |
| **6** | **Limpiar Prellenado de Horómetro Superestructura (`REQ-1108`):** Eliminar el prellenado del horómetro de la superestructura en la aplicación dejando el campo vacío para ingreso manual obligatorio. | Sergio Gajardo | LeanGlobal | 04-Nov-2026 | 🔄 En Ejecución |
| **7** | **Proponer Idea Estructurada de Cotizador en Árbol (`REQ-1109`):** Presentar propuesta formal de rediseño del estructurador comercial con jerarquía en árbol. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Programado |

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza

*   **Fecha Propuesta:** Jueves 05 de Noviembre de 2026.
*   **Participantes Convocados:** Jorge Ponce (`Grúas San Pablo`) y Sergio Gajardo (`LeanGlobal`).
*   **Foco Principal de la Sesión:** Revisión en producción de los 6 ajustes operativos liberados hoy y presentación de la propuesta estructurada del nuevo Cotizador Comercial en jerarquía de árbol.
