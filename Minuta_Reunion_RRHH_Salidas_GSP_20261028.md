# 📝 Minuta de Reunión: Revisión 360° de Salidas de Plataforma GSP, Liquidación de Horas/Viáticos RRHH y Cronograma Go-Live

**Fecha:** 28 de Octubre de 2026  
**Hora:** 18:00 - 19:35 CLT (GMT-03:00)  
**Proyecto:** Plataforma de Gestión Operativa, Comercial y Financiera - Grúas San Pablo (GSP)  
**Participantes:**  
*   **Tesalia de Lourdes Malatesta Espinoza** (Gerente de Recursos Humanos - Grúas San Pablo - `tesalia@arriendosanpablo.cl`)  
*   **Jorge Ponce** (Gerente General / Operaciones - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Director de Proyecto / Arquitecto Senior - LeanGlobal - `sgajardoc@gmail.com`)  

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Sesión de revisión integral y alineación ejecutiva con la Gerencia de Recursos Humanos (**Tesalia Malatesta**) y la Gerencia General / Operaciones (**Jorge Ponce**) para presentar el flujo de punta a punta (**360°**) de la plataforma LeanGlobal GSP y validar las salidas de información hacia **Recursos Humanos (Remuneraciones)** y **Contabilidad**:

1. **Requerimiento y Estructuración Comercial:** Ingreso del negocio, definición de condiciones comerciales, modalidad urbana/rural, horas mínimas pactadas y tonelaje comercial cotizado.
2. **Verificación y Aprobación Comercial/Técnica:** Validación de parámetros y emisión formal de la Orden de Trabajo (OT).
3. **Asignación de Recursos (Operaciones):** Vinculación de equipos (grúas, camiones, tractos, camas bajas), operadores y riggers según disponibilidad real en patio.
4. **Ejecución en Terreno (APP / PWA):** Registro digital de hitos de viaje (salida de planta, llegada a obra, retorno), Análisis de Seguridad en el Trabajo (AST) y emisión de **Reportes Diarios de Faena** firmados digitalmente con horómetros y fotografías obligatorias.
5. **Auditoría Operativa Diaria (Matriz PMO - Control de Gestión):** Revisión y visación diaria de cada Reporte Diario por parte de **Yiara** (Analista de Operaciones) antes de las 13:00 hrs del día hábil siguiente.
6. **Informe Técnico de Servicio (ITS) y Estado de Pago (EDP):** Consolidación automática de ingresos versus costos directos de operación (horas operador/rigger, viáticos, combustible, peajes) y liberación del expediente de facturación.
7. **Salidas Consolidables hacia RRHH y Contabilidad:** Sábana de control y liquidación de horas trabajadas de operadores/riggers y viáticos de alimentación por período o rango de fechas, lista para su procesamiento de nómina en Laudus y fiscalizaciones laborales.

---

## 📌 2. Acuerdos y Decisiones de Negocio y Arquitectura

### 2.1. Traslado de Lógica de Costos de Personal y Viáticos desde el ITS hacia la Auditoría del Reporte Diario (Matriz PMO)
* **Decisión:** Trasladar la instancia de validación y cálculo de costos de personal (horas de operador/rigger) y viáticos de alimentación desde el cierre del ITS hacia la **auditoría unitaria del Reporte Diario en la Matriz PMO**.
* **Flujo Operativo y SLA:**
  - **Yiara (Analista de Operaciones)** auditará y validará directamente las horas trabajadas del operador/rigger y los viáticos devengados al revisar cada Reporte Diario.
  - **SLA Obligatorio:** Todo Reporte Diario ejecutado en el día $D$ debe quedar auditado y validado en la plataforma **antes de las 13:00 hrs del día hábil siguiente ($D+1$)**.
  - **Efecto en Cadena:** Tanto el **Informe Técnico de Servicio (ITS)** como la **Sábana de Recursos Humanos** se alimentarán automáticamente de los Reportes Diarios ya validados por Yiara, eliminando reprocesos al final del servicio y garantizando consistencia absoluta entre el costo imputado al negocio y el pago al trabajador.

