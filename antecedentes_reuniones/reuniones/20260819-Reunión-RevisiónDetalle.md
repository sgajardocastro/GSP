# 📝 Minuta de Reunión: Revisión de Detalles Operativos y Comerciales GSP

**Fecha:** 2026-08-19  
**Participantes:**  
*   Jorge Ponce (Asesor Externo - Grúas San Pablo - jponce@arriendosanpablo.cl)  
*   Sergio Gajardo (LeanGlobal)  

---

## 🎯 Objetivos de la Reunión
1.  Consolidar los procesos operativos y comerciales enfocados en priorizar un producto mínimo viable (MVP) eficiente.
2.  Definir restricciones de datos en el sistema y reglas de negocio críticas para evitar errores en la facturación futura.
3.  Estandarizar las inspecciones de patio y el control de combustibles.

## 💬 Puntos Tratados

*   **Gestión de Valores y Costos de Servicios:** Se analizó el proceso de ingreso de valores para alojamiento, alimentación (desayuno, almuerzo, cena) y traslados. Se acordó que el coordinador de operaciones es responsable de validar estos servicios en la fase de verificación, dado que la etapa comercial no debe mostrar precios al cliente inicialmente. Jorge Ponce enfatizó que la cotización debe reflejar solo los servicios costeados por el cliente para aportar valor, excluyendo costos internos que no corresponden a la oferta comercial.
*   **Configuración de Cotizaciones y Combustible:** Los participantes definieron que cualquier elemento costeado por el cliente debe figurar explícitamente en la cotización. Se acordó centralizar los costos de combustible en la fase de preventa agregando un flag específico en la columna de preventa. Si un elemento tiene relación con el cliente, el sistema lo desplegará automáticamente en la cotización sin incluir el valor, el cual se asignará posteriormente en la fase de verificación.
*   **Restricciones de Datos en el Sistema:** Se discutió la necesidad de implementar restricciones estrictas al generar cotizaciones, tales como obligar el ingreso de las fechas de inicio y término del servicio. Asimismo, se acordó reemplazar los checkboxes por combobox para campos críticos como "requiere Rigger" o "requiere OC", asegurando que el vendedor deba seleccionar una opción explícita (sí o no) para evitar que campos obligatorios queden nulos y prevenir errores de facturación.
*   **Coordinación de Visita a Terreno:** Se planificó una reunión para el próximo martes. Jorge Ponce llegará a Camino a la Abranza a las 9:00, y se acordó enviar una camioneta al terminal para trasladar a Sergio Gajardo para que llegue a las 10:00. Al realizar la asignación, el coordinador podrá incluir un campo de texto libre para comentarios adicionales.
*   **Estructura y Búsqueda de Equipos:** Se solicitó mejorar la funcionalidad de búsqueda en la selección de equipos, reemplazando el desplazamiento manual en listas largas por un buscador que permita filtrar por patente (ej. PT31) o modelo para agilizar el trabajo.
*   **Gestión de Traslados y Apoyo Logístico:** Se discutió cómo manejar los traslados de maquinaria que requieren vehículos de apoyo. Se propuso añadir un botón de "Añadir traslado" para agrupar estas líneas de manera más lógica. Cada vehículo de apoyo debe tener un conductor asignado para que el sistema le envíe la orden de trabajo correspondiente.
*   **Unificación y Simplificación de la Inspección de Patio:** Aunque se consideró dividir la inspección en manifiesto de salida y listas de verificación, se decidió mantener la estructura actual para evitar retrasos en la facturación y asegurar el cumplimiento de plazos. El registro de combustible y datos técnicos (orómetro, odómetro y fotografías del comprobante de carga) será obligatorio en el flujo de viaje para liberar la tarjeta de combustible.
*   **Flujo de Aprobación y Firmas Electrónicas:** El jefe de patio debe firmar el documento mediante firma electrónica para validar el estado del equipo. El sistema debe distinguir entre las operaciones validadas por el jefe de patio y aquellas realizadas por el personal nocturno (quienes utilizarán un perfil distinto).
*   **Flujo de Análisis Posterior al Servicio:** Se definió que el analista debe utilizar una lista de verificación simple con campos de observaciones para validar la ruta, los tiempos y los costos. El proceso finalizará con un botón de análisis que enviará la información al coordinador de operaciones para su visto bueno antes de facturar.
*   **Enfoque Estratégico y MVP:** Se acordó priorizar el Producto Mínimo Viable (MVP) funcional antes de añadir funcionalidades complejas (como cruces avanzados de datos por cliente/vendedor en formato chat) para evitar dilataciones. Se validó positivamente el avance en comparación con proveedores grandes, representando una ventaja competitiva.

