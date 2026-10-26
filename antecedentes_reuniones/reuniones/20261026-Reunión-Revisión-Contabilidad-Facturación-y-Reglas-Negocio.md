# 📝 Minuta de Reunión: Revisión de Procesos y Ajustes Contables con Facturación, Flujos Operativos y Reglas de Negocio

**Fecha:** 2026-10-26  
**Hora:** 15:00 - 16:00 CLT  
**Participantes:**  
*   **Maritza Andrea Seguel Reyes** (Encargada de Contabilidad y Tesorería - Grúas San Pablo - `mseguel@arriendosanpablo.cl`)  
*   **Jorge Ponce** (Gerente General / Operaciones - Grúas San Pablo - `jponce@arriendosanpablo.cl`, `controlflota@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros Oficiales:**  
*   [Evento de Calendario Google Meet](https://calendar.google.com/calendar/event?eid=MXQ3NTQxcDJmM2l2bDdrdWhkNXQ1ZDJyMGkgc2dhamFyZG9jQG0)  
*   [Transcripción Oficial de la Reunión](https://docs.google.com/document/d/1GzfR2H-FzOMEU6uSTwiErowfKIfumYDPiQPMpPA-kgc/edit?usp=drive_web&tab=t.fpuoru35yqmk)  

---

## 🎯 1. Resumen Ejecutivo

Sesión de trabajo estratégica entre Contabilidad (**Maritza Seguel**), Gerencia/Operaciones (**Jorge Ponce**) y LeanGlobal (**Sergio Gajardo**) para revisar la **Perspectiva de Contabilidad**, el **desacople operativo de la facturación** respecto al Informe de Término de Servicio (ITS), las **reglas de cálculo de remuneración y viáticos de operadores** (diferenciando servicios urbanos de rurales), y la **estandarización del formato PDF del Estado de Pago (EDP)** de cara a los clientes mandantes.

Durante la sesión se tomaron decisiones de alto impacto en el modelo de negocio:
1. **Desacople y simplificación del circuito de firmas:** Se acordó eliminar la firma contable obligatoria de Maritza en el Estado de Pago para que este se libere automáticamente tras la validación de los reports de terreno, evitando cuellos de botella en la facturación.
2. **Diferenciación urbana vs. rural:** Se definieron las reglas formales para el cómputo de horas máquina y horas de flete del operador, así como el cálculo independiente de los viáticos de alimentación tabulares.
3. **Regla de tonelaje cotizado:** El pago de operadores se rige por el tonelaje comercial cotizado y no por la capacidad física de la grúa enviada a faena.
4. **Protección comercial en el PDF del Estado de Pago:** Se determinó ocultar el cuadro de desglose horario de turnos cuando las horas trabajadas sean menores a las mínimas contratadas, mostrando únicamente el total de horas facturables para evitar disputas comerciales infundadas con clientes.
5. **Corrección de tarifas y comisiones:** Se revisó el caso Tensacon para corregir las tarifas de horas de sobretiempo (\$150.000 vs. \$65.000) y se acordó incorporar la identificación del vendedor en el EDP para la liquidación de comisiones.

---

## 🏛️ 2. Decisiones de Negocio y Arquitectura Acordadas

### A. Circuito de Firmas del Estado de Pago (EDP)
* **Decisión:** Eliminar la 2° firma FES de Maritza en el expediente del Estado de Pago.
* **Comportamiento Sistémico:**
  - El Estado de Pago se libera automáticamente en los módulos de Comercial y Contabilidad una vez que los **Reports Diarios de Faena son validados por Control de Gestión (Yara)**.
  - No se requiere esperar la elaboración ni el cierre formal del ITS para emitir el EDP.
  - Contabilidad recibe el EDP listo para facturar, condicionado únicamente a la presencia de la Orden de Compra (cuando el cliente la exija) o de forma directa si el servicio es exento.

### B. Reglas de Cálculo de Horas de Operadores (Urbanos vs. Rurales)
* **Servicio Urbano:**
  - Cómputo de horas: Desde la salida de la planta de Grúas San Pablo hasta la terminación efectiva de la faena en la obra.
  - Deducción obligatoria: Se descuenta 1 hora de colación.
* **Servicio Rural (Faenas fuera del radio urbano / regionales):**
  - Se garantizan las horas mínimas pactadas en la cotización.
  - Si el tiempo total transcurrido desde la salida de la planta hasta el retorno a la misma supera las horas mínimas de faena, el tiempo excedente de traslado se liquida al operador como **horas de flete / traslado interno** (horas máquina reconocidas al trabajador sin alterar el cobro pactado con el mandante).
* **Viáticos de Alimentación (Lógica Independiente):**
  - No depende de si el servicio es urbano o rural ni del flete.
  - Se calcula por tramos horarios basados en una tabla tabular oficial desde la hora de salida de la planta hasta la hora de retorno efectivo, deduciendo la colación.

### C. Tonelaje Comercial Cotizado vs. Capacidad Física de Flota
* **Decisión:** La tarifa horaria pagada al operador de grúa se determinará estrictamente según el **tonelaje comercial pactado en la Cotización/OT**, con total independencia del equipo asignado físicamente en terreno.
* **Ejemplo Práctico:** Si se cotiza y contrata una grúa de 80 toneladas a un valor hora determinado, pero por disponibilidad operacional se despacha una grúa de 100 toneladas, el operador percibe la tarifa correspondiente a 80 toneladas y el mandante paga la tarifa de 80 toneladas.

### D. Reportes Diarios como Fuente Primaria de Pago
* **Decisión:** La liquidación y pago quincenal/mensual de horas trabajadas a los operadores se alimentará de los **Reports Diarios validados**, sin supeditar el pago a que el ITS esté cerrado o firmado.
* **Visibilidad:** El reporte consolidado de nómina incluirá una columna indicando si la OT cuenta con ITS cerrado (`SÍ / NO`), pero el devengo se reconoce por report diario firmado.

### E. Presentación Comercial del Estado de Pago hacia el Cliente (Horas Mínimas)
* **Problema Detectado:** Cuando un cliente contrata un mínimo de 9 horas pero la maniobra concluye en 3 horas, el desglose de horarios en el PDF generaba reclamos del tipo *"¿por qué me cobran 9 horas si la grúa operó solo de 09:00 a 12:00?"*.
* **Regla Estandarizada:**
  - **Caso 1: Horas Trabajadas < Horas Mínimas Contratadas:**  
    Se **oculta el desglose horario de turnos de faena** en el PDF oficial de cara al cliente. Se muestra únicamente la línea de cobro consolidada: `Servicio de Grúa (Mínimo Contratado): 9.0 Horas` y el monto total neto correspondiente.
  - **Caso 2: Horas Trabajadas ≥ Horas Mínimas Contratadas:**  
    Se despliega el cuadro completo de desglose horario con fecha, patente, operador, hora inicio, hora término y sobretiempos.

### F. Caso Tensacon y Cuadre de Sobretiempos
* **Incidencia:** En el expediente de Tensacon, las horas de sobretiempo se valorizaron con la tarifa base de \$65.000 en vez de la tarifa comercial acordada de \$150.000 para horario extraordinario.
* **Acción:** Corregir el motor de cálculo del Estado de Pago para que aplique la tarifa de sobretiempo estipulada en las condiciones comerciales pactadas y recalcular el monto final a facturar.

### G. Inclusión de Vendedor en el Estado de Pago
* **Requerimiento:** Incluir en el encabezado del Estado de Pago y en las exportaciones contables el nombre del **Vendedor / Ejecutivo Comercial**, facilitando a Maritza el cálculo de comisiones en el sistema contable y en planillas Laudus.

---

## 🤝 3. Compromisos y Próximos Pasos (TODOs)

| Tarea / Entregable | Responsable | Fecha Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Envío de planillas maestras:** Remitir planillas de horas de operadores y ventas por grúa/equipo para homologación en software. | **Maritza Seguel** | 2026-10-27 | Pendiente |
| **Ajuste circuito firmas EDP:** Eliminar 2° firma contable de Maritza y liberar EDP automáticamente al validar reports diarios. | **Sergio Gajardo** | 2026-10-27 | En Progreso |
| **Implementación carga OC Comercial:** Habilitar formulario y visor de carga de Orden de Compra para el área Comercial. | **Sergio Gajardo** | 2026-10-27 | En Progreso |
| **Regla horas mínimas en PDF EDP:** Ocultar cuadro de turnos si horas reales < horas mínimas; mostrar detalle si horas reales ≥ mínimas. | **Sergio Gajardo** | 2026-10-28 | Pendiente |
| **Revisión Caso Tensacon:** Ajustar tarifado de sobretiempos (\$150.000) y cuadrar valor final a facturar. | **Sergio Gajardo** | 2026-10-27 | Pendiente |
| **Inclusión de Vendedor en EDP:** Incorporar `vendedor_nombre` en carátula EDP y reportes contables para comisiones. | **Sergio Gajardo** | 2026-10-28 | Pendiente |
| **Sistematización reglas urbano/rural/viáticos:** Documentar y codificar el motor de liquidación de horas de operadores y viáticos tabulares. | **Sergio Gajardo** | 2026-10-29 | Pendiente |

---

## 📅 4. Siguiente Hito
* **Fecha propuesta:** 2026-10-28
* **Foco:** Demostración de carga de OC por Comercial, nuevo PDF de EDP con regla de horas mínimas y revisión de cuadre Tensacon.
