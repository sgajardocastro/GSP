# 📝 Minuta de Reunión: Análisis de Reporte Diario & Estados de Pago (EDP)

- **Fecha:** 10 de Agosto, 2026
- **Ámbito:** Gestión GSP / LeanGlobal – Arquitectura de Reporte Diario, Reglas de Cobro & Estados de Pago (EDP)
- **Asistentes:** Sergio Gajardo, Jorge Ponce (`jponce@arriendosanpablo.cl`), Jesús Acevedo (`jesus.acevedo.sanpablo@gmail.com`)

---

## 📌 Resumen Ejecutivo
Definición del alcance técnico, priorización de reglas de negocio para optimizar la emisión de Estados de Pago (EDP) y diseño funcional del **Reporte Diario de Trabajo en Terreno (PWA / Consola)** como insumo primario inmutable para facturación.

---

## 💬 Temas Tratados y Detalles de Discusión

### 1. Priorización del Reporte Diario de Trabajo
- **Criticidad Insumo:** Se acordó priorizar el Reporte Diario debido a que constituye el insumo primario inmutable para generar los Estados de Pago (EDP).
- **Control de Reglas:** Es el componente donde residen las reglas de negocio más críticas de cobro, validación de horas mínimas y firmas en faena.

### 2. Lógica de Desplazamientos & Modalidades de Servicio
- **Escenarios Identificados:**
  1. Equipos que salen de base y regresan diariamente.
  2. Servicios continuos de varios días con maquinaria permaneciendo en obra.
  3. Servicios donde solo se requiere hito de inicio y término sin contabilizar tránsito diario.

### 3. Reglas de Cobro: Con Flete vs. Sin Flete
- **Servicios Con Flete (Grúas Mayor Tonelaje o Contrapesos):** El tiempo facturable se calcula estrictamente desde el **inicio formal del servicio en obra hasta el término**, integrando los costos de traslado/flete dentro de la cotización comercial.
- **Servicios Sin Flete (Equipos < 75 Ton / Radio Urbano < 30 km):** No se cobra flete independiente, pero el tiempo facturable **comienza a correr desde la salida del equipo de la base (patio) hasta el término del servicio en faena**.

### 4. Gestión Estricta de Horas Mínimas
- **Problema Actual:** Errores recurrentes del personal operativo al no aplicar o desconocer las horas mínimas cotizadas en contratos/cotizaciones.
- **Solución en Sistema:** El sistema restringirá la entrada de horas para forzar automáticamente el cobro del mínimo estipulado en la cotización base cuando el real ejecutado sea inferior.

### 5. Interfaz de Registro de Tiempos & Edición Manual
- **Captura PWA:** La interfaz solicitará: *Hora de Salida Base*, *Hora Inicio Faena*, *Hora Término Faena*, *Hora Retorno Base* y deducción explícita de *Horas de Colación*.
- **Edición Manual Inicial:** Se permitirá la edición manual de horarios por parte del operador para mitigar olvidos al presionar botones en faena, sujeto a auditoría preventiva.

### 6. Digitalización del Flujo & Firma Digital del Cliente
- **Eliminación del Papel:** Reemplazo definitivo del escaneo manual de vales/reportes físicos.
- **Firma Obligatoria FES:** Validación mediante firma digital del cliente en terreno, geolocalización y fotos de orómetro/kilometraje para respaldar el EDP y eliminar reprocesos.

### 7. Unificación de Pre-Estado de Pago y EDP Final
- **Cero Duplicidad:** Integración del flujo de "Pre-Estado de Pago" (control interno) con el "Estado de Pago Final", ofreciendo una consola unificada para comercial, operaciones y contabilidad.

### 8. Tipos de Arriendo & Contratos Mensuales
- **Estandarización:** Definición clara de reglas por modalidad (*Por Hora*, *Diario*, *Mensual*, *Fijo*).
- **Arriendos Mensuales:** Aplica lógica de bolsa de horas mínimas mensuales. Si se superan, se factura el exceso. El operador debe enviar reportes diarios obligatorios de respaldo.

---

## 🎯 Próximos Pasos & Compromisos

| Responsable | Tarea / Compromiso | Estado |
| :--- | :--- | :--- |
| **Sergio Gajardo** | Ampliar Modelo BD con tablas faltantes para Reporte Diario, Horas Mínimas y EDP. | ⏳ Pendiente |
| **Sergio Gajardo** | Programar lógica de cálculo de horas diferenciando reglas Con Flete (Inicio-Término) vs Sin Flete (Salida-Término). | ⏳ Pendiente |
| **Sergio Gajardo** | Construir pantalla de Reporte Diario (PWA/Web) con tiempos, colación, orómetros, fotos y firma digital FES. | ⏳ Pendiente |
| **Sergio Gajardo** | Definir e implementar el flujo de envío automático del reporte diario firmado al cliente (`tnot_queue`). | ⏳ Pendiente |
| **Jorge Ponce** | Consultar con Omar las reglas de negocio para la modificación manual de horarios por parte de operadores. | ⏳ Pendiente |
| **Jorge Ponce** | Evaluar categorías de cobro vigentes (Hora, Día, Mes, Fijo) y coordinar definición final con Contabilidad y Omar. | ⏳ Pendiente |