## 🤝 Acuerdos y Próximos Pasos (TODOs)

| Tarea / Entregable | Responsable | Fecha Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Restringir fechas:** Obligar al vendedor a ingresar fecha de inicio y término para poder generar la cotización (Prioridad Alta - Comercial/Facturación) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Implementar selectores:** Reemplazar los campos de selección actuales por listas desplegables (SÍ/NO) con valores nulos por defecto y marcación en rojo (Prioridad Alta - Comercial/Facturación) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Obligar campos:** Configurar los campos clave en la interfaz como obligatorios para evitar datos incompletos (Prioridad Alta - Comercial/Facturación) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Reubicar costos:** Eliminar el campo de valor de la cotización comercial y trasladarlo a la fase de verificación (Prioridad Alta - Comercial/Facturación) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Incluir combustible:** Agregar el indicador de combustible a cargo del cliente en la columna de preventa (Prioridad Alta - Comercial/Facturación) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Crear buscador:** Implementar una función de filtrado en el buscador de equipos para localizar elementos específicos por su nombre o patente (Prioridad Media-Alta - Agilidad Operativa) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Agregar botón traslado:** Implementar un botón funcional para añadir traslados en la cotización (Prioridad Media-Alta - Agilidad Operativa) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Regla de negocio conductores:** Programar la regla de negocio para asignar obligatoriamente un conductor a cada patente de equipo (Prioridad Media-Alta - Agilidad Operativa) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Asociar flota:** Asociar la flota de patentes a sus respectivas categorías y subcategorías (Prioridad Media-Alta - Estructura) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Configurar registro combustible:** Habilitar la función de registro de carga de combustible en el módulo de viajes, incluyendo orómetro, odómetro y fotografías (Prioridad Media - Control/Operaciones) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Corregir estados:** Revisar y corregir el error en el sistema relacionado con el estado de la tarjeta de preparación de operaciones (Prioridad Media - Control/Operaciones) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Añadir comentarios:** Incluir un campo de texto libre para que el coordinador pueda añadir observaciones al asignar el servicio (Prioridad Media - Operaciones) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Añadir comentario técnico:** Agregar un campo de texto expandible para observaciones en la sección de implementos de izaje (Prioridad Media - Operaciones) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Despachar dossier:** Finalizar el envío del dossier al cliente con los enlaces correspondientes (Prioridad Baja - Administrativa) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Reprogramar reunión:** Reasignar la reunión de gestión para mañana a las 16 horas (Prioridad Baja - Logística) | Sergio Gajardo | 2026-08-21 | Pendiente |
| **Revisar modificaciones:** Analizar los cambios realizados y notificar a Jorge Ponce para ejecutar la prueba del desarrollo (Prioridad Baja - Cierre) | Sergio Gajardo | 2026-08-21 | Pendiente |

## 📅 Siguiente Reunión
*   **Fecha propuesta:** 2026-08-21 a las 16:00 (Reprogramada debido a feriado en Chillán el 20-Ago)
*   **Foco principal:** Análisis de modificaciones y pruebas de desarrollo con Jorge Ponce.