### 2.2. Cierre Mensual en Último Día Calendario Independiente del Estado del ITS
* **Decisión:** El corte de remuneraciones y contabilidad se realiza estrictamente al **último día calendario de cada mes** (día 30 o 31, o 28/29 en febrero) sobre la totalidad de los **Reportes Diarios ejecutados dentro de ese mes**, con total independencia de si la Orden de Trabajo o el ITS continúan abiertos en el mes siguiente.
* **Regla de Corte y Devengo:**
  - Si un servicio abarca desde el 25 de un mes hasta el 5 del mes siguiente, los Reportes Diarios del día 25 al 30/31 entran en el cierre del primer mes; los reportes del día 1 al 5 quedan imputados al período mensual siguiente.
  - **Meta Día 1:** Todos los Reportes Diarios correspondientes al mes cerrado deben encontrarse **100% validados el día 1 del mes siguiente** para habilitar el procesamiento inmediato de remuneraciones y contabilidad.

### 2.3. Filtro por Rango de Fechas (`Desde - Hasta`) y Estatus de Validación del Reporte Diario
* **Decisión:** Ampliar los criterios de consulta y exportación en la vista de RRHH / Contabilidad incorporando un selector explícito por **Rango de Fechas (`Desde - Hasta`)**, en lugar de limitar la vista únicamente a un selector de mes cerrado.
* **Casos de Uso Críticos Cubiertos:**
  - **Fiscalizaciones de la Dirección del Trabajo (DT):** Respuesta inmediata ante requerimientos de inspección por períodos específicos.
  - **Finiquitos y Desvinculaciones a Mitad de Mes:** Cálculo exacto de horas de grúa y viáticos devengados por un trabajador hasta su fecha efectiva de salida (ej. del día 1 al día 14 del mes en curso).
* **Trazabilidad de Estatus:** La grilla y el reporte exportable mostrarán explícitamente el **estatus de validación de cada Reporte Diario** (`Validado por Operaciones / Yiara` vs. `Pendiente de Validación`), otorgando certeza a RRHH sobre qué registros ya cuentan con visación firme.

### 2.4. Regla de Tarifario de Horas Operador por Tonelaje Comercial Cotizado
* **Decisión:** El cálculo del incentivo/pago por hora al operador se rige por una **tabla plana tarifaria asociada al tonelaje de la grúa cotizada originalmente en el negocio** (ej. 70 Toneladas), independientemente de si por razones operativas o de disponibilidad en patio se despachó a terreno una máquina de mayor o menor capacidad física.
* **Control de Excepciones:** El sistema aplica por defecto la tarifa del tonelaje comercial cotizado en la OT, manteniendo la instancia de verificación humana de **Yiara** durante la auditoría del Reporte Diario para gestionar y documentar cualquier excepción operacional autorizada.

### 2.5. Numeración Secuencial Única de Negocios
* **Decisión:** Estandarizar un **identificador único secuencial de negocio** (formato limpio de 5 dígitos / correlativo único por negocio, ej. `GSP-2610-001` o correlativo secuencial único) que acompañe transversalmente toda la trazabilidad documental:
  - **Requerimiento Comercial / Cotización** $\rightarrow$ **Orden de Trabajo (OT)** $\rightarrow$ **Informe Técnico de Servicio (ITS)** $\rightarrow$ **Estado de Pago (EDP)**.
* **Beneficio:** Elimina la dispersión de folios entre áreas y facilita la conciliación directa entre Operaciones, RRHH, Contabilidad y el ERP contable.

### 2.6. Alcance Actual vs. Evolución Futura (Horizonte 3 a 6 Meses)
* **Alcance Fase Actual (Producción Noviembre 2026):**
  - La plataforma LeanGlobal GSP entrega el **insumo oficial consolidado y auditado** de horas trabajadas de operadores/riggers, bonos por tonelaje y viáticos de alimentación para Recursos Humanos, así como los Estados de Pago y cuadres para Contabilidad.
  - La emisión de **liquidaciones de sueldo** y la **facturación tributaria (DTE)** continúan ejecutándose en **Laudus**, alimentadas por las salidas validadas de la plataforma GSP.
* **Proyección Fase Futura (Horizonte 3 a 6 Meses):**
  - Una vez estabilizada la operación 100% digital en Casa Matriz y sucursales, se proyecta evaluar e incorporar los módulos de **facturación directa** y **liquidación interna de remuneraciones** dentro del ecosistema en un plazo estimado de 3 a 6 meses.

