# 📝 Minuta de Reunión: Revisión de Líneas de Negocio, Reclasificación de Horquillas y Manipuladores en Izaje, Cotización Comercial Simplificada, Fallas de Asignación de Recursos (Caso Rosen) y Gobernanza DEV vs. Producción

- **Fecha y Hora:** Miércoles 11 de noviembre de 2026 (`CLT / GMT-03:00`). Hora de inicio no consignada en el evento; la transcripción registra marcas desde `00:01:19` hasta `00:53:34` (aprox. 54 minutos).
- **Proyecto:** Plataforma de Gestión Operativa y Liquidación de Servicios — **Grúas San Pablo (GSP)**.
- **Participantes Asistentes:**
  - **Sergio Gajardo** — Director de Proyecto y Arquitecto Principal, LeanGlobal (`sgajardoc@gmail.com`).
  - **Jorge Ponce** — Jefe de Operaciones, Grúas San Pablo (`jponce@arriendosanpablo.cl`).
  - **Alfonso Porperrello** — Product Manager / Coordinación Operativa GSP (`alfonsoporperello@gmail.com`). *Figura como invitado; las intervenciones registradas en la transcripción corresponden a Sergio Gajardo y Jorge Ponce, y la reunión acuerda enviarle el material para su retroalimentación posterior.*
- **Stakeholders / Personal Clave Mencionados:**
  - **Jonathan** (apellido y cargo no consignados en el resumen) — responsable de administrar los botones de equipos de apoyo y accesorios en la etapa de Operaciones.
  - **Contabilidad GSP** — destinataria de los reportes digitales con sello PIN.
  - **Cliente Rosen** — caso real usado para analizar la estructura de servicios y reproducir la falla de asignación.
