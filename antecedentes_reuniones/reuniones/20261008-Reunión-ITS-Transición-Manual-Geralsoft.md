# 📝 Minuta de Reunión: ITS Transición Manual — Reemplazo de Sistema Geralsoft, Persistencia de Informes, Guardado Incremental y Resumen de Costos

**Fecha:** 2026-10-08  
**Participantes:**  
*   **Yiara Mendoza** (Control de Flota y Operaciones - Grúas San Pablo - `controlflota@arriendosanpablo.cl`)  
*   **Jorge Ponce** (Gerente General - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros Oficiales:**  
*   [Evento de Calendario](https://calendar.google.com/calendar/event?eid=NDE4bGM4OGxzcmRiZGZiMW1wZTlka2I3dWogc2dhamFyZG9jQG0)  
*   [Transcripción Oficial](https://docs.google.com/document/d/1Lw6RU8orwQTBjRZasLwDurW-FdUXnmG9-BKUYLTT7PM/edit?usp=drive_web&tab=t.kor5zy3px3vg)  
*   [Archivos Adjuntos: Formulario carga Secretarias](https://calendar.google.com/calendar/event?eid=NDE4bGM4OGxzcmRiZGZiMW1wZTlka2I3dWogc2dhamFyZG9jQG0)  

---

## 🎯 1. Resumen Ejecutivo

Reunión de urgencia operativa para evaluar las graves ineficiencias y fallos del sistema actual de emisión de informes diarios de servicio basado en Geralsoft y una aplicación web preliminar. Se acordó desarrollar de forma prioritaria e inmediata una solución transicional: el **ITS Transición (Versión 1 Manual)**.

Esta herramienta permitirá a las secretarias y a Yiara Mendoza cargar y editar manualmente los informes de servicio a partir de las planillas de Geralsoft, garantizando la **persistencia íntegra de los datos en la base de datos de LeanGlobal Platform**, el guardado incremental de avances diarios para servicios multi-día, la colaboración y revisión en vivo mediante el intercambio de folios por WhatsApp, la emisión del documento PDF oficial con la **tabla crítica de resumen de costos operativos** (viáticos, peajes, alimentación y márgenes), y el despacho automático por correo y WhatsApp a Omar y Contabilidad. 

Se estableció una hoja de ruta ágil: versión funcional manual desplegada el mismo día, persistencia en base de datos en 2 días, y migración hacia generación automática 100% integrada desde LeanGlobal en un plazo de dos semanas.

---

## ❌ 2. Diagnóstico del Problema y Causa Raíz (Sistema Actual)

1. **Ineficiencia Extrema en Operación Remota (Geralsoft):**
   * El sistema actual que procesa planillas de Geralsoft sufre de severos problemas de rendimiento al trabajar de manera remota, reduciendo la productividad a solo 2 o 3 informes procesados en 4 horas (en comparación con el trabajo presencial local).
   * Esta lentitud pone en riesgo el cumplimiento del mandato estricto de Gerencia General de entregar los informes de servicio al día y sin atrasos.

2. **Bug Crítico de Destrucción de Datos al Reabrir Informes:**
   * En la aplicación web construida previamente por Jorge, cada vez que una usuaria reabre un informe ya completado (con sus órdenes de trabajo, personal asignado y servicios por hora), **el sistema borra de forma automática e irreversible las observaciones y los valores ingresados**.
   * Si el departamento de Contabilidad solicita una corrección mínima o la adición de una observación sobre peajes o viáticos, el operador/secretaria se ve forzado a repetir y digitar todo el documento desde cero, generando frustración y pérdida sustancial de horas hombre.

3. **Ausencia de Persistencia y Trazabilidad:**
   * La herramienta actual solo genera un archivo PDF local; no existe una base de datos relacional que almacene las variables cargadas, impidiendo auditar versiones previas, rescatar borradores o consolidar métricas de gestión.

4. **Desconexión con el Destinatario Estratégico y Financiero:**
   * Los informes deben alimentar oportunamente a dos receptores clave:
     * **Contabilidad (Maritza):** Para reembolsar semanalmente los fondos por rendir a los operadores (peajes, viáticos y rendiciones de faena).
     * **Gerencia (Omar) y Operaciones (Yiara):** Para realizar el análisis de impacto estratégico de los negocios, auditar desviaciones de costos y detectar tempranamente pérdidas financieras en servicios ejecutados.

---

## 🚀 3. Acuerdos y Definición de Solución: "ITS Transición" (Versión 1)

Se acuerda desarrollar el módulo **ITS Transición** bajo un enfoque de desarrollo rápido y Spec-Driven con las siguientes características esenciales:

### A. Carga y Edición Manual Flexible
* Interfaz sobria, ergonómica y rápida para secretarias y analistas con los siguientes campos y selectores:
  * **Listas Desplegables:** Cliente, Empresa de Facturación (Grúas San Pablo, Bestmaq, Logística del Sur, Royal Rental), Tipo de Servicio, Comercial a cargo y Grúa/Equipo.
  * **Campos de Fecha y Ubicación:** Selector de fecha de jornada, campos de texto para Obra y Ciudad de faena.
  * **Estructura de Servicios y Horas:** Digitación manual de horas operadas, tiempos de viaje/faena y valores convenidos.
  * **Área de Observaciones Protegida:** Campo de texto enriquecido que no se borre bajo ninguna circunstancia al guardar o reabrir el informe.

### B. Persistencia Relacional y Guardado Incremental Multi-Día
* Cada informe contará con un **identificador único o folio correlativo**.
* Soporte para **guardado de avances diarios**: en faenas de múltiples jornadas (ej. 3 días), el sistema permitirá registrar y guardar el Día 1 y el Día 2 de forma incremental, cerrando definitivamente el informe al término del Día 3.
* Los datos quedarán alojados en PostgreSQL (`sch_leangsp`), asegurando que al reabrir el folio para editar o corregir, toda la información previa permanezca intacta.

### C. Supervisión Colaborativa en Tiempo Real
* La secretaria podrá copiar el número/enlace del informe y compartirlo por WhatsApp a Yiara Mendoza.
* Yiara podrá acceder directamente al informe en vivo, auditar los datos, realizar correcciones o añadir observaciones técnicas sin bloquear a la secretaria ni perder información.

### D. Tabla de Resumen de Costos Crítica (PDF Oficial)
* El requerimiento financiero más estricto del documento es la **tabla de liquidación de costos directos** ubicada al final del PDF:
  * Desglose detallado de:
    * Viáticos y Alojamientos.
    * Alimentación (Desayunos, Almuerzos, Cenas).
    * Peajes y Estacionamientos.
    * Personal Externo / Subcontrataciones.
  * Cálculo porcentual de impacto financiero y margen respecto al valor total facturable del servicio.
  * Esta tabla servirá como respaldo legal inmediato para que Contabilidad libere los reembolsos a los operadores.

### E. Despacho Omnicanal Automatizado
* Notificación automática con el PDF emitido adjunto vía Correo Electrónico (Nodemailer) y WhatsApp (Microservicio Baileys) dirigido a Omar y al equipo de Contabilidad.

---

## 📅 4. Hoja de Ruta y Plazos de Entrega

| Hito / Fase | Alcance Técnico | Plazo Comprometido | Responsable |
| :--- | :--- | :--- | :--- |
| **Fase 1: Formulario Manual V1** | Interfaz web de carga manual, prevención de borrado de observaciones, cálculo de costos y generación de PDF con tabla resumen. | **Mismo día (08-Oct-2026)** | Sergio Gajardo |
| **Fase 2: Conexión y Persistencia BD** | Persistencia relacional en PostgreSQL (`tits_*`), soporte de avances multi-día y edición colaborativa por folio. | **En 2 días (10-Oct-2026)** | Sergio Gajardo |
| **Fase 3: Migración e Integración Total** | Generación 100% automatizada desde el core LeanGlobal (alimentada directamente por la PWA y Torre de Control). | **En 2 semanas (22-Oct-2026)** | Sergio Gajardo & Equipo GSP |

---

## 📋 5. Próximos Pasos (TODOs Inmediatos)

* [ ] **[Yiara Mendoza] Enviar materiales técnicos:** Remitir a Sergio Gajardo el informe técnico actual de muestra, el código fuente HTML del formulario anterior (`index.html`), las planillas de entrada de órdenes de trabajo y casos de control de servicio desde San Pablo.
* [ ] **[Yiara Mendoza] Generar prompt detallado:** Elaborar y enviar el prompt descriptivo estructurado previamente en AntiGravity/Gemini con los requerimientos de campos y tablas del formulario.
* [ ] **[Yiara Mendoza] Crear usuario QR:** Gestionar y crear el usuario para Remis respecto a la administración de códigos QR, asegurando que no distraiga la prioridad del ITS Transición.
* [ ] **[Sergio Gajardo] Especificación Formal Spec-Driven:** Redactar la especificación canónica en `.agents/specs/` (`SPEC-066: ITS Transición Manual y Resumen de Costos`) antes de desplegar código.
* [ ] **[Sergio Gajardo] Desarrollar formulario funcional V1:** Implementar la interfaz de captura manual de informes con persistencia segura de observaciones, tabla de costos y generación de PDF.
