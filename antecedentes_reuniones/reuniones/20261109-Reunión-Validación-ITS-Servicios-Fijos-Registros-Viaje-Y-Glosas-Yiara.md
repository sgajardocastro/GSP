# 📝 Minuta de Reunión: Validación Operativa de ITS, Servicios de Valor Fijo, Registros de Viaje de Tracto Camión y Glosas de Costos (Sesiones 15:08, 17:44 y 19:01 hrs)

- **Fecha y Hora:** Lunes 9 de noviembre de 2026 — Sesiones continuas a las **15:08 hrs**, **17:44 hrs** y **19:01 hrs** (`CLT / GMT-03:00`).
- **Proyecto:** Plataforma de Gestión Operativa y Liquidación de Servicios — **Grúas San Pablo (GSP)**.
- **Participantes Asistentes:**
  - **Yiara Mendoza** — Analista de Control de Gestión y Liquidación ITS, Grúas San Pablo (`ymendoza@gruassanpablo.cl`).
  - **Jorge Ponce** — Jefe de Operaciones, Grúas San Pablo (`jponce@gruassanpablo.cl`) *(Sesión 15:08 hrs)*.
  - **Sergio Gajardo** — Director de Proyecto y Arquitecto Principal, LeanGlobal (`sgajardo@leanglobal.cl`).
- **Stakeholders / Comité Mencionados:**
  - **Alfonso Porperrello** — Product Manager / Coordinación Operativa GSP.
  - **Tesalia Malatesta** — Gerente de Recursos Humanos GSP.
  - **Contabilidad y Facturación GSP**.