- **Enlaces y Registros Oficiales:**
  - **Evento de Calendario:** [Revisión Líneas de Negocio](https://calendar.google.com/calendar/event?eid=MWtsa3VmN2djY2huZGhwMTc2anU5ZzQwcm8gc2dhamFyZG9jQG0)
  - **Transcripción Oficial Google Docs:** [Transcripción Oficial Sesión 11-Nov-2026](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?usp=drive_web&tab=t.dy1ss7kgylvg)
  - **Material presentado en la sesión:** [Levantamiento E2E publicado](https://servidor.leanglobal.cl/pptas/GSP/estructurador/analisis.html) (matriz de líneas de negocio, AS-IS, brechas y TO-BE).

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Sesión de revisión del levantamiento E2E presentado por Sergio Gajardo a Jorge Ponce (Jefe de Operaciones) sobre las brechas del servicio actual y la reestructuración de líneas de negocio. Se validó la hipótesis de fondo (el sistema no reconoce a qué línea pertenece cada servicio), se redefinió la frontera entre líneas de negocio (horquillas y manipuladores pasan a Izaje), se acordó mantener una cotización comercial simple para el cliente y se estableció una regla de gobernanza para dejar de modificar el ambiente productivo sin validación previa en Desarrollo. Cerrando la sesión se priorizó, como excepción urgente en producción, el adjunto de los reportes digitales con sello PIN que Contabilidad necesita para facturar.

Los ejes estructurales abordados fueron:
1. **Hallazgos del levantamiento:** el sistema no identifica la línea de servicio; el cotizador móvil infla precios; contratos y actas de entrega con almacenamiento y visualización deficientes.
2. **Definición de las líneas de negocio:** reclasificación de grúas horquilla y manipuladores telescópicos a la familia de Izaje; plataformas permanecen en Arriendo / Rental.
3. **Cotización comercial simplificada:** equipo principal más traslado global, sin decisiones operativas del vendedor; ítems primarios con control y reportes obligatorios, servicios adicionales o de valor fijo independientes.
4. **Revisión de la matriz de reglas de negocio:** observación de Jorge sobre viáticos y pago por hora líquida a conductores; envío editable a Alfonso.
5. **Fallas en la capa web (caso Rosen) y documentos de operadores:** error al modificar o eliminar asignaciones, y vigencia genérica de documentos en perfiles de operadores.
6. **Gobernanza de ambientes y priorización:** DEV como único lugar de cambios nuevos, despliegues coordinados en las tardes y reportes digitales con sello PIN como urgencia en producción.

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

- **✅ Decisiones Acordadas (En Firme):**
  1. **Reclasificación de Horquillas y Manipuladores Telescópicos en la familia de Izaje**, junto a grúas telescópicas y camiones pluma; las plataformas de arriendo permanecen como Rental.
  2. **Cotización comercial simplificada:** líneas principales y traslados generales, sin requerimientos operativos excesivos para el vendedor.
  3. **Flujo de validación para cambios:** se detienen las modificaciones directas en Producción; todo cambio se valida en Desarrollo con pruebas de Alfonso antes de implementarse, y los despliegues se coordinan en horario de tarde.
  4. **Prioridad urgente en Producción:** reparar el adjunto de los reportes digitales con sello PIN para que Contabilidad pueda procesarlos y enviarlos a clientes.
- **⏳ Decisiones Sujetas a Validación / Escalamiento:**
  1. **Matriz de líneas de negocio:** se envía a Alfonso en formato editable para sus comentarios; la maqueta definitiva se refina después de esa retroalimentación.
  2. **Plan de remediación de brechas:** debe elaborarse y socializarse con los interesados; la revisión de brechas críticas se coordina con Alfonso y las dudas de reglas de negocio se consultan a Jorge.
  3. **Correcciones a la matriz:** retirar o reformular viáticos y pago por hora líquida a conductores (observación de Jorge, ver 2.4).

### 2.1. Hallazgos Iniciales del Levantamiento `[00:01:19]`
- **Fuente:** [Transcripción 00:01:19](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.p1l9bmond2y1) y [00:09:54](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.4xswxe6ai1c9)
- **Decisión / Regla de Negocio:** Sergio expone que el sistema actual no reconoce a qué línea pertenece cada servicio, lo que genera errores sistemáticos en todos los niveles operativos y comerciales. Identifica además que el cotizador móvil infla los precios de las jornadas por fallas en el cálculo de arriendos, y deficiencias en el almacenamiento y visualización de contratos y actas de entrega creadas apresuradamente. Jorge participa en la revisión de los antecedentes.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):** Ratifica como causa raíz la ausencia de `linea_negocio` y `rol_nodo` en el servicio (brecha base del levantamiento) y confirma como prioritarias las brechas del cotizador express (sobreprecio por jornada), el contrato físico no persistido y el Acta 360° (almacenamiento y visualización).

### 2.2. Plan de Remediación y Revisión Paralela `[00:11:06]`
- **Fuente:** [Transcripción 00:11:06](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.ml9plilg3gxs)
- **Decisión / Regla de Negocio:** Sergio se compromete a elaborar un plan de remediación. Jorge sugiere revisar estos puntos en paralelo junto a Alfonso para evitar modificaciones no sincronizadas.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):** El plan de remediación se documenta como especificación antes de cualquier cambio (Constitución GSP, Spec-Driven), y su priorización se valida con Alfonso y Jorge antes de ejecutar.

### 2.3. Definición de las Líneas de Negocio `[00:14:33]`
- **Fuente:** [Transcripción 00:14:33](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.oo7x947kz895)
- **Decisión / Regla de Negocio:** Se reclasifican **grúas horquilla** y **manipuladores telescópicos** dentro de la familia de **Izaje**, junto a grúas telescópicas y camiones pluma, diferenciándolas de las plataformas de arriendo o Rental. Jorge explica que la lógica operativa de horquillas y manipuladores es idéntica a la de las grúas de izaje con operador.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - La `linea_negocio` se asigna por **familia de equipo** y no por prefijo o nombre del activo: horquillas y manipuladores heredan el flujo de Izaje operado (Report Diario, regla Urbano/Rural, operador con pago por hora según tarifario, ITS por nodo).
  - **Efecto en el material publicado:** el levantamiento (`analisis.html`) ubica horquillas y manipuladores en Arriendo / Rental. Debe corregirse en la matriz, en el árbol TO-BE y en la tabla de sostenibilidad. También afecta la exclusión actual del Acta 360° (`Surveys.vue`), que hoy impide su uso en equipos no plataforma: ahora esos equipos no usarían Acta sino Report Diario cuando se arriendan con operador.
  - Pendiente por definir con Jorge: tratamiento de horquillas o manipuladores arrendados en seco (sin operador), si existieran.

