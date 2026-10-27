# 📝 Minuta de Reunión: Revisión Técnica de Reglas y Simplificación Operativa de la APP (PWA)

**Fecha:** 2026-10-27  
**Hora:** 11:30 - 12:40 CLT  
**Participantes:**  
*   **Jorge Ponce** (Gerente General / Operaciones - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros Oficiales:**  
*   [Evento de Calendario Google Meet — Revisión reglas app](https://calendar.google.com/calendar/event?eid=MWJzM21zZGZvZzBidnZldjhvcnN1ZGpuOXMgc2dhamFyZG9jQG0)  
*   [Transcripción Oficial de la Reunión](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?usp=drive_web&tab=t.veqquh29tg5d)  

---

## 🎯 1. Resumen Ejecutivo

Sesión de revisión técnica y operativa de la aplicación móvil (**APP / PWA**) enfocada en la **simplificación extrema de la interfaz para operadores y riggers**, el **ajuste de campos obligatorios en los hitos de viaje y reporte diario de faena**, la **validación de seguridad (AST/IRL)** y la **planificación de la transición de sistemas** entre Casa Matriz y sucursales.

### Ejes Principales Abordados:
1. **Optimización de la Interfaz (APP):** Simplificación del menú principal y de la vista de operaciones para eliminar elementos que generan ruido visual o confusión en terreno. Ajuste de contraste (modo claro/oscuro), aumento de tamaño tipográfico y botones de acción principales de alta legibilidad, junto con la redefinición de campos obligatorios para el inicio y término de faena.
2. **Gestión de Seguridad:** Definición de la obligatoriedad y rigurosidad del Análisis de Seguridad en el Trabajo (AST) cada vez que se ejecute un trabajo con riesgo para mitigar contingencias legales para la compañía y su personal directivo/técnico.
3. **Planificación Comercial-Operativa y Transición de Sistemas:** Coordinación de servicios rurales y urbanos manteniendo flexibilidad en el estructurador comercial y delegando el control en Operaciones (validaciones en paralelo), traspaso del número corporativo de notificaciones WhatsApp a Dominic, paso de Geralsoft a modo hibernación en Casa Matriz y despliegue controlado en sucursales por un máximo de dos semanas con seguimiento semanal.

---

## 🏛️ 2. Decisiones de Negocio y Arquitectura Acordadas

### A. Simplificación del Menú Principal y Vista de Operaciones en la APP
* **Eliminación temporal del Control de Portón y Patio:** Se acordó retirar provisionalmente el módulo de control de portón y patio de la vista de operaciones hasta que comience a ser utilizado formalmente en terreno.
* **Simplificación de botones en Operaciones:** Se acordó eliminar de la interfaz operativa los botones de **Visitas a Terreno** sin datos asociados, las **Listas de Verificación (Checklists) iniciales** y el **Cotizador Express**, trasladando este último exclusivamente al menú comercial.
* **Ergonomía Visual y Contraste:** Se acordó corregir los problemas de legibilidad en la parte inferior de la pantalla en modo oscuro y los segmentos negros en modo claro, manteniendo fuentes grandes y botones verdes de alto contraste para facilitar la lectura de operadores con dificultades visuales.

### B. Flujo de Inicio de Viaje y Confirmación de Llegada a Faena
* **Parámetros obligatorios de salida (Viaje de Ida):** Para el inicio del viaje de ida es obligatorio registrar el **horómetro**, **odómetro** y **nivel de combustible** del equipo, respaldados con sus respectivas **fotografías** y la **firma del operador**.
* **Simplificación del registro de llegada a faena:**
  - Eliminar el botón/enlace de dudas y marcadores que redirigía a la documentación externa para evitar que los operadores salgan o cierren la aplicación por error.
  - Eliminar el campo opcional de observaciones en la pantalla de llegada.
  - Eliminar los datos de la superestructura en la pantalla de llegada a obra, manteniendo únicamente los datos obligatorios del traslado.
  - Cambiar la etiqueta del botón de confirmación únicamente a **`"Confirmar llegada"`**.

### C. Modificación de la Interfaz y Reglas del Reporte Diario (Inicio y Término)
* **Patente única y eliminación de selección multimáquina:** Se acordó corregir la visualización donde aparecían múltiples patentes y eliminar la selección multimáquina, mostrando una sola patente correspondiente al equipo asignado.
* **Nomenclatura de encabezados y contador de días:** Se acordó eliminar los botones superiores innecesarios en la vista de faena, renombrar los encabezados a **`"Inicio de report"`** y **`"Término de report"`**, y formatear el contador de días de servicio como **`"Día X de Y"`** (ej. *"Día 2 de 4"*).
* **Restricción de fecha y editabilidad de horario de inicio:**
  - Restringir el selector de fecha del reporte exclusivamente a la **fecha actual del sistema** (cualquier ajuste retroactivo se gestiona por backoffice).
  - Mantener editable la **hora de inicio** por si el operador comienza más tarde de lo programado, manteniendo fijo sin opción de edición el horómetro inicial.
  - Evaluar el reemplazo de selectores circulares de hora del sistema operativo móvil por entrada numérica directa para operadores menos tecnológicos.
* **Obligatoriedad estricta del horómetro de superestructura:** Se acordó establecer el registro del **horómetro de la superestructura** y su **fotografía** como estrictamente obligatorios en el reporte (eliminando la condición de opcional), por ser un dato crítico para el control de horas de uso en equipos arrendados y la programación de mantenciones preventivas.

### D. Resumen de Tiempos, Lógica de Standby y Cierre del Reporte
* **Simplificación del resumen de tiempos del reporte:** Se acordó eliminar del resumen final las tarjetas de *"Jornada total"* y *"Sobretiempo devengado"*, renombrando el indicador a **`"Hora report"`** para reflejar las horas efectivas y conservando claramente separado el **tiempo de colación**.
* **Estandarización de categorías y lógica de Standby:**
  - Destacar en mayúsculas las etiquetas de **`"STANDBY CLIENTE (COBRABLE)"`** y **`"STANDBY SAN PABLO (FALLA EQUIPO SIN COBRO AL CLIENTE)"`** para mejorar la comprensión visual.
  - Corregir la lógica de cálculo y persistencia en base de datos para que las horas de standby se descuenten correctamente, incluso cuando se seleccionan múltiples tipos de detención.
* **Exclusión de horómetro de chasis y notas de taller al cierre:**
  - Eliminar el **horómetro de chasis** del reporte diario de término de faena, dado que el desplazamiento dentro de la obra es mínimo y no corresponde registrarlo diariamente.
  - Excluir las **notas mecánicas de taller** del reporte destinado al cliente mandante.
  - Estandarizar el botón final con letras grandes como **`"Término de report"`**.

### E. Gestión de Seguridad (AST e IRL)
* **Rigurosidad del AST:** Se definió que el Análisis de Seguridad en el Trabajo (AST) debe ejecutarse cada vez que se realice una maniobra o trabajo que conlleve riesgos, y no solo una vez al día de manera rutinaria, mitigando riesgos legales graves que involucran a la empresa y a su personal (Omar, Dayana).

### F. Estructurador Comercial, Validación Operativa y Transición en Sucursales
* **Flexibilidad en el estructurador y validación operativa:** Se simplificará el estructurador para permitir fluidez comercial sin detener las cotizaciones (con validaciones en paralelo y autorización previa de Omar), delegando en Operaciones (**Jonathan**) la revisión y el rechazo de servicios catalogados como rurales que no incluyan el ítem de flete.
* **Categorización de plataformas y transporte complejo:** Se evaluó configurar las plataformas como servicios de arriendo (modalidad *rent a car*) en lugar de fletes, y definir entre Omar y Jorge Ponce el tratamiento de traslados con múltiples destinos (ej. movimiento de grúas o barreras New Jersey de Temuco a Valdivia) para reimplementarlo en un plazo de 2 a 4 días.
* **Implementación del sistema en sucursales con controles:** Se dejará Geralsoft en modo de hibernación en Casa Matriz y se desplegará el nuevo sistema en las sucursales por un periodo de transición de máximo **dos semanas**, estableciendo puntos de control semanales y el apoyo operativo de **Yara** para resolver discrepancias (ej. servicios controlados en Puerto Montt).

---

## 🤝 3. Compromisos y Próximos Pasos (TODOs)

| Tarea / Entregable | Responsable | Fecha Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Limpiar interfaz APP:** Eliminar botones innecesarios como control de portón, checklist y cotizador express de la vista de operaciones. Ajustar el tamaño de la fuente y la legibilidad/contraste de los botones para facilitar el uso por parte de los operadores. | **Sergio Gajardo** | 2026-10-28 | Pendiente |
| **Simplificar aplicación (Llegada y Reporte Diario):** Ajustar botones, campos obligatorios (horómetro de superestructura + foto obligatorios, fecha restringida al día actual), eliminar enlaces de ayuda/observaciones en llegada, quitar horómetro de chasis y notas de taller del cierre, mostrar una sola patente, contador `"Día X de Y"`, tarjetas de resumen (`"Hora report"` + colación) y botones `"Inicio de report"` / `"Término de report"`. | **Sergio Gajardo** | 2026-10-28 | Pendiente |
| **Corregir lógica Standby:** Estandarizar etiquetas en mayúsculas (`STANDBY CLIENTE (COBRABLE)` y `STANDBY SAN PABLO (FALLA EQUIPO SIN COBRO AL CLIENTE)`) y corregir la lógica de cálculo en el sistema/BD para que las horas de standby se descuenten correctamente. | **Sergio Gajardo** | 2026-10-28 | Pendiente |
| **Enviar QR de WhatsApp:** Realizar una sesión breve para enviar el código QR a Dominic y permitir que tome el control operativo del número corporativo de notificaciones. | **Sergio Gajardo** | 2026-10-27 (Tarde) | Pendiente |
| **Coordinar operaciones y transición:** Gestionar con Dominic y el equipo de operaciones durante la tarde la transición de funciones y la capacitación sobre las nuevas responsabilidades. | **Jorge Ponce** | 2026-10-27 (Tarde) | Pendiente |
| **Coordinar reunión interáreas:** Coordinar una reunión conjunta con las áreas de Operaciones, Comercial y Mantenimiento (incluyendo personal de Casa Matriz: Natalia, Marcelo, Wilson y Pamela) para el miércoles por la tarde. | **Jorge Ponce** | 2026-10-28 | Pendiente |
| **Confirmar horario de reunión:** Confirmar la disponibilidad de los equipos y el horario definitivo de la reunión tras el almuerzo. | **Jorge Ponce** | 2026-10-27 (Tarde) | Pendiente |

---

## 🕒 4. Detalle Cronológico de Puntos Tratados

*   **Ambiente de desarrollo y asignación de equipos** ([00:00:00](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.gdo56t8cf88l)):  
    Jorge Ponce y Sergio Gajardo iniciaron la sesión revisando el ambiente de desarrollo para limpiar el sistema y partir de cero. Jorge Ponce se asignó una grúa de 50 toneladas (modelo Tadano) en el sistema y mencionó las licencias requeridas (tipo D para grúa, A2 y A4 para camión), además de notar un error de registro en su nombre de usuario. Sergio Gajardo recomendó buscar la documentación relacionada con cotizaciones, procesos financieros, manejo de excepciones, asignación de recursos y traslados de reportes.
*   **Documentación del sistema y gestión de facturas** ([00:03:06](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.yvz2mz1vyq5p)):  
    Jorge Ponce reflexionó sobre un mes productivo en el cierre de temas pero improductivo en cuanto a tareas concretas. Sergio Gajardo comentó sobre la dificultad para encontrar la documentación en el sistema a pesar de su calidad, y Jorge Ponce confirmó que reenvió a gerencia la factura enviada por Edgardo.
*   **Pruebas de notificaciones y gestión de números corporativos** ([00:05:00](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.i4chjzx190jv), [00:07:48](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.o2e54w8iil1g)):  
    Jorge Ponce realizó pruebas de despacho y notificaciones por WhatsApp, señalando que los mensajes llegan con el nombre de Sergio Gajardo y que se debe actualizar al número administrativo de operaciones de Alfonso. Se explicó que dicho número corporativo se transfiere entre personal y que Dominic asumirá su uso, por lo que Jorge Ponce coordinará una sesión por la tarde para enviar un código QR a Dominic para que tome el control y se familiarice con el sistema.
*   **Limpieza de la interfaz de usuario y modo oscuro** ([00:10:26](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.aoc6kbwcngq), [00:11:10](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.yv67t8fpbtiq)):  
    Sergio Gajardo indicó que falta limpiar la aplicación de los elementos conversados. Jorge Ponce señaló problemas de legibilidad en la parte inferior de la pantalla al utilizar el modo oscuro, aunque el modo claro presenta segmentos negros que tampoco se visualizan correctamente. Acordaron simplificar la vista de operaciones para que muestre lo mínimo indispensable para el operador y el rigger, eliminando elementos con ruido visual como el control de portón y patio.
*   **Requisitos y obligatoriedad del Análisis de Seguridad en el Trabajo (AST)** ([00:12:13](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.g6w0q1aflkh1), [00:14:36](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.b797pvgfwgcj)):  
    Sergio Gajardo y Jorge Ponce discutieron la rigurosidad en torno al Análisis de Seguridad en el Trabajo (AST) y los informes de riesgos laborales (IRL) exigidos para las certificaciones. Sergio Gajardo enfatizó que el AST debe ejecutarse cada vez que se realice un trabajo que conlleve riesgos, y no solo una vez al día. Ambos coincidieron en que el incumplimiento de estas medidas de seguridad representa un riesgo legal grave que involucra al personal de la empresa como Omar y Dayana.
*   **Simplificación del menú principal de operaciones** ([00:15:32](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.bkiadnudy1b), [00:16:21](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.tlbnal8uhlc9)):  
    Jorge Ponce propuso y acordó con Sergio Gajardo eliminar de la interfaz de operaciones los botones innecesarios que no tengan datos asociados, tales como visitas a terreno, protocolos de checklist asignados y el cotizador express, el cual pertenece al ámbito comercial y no debe estar en operaciones. Con esto buscan reducir el ruido visual y evitar errores de los operadores.
*   **Flujo de inicio de viaje y registro de parámetros iniciales** ([00:17:15](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.k78u35a5v3ly), [00:18:11](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.wxd8uk9indbm)):  
    Jorge Ponce revisó la experiencia de usuario para el inicio de viaje en la aplicación web y móvil, verificando los datos planos del proyecto, destino en la Planta Mac From y conductor (Jorge Ponce). Acordaron que es obligatorio registrar para el viaje de ida el horómetro, odómetro y nivel de combustible del equipo, respaldados con fotografías y la firma del operador a las 6:00 de la mañana.
*   **Coordinación operativa y optimización de botones** ([00:20:11](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.mgc8pdzi35k5), [00:21:04](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.hgv9ug3xugdc), [00:22:48](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.6et45bhm3ylt)):  
    Durante la revisión, Jorge Ponce atendió una llamada operacional de Jonathan sobre requerimientos de personal, equipos, rigger y coordinación de almuerzos. Tras retomar la sesión, Jorge Ponce valoró positivamente la instrucción de agrandar los caracteres y los botones verdes en la aplicación para facilitar la lectura de operarios con problemas de vista.
*   **Confirmación de llegada a faena y eliminación de enlaces redundantes** ([00:23:56](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.d1uutksnbcc7), [00:25:01](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.r6sbeuchadc2)):  
    Jorge Ponce probó la función de confirmar la llegada a la obra, registrando el odómetro y horómetro de llegada. Acordaron eliminar el botón de dudas con los marcadores que redirigía a la documentación para evitar que las personas se marearan y cerraran la aplicación por error, así como eliminar los datos de la superestructura en la pantalla de llegada y cambiar la etiqueta del botón únicamente a `"Confirmar llegada"`.
*   **Estructura del reporte diario, patentes y nomenclatura de días** ([00:30:17](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.4mtapuvyskdy), [00:32:18](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.olcg6pddbz7y)):  
    Jorge Ponce y Sergio Gajardo detectaron un error donde se mostraban múltiples patentes en lugar de la asignada, lo cual debe ser corregido. Acordaron eliminar los botones superiores innecesarios en la vista de faena, renombrar los encabezados como `"Inicio de report"` y `"Término de report"`, y ajustar la nomenclatura de los días de servicio (por ejemplo, `"Día 2 de 4"`) para mayor claridad del operador y control interno.
*   **Configuración de fecha, hora y selectores en el inicio de jornada** ([00:34:41](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.j507la3awsck), [00:35:40](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.q8i3ys2dujwn), [00:36:30](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.igolvdv6ul0d)):  
    Jorge Ponce y Sergio Gajardo revisaron el registro de inicio de faena, donde se muestra la fecha y hora. Discutieron sobre la usabilidad de los selectores de hora circulares del sistema operativo en algunos teléfonos celulares que confunden a operadores menos tecnológicos, evaluando abrir un teclado numérico directo. Sergio Gajardo señaló que la fecha se mantendrá restringida para evitar reportes en fechas incorrectas, gestionándose cualquier ajuste a través del backoffice.
*   **Obligatoriedad del horómetro de superestructura para control de mantenimiento** ([00:38:37](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.r8ztehjrzrnc), [00:39:40](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.dol53kwh80yn)):  
    Jorge Ponce y Sergio Gajardo determinaron que el registro del horómetro de la superestructura y su respectiva fotografía deben ser estrictamente obligatorios en el reporte, eliminando la opción de opcional. Argumentaron que este dato es crucial para llevar el control preciso de las horas de uso en equipos arrendados y programar las mantenciones preventivas requeridas durante el periodo de arriendo.
*   **Revisión de campos editables y datos de inicio de faena** ([00:43:03](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.pvul8izt05y)):  
    Jorge Ponce y Sergio Gajardo revisaron la sección de inicio de faena, manteniendo editable el horario de inicio por si el operador comienza más tarde de lo programado, mientras que el horómetro inicial se deja fijo sin opción de edición.
*   **Resumen de horas de jornada, colación y eliminación de métricas redundantes** ([00:46:26](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.e9pcwxmawwh2), [00:47:26](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.e368usvyud2e)):  
    Jorge Ponce propuso simplificar la tarjeta de resumen de tiempo de jornada eliminando métricas confusas o sin valor como la *"jornada total"* y el *"sobretiempo devengado"*. Acordaron renombrar el título a `"Hora report"` para reflejar las horas efectivas y mantener claramente separado el tiempo de colación.
*   **Configuración de tiempos de standby y distinción de cobros** ([00:49:54](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.k8juey54xtpo), [00:52:12](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.btiftgiaukp9)):  
    Jorge Ponce y Sergio Gajardo revisaron los tiempos de standby y detenciones en faena, acordando destacar en mayúsculas los conceptos de `"STANDBY CLIENTE (COBRABLE)"` y `"STANDBY SAN PABLO (FALLA EQUIPO SIN COBRO AL CLIENTE)"` para mejorar la comprensión visual. Jorge Ponce identificó un problema en la lógica de descuento de horas al seleccionar múltiples tipos de standby, acordando con Sergio Gajardo corregir dicha lógica en la base de datos.
*   **Horómetros de término, eliminación del horómetro de chasis y cierre del reporte** ([00:54:36](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.pvs3oreyjkgq), [00:56:19](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.j9qo2pc1zdxn)):  
    Jorge Ponce y Sergio Gajardo acordaron eliminar el horómetro de chasis del reporte de término, ya que el desplazamiento dentro de la obra es mínimo y no corresponde registrarlo diariamente. Finalmente, revisaron los campos de maniobras realizadas y decidieron eliminar las notas mecánicas de taller del reporte dirigido al cliente, estandarizando el botón final como `"Término de report"` con letras grandes.
*   **Modificaciones en la lógica del estructurador para servicios urbanos y rurales** ([00:58:35](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.8mob71ncsmnr)):  
    Sergio Gajardo y Jorge Ponce discutieron los ajustes en el estructurador, determinando que el área de operaciones establecerá la lógica entre servicios rurales y urbanos. Ante la preocupación de Sergio Gajardo sobre posibles cotizaciones generadas por el área comercial sin el ítem de flete, Jorge Ponce explicó que las validaciones se realizarán en paralelo con la autorización previa de Omar para evitar detener la cotización, facilitando la transición.
*   **Categorización de servicios de arriendo y transporte complejo** ([01:01:48](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.6l1vequll51p)):  
    Sergio Gajardo propuso configurar las plataformas como servicios de arriendo (similares a *rent a car*) en lugar de fletes, y expuso la complejidad de traslados con múltiples destinos, como el movimiento de grúas o barreras New Jersey de Temuco a Valdivia. Jorge Ponce confirmó experiencias previas con servicios similares de múltiples puntos de entrega y acordó que una definición clara entre Omar y Jorge Ponce permitirá reimplementar los cambios en el sistema en un plazo máximo de dos a cuatro días.
*   **Responsabilidad de operaciones en la revisión de servicios rurales** ([01:04:17](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.xmh0i6ihdtbz)):  
    Jorge Ponce detalló que la labor principal de Jonathan consiste en revisar los servicios catalogados como rurales que no incluyan el flete, procediendo a rechazarlos y resolverlos directamente con la gerencia para proteger los costos operativos de la empresa. Jorge Ponce decidió priorizar la fluidez operativa actual antes de implementar reglas estrictas en el estructurador que puedan generar fricciones innecesarias.
*   **Planificación de reunión conjunta entre operaciones, comercial y mantenimiento** ([01:05:13](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.vuqj0kfiuuv0)):  
    Sergio Gajardo sugirió programar una reunión para la tarde del miércoles con las áreas de operaciones, comercial y mantenimiento, incluyendo al personal de Casa Matriz como Natalia, Marcelo, Wilson y Pamela. Jorge Ponce indicó que evaluará la disponibilidad de los equipos y sus propios compromisos para confirmar la realización de la reunión después del almuerzo.
*   **Transición de sistemas y uso de Geralsoft en sucursales** ([01:06:17](https://docs.google.com/document/d/1-wOUYeFQs97Vu3FGVG7RhRy0eUlZGHRWg-Qaa2A0kpM/edit?tab=t.veqquh29tg5d#heading=h.950kjzn7dczs)):  
    Jorge Ponce y Sergio Gajardo abordaron el cambio de sistema para dejar a Geralsoft operando en modo de hibernación en Casa Matriz mientras las sucursales continúan utilizándolo temporalmente. Ante los posibles problemas de integración con servicios controlados en Puerto Montt, acordaron que Yara apoyará en la resolución de discrepancias durante un periodo de dos semanas, estableciendo puntos de control semanales para corregir inconvenientes.

---

## 📅 5. Siguiente Reunión
*   **Fecha propuesta:** Miércoles 2026-10-28 (Tarde, horario por confirmar tras almuerzo).
*   **Foco principal:** Reunión interáreas con Operaciones, Comercial y Mantenimiento (Casa Matriz: Natalia, Marcelo, Wilson y Pamela), validación de los ajustes de simplificación en la APP (PWA) y seguimiento de transición operativa con Dominic.