- **Enlaces y Registros Oficiales:**
  - **Sesión 1 (15:08 GMT-03:00):** [Transcripción Oficial Google Docs](https://docs.google.com/document/d/15HmmIbelSw7PNyScroVCJYm9OKoWPK2dRIyqzV0TTvQ/edit?usp=drive_web&tab=t.l0twebi1vwy4)
  - **Sesión 2 (17:44 GMT-03:00):** [Transcripción Oficial Google Docs](https://docs.google.com/document/d/12HEi_VearS3eka9ItIgzq_Ys86vJ9MeoYSzj26lkAfw/edit?usp=drive_web&tab=t.i0xbztcqwhcg)
  - **Sesión 3 (19:01 GMT-03:00):** [Transcripción Oficial Google Docs](https://docs.google.com/document/d/1b3T5JBFVpVQW6714AXK7C5NYqF3-pBptSBppm_JcN8g/edit?usp=drive_web&tab=t.pztk7bx3x5ad)

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Durante la tarde del 9 de noviembre de 2026 se llevaron a cabo tres sesiones sucesivas de validación y depuración en vivo en Producción (`v2.0.5`) entre Control de Gestión (Yiara Mendoza), Jefatura de Operaciones (Jorge Ponce) y Arquitectura LeanGlobal (Sergio Gajardo), enfocadas en certificar la emisión del **Informe de Término de Servicio (ITS)** sobre órdenes reales —especialmente la **OT 32 (`GSP-2611-00003`, Cliente: Gerard Barthou, Temuco)** y la **OT 30 (`GSP-2611-00001`, FEPASA)**—.

Los ejes estructurales revisados y resueltos abarcaron:
1. **Saneamiento del Estructurador de Preventa y Servicios de Valor Fijo (Suma Alzada):** Eliminación de líneas comerciales fantasma de Rigger a `$0` que heredaban erróneamente `$1.000.000`, separación de `Valor Fijo Pactado` frente a `Valor Hora Pactado` y eliminación de pisos mínimos de 9 horas en servicios pactados a suma alzada.
2. **Persistencia de Eliminación y Edición de Costos de Hora Operador:** Corrección del constraint `tits_jornada_detalle_tipo_servicio_check` en PostgreSQL y respeto estricto a las filas eliminadas o editadas manualmente por Control de Gestión.
3. **Regla Determinista de Despliegue de Flota (Tracto Camión vs. Rampla/Plataforma):** Incorporación del **Registro de Viaje (`tequ_log_desplazamiento`)** en el ITS vinculándolo exclusivamente a los equipos motorizados que poseen registro de viaje o report diario (ej. Grúa `PJYY.20-1` con Robert Rodríguez y Tracto Camión `RWJL.23-K` con Luis Mercado), excluyendo plataformas o semirremolques sin motor ni registros asociados (`JC.2796-2`).
4. **Visibilidad de Glosas, Condición Editable de Viáticos y Movilización Combinada:** Visualización simultánea del tipo de movilización y su glosa personalizada en web y PDF, edición directa de la condición de movimiento diario en viáticos de alimentación, e inclusión de tipo de viaje y comentario en los registros de desplazamiento.

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

- **✅ Decisiones Acordadas (En Firme e Implementadas):**
  1. **Servicios de Valor Fijo (Suma Alzada):** En servicios cotizados como `Valor Fijo`, el ITS no aplica horas mínimas (`NO APLICA (VALOR FIJO)`), muestra en cabecera `SERVICIO VALOR FIJO (SUMA ALZADA)` y presenta en el resumen de ingresos el ítem `1. Valor Fijo Servicio` por el monto total pactado (`$1.000.000`).
  2. **Gestión Manual de las 6 Horas Base de Operador en Valor Fijo:** Se acordó que el pago de 6 horas fijas al operador en servicios de valor fijo sea gestionado manualmente por Control de Gestión en la pestaña `Hora Operador` sin automatización rígida, dado que el cliente firma únicamente las horas reales de terreno.
  3. **Regla Determinista de Equipos en ITS Web y PDF:** En el ITS solo deben desplegarse los equipos que posean **Registro de Viaje (`tequ_log_desplazamiento`)** o **Report Diario (`tedp_reporte_avance`)**. Las ramplas/semirremolques acoplados sin registros propios (`JC.2796-2`) no deben listarse como vehículos independientes.
  4. **Movilización (Tipo + Glosa Simultáneos):** El sistema debe conservar y mostrar simultáneamente tanto el **Tipo de Movilización** (`UBER / TAXI`, `PASAJE BUS`, etc.) como la **Glosa / Ruta personalizada** ingresada por el analista, tanto en la interfaz web como en el PDF.
  5. **Condición de Movimiento Diario Editable en Viáticos:** El campo de condición/concepto de movimiento diario en la pestaña `Viático Alimentación` debe ser editable por el usuario y persistirse en la base de datos y en el PDF.
  6. **Tipo de Viaje y Comentario en Registros de Viaje:** Los registros de viaje deben incluir el tipo de trayecto/viaje y un campo de comentario/observación.
  7. **Formato Horario Reloj (`hh:mm`):** Todas las columnas de horas de servicio, viáticos y report en el PDF del ITS deben expresarse en formato `hh:mm` (ej. `02:38`, `03:40`).

- **⏳ Decisiones Sujetas a Seguimiento / Próxima Sesión:**
  1. **Desglose Diario por Columnas en Pensiones (PDF):** Yiara Mendoza planteó la necesidad de detallar por columnas (`Desayuno`, `Almuerzo`, `Cena`, `Alojamiento`) la tabla de pensiones en el PDF debido a variaciones diarias de asistencia del personal; se revisará en conjunto con la matriz de PMO en la siguiente sesión.

---

### Detalle Técnico y Trazabilidad a Transcripciones

#### 2.1. Servicios de Valor Fijo, Preventa y Eliminación de Registros ([Sesión 1 - 15:08 hrs](https://docs.google.com/document/d/15HmmIbelSw7PNyScroVCJYm9OKoWPK2dRIyqzV0TTvQ/edit?usp=drive_web&tab=t.l0twebi1vwy4))
- **Hallazgo ([00:00:00] - [00:06:16]):** Al intentar eliminar filas inferiores en `Hora Operador` y guardar el ITS de la OT 32, el backend arrojaba error 500 por la restricción `tits_jornada_detalle_tipo_servicio_check` al recibir `Valor Fijo / Jornada`, y al refrescar reaparecían los registros autogenerados. Además, la preventa había inyectado una línea fantasma de `Rigger Certificado` que tomaba el millón de pesos de la grúa.
- **Impacto en Arquitectura:**
  - En `GestorOportunidades.vue` y `proyectoModel.js` se suprimió la creación y promoción de líneas comerciales `$0` de Rigger cuando se marca el check operativo `"Con Rigger"`.
  - En PostgreSQL (`sch_leangsp_prod` y `sch_leangsp`) se amplió el constraint `tits_jornada_detalle_tipo_servicio_check` para admitir `'Valor Fijo'`, `'Valor Fijo / Jornada'`, `'Registro de Viaje'` y `'Traslado'`.
  - En `itsController.js` se persistió la bandera `costos_guardados_usuario: true` en `categorias_sin_costo` para respetar las eliminaciones manuales del analista.

#### 2.2. Regla de las 6 Horas del Operador e Incorporación del Registro de Viaje ([Sesión 2 - 17:44 hrs](https://docs.google.com/document/d/12HEi_VearS3eka9ItIgzq_Ys86vJ9MeoYSzj26lkAfw/edit?usp=drive_web&tab=t.i0xbztcqwhcg))
- **Regla de Negocio ([00:00:24] - [00:02:13]):** Yiara Mendoza confirmó que el valor fijo de `$1.000.000` ya se visualizaba correctamente en la web y en el PDF. Respecto a la regla interna donde al operador se le pagan 6 horas en servicios de valor fijo aunque el report marque `02:38` hrs, Yiara indicó que no requiere automatización porque el cliente no firma esas 6 horas y es preferible ajustarlas manualmente en la planilla de costos.
- **Trazabilidad de Flota ([00:03:05] - [00:07:22]):** Se identificó que faltaba visualizar en el ITS al conductor del camión (**Luis Mercado**) y el **Registro de Viaje** del tracto camión que trasladó los contrapesos/accesorios.

#### 2.3. Filtrado de Equipos con Registros Activos y Glosas de Costos ([Sesión 3 - 19:01 hrs](https://docs.google.com/document/d/1b3T5JBFVpVQW6714AXK7C5NYqF3-pBptSBppm_JcN8g/edit?usp=drive_web&tab=t.pztk7bx3x5ad))
- **Exclusión de Ramplas sin Registro ([00:00:11]):** Se definió que en el ITS deben aparecer exclusivamente los equipos con registros de viaje o reports activos (`PJYY.20-1` y el tracto camión `RWJL.23-K`), descartando la rampla/semirremolque `JC.2796-2` que carece de motor, chofer y registro de viaje propio.
- **Movilización y Condición de Viáticos ([00:03:52] - [00:05:06]):** Se acordó que en `Movilización` se muestren simultáneamente el tipo de movilización y la glosa personalizada, que en `Viáticos de Alimentación` la condición de movimiento del día sea editable, que Matías Barrales figure siempre con su rol de `Rigger`, y que en los registros de viaje se incluya el tipo de viaje y comentario.
- **Validación del Valor Hora Operador ([00:08:37]):** Yiara Mendoza verificó en vivo que tras guardar los avances el PDF refleja correctamente el valor hora de `$6.000` y las asignaciones diarias del operador.

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Fecha Límite / Hito | Estado |
| :-: | :--- | :--- | :--- | :---: | :---: |
| 1 | Corregir constraint de BD y persistencia de eliminación de filas en `Hora Operador` | Sergio Gajardo | LeanGlobal | 09-11-2026 | ✅ Completado |
| 2 | Ajustar formato PDF para servicios de `Valor Fijo` (`SUMA ALZADA`), ocultar horas mínimas y formatear horas en `hh:mm` | Sergio Gajardo | LeanGlobal | 09-11-2026 | ✅ Completado |
| 3 | Desplegar en ITS Web y PDF únicamente equipos motorizados con `Registro de Viaje` (`RWJL.23-K`, Luis Mercado) o `Report Diario` (`PJYY.20-1`, Robert Rodríguez), excluyendo rampla `JC.2796-2` | Sergio Gajardo | LeanGlobal | 09-11-2026 | ✅ Completado |
| 4 | Mostrar simultáneamente `Tipo de Movilización` + `Glosa / Ruta` en Web y PDF | Sergio Gajardo | LeanGlobal | 09-11-2026 | ✅ En Despliegue |
| 5 | Hacer editable el campo `Condición de Movimiento Día` en `Viático Alimentación` y reflejarlo en el PDF | Sergio Gajardo | LeanGlobal | 09-11-2026 | ✅ En Despliegue |
| 6 | Incluir `Tipo de Viaje` y `Comentario` en los Registros de Viaje y asegurar rol `RIGGER` para Matías Barrales | Sergio Gajardo | LeanGlobal | 09-11-2026 | ✅ En Despliegue |

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza

- **Fecha Propuesta:** Martes 10 de noviembre de 2026 (Jornada AM/PM).
- **Participantes Convocados:** Yiara Mendoza, Jorge Ponce, Alfonso Porperrello y Sergio Gajardo.
- **Foco Principal de la Sesión:** Revisión de la matriz de la Oficina de Gestión de Proyectos (PMO), validación de los ajustes de glosas/viáticos en producción y revisión de pendientes del equipo operativo.
