# 📅 PLAN DE TRABAJO TÉCNICO Y OPERACIONAL
### **Módulo de Registro Diario de Avance (PPD), Estados de Pago (EDP) y Control de Costos 360°**
**Proyecto:** Sistema de Gestión Operativa — Grúas San Pablo (GSP) / Ecosistema LeanGlobal  
**Periodo de Ejecución:** Lunes 10 al Miércoles 12 de Agosto de 2026  
**Entregable:** Sub-sistema completo de captura en terreno, devengado diario, conciliación de costos y cierre con factura ERP.

---

## 🎯 OBJETIVO GENERAL
Implementar la captura digital en terreno de los Partes de Producción Diarios (PPD) mediante firmas FES en PWA, la trazabilidad de ruta por GPS, la conciliación 360° de costos operativos reales (combustible, viáticos, peajes), y la consolidación de Estados de Pago (EDP) listos para su recepción de factura mediante el ERP actual del cliente.

---

## 🗓️ DESGLOSE DETALLADO DE ACTIVIDADES Y HITOS

### 📍 FASE 1: ESPECIFICACIÓN, BASE DE DATOS Y ARQUITECTURA
**Periodo:** Lunes 10 de Agosto (Jornada Mañana y Tarde)

* **1.1 Validación de Reglas de Negocio con Cliente (Mañana):**
  * Confirmación de horas mínimas garantizadas por jornada.
  * Definición de campos obligatorios en el diálogo de Firma FES en terreno (RUT, Nombre, Cargo).
  * Validación de categorías de gastos operacionales e hitos de corte de Estados de Pago.
* **1.2 Redacción de Especificación Maestra N° 27 (`.agents/specs/27_modelo_ppd_devengado_edp_spec.md`):**
  * Documentación formal de la arquitectura de datos, flujos de pantalla y contratos de API REST.
* **1.3 Creación del Modelo de Datos SQL (`sch_leangsp`):**
  * Tabla `tlog_telemetria_desplazamiento`: Registro de pings GPS de ruta (latitud, longitud, velocidad, timestamp).
  * Tabla `tppd_reporte_avance`: Registro de reportes diarios de producción PWA + Firma FES.
  * Tabla `topr_costos_servicio`: Imputación de costos reales (combustible, viáticos, peajes, pensión).
  * Tabla `tedp_estado_pago`: Encabezado de Estados de Pago consolidados.
  * Tabla `tedp_rel_edp_ppd`: Tabla pivote de cierre para prevenir doble devengado.

---

### 📍 FASE 2: CAPTURA EN TERRENO Y PWA OPERADOR
**Periodo:** Martes 11 de Agosto (Jornada Mañana)

* **2.1 Módulo de Desplazamiento y Ruta (PWA Móvil):**
  * Botón *"Iniciar Desplazamiento"* en PWA con registro de punto de partida (Casa Matriz).
  * Emisión automática de pings de telemetría GPS periódicos durante el trayecto en carretera.
  * Botón *"Llegada a Faena / Destino"* con validación de geocerca GPS.
* **2.2 Formulario de Reporte Diario de Producción (Survey PPD):**
  * Formulario móvil precargado con datos del servicio, equipo (patente) y tripulación.
  * Captura de: Horas Grúa de Operación, Horas Standby, Horario de Colación, Descripción de Trabajos Realizados.
  * Cálculo automático instantáneo del **Devengado del Día ($)** según tarifa contractual.
* **2.3 Módulo de Consentimiento y Firma Digital FES (Mandante):**
  * Diálogo modal interactivo para que el supervisor del cliente en obra ingrese RUT, Nombre, Cargo y estampe su **Firma Digital FES** en la pantalla del celular.
  * Generación del sello hash de trazabilidad de la firma.

---

### 📍 FASE 3: AUDITORÍA 360°, COSTOS REALES Y MARGEN OPERACIONAL
**Periodo:** Martes 11 de Agosto (Jornada Tarde)

* **3.1 Módulo de Imputación de Costos Reales (Analista de Operaciones Web):**
  * Formulario web para ingresar los gastos reales incurridos en la OT:
    1. Combustible (Litros cargados + $ Monto + KM Odómetro).
    2. Viáticos / Alimentación de Tripulación.
    3. Peajes / TAG.
    4. Pensión / Alojamiento.
    5. Movilización / Escoltas.
    6. Gastos Extraordinarios.
  * Carga de archivos adjuntos (Fotos/PDFs de boletas y facturas de compra).
* **3.2 Visor 360° de Margen Operacional (Torre de Control & Gerencia):**
  * Panel gráfico comparativo en tiempo real por Proyecto/OT:
    * $\text{Monto Ofertado Commercial}$ vs $\text{Monto Devengado Real (PPDs)}$ vs $\text{Costos Imputados}$ = $\mathbf{\text{Margen Bruto Real (\%)}}$.

---

### 📍 FASE 4: ESTADOS DE PAGO (EDP) Y ANEXO DE FACTURA ERP
**Periodo:** Miércoles 12 de Agosto (Jornada Mañana y Tarde)

* **4.1 Módulo de Agrupación y Generación de Estados de Pago (EDP):**
  * Interfaz web para seleccionar un rango de fechas o listado de PPDs aprobados y generar un **Estado de Pago (EDP)**.
  * Bloqueo automático de PPDs consolidados para evitar duplicidad de cobro.
* **4.2 Emisión de Dossier PDF del Estado de Pago:**
  * Generación automática del documento PDF resumen del EDP, adjuntando la hoja de resumen y la copia digital de los PPDs con sus firmas FES para envío al cliente.
* **4.3 Botón de Cierre con Anexo de Factura ERP:**
  * Formulario de cierre de EDP: Ingreso del N° de Folio de Factura emitida en el ERP del cliente + Botón para **Adjuntar el archivo PDF/XML de la Factura**.
  * Transición automática del estado del EDP a **`FACTURADO`** y cierre del ciclo de la OT.
* **4.4 Certificación Empírica y Cierre:**
  * Pruebas de compilación `npm run build` local con **0 errores**.
  * Ejecución de `git commit` de checkpoint final.

---

## 📊 MATRIZ DE ENTREGABLES

| Entregable | Plataforma | Usuario Responsable | Impacto en el Negocio |
| :--- | :--- | :--- | :--- |
| **PWA Desplazamiento & Survey PPD** | PWA Móvil | Operador / Rigger | Elimina el papel y captura las horas reales con firma FES en obra. |
| **Imputación Costos Reales** | Portal Web | Analista Operaciones | Registra combustible y gastos exactos del servicio. |
| **Visor Margen 360°** | Torre de Control | Gerencia / Operaciones | Muestra la rentabilidad real de cada OT en tiempo real. |
| **Módulo EDP + Adjunto ERP** | Portal Web | Coordinador Operaciones | Agrupa cobros y los vincula con la factura emitida en su ERP. |
