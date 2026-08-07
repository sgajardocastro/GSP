# 📝 Minuta de Reunión: Seguimiento GSP / LeanGlobal

- **Fecha:** 06 de Agosto, 2026
- **Ámbito:** Gestión GSP / LeanGlobal – Seguimiento de Plataforma, Acreditaciones & Inspección
- **Asistentes:** Sergio Gajardo, Jorge Ponce (`jponce@arriendosanpablo.cl`), Jesús Acevedo (`jesus.acevedo.sanpablo@gmail.com`)

---

## 📌 Resumen Ejecutivo
Actualización de plataforma (Despliegue v1.0.23 / 21.0.23), optimización de flujos comerciales, definición del proceso de acreditaciones post-asignación y estandarización de documentos técnicos y checklists de inspección.

---

## 💬 Temas Tratados y Detalles de Discusión

### 1. Actualización de Plataforma y Versión
- **Despliegue Realizado:** Sergio Gajardo confirmó el despliegue de la versión actualizada de la plataforma (`1.0.23`), resolviendo problemas de carga en la vista de negocios dentro del Kanban Operacional.
- **Estado de Homologación:** Se confirmó que el sistema está homologado para los procesos actuales. Quedan pendientes la habilitación del enlace QR y la configuración de acceso al dominio corporativo `arriendosanpablo.cl`.

### 2. Revisión del Proceso de Preventa
- **Demostración de Flux:** Demostración del flujo de preventa usando el proyecto *Codama* como ejemplo.
- **Recomendación de Procesos Nuevos:** Se advirtió que proyectos o borradores antiguos podrían presentar inconsistencias debido a flags o estados desactualizados, por lo que se recomienda iniciar procesos desde cero para asegurar compatibilidad completa.

### 3. Discusión sobre la Acreditación en la Cotización
- **Debate de Ubicación del Flag:** Jorge Ponce argumentó que conocer si un negocio requiere acreditación es vital desde la cotización inicial para calcular costos de personal y viáticos adicionales.
- **Acuerdo:** Se mantiene el flag `requiere_acreditacion = true` en la etapa comercial inicial, mientras que la gestión operativa de los archivos del dossier se ejecuta en etapas posteriores.

### 4. Gestión del Dossier y Visibilidad Comercial
- **Necesidad Comercial:** Jorge Ponce enfatizó que el personal comercial no debe navegar por vistas complejas de operaciones para gestionar los documentos de acreditación de sus proyectos.
- **Solución Propuesta:** Sergio Gajardo propuso habilitar una columna o vista específica de **Acreditación** para que Comercial gestione sus pendientes documentales sin interferir con las operaciones de patio y faena.

### 5. Flujo de Visita a Terreno y Funcionalidad Móvil
- **Demostración PWA:** Se mostró el flujo de solicitud y asignación de visitas desde dispositivos móviles.
- **Mejoras Solicitadas:** Jorge Ponce indicó la necesidad de incorporar campos obligatorios para el **horario de la visita** y el **vehículo/equipo asignado**.
- **Generación PDF:** Se confirmó que la generación del PDF con firma electrónica FES está operativa.

### 6. Incidente Técnico en Reportes de Terreno
- **Bug Detectado:** Sergio Gajardo identificó un error en la plantilla de Visita a Terreno donde datos de *existencia de ramas* y *cables de tendido eléctrico* se copian erróneamente con un RUT de empresa.

### 7. Homologación de Documentos de Acreditación
- **Descalce de Nombres:** Inconsistencia entre nombres de documentos en el sistema y los nombres reales de los archivos (ej: Licencia de Conducir), impidiendo el reconocimiento automático.
- **Solución:** Cambiar la lógica de validación para comparar contra el **tipo de documento** en lugar del nombre del archivo u observación.

### 8. Mejora en Formato del Checklist de Inspección
- **Inconsistencia Visual:** El checklist de inspección de patio incluye campos de cantidad para ítems cualitativos (ej: Botiquín).
- **Acción:** Jorge Ponce revisará el checklist con la prevencionista y entregará una planilla Excel con el formato corregido.

### 9. Documentación Pendiente para Servicios
- **Formatos Requeridos:** Integración del *Plan de Izaje* y el *Análisis de Riesgo de Trabajo (ART)* en la PWA para que el operador los complete en terreno al iniciar el servicio. Jorge Ponce enviará los PDFs de muestra.

### 10. Acceso al Dominio y Control de Combustible
- **Dominio:** Prioridad en la semana para configurar `arriendosanpablo.cl`.
- **Combustible:** Sergio Gajardo preparará una propuesta de control de combustible durante el fin de semana.

---

## 🎯 Próximos Pasos & Compromisos

| Responsable | Tarea / Compromiso | Estado |
| :--- | :--- | :--- |
| **Sergio Gajardo** | Resolver incidente técnico de copia de RUT en datos de ramas/cables en Visita a Terreno. | ⏳ Pendiente |
| **Sergio Gajardo** | Compartir en el grupo la lista de tipos de documentos cargados en el sistema para contrastar con Prevención. | ✅ Completado |
| **Sergio Gajardo** | Homologar nombres de documentos en el sistema comparando contra el tipo de certificado en lugar de la observación. | ⏳ Pendiente |
| **Sergio Gajardo** | Crear columna/vista específica de acreditaciones para la gestión comercial sin entrar a operaciones. | ⏳ Pendiente |
| **Sergio Gajardo** | Agregar campos obligatorios de horario de visita y vehículo asignado en la Visita a Terreno. | ⏳ Pendiente |
| **Sergio Gajardo** | Configurar el acceso al dominio corporativo `arriendosanpablo.cl`. | ⏳ Pendiente |
| **Sergio Gajardo** | Analizar el control de combustible y elaborar propuesta técnica/funcional. | ⏳ Pendiente |
| **Jorge Ponce** | Revisar y ajustar el checklist de inspección con la prevencionista en Excel. | ⏳ Pendiente |
| **Jorge Ponce** | Enviar PDFs del Plan de Izaje y Análisis de Riesgo de Trabajo (ART) a Sergio Gajardo. | ⏳ Pendiente |
| **Jorge Ponce** | Identificar e involucrar a un líder operativo dentro de la organización en el proyecto. | ⏳ Pendiente |
