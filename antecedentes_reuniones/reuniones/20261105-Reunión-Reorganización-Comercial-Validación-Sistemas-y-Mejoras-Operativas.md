# 📝 Minuta de Reunión: Reorganización Comercial, Validación de Sistemas y Mejoras Operativas GSP

**Fecha:** 05 de Noviembre de 2026  
**Hora:** 09:17 CLT (GMT-03:00)  
**Proyecto:** Plataforma de Gestión Operativa, Comercial y Financiera — Grúas San Pablo (GSP)  
**Participantes Asistentes:**  
*   **Jorge Ponce** (Gerente General / Operaciones — Grúas San Pablo — `jponce@arriendosanpablo.cl`)  
*   **Yiara Mendoza** (Analista de Control de Gestión / PMO — Grúas San Pablo — `ymendoza@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Director de Proyecto / Arquitecto Senior — LeanGlobal — `sgajardoc@gmail.com`)  

**Stakeholders / Comité Mencionados:**  
*   **Jonathan** (Jefe de Operaciones / Planificación — Grúas San Pablo)  
*   **Wilson** (Comercial / Contratos — Grúas San Pablo)  
*   **Tesalia Malatesta** (Gerente de Personas y RRHH — Grúas San Pablo)  
*   **Gerald Bartú** (Operador de Grúa — Grúas San Pablo)  
*   **Mario Concha** (Operador de Grúa Horquilla — Grúas San Pablo)  
*   **Robert Rodríguez** (Operador de Grúa / Faenas Fijas — Grúas San Pablo)  
*   **Isis Osses** (Operadora / Conductora — Grúas San Pablo)  
*   **Personal Administrativo y Secretarías de Sucursal** (Sucursales Regionales GSP)  

**Enlaces y Registros Oficiales:**  
*   📄 [Transcripción Oficial de Google Docs](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?usp=drive_web&tab=t.w857g3gdz2r9)

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Sesión ejecutiva de alineación comercial, operativa y tecnológica celebrada entre la Gerencia de Operaciones (**Jorge Ponce**), el área de Control de Gestión / PMO (**Yiara Mendoza**) y la Dirección de Proyecto de LeanGlobal (**Sergio Gajardo**). La reunión abordó de manera integral la reorganización del modelo comercial del catálogo de servicios, la depuración de inconsistencias operacionales en faenas en curso (Besalco, FEPASA, Gerald Bartú, Royal Rental) y la definición de candados de gobierno para la emisión de documentos técnicos y estados de pago:

1. **Reorganización Estructural del Cotizador Comercial:** Presentación de la nueva arquitectura de familias comerciales (Transporte de Activos, Arriendo de Equipos, Servicios Profesionales y Grúas), vinculando de manera natural los traslados a la grúa principal y simplificando la comprensión para clientes y vendedores.
2. **Protocolo de Certificación E2E de la Estructura Comercial:** Planificación de una batería de 4 pruebas de punta a punta en el entorno `DEV` junto a Yiara Mendoza y Jonathan para validar la trazabilidad completa (Cotización $\rightarrow$ Requerimiento $\rightarrow$ Asignación $\rightarrow$ PWA/Reports $\rightarrow$ ITS $\rightarrow$ EDP).
3. **Control Operativo Fino en Torre PMO y RRHH:** Incorporación de filtro/rango de fechas para asignación de operadores en servicios multi-turno (resolviendo el caso Besalco), campo de comentarios diarios para el seguimiento de Recursos Humanos (Tesalia Malatesta) y captura del hito de llegada a planta en telemetría de retorno.
4. **Saneamiento Técnico del Caso Ferrocarriles del Pacífico (FEPASA):** Corrección urgente de las 3 desviaciones que bloquean la facturación: priorización de la hora validada por operaciones sobre la del conductor, visualización del término de retorno y cálculo matemático de sumatorias manuales.
5. **Políticas de Horas Mínimas en Servicios Fijos:** Análisis del problema de las "horas mínimas fantasma" (8 hrs por defecto en faenas fijas como la de Robert Rodríguez), evaluando una regla sugerida de 6 horas base y permitiendo su edición controlada en la etapa de validación de operaciones.
6. **Segregación de Roles y Gobierno Documental:** Restricción del resumen ejecutivo del ITS para secretarías de sucursales (creación de flujo FES con firma PIN de 4 dígitos y derivación por correo a Yiara), automatización del envío de PDF en visitas a terreno, clasificación simplificada de servicios internos y aplicación de sellos de agua de borrador en reportes no validados.

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

| Categoría | Decisión | Estado |
| :--- | :--- | :---: |
| **Comercial / CRM** | Validación mediante 4 pruebas integrales E2E de la nueva estructura comercial en `DEV` antes de su paso a producción. | ✅ **Acordada (En Firme)** |
| **Control Gestión / ITS** | Restricción del acceso al resumen ejecutivo del ITS a secretarías de sucursales; flujo de firma FES 4 dígitos y derivación a Yiara Mendoza. | ✅ **Acordada (En Firme)** |
| **Torre PMO** | Control de asignación de operadores por rango de fechas en tarjetas PMO para servicios con relevos (Caso Besalco). | ✅ **Acordada (En Firme)** |
| **Torre PMO / RRHH** | Incorporación de campo de comentarios diarios externos para Recursos Humanos (Tesalia) al pie de las tarjetas operativas. | ✅ **Acordada (En Firme)** |
| **Telemetría / Viáticos** | Registro y despliegue del hito de llegada a planta en el viaje de retorno (Caso Gerald Bartú). | ✅ **Acordada (En Firme)** |
| **Operaciones / FEPASA** | Corrección en informe técnico FEPASA: priorizar hora validada de operaciones, mostrar término de retorno y sumar inserciones manuales. | ✅ **Acordada (En Firme)** |
| **Notificaciones** | Envío automático de correo con enlace al PDF de Visita a Terreno para vendedor, operaciones y gerencia. | ✅ **Acordada (En Firme)** |
| **Formato Horas** | Despliegue de tiempos en formato `HH:MM` (horas y minutos) en lugar de valores decimales en reportes e interfaces. | ✅ **Acordada (En Firme)** |
| **Operaciones / Regla** | Configuración de horas mínimas para servicios fijos (propuesta base de 6 horas con edición en validación de operaciones). | ⏳ **Requiere Debate (Tarde 05-Nov)** |
| **Servicios Internos** | Exención de reporte diario/ITS completo para servicios internos y derivación directa a biblioteca de costos. | ⏳ **Requiere Debate (Tarde 05-Nov)** |
| **Seguridad Documental** | Inyección de marca de agua "BORRADOR" o restricción de descarga de PDF de reportes hasta aprobación de operaciones. | ⏳ **Requiere Debate (Tarde 05-Nov)** |

---

### 2.1. Propuesta de Estructuración de Servicios Comerciales y Plan de Pruebas E2E
*   **Timestamp:** [[00:05:31]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.w857g3gdz2r9#heading=h.uy2xg2sozlpv) — [[00:08:58]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.w857g3gdz2r9#heading=h.nj495ojj1sl6) — [[00:13:01]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.w857g3gdz2r9#heading=h.fe2ppih80viz)
*   **Decisión / Regla de Negocio:**
    1. Se reorganiza el catálogo comercial en 4 familias claras: **Transporte de Activos**, **Arriendo de Equipos**, **Servicios Profesionales** y **Grúas**.
    2. Los traslados de ida y vuelta quedan jerárquicamente asociados a la máquina principal para evitar cotizaciones inconexas y clarificar la lectura ante los mandantes.
    3. Para asegurar la estabilidad y cuadratura financiera del cambio, se acuerda ejecutar **4 pruebas integrales de ciclo completo (E2E)** en el entorno de desarrollo (`DEV`) junto a Yiara Mendoza y Jonathan antes de liberar cualquier cambio a producción.
*   **Impacto en Plataforma / Arquitectura (`SPEC-016`):**
    - Parametrización en el estructurador comercial (`GestorOportunidades.vue`) y validación de impacto en la generación de OT (`proyectoModel.js`), ITS (`itsController.js`) y EDP (`edpController.js`).

### 2.2. Lógica de Asignación por Fechas en Torre PMO (Caso Besalco)
*   **Timestamp:** [[00:13:58]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.cxrjey1h0ah7) — [[00:15:42]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.8x7gpnbvrewf)
*   **Decisión / Regla de Negocio:**
    1. Se constató que en la versión `v1.0.197` la Orden de Trabajo de Besalco ya refleja adecuadamente a Mario Concha tras la regeneración del documento.
    2. Sin embargo, en la tarjeta de la matriz PMO (`ControlOperativoVivo.vue` / `Torre.vue`), el operador mostrado no discriminaba la fecha activa del día visualizado, mostrando a Isis Osses en días donde ya operaba Mario Concha.
    3. Se establece que la tarjeta de la torre de control debe resolver al operador consultando la estructura de relevos (`turnos_operadores`) según el rango de días de la fecha seleccionada.
*   **Impacto en Plataforma / Arquitectura (`SPEC-016` / `SPEC-065`):**
    - Actualización de los métodos de resolución de tripulación en `ControlOperativoVivo.vue` y `Torre.vue` para evaluar `fecha_inicio <= fecha_filtro <= fecha_fin`.

### 2.3. Incorporación de Comentarios Diarios de Faena para Recursos Humanos
*   **Timestamp:** [[00:18:23]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.31g5s66ffrsv)
*   **Decisión / Regla de Negocio:**
    1. A solicitud de Yiara Mendoza y para uso del equipo de Recursos Humanos liderado por Tesalia Malatesta, se requiere registrar y consultar comentarios e incidencias del día ocurridas en terreno (retrasos, clima, fallas, tiempos muertos, cambios de turno).
    2. Estos comentarios deben ser independientes del reporte formal del cliente y ubicarse en un campo editable accesible en la parte inferior de la tarjeta diaria de la matriz PMO.
*   **Impacto en Plataforma / Arquitectura (`SPEC-065` / `SPEC-057`):**
    - Extensión en `ControlOperativoVivo.vue` y persistencia en `tedp_reporte_avance.comentarios_rrhh` o en la bitácora operativa diaria de la OT.

### 2.4. Telemetría de Retorno: Registro de Hora de Llegada a Planta (Caso Gerald Bartú)
*   **Timestamp:** [[00:22:07]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.73ivxr37jdjf)
*   **Decisión / Regla de Negocio:**
    1. En el servicio operado por Gerald Bartú, la matriz PMO registra el inicio del viaje de retorno pero omite la hora exacta de llegada a las instalaciones/planta de San Pablo.
    2. Este dato es crítico para liquidar viáticos de viaje, colaciones y horas de traslado del personal. Se debe asegurar el cierre del hito temporal de llegada y su correcta visualización en la torre de control.
*   **Impacto en Plataforma / Arquitectura (`SPEC-049` / `SPEC-053`):**
    - Auditoría del flujo en `ViajeConductor.vue` y `tequ_log_desplazamiento` para asegurar la captura y renderizado de `fecha_llegada_destino` / `hora_llegada_destino`.

### 2.5. Restricción del Resumen Ejecutivo del ITS para Secretarías y Flujo de Firma FES
*   **Timestamp:** [[00:26:34]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.fctgb4xya8p6)
*   **Decisión / Regla de Negocio:**
    1. Las secretarías y personal administrativo de las sucursales no deben tener acceso a la visualización ni edición del **Resumen Ejecutivo / Balance Financiero** del Informe Técnico de Servicio (Secciones de costos, tarifas y márgenes netos).
    2. Su alcance se limitará a ingresar los datos operativos de faena, guardar el borrador y firmar digitalmente con su **PIN FES de 4 dígitos**.
    3. Al firmar, el sistema disparará una notificación automática por correo electrónico a **Yiara Mendoza** indicando que el informe está disponible para su revisión, consolidación económica y aprobación final.
*   **Impacto en Plataforma / Arquitectura (`SPEC-067`):**
    - Condicionamiento de visualización en `ItsTransicionView.vue` bajo rol `SECRETARIA`, validación de PIN FES en backend (`itsController.firmarElaborador`) y despacho de correo con deep link a Yiara.

### 2.6. Saneamiento del Informe Técnico en Caso Ferrocarriles del Pacífico (FEPASA)
*   **Timestamp:** [[00:30:58]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.jdsd1llj7z7q)
*   **Decisión / Regla de Negocio:** Resolver de inmediato los 3 errores que frenan la emisión del estado de pago y la facturación de FEPASA:
    1. **Prevalencia de Horas:** El sistema debe tomar la hora corregida y validada por Operaciones/PMO, erradicando la persistencia de la hora digitada preliminarmente por el conductor.
    2. **Término del Retorno:** El horario de finalización del traslado de retorno debe desplegarse de forma transparente en la interfaz de liquidación del informe.
    3. **Sumatoria Manual:** La inserción manual de valores u horas adicionales debe sumarse reactivamente al total computable sin requerir recargas de página.
*   **Impacto en Plataforma / Arquitectura (`SPEC-067` / `SPEC-068`):**
    - Ajuste en `ItsTransicionView.vue`, `itsController.js` y recálculo de jornadas en `tits_jornada_detalle`.

### 2.7. Regulación de Horas Mínimas en Servicios Fijos (Caso Robert Rodríguez)
*   **Timestamp:** [[00:34:58]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.i4yc2ypb32h4)
*   **Decisión / Regla de Negocio:**
    1. Actualmente el sistema inyecta por defecto 8 horas mínimas en contratos con modalidad fija, generando discrepancias con las faenas reales ejecutadas (ej. caso Robert Rodríguez).
    2. Se propone configurar un piso base por defecto de **6 horas** para servicios fijos, habilitando un campo editable para que el Jefe de Operaciones (Jonathan) o el analista pueda ajustar este mínimo durante la fase de validación u orden de trabajo.
    3. Se aplaza la ratificación formal de esta regla para la sesión de la tarde.
*   **Impacto en Plataforma / Arquitectura (`SPEC-016` / `SPEC-034`):**
    - Incorporación de control de horas mínimas editables en la pestaña de Validación de Operaciones y su herencia a los reportes de faena fija.

### 2.8. Revisión de Contrato de Arriendo Royal Rental y Traslados
*   **Timestamp:** [[00:40:07]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.wa5fj4vpwiqg)
*   **Decisión / Regla de Negocio:**
    1. Se revisó la primera cotización formal de arriendo mensual de plataforma para Royal enviada por WhatsApp (valor fijo más flete de traslado).
    2. Se verificó la correcta operación de la funcionalidad que permite desagregar traslados individuales de ida o retorno.
    3. Sergio Gajardo consultará directamente con Wilson el estatus administrativo del contrato para asegurar su consistencia documental.
*   **Impacto en Plataforma / Arquitectura:**
    - Verificación documental de contratos de arriendo y parametrización de líneas mensuales en CRM.

### 2.9. Notificaciones Automáticas con Enlace PDF para Visitas a Terreno
*   **Timestamp:** [[00:43:20]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.wyubg97ibpap)
*   **Decisión / Regla de Negocio:**
    1. Al completarse y firmarse una Visita a Terreno (Site Visit), la plataforma debe despachar automáticamente una notificación por correo electrónico.
    2. El correo debe contener el enlace directo de descarga del informe PDF e incluir como destinatarios obligatorios al **ejecutivo comercial que solicitó la visita**, al equipo de **Operaciones** y a la **Gerencia General**.
*   **Impacto en Plataforma / Arquitectura (`SPEC-052`):**
    - Sincronización en `visitaTerrenoController.js` y `notificacionService.js` al emitir el evento de cierre de visita.

### 2.10. Tratamiento de Servicios Internos (Sin Reporte ni ITS Completo)
*   **Timestamp:** [[00:44:06]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.18650385xgvv)
*   **Decisión / Regla de Negocio:**
    1. Los movimientos y servicios internos (mantenimiento propio, traslados entre bases, pruebas de equipos) sobrecargan innecesariamente el tablero Kanban y el flujo documental de facturación.
    2. Se debate crear una bandera o clasificación de "Servicio Interno" que permita a Operaciones (con visto bueno de Jonathan o Yiara) eximir a la OT del circuito de reportes diarios mandantes y del ITS formal, derivándola a un repositorio de costos internos sin llegar a EDP.
    3. El mecanismo definitivo se acordará en la sesión de la tarde.

### 2.11. Marca de Agua "BORRADOR" en Reportes Diarios No Validados
*   **Timestamp:** [[00:46:20]](https://docs.google.com/document/d/14-IBAorJ3pQk0zpcWveH6jD0hch_v_xKhA2hQN4-sZ8/edit?tab=t.vd0lultmk9us)
*   **Decisión / Regla de Negocio:**
    1. Para prevenir que circulen documentos preliminares entre clientes o áreas no operativas antes de la revisión técnica de Control de Gestión (Yiara), se evalúa estampar una **marca de agua diagonal destacada con la palabra "BORRADOR"** en todo PDF de Reporte Diario que no haya sido visado formalmente por Operaciones.
    2. Se discutirá en la reunión vespertina si se complementa con una restricción dura de descarga directa para mandantes externos.

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Fecha Límite / Hito | Estado |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Monitoreo Matutino de Plataforma:** Verificar que la consola web y la PWA operen con absoluta estabilidad durante la mañana del 05-Nov. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 11:00 | 🔄 En Ejecución |
| **2** | **Pruebas Integrales Estructura Comercial:** Ejecutar 4 pruebas de punta a punta en ambiente `DEV` junto a Yiara Mendoza y Jonathan para validar cotización, requerimiento, asignación, PWA, ITS y EDP. | Sergio Gajardo, Yiara Mendoza, Jonathan | LeanGlobal / GSP | 05-Nov-2026 | ⏳ Pendiente |
| **3** | **Lógica de Asignación por Fechas en Torre PMO:** Ajustar la resolución del operador en la tarjeta PMO (`ControlOperativoVivo.vue` / `Torre.vue`) según los rangos de fecha de `turnos_operadores` (Caso Besalco / Mario Concha). | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **4** | **Captura de Llegada a Planta en Retorno:** Investigar y corregir en telemetría/viajes la omisión del registro de hora de llegada a planta en el viaje de regreso (Caso Gerald Bartú). | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **5** | **Formato Horas en `HH:MM`:** Adaptar la visualización de tiempos a formato de horas y minutos en interfaces operativas e informes técnicos a petición de Yiara Mendoza. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **6** | **Restricción de Resumen ITS para Secretarías:** Ocultar el resumen ejecutivo de costos a rol `SECRETARIA`, habilitar guardado y firma FES con PIN de 4 dígitos y despacho de correo a Yiara. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **7** | **Corrección Informe Técnico Ferrocarriles (FEPASA):** Priorizar hora validada de operaciones, mostrar término del viaje de retorno y sumar reactivamente inserciones manuales. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **8** | **Comentarios Diarios para RRHH:** Habilitar campo de comentarios del día en la parte inferior de las tarjetas PMO para seguimiento operativo y laboral por parte de Tesalia Malatesta. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **9** | **Revisión y Seguimiento Contrato Royal:** Revisar el primer contrato de arriendo de Royal Rental enviado al cliente y consultar con Wilson su estado de formalización. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **10** | **Automatización Notificaciones Visita a Terreno:** Implementar despacho automático de correo con enlace al informe PDF de la visita técnica a vendedor, operaciones y gerencia. | Sergio Gajardo | LeanGlobal | 05-Nov-2026 | ⏳ Pendiente |
| **11** | **Regulación Horas Mínimas en Servicios Fijos:** Diseñar propuesta de 6 horas por defecto y edición en validación de operaciones para definir en la sesión de la tarde. | Sergio Gajardo, Jorge Ponce | LeanGlobal / GSP | 05-Nov-2026 (Tarde) | ⏳ En Definición |
| **12** | **Tratamiento Servicios Internos:** Estructurar flujo simplificado para servicios internos sin reporte obligatorio ni ITS formal para resolver en la sesión de la tarde. | Sergio Gajardo, Jorge Ponce | LeanGlobal / GSP | 05-Nov-2026 (Tarde) | ⏳ En Definición |
| **13** | **Sello de Borrador en Reportes:** Definir e implementar marca de agua de borrador o bloqueo de descarga para reportes diarios no aprobados por Operaciones. | Sergio Gajardo, Jorge Ponce | LeanGlobal / GSP | 05-Nov-2026 (Tarde) | ⏳ En Definición |

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza

*   **Fecha y Hora Programada:** Jueves 05 de Noviembre de 2026, jornada de la tarde (posterior al almuerzo).
*   **Participantes Convocados:** Jorge Ponce (`Grúas San Pablo`), Sergio Gajardo (`LeanGlobal`) y Yiara Mendoza (`Grúas San Pablo`).
*   **Foco Principal de la Sesión:** Cierre y ratificación de las decisiones pendientes (horas mínimas en servicios fijos, tratamiento documental de servicios internos y marca de agua en reportes), junto a la coordinación de las 4 pruebas integrales E2E de la nueva estructura comercial.