---

## 🚀 3. Cronograma Oficial de Puesta en Marcha (Go-Live)

Se definió y aprobó la hoja de ruta escalonada para el paso a producción definitiva e hibernación del sistema legado (Geralsoft):

| Hito / Período | Alcance Operativo y Organizacional | Sistema Principal | Rol de Geralsoft |
| :--- | :--- | :--- | :--- |
| **Lunes 2 de Noviembre de 2026** | **Inicio de Operación en Vivo (Go-Live Casa Matriz):** Todos los negocios nuevos nacen y se ejecutan íntegramente en la nueva plataforma GSP y su aplicación móvil (PWA). Se dispondrá de **apoyo híbrido inicial en terreno/backoffice** para acompañar a los operadores en el uso de la PWA. | **LeanGlobal GSP (100% Negocios Nuevos)** | En hibernación para negocios nuevos (solo consulta / cierre de arrastre). |
| **Noviembre de 2026** | **Transición Progresiva de Sucursales y Registro de Horas:** Incorporación paulatina de las sucursales al flujo digital y captura sistemática de las horas de operadores y viáticos en la nueva plataforma, con auditoría diaria de Yiara (SLA 13:00 hrs). | **LeanGlobal GSP (Casa Matriz + Sucursales en transición)** | Uso residual controlado únicamente para servicios antiguos en curso. |
| **Diciembre de 2026** | **Operación 100% Unificada en Plataforma GSP:** Toda la operación comercial, operativa, de flota, reportes diarios, ITS, EDP y sábanas de RRHH de la compañía opera exclusivamente en LeanGlobal GSP. | **LeanGlobal GSP (100% Compañía)** | **Apagado Operativo:** Restringido única y exclusivamente para facturación o cierres administrativos rezagados de meses previos. |

---

## 🤝 4. Compromisos y Próximos Pasos (Plan de Acción)

| # | Tarea / Entregable | Responsable | Fecha Límite | Estado |
| :- | :--- | :--- | :---: | :---: |
| **1** | **Trasladar validación de costos de personal y viáticos a Auditoría de Reporte Diario (Matriz PMO):** Habilitar en la vista de revisión de Yiara la validación directa de horas operador/rigger (según tonelaje cotizado) y viáticos por cada Reporte Diario, alimentando automáticamente el ITS y la vista de RRHH. | **Sergio Gajardo** | 2026-10-30 | ⏳ En Ejecución |
| **2** | **Implementar filtro `Desde - Hasta` y columna de Estatus de Validación en Sábana RRHH:** Incorporar selector por rango de fechas arbitrario (para fiscalizaciones DT y finiquitos) e indicador visual del estado de auditoría de Yiara por reporte, asegurando el corte al último día calendario del mes. | **Sergio Gajardo** | 2026-10-30 | ⏳ En Ejecución |
| **3** | **Estandarizar numeración secuencial única de negocios:** Ajustar el generador de folios para mantener un identificador secuencial limpio y único transversal entre Requerimiento, OT, ITS y EDP. | **Sergio Gajardo** | 2026-10-31 | ⏳ Pendiente |
| **4** | **Alinear protocolo de auditoría diaria (SLA 13:00 hrs) con Operaciones:** Instruir formalmente el flujo de revisión diaria de Reportes Diarios con Yiara y el equipo de Operaciones para garantizar que el día 1 de cada mes el 100% de los reportes del mes anterior estén validados. | **Jorge Ponce** | 2026-10-30 | ⏳ Pendiente |
| **5** | **Validación de Sábana de Salida RRHH para carga en Laudus:** Revisar en conjunto con Tesalia Malatesta el formato exportable con filtro `Desde - Hasta` y corte mensual al último día calendario previo al primer cierre en vivo. | **Tesalia Malatesta / Sergio Gajardo** | 2026-11-04 | ⏳ Pendiente |
| **6** | **Puesta en marcha oficial (Go-Live Negocios Nuevos + PWA):** Inicio de operación de todos los negocios nuevos en la plataforma GSP con acompañamiento híbrido a operadores. | **Jorge Ponce / Sergio Gajardo** | 2026-11-02 | 🎯 Hito Go-Live |
