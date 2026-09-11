# 📝 Minuta de Reunión: Revisión Valorización Servicios / DTEs y Cierre Operativo

**Fecha:** 2026-09-08  
**Participantes:**  
*   **Jorge Ponce** (Gerente General - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Maritza Seguel** (Jefa de Contabilidad - Grúas San Pablo - `mseguel@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros:**  
*   [Evento de Calendario](https://calendar.google.com/calendar/event?eid=M2VkMmtzZnM2bW5rbDBkdGFiaWpqa2cyNjggc2dhamFyZG9jQG0)  
*   [Transcripción Oficial](https://docs.google.com/document/d/1l9Q-tEGAfLUJLUoAi6znwaTzMt59_V50-69CcIVfNkI/edit?usp=drive_web&tab=t.2gnk3cbowq1c)  

---

## 🎯 Resumen Ejecutivo

Definición y estandarización del flujo punta a punta: Cotización Comercial (Estructurador) ➔ Informe de Término de Servicio (ITS) ➔ Estado de Pago (EDP) ➔ Emisión de DTE / Integración con Laudus ERP. Se establecen acuerdos críticos sobre la reestructuración de unidades de cobro en preventa, el repositorio de Órdenes de Compra (OC), la política de cancelación transparente y el gestor documental por razón social.

---

## ✅ Decisiones Acordadas

### 1. Estandarización de Unidades de Cobro en el Estructurador (Cotizador)
* Se eliminan opciones ambiguas del estructurador de líneas (como "Semanal" o unidades mixtas genéricas).
* Se homologa a **4 unidades de cobro canónicas**:
  1. `HRS_DIA` (Horas mínimas por día / jornada)
  2. `HRS_MENSUAL` (Horas mínimas mensuales garantizadas)
  3. `FIJO` (Valor cerrado por servicio / maniobra spot)
  4. `FLETE` (Traslado fijo por camión / cama baja / convoy)
* **Ajuste estructural clave:** Se deben incorporar columnas explícitas para **Cantidad de Períodos/Días** y **Cantidad Mínima de Horas (Piso)**, permitiendo liquidar y proyectar correctamente servicios multi-día (ej. 3 días de grúa × 8 horas mínimas = 24 hrs base mínimas).

### 2. Derivación del Estado de Pago (EDP) desde el ITS
* El EDP no se digita de forma independiente: se genera y extrae automáticamente a partir de los datos validados del **Informe de Término de Servicio (ITS)**.
* Contenido visible para el mandante: Horas operadas efectivas, desglose cronológico de jornadas y valores fijos de flete.
* Los reportes diarios de terreno firmados por el cliente actúan como anexo de respaldo.
* Se incluye de forma obligatoria el **Número de Cotización** en la carátula del EDP para cruce inmediato por parte del cliente y de contabilidad.

### 3. Registro Centralizado y Selección Flexible de Órdenes de Compra (OC)
* Se habilitará un módulo para que el vendedor adjunte los archivos PDF de las OC recibidas, registrando: N° de OC, monto, fecha y centro de costo/obra.
* Al momento de emitir el EDP, el comercial o analista podrá **seleccionar qué OC específicas** se liquidan en dicho corte, resolviendo la casuística de clientes con múltiples obras o pagos divididos.

### 4. Integración con Laudus ERP para Emisión de DTE
* El sistema GSP transferirá la información del EDP aprobado a Laudus para la generación automática del asiento contable y la emisión del DTE (Factura Electrónica), eliminando la doble digitación de Maritza y su equipo.

### 5. Política Comercial de Cancelación y Transparencia
* Política estricta: No utilizar "letra chica". Los vendedores deben explicar proactivamente las condiciones de cobro ante cancelaciones de grúas reservadas (cobro de 1 jornada mínima de 8 hrs, aprox. $800.000).
* La aceptación formal de la cotización y su anexo comercial vía correo electrónico constituye respaldo jurídico vinculante.

### 6. Gestor Documental y Acreditación Multi-Empresa
* Convalidación del modelo implementado: clasificación en carpetas universales (cédula, salud, licencias) y laborales por razón social (GSP, Bestmaq, Logística, Royal).
* Vinculación automática con la empresa emisora seleccionada en la cotización.

---

## 📋 Próximos Pasos (TODOs)

| Tarea / Entregable | Responsable | Estado |
| :--- | :--- | :--- |
| **Ajustar Estructurador de Cotizaciones:** Incluir columnas de cantidad de días/períodos, cantidad mínima (piso de horas) y selector de las 4 unidades canónicas. Actualizar fórmulas reactivas y PDF. | Sergio Gajardo | En Análisis |
| **Llamar a Jorge Ponce:** Notificar una vez ajustado el estructurador para convalidar la nueva grilla. | Sergio Gajardo | Pendiente |
| **Módulo de Carga de OC:** Permitir subir PDF de OC con metadatos (N°, monto, fecha) y vinculación a la OT. | Sergio Gajardo | Pendiente |
| **Estructura Detallada de EDP:** Formalizar la carátula con N° Cotización, detalle cronológico y selección de OCs. | Sergio Gajardo | Pendiente |
| **Revisar Acreditación con Dayana:** Presentar avances del gestor documental y habilitar botones de carga. | Jorge Ponce / Sergio G. | Pendiente |
| **Coaching Comercial a Ventas:** Capacitar a vendedores en transparencia de condiciones y políticas de cobro. | Jorge Ponce | En curso |
