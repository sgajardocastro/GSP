# 📋 Minuta de Reunión: Ajustes en Contratos de Plataformas, Entrega/Retorno Operativo, Viáticos en ITS Final y Rectificación de Reportes

**Fecha:** 14 de Octubre de 2026, 15:41 hrs (GMT-03:00)  
**Proyecto:** Plataforma de Gestión Operativa y Comercial - Grúas San Pablo (GSP)  
**Participantes:**
* **Jorge Ponce** (Gerente de Operaciones / Proyecto - GSP)
* **Sergio Gajardo** (Director de Proyecto / Arquitecto Senior - LeanGlobal)

**Referencias:** [Transcripción Oficial en Google Docs](https://docs.google.com/document/d/1uTQ5r1CGENCff6KTb2IlSwmrIoH96w30si9IU3n6_YI/edit?usp=drive_web&tab=t.lw4fby1jhs70)

---

## 1. 🎯 Resumen Ejecutivo
En la sesión de seguimiento se revisaron cuatro frentes críticos derivados de la operación real y las pruebas sobre la plataforma:
1. **Formateo y Reglas Legales del Contrato de Arriendo de Plataformas:** Definición del título específico con etiqueta `(Plataforma)`, apertura multi-empresa para casos de crédito (Grúas San Pablo, Bestmaq, Royal Rental), reemplazo obligatorio de plazos ambiguos ("a convenir") por **fechas de término exactas** para resguardo legal ante impagos o apropiación indebida, e incorporación automática de la firma de Omar en el PDF (contrato y anexo).
2. **Ciclo Operativo de Entrega y Retorno Desacoplado de Plataformas:** Registro de entrega en obra con respaldo fotográfico por parte del operador del camión plataforma, capacidad de asignar un **flete de retorno independiente** meses después (con patente, equipo y chofer distintos) e **inspección obligatoria de recuperación** previa al inicio del viaje de retorno.
3. **Homologación de Viáticos y Resumen de Costos en el ITS Final (Caso Tensacon):** Incorporación de las pestañas de viáticos de alimentación (desayuno, almuerzo, cena, alojamiento y traslado) y del desglose detallado de costos operacionales en el Informe Técnico de Servicio (ITS) final del flujo nativo, replicando el estándar del ITS de Transición.
4. **Mecanismo de Corrección de Operador / Rigger en Reportes Emitidos (Caso Tensacon):** Análisis y solución para subsanar errores humanos de asignación (ej. Claudio Canío vs. José Regad) que hoy persisten en los reportes y controles ya generados tras cambiar al recurso en la OT.

---

## 2. 📌 Decisiones y Acuerdos de Diseño

| # | Ámbito | Decisión / Definición | Estado |
| :--- | :--- | :--- | :--- |
| **1** | **Configuración Abierta Multi-Empresa en Contratos de Plataformas** | Dejar abierto el contrato de arriendo de plataformas para que pueda emitirse bajo distintas empresas del grupo (ej. facturar por Grúas San Pablo o Bestmaq por razones de crédito del cliente), adaptando dinámicamente los datos del arrendador y arrendatario y manteniendo la etiqueta **`(Plataforma)`** en el título para evitar confusiones. | ✅ Acordada |
| **2** | **Fecha de Término Contractual Explícita** | Erradicar la glosa *"a convenir"* en la vigencia del contrato e inyectar obligatoriamente la **fecha de término exacta** ingresada por el vendedor en la cotización, resguardando la validez ejecutiva en demandas civiles o acciones por apropiación indebida. | ✅ Acordada |
| **3** | **Firma Pre-Estampada de Omar en PDF** | Utilizar la firma digitalizada de Omar (que enviará Jorge en PDF) para incrustarla de forma automática en el documento contractual y en el Anexo Técnico, evitando retrasos operativos de visación interna. | ✅ Acordada |
| **4** | **Flujo Operativo de Entrega, Inspección y Retorno Independiente** | El operador del camión plataforma registra la entrega al llegar a obra (formulario + fotos). Para el retiro (que puede ocurrir meses después), Operaciones asigna una línea de **flete de retorno independiente** (nueva patente y chofer) y el operador debe completar obligatoriamente la **inspección de recuperación** antes de iniciar el viaje de regreso. | ✅ Acordada |
| **5** | **Incorporación de Viáticos y Apertura de Costos en ITS Final** | Incorporar el ítem de viático de alimentación del personal y la apertura detallada del resumen ejecutivo de costos operacionales en el formato del ITS final nativo, igualando la estructura del ITS de Transición. | ✅ Acordada |
| **6** | **Mecanismo de Corrección de Operadores / Rigger en Reportes** | Evaluar y definir el mecanismo técnico para corregir asignaciones erróneas de Operador o Rigger por fecha o por reporte específico en reportes pasados y futuros ya generados, sin perder trazabilidad. | 🔍 Requiere Análisis / En Diseño |

---

## 3. 💬 Desglose Detallado de Puntos Tratados

### 3.1. Formateo, Restricciones y Cláusulas del Contrato de Arriendo de Plataformas
* **Tiempos de ajuste y alcance del documento (`[00:00:59]`):** Sergio Gajardo explicó que el ajuste de maquetación y generación de PDF en el servidor ha requerido iteraciones cuidadosas. Jorge Ponce precisó que este formato contractual es estático con variables parametrizadas y aplica **exclusivamente para servicios de plataformas**, por lo que su título debe incluir entre paréntesis la palabra **`(Plataforma)`**.
* **Adaptación Arrendador / Arrendatario y Flexibilidad Comercial (`[00:17:56]`):** Se ajustará la lógica para poblar correctamente los datos del arrendador y del arrendatario según el cliente seleccionado, dejando abierto el emisor para aquellos casos en que, por línea de crédito del cliente, un arriendo de plataforma deba facturarse a través de Grúas San Pablo o Bestmaq en lugar de Royal Rental.
* **Riesgo Legal de Fecha "A Convenir" (`[00:26:07]`):** Jorge Ponce enfatizó que la fecha de término del contrato jamás puede quedar como *"a convenir"*, ya que ante un impago o retención de maquinaria ello impide configurar apropiación indebida o sostener con fuerza una demanda civil. El contrato debe tomar la **fecha de término exacta** definida por el ejecutivo comercial y conservar el rigor íntegro de sus 14 cláusulas.
* **Flujo Digital Omnicanal y Firma de Omar (`[00:22:47]` / `[00:27:59]`):** El cliente recibe por correo y WhatsApp el enlace para leer las 14 cláusulas y firmar digitalmente. Por el lado del arrendador, Jorge Ponce enviará en PDF la firma de Omar para que quede estampada automáticamente en el contrato y en el anexo.

### 3.2. Registro de Entrega en Obra y Devolución Asíncrona de Plataformas
* **Entrega en Terreno (`[00:30:58]`):** El operador del camión plataforma que traslada el equipo a la obra es quien ejecuta el registro de entrega en el lugar mediante formulario y captura fotográfica.
* **Retiro Diferido con Flete de Retorno Independiente (`[00:32:52]`):** Dado que las plataformas suelen arrendarse por periodos extensos y retirarse meses después, el asignador de recursos de Operaciones debe permitir agregar un **flete de retorno independiente**, vinculando una nueva línea con una patente de camión, chofer y equipo de transporte potencialmente distintos a los que hicieron la entrega inicial.
* **Candado de Inspección de Recuperación (`[00:35:48]`):** Antes de iniciar el viaje de retorno a base, el operador deberá realizar con carácter obligatorio la **inspección de recuperación del equipo**.

### 3.3. Ausencia de Viáticos y Apertura de Costos en el ITS Final (Caso Tensacon)
* **Hallazgo en producción (`[00:36:56]`):** Al revisar los Informes Técnicos de Servicio (ITS) finales de servicios de Tensacon, Jorge Ponce detectó que no aparecían las pestañas ni la apertura detallada para el **viático de alimentación del personal** (desayuno, almuerzo, cena, alojamiento y traslado), información indispensable para el análisis gerencial de rentabilidad y el cálculo del peso porcentual de cada ítem sobre la venta.
* **Alineación con ITS de Transición (`[00:38:11]`):** Sergio Gajardo homologará el ITS final nativo integrando el registro de viáticos y el cuadro de Resumen Ejecutivo con la apertura detallada de costos operacionales implementada en los informes de transición.

### 3.4. Persistencia de Operador / Rigger Erróneo en Reportes Generados (Caso Tensacon)
* **Incidente reportado (`[00:40:21]`):** En un servicio de Tensacon se asignó inicialmente por error a **Claudio Canío** en lugar de **José Regad**. Pese a que Operaciones corrigió posteriormente la asignación en la OT, el nombre de Claudio Canío siguió apareciendo en los reportes diarios y controles ya generados y firmados.
* **Causa raíz y solución requerida (`[00:41:31]` / `[00:43:29]`):** Sergio Gajardo explicó que esto ocurre porque los reportes generados guardan un snapshot local/histórico del operador al momento de su emisión. Jorge Ponce solicitó contar con una funcionalidad administrativa/operativa que permita corregir o reemplazar al Operador o Rigger (por fecha o en reportes específicos) cuando ocurran errores humanos de asignación, actualizando los registros e informes derivados.

---

## 4. 🤝 Acuerdos y Próximos Pasos (TODOs)

| # | Tarea / Entregable | Responsable | Prioridad | Estado |
| :- | :--- | :--- | :---: | :---: |
| **1** | **Restringir y parametrizar contrato (Arrendador/Cliente):** Ajustar la lógica del contrato para aplicar dinámicamente los datos de arrendador y arrendatario según la empresa emisora (San Pablo, Bestmaq, Royal Rental) y el cliente, permitiendo facturación multi-empresa por crédito. | Sergio Gajardo | Alta | ⏳ Pendiente |
| **2** | **Ajustar título del contrato (`(Plataforma)`):** Modificar el encabezado del contrato de arriendo para incluir explícitamente la palabra `(Plataforma)` entre paréntesis y acotar su uso a servicios de plataformas. | Sergio Gajardo | Alta | ⏳ Pendiente |
| **3** | **Revisar contenido contractual y Fecha de Término Explícita:** Asegurar la densidad legal de las 14 cláusulas y reemplazar la glosa *"a convenir"* por la fecha de término exacta establecida por el vendedor en la cotización. | Sergio Gajardo | Crítica | ⏳ Pendiente |
| **4** | **Enviar firma digital de Omar:** Remitir archivo PDF con la firma de Omar para su incorporación automática en el contrato y anexo. | Jorge Ponce | Alta | ⏳ Pendiente |
| **5** | **Estampar firma de Omar en PDF (Contrato y Anexo):** Integrar la firma de Omar en el generador PDF del contrato y su anexo técnico una vez recibida. | Sergio Gajardo | Alta | ⏳ Pendiente |
| **6** | **Finalizar flujo de Entrega, Inspección de Recuperación y Flete de Retorno:** Habilitar el registro de entrega en obra con fotos, la adición de una línea independiente de flete de retorno en el asignador de recursos (otro camión/chofer meses después) y la inspección obligatoria de recuperación previa al viaje de retorno. | Sergio Gajardo | Alta | ⏳ Pendiente |
| **7** | **Añadir viáticos de alimentación en ITS Final:** Incorporar las pestañas e ítems de viático de alimentación (desayuno, almuerzo, cena, alojamiento y traslado) en la configuración del ITS final nativo. | Sergio Gajardo | Alta | ⏳ Pendiente |
| **8** | **Ajustar resumen ejecutivo del ITS Final:** Modificar el resumen ejecutivo del ITS final para desplegar la apertura detallada de costos operacionales y `% S/ VENTA`, homologándolo con el ITS de Transición. | Sergio Gajardo | Alta | ⏳ Pendiente |
| **9** | **Corregir actualización de Operador y Rigger en reportes generados:** Investigar y solucionar el defecto que mantiene el nombre antiguo de Operador/Rigger en reportes ya generados tras una reasignación (Caso Tensacon), habilitando rectificación por fecha/reporte. | Sergio Gajardo | Alta | ⏳ Pendiente |