### 2.4. Cotización Comercial Simplificada y Separación de lo Operativo `[00:18:45]` `[00:20:53]` `[00:27:38]`
- **Fuente:** [Transcripción 00:18:45](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.rlysirrrp2xw), [00:20:53](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.ncu3r4uldagt) y [00:27:38](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.cdl9pkfepew9)
- **Decisión / Regla de Negocio:**
  - La cotización comercial se mantiene **simple para el cliente**: muestra solo el **equipo principal** y el **costo de traslado global**.
  - La fuerza comercial **no participa en decisiones operativas** como tipo de camión o equipos de apoyo; esas definiciones pertenecen a Operaciones.
  - Analizado sobre un caso real de **Rosen**, los **ítems primarios** llevan control y reportes obligatorios, mientras que los **servicios adicionales o de valor fijo** funcionan de manera independiente.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - El Estructurador comercial se acota a **línea principal + traslado general**. Los roles de nodo operativos (`APOYO` como tracto de contrapesos, escolta, accesorios) dejan de ser requisito del vendedor y se asignan en la etapa de **Operaciones** (ver compromiso de Jonathan sobre botones de equipos de apoyo y accesorios).
  - El control (Report Diario, Acta, viaje) se ata al **ítem primario**; los adicionales y servicios de valor fijo se liquidan de forma independiente, consistente con la separación nodo por nodo del ITS (no aplastar valor fijo sobre horas).
  - **Efecto en el material publicado:** el TO-BE actual modela ramas operativas dentro de la cotización (tracto de contrapesos, rigger, escolta, accesorios). Debe rehacerse la vista separando "qué ve el cliente y el vendedor" de "qué estructura interna define Operaciones".

### 2.5. Retroalimentación sobre la Matriz de Reglas de Negocio `[00:29:46]` `[00:46:09]`
- **Fuente:** [Transcripción 00:29:46](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.919mgowefezt) y [00:46:09](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.ubntup9en09n)
- **Decisión / Regla de Negocio:** Jorge confirma haber revisado la matriz y advierte que se incluyeron erróneamente **viáticos y pagos por hora líquida para conductores**, que no corresponden al esquema de pago real. Se coordina enviar el material actualizado por el grupo de WhatsApp de gestión para que Alfonso incorpore comentarios; Sergio se compromete a enviar las matrices en formato editable (Excel o documento en Drive).
- **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - Se corrige la matriz de sostenibilidad: las filas "Pago de horas (RRHH)" y "Política de viáticos" para conductores (tracto, fletes) deben ajustarse al **esquema real** que Jorge detalle por escrito antes de volver a presentarlas.
  - La brecha de levantamiento que indica "choferes de apoyo invisibles en RRHH" debe revalidarse con Jorge: puede que parte de lo que se señaló como brecha no corresponda al esquema de pago real de conductores.
  - Entregable editable de la matriz (Excel / Drive) para comentarios en línea de Alfonso.

