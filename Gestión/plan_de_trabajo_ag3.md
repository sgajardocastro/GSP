# 📅 PLAN DE TRABAJO TÉCNICO Y OPERACIONAL DETALLE TOTAL (V3)
### **Módulo de Registro Diario de Avance (PPD), Desplazamiento GPS, Estados de Pago (EDP) y Control de Costos 360°**
**Proyecto:** Sistema de Gestión Operativa — Grúas San Pablo (GSP) / Ecosistema LeanGlobal  
**Periodo de Ejecución:** Lunes 10 al Miércoles 12 de Agosto de 2026  
**Versión Plan:** `AG3` (Con Unidades de Cobro Oficiales: *Hrs día*, *Hrs Mensual*, *Fijo*, *Flete* + Recepción Factura ERP)

---

## 🎯 OBJETIVO GENERAL
Implementar el ciclo de vida operacional multidía completo: captura de telemetría de ruta por GPS, registro digital en terreno de Partes de Producción Diarios (PPD) en PWA con algoritmo de devengado según la Unidad de Cobro acordada (*Hrs día*, *Hrs Mensual*, *Fijo*, *Flete*), firma de conformidad FES en obra, imputación 360° de costos reales (combustible, viáticos, peajes) y consolidación de Estados de Pago (EDP) listos para adjuntar la factura emitida por el ERP del cliente.

---

## 📐 UNIDADES DE COBRO OFICIALES Y ALGORITMOS DE DEVENGADO

Las fórmulas de devengado financiero en terreno quedan estructuradas bajo las 4 definiciones comerciales acordadas con el cliente:

1. ⏱️ **Hrs día (Horas Mínimas Diarias):**
   * **Regla:** Cobra al cliente por un piso mínimo de horas diarias garantizadas por jornada.
   * **Fórmula PPD:** $\text{Devengado Día} = \max(\text{Horas Operadas Reales}_i, \text{Horas Mínimas Diarias}) \times \text{Tarifa Hora}$.
2. 📅 **Hrs Mensual (Horas Mínimas Mensuales):**
   * **Regla:** Cobra al cliente por un piso mínimo acumulado durante el ciclo mensual.
   * **Fórmula PPD / EDP:** En cada PPD se registran las horas reales diarias. En el corte del EDP: $\text{Devengado} = \max(\sum \text{Horas Reales Mes}, \text{Piso Mínimo Mensual}) \times \text{Tarifa Hora}$.
3. 🎯 **Fijo (Servicio Puntual a Precio Alzado):**
   * **Regla:** Cobra un monto cerrado acordado por un servicio o maniobra específica.
   * **Fórmula PPD / EDP:** Se devenga por hito o al registrar el 100% del avance de la maniobra en la PWA ($100\%$ del Valor Fijo).
4. 🚛 **Flete (Traslado de Grúa, Contrapesos y Accesorios):**
   * **Regla:** Cobra un valor fijo por concepto de movilización y transporte de flota/equipamiento.
   * **Fórmula PPD / EDP:** Cargo de tarifa fija que se devenga al registrar el hito de *"Llegada a Faena"* (Día 1) o retorno a base.

---

## 🗓️ DESGLOSE DETALLADO DE ACTIVIDADES Y HITOS (LUNES A MIÉRCOLES)

### 📍 FASE 1: ESPECIFICACIÓN MAESTRA 27 Y BASE DE DATOS SQL
**Periodo:** Lunes 10 de Agosto (Jornada Mañana y Tarde)

* **1.1 Validación de Insumos Comerciales:**
  * Incorporación de las 4 Unidades de Cobro (`HRS_DIA`, `HRS_MENSUAL`, `FIJO`, `FLETE`) en la estructura del proyecto.
  * Definición de campos obligatorios para el diálogo de Firma FES en terreno (RUT, Nombre, Cargo del Mandante).
* **1.2 Redacción de Especificación Maestra N° 27 (`.agents/specs/27_modelo_ppd_devengado_edp_spec.md`):**
  * Documentación formal de la arquitectura de datos, flujos PWA y contratos de API REST (`POST /api/ppd`, `POST /api/edp`, `POST /api/telemetria/ping`).