### 2.6. Falla en Asignación de Recursos, Caso Rosen `[00:33:13]` `[00:41:56]`
- **Fuente:** [Transcripción 00:33:13](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.seac9nv1hmzv) y [00:41:56](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.8w7c0aoisr9h)
- **Decisión / Regla de Negocio:** Jorge demuestra un error persistente al intentar **modificar o eliminar la asignación de recursos y transportes** en el caso Rosen; la interfaz genera fallos en la consola del navegador al guardar. Sergio diagnostica que es un problema de la **capa de presentación web heredada de la antigua estructura comercial**, no de la base de datos. Se acuerda investigarlo y corregirlo específicamente en el ambiente de **Desarrollo**, analizando el manejo de memoria en el cliente.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):** Intervención exclusiva de frontend (`GestorOportunidades.vue` y componentes de asignación). No requiere modificar backend ni base de datos; se valida en DEV con el caso Rosen antes de cualquier despliegue.
- **Mejora de usabilidad asociada:** reemplazar los buscadores actuales de operarios y equipos por **listas desplegables con filtros de búsqueda eficientes**.

### 2.7. Vigencia de Documentos de Operadores `[00:43:54]` `[00:45:08]`
- **Fuente:** [Transcripción 00:43:54](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.ati94klsxom4) y [00:45:08](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.gqack6jph0ro)
- **Decisión / Regla de Negocio:** Jorge reporta que los perfiles de operadores muestran de forma genérica **todos los documentos como vigentes por una cantidad masiva de días** aunque no hayan sido subidos. Sergio indica que revisará el funcionamiento de este módulo.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):** Revisión del módulo de acreditaciones de persona (semáforo de vigencia, `tsec_certificados_persona`): un documento no cargado debe mostrarse como **faltante / sin vigencia**, no como vigente. Pendiente: confirmar en DEV el origen del valor por defecto y definir si requiere saneamiento de datos (requiere autorización explícita previa para cualquier intervención en base de datos).

### 2.8. Gobernanza de Ambientes: DEV vs. Producción `[00:49:14]` `[00:50:20]`
- **Fuente:** [Transcripción 00:49:14](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.fmr8wze2sly5) y [00:50:20](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.s5ob9cfffhu1)
- **Decisión / Regla de Negocio:** Se detienen las modificaciones directas en Producción; todas las pruebas y nuevas lógicas se realizan exclusivamente en **Desarrollo**. Sergio trabaja las prioridades junto a Alfonso, las validaciones técnicas se hacen en DEV y los **despliegues de versiones se efectúan coordinadamente durante las tardes**.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):** Refuerza el bloqueo de entornos de la Constitución GSP (DEV `lg-gsp-dev` / `sch_leangsp`). Flujo operativo: **especificación, DEV, prueba de Alfonso, despliegue en ventana de tarde** (con `git pull` y `pm2 restart` solo con autorización explícita). La única excepción acordada es la urgencia descrita en 2.9.

### 2.9. Reportes Digitales con Sello PIN para Contabilidad `[00:52:15]` `[00:53:34]`
- **Fuente:** [Transcripción 00:52:15](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.vdntdnb3jeyp) y [00:53:34](https://docs.google.com/document/d/1unx7-mQO92c0SzXEZ0HrJpbojyg7dczIEoA1IzlC35k/edit?tab=t.dy1ss7kgylvg#heading=h.i4gf3i6apnox)
- **Decisión / Regla de Negocio:** Jorge y Sergio revisan la generación y visualización de reportes digitales en PDF con sellos digitales y edición de terreno. Jorge destaca que este punto es **crítico y urgente**: Contabilidad necesita procesar los documentos y enviarlos a los clientes con el sellado por PIN. Se acuerda **priorizar esta solución en Producción antes de cerrar la reunión**, corrigiendo el problema del adjunto en los reportes.
- **Impacto en Plataforma / Arquitectura (Spec-Driven):** Corrección del adjunto del reporte (PDF V2 con doble sello y PIN FES) en el flujo de envío a Contabilidad. Por ser corrección en Producción, queda sujeta a la regla de autorización explícita y diff previo, con evidencia empírica de envío exitoso.

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Fecha Límite / Hito | Estado |
|---|---|---|---|---|---|
| 1 | **Reparar adjunto en reportes (Producción):** corregir el adjunto de los reportes digitales con sello PIN para permitir su envío correcto a Contabilidad. **Prioridad urgente.** | Sergio Gajardo | LeanGlobal | Urgente; excepción acordada para Producción | Pendiente |
| 2 | **Planificar remediación:** elaborar el plan para resolver las brechas identificadas en el servicio y socializarlo con los interesados. | Sergio Gajardo | LeanGlobal | Sin fecha definida; previo a ejecutar cambios | Pendiente |
| 3 | **Enviar matrices en formato editable** (Excel o documento en Drive) para facilitar la revisión; incorporar la corrección de líneas (horquillas y manipuladores en Izaje) y la observación sobre viáticos y pago por hora de conductores. | Sergio Gajardo | LeanGlobal | Inmediato (distribución por grupo de WhatsApp de gestión) | Pendiente |
| 4 | **Retroalimentar matriz:** revisar el material recibido y entregar comentarios detallados para refinar la propuesta y la maqueta definitiva. | Alfonso Porperrello | GSP | Posterior al envío de la matriz | Pendiente |
| 5 | **Revisar brechas críticas con Alfonso** para asegurar alineación; consultar a Jorge ante dudas de reglas de negocio. | Sergio Gajardo | LeanGlobal | Sin fecha definida | Pendiente |
| 6 | **Gestionar asignación operativa:** administrar los botones de equipos de apoyo y accesorios en la etapa de Operaciones, excluyendo al personal comercial de estas definiciones. | Jonathan | GSP | Sin fecha definida | Pendiente |
| 7 | **Corregir error de interfaz (caso Rosen):** investigar y solucionar la falla de la capa web que impide guardar cambios en la asignación de recursos; analizar el manejo de memoria en el cliente. | Sergio Gajardo | LeanGlobal | Ambiente DEV; validación con Alfonso | Pendiente |
| 8 | **Implementar listas desplegables:** filtros de búsqueda eficientes y listas desplegables para seleccionar operarios y equipos, reemplazando los buscadores actuales. | Sergio Gajardo | LeanGlobal | Ambiente DEV; validación con Alfonso | Pendiente |
| 9 | **Investigar el error de estructura en Rosen** y resolverlo específicamente en el ambiente de Desarrollo. | Sergio Gajardo | LeanGlobal | Ambiente DEV | Pendiente |
| 10 | **Revisar el módulo de vigencia de documentos de operadores** (documentos no cargados mostrados como vigentes por una cantidad masiva de días). | Sergio Gajardo | LeanGlobal | Sin fecha definida | Pendiente |
| 11 | **Actualizar el levantamiento publicado** (`analisis.html`): horquillas y manipuladores en Izaje, vista de cotización simplificada versus estructura operativa interna, y corrección de viáticos y pago a conductores. Previa autorización explícita para publicar. | Sergio Gajardo | LeanGlobal | Tras retroalimentación de Alfonso y Jorge | Pendiente (acción derivada) |

> Los ítems 1 a 10 provienen del resumen oficial de la reunión. El ítem 11 es una acción derivada de las decisiones 2.3, 2.4 y 2.5, registrada para trazabilidad.

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza

- **Fecha y Hora Propuesta:** No definida en la sesión. Se sugiere agendar una vez que Alfonso entregue su retroalimentación de la matriz.
- **Participantes Convocados:** Sergio Gajardo (LeanGlobal), Jorge Ponce (Jefe de Operaciones), Alfonso Porperrello (Product Manager). Jonathan, según se requiera por la asignación operativa de equipos de apoyo y accesorios.
- **Foco Principal de la Sesión:**
  1. Validar la matriz de líneas de negocio corregida (horquillas y manipuladores en Izaje; viáticos y pago de conductores según esquema real).
  2. Revisar el plan de remediación de brechas y su priorización.
  3. Probar en DEV con Alfonso las correcciones del caso Rosen y las listas desplegables de operarios y equipos.
  4. Confirmar la resolución del adjunto de reportes con sello PIN en Producción y su recepción en Contabilidad.