* **1.3 Creación del Modelo de Datos SQL (`sch_leangsp`):**
  * Tabla `tlog_telemetria_desplazamiento`: Telemetría GPS en ruta (latitud, longitud, velocidad, timestamp).
  * Tabla `tppd_reporte_avance`: Registro de reportes diarios de producción PWA + Firma FES + Unidad de Cobro.
  * Tabla `topr_costos_servicio`: Imputación de costos reales (combustible, viáticos, peajes, pensión).
  * Tabla `tedp_estado_pago`: Encabezado de Estados de Pago consolidados.
  * Tabla `tedp_rel_edp_ppd`: Tabla pivote de cierre para prevenir doble devengado.

---

### 📍 FASE 2: CAPTURA EN TERRENO, DESPLAZAMIENTO Y PWA OPERADOR
**Periodo:** Martes 11 de Agosto (Jornada Mañana)

* **2.1 Módulo de Desplazamiento y Ruta GPS (PWA Móvil):**
  * Botón *"Iniciar Desplazamiento"* en PWA con registro de punto de partida (Casa Matriz).
  * Emisión automática de pings de telemetría GPS periódicos (cada 1-5 min) durante el trayecto en carretera.
  * Botón *"Llegada a Faena / Destino"* con validación de geocerca GPS.
* **2.2 Formulario de Reporte Diario de Producción (Survey PPD):**
  * Formulario móvil precargado con datos del servicio, equipo (patente) y tripulación.
  * Selector de Unidad de Cobro (`Hrs día`, `Hrs Mensual`, `Fijo`, `Flete`).
  * Captura de: Horas Grúa de Operación, Horas Standby, Horario de Colación, Descripción de Trabajos Realizados.
  * Cálculo automático instantáneo del **Devengado del Día ($)** según la Unidad de Cobro.
* **2.3 Módulo de Consentimiento y Firma Digital FES (Mandante):**
  * Diálogo modal interactivo para que el supervisor del cliente en obra ingrese RUT, Nombre, Cargo y estampe su **Firma Digital FES** en la pantalla del celular.
  * Generación del sello hash de trazabilidad de la firma.

---

### 📍 FASE 3: AUDITORÍA 360°, COSTOS REALES Y MARGEN OPERACIONAL
**Periodo:** Martes 11 de Agosto (Jornada Tarde)

* **3.1 Módulo de Imputación de Costos Reales (Analista de Operaciones Web):**
  * Formulario web para ingresar los gastos reales incurridos en la OT:
    1. **Combustible:** Litros cargados + $ Monto + KM Odómetro + N° Ticket/Boleta.
    2. **Viáticos / Alimentación** de Tripulación.
    3. **Peajes / TAG**.
    4. **Pensión / Alojamiento**.
    5. **Movilización / Escoltas**.
    6. **Gastos Extraordinarios**.
  * Carga de archivos adjuntos (Fotos/PDFs de boletas y facturas de compra).
* **3.2 Visor 360° de Margen Operacional (Torre de Control & Gerencia):**
  * Panel gráfico comparativo en tiempo real por Proyecto/OT:
    * $\text{Monto Ofertado Comercial}$ vs $\text{Monto Devengado Real (PPDs)}$ vs $\text{Costos Imputados}$ = $\mathbf{\text{Margen Bruto Real (\%)}}$.

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
| **PWA Desplazamiento & Survey PPD** | PWA Móvil | Operador / Rigger | Captura horas reales y aplica el cálculo automático por Unidad de Cobro (*Hrs día*, *Hrs Mensual*, *Fijo*, *Flete*) con firma FES en obra. |
| **Imputación Costos Reales** | Portal Web | Analista Operaciones | Registra combustible (litros/KM), viáticos y gastos exactos del servicio. |
| **Visor Margen 360°** | Torre de Control | Gerencia / Operaciones | Muestra la rentabilidad real de cada OT en tiempo real. |
| **Módulo EDP + Adjunto ERP** | Portal Web | Coordinador Operaciones | Agrupa cobros PPD, genera dossier PDF y vincula la factura emitida en el ERP actual. |
