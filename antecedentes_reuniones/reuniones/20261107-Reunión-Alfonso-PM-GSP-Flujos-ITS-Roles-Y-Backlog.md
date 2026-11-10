# 📝 Minuta de Reunión: Revisión de Proyectos, Control de Alcance, Flujos Aprobatorios ITS y Roles

**Fecha:** 07 de Noviembre de 2026  
**Hora:** 16:00 CLT (GMT-03:00)  
**Proyecto:** Plataforma de Gestión Operativa, Comercial y Financiera — Grúas San Pablo (GSP)  
**Participantes Asistentes:**  
*   **Alfonso Porperrello** (Product Manager / Key User — Grúas San Pablo — `alfonsoporperello@gmail.com`)  
*   **Sergio Gajardo** (Director de Proyecto / Arquitecto Senior — LeanGlobal — `sgajardoc@gmail.com`)  

**Stakeholders / Comité Mencionados:**  
*   **Jorge Ponce** (Gerente General / Operaciones — Grúas San Pablo)  
*   **Yiara Mendoza** (Analista de Control de Gestión / PMO — Grúas San Pablo)  
*   **Maritza** (Jefa de Contabilidad y Finanzas — Grúas San Pablo)  
*   **José Soto** (Operador de Grúa Telescópica 70 Ton — Grúas San Pablo)  
*   **Alfonso Maldonado** (Rigger Certificado — Grúas San Pablo)  
*   **Franz Sandoval** (Administrador de Contrato — Mandante Royal Rental / Obra Salfa Recabarren)  

**Enlaces y Registros Oficiales:**  
*   📄 [Transcripción Oficial de Google Docs](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?usp=drive_web&tab=t.z6wscd4dn9lm)

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Sesión de trabajo y alineación ejecutiva entre el nuevo Product Manager de la contraparte (**Alfonso Porperrello**) y la Dirección de Proyecto de LeanGlobal (**Sergio Gajardo**). La reunión consolidó la metodología de gobernanza de producto, el control estricto del alcance comprometido y la definición de soluciones para optimizar la experiencia de usuario y la cuadratura operativa del sistema:

1. **Gobernanza de Producto y Centralización en Backlog:** Adopción de una metodología estricta donde todo requerimiento, incidencia y mejora debe canalizarse mediante tickets en el backlog oficial de la plataforma, evitando dispersión por canales informales. Se acordó dotar al módulo de backlog de soporte para carga de evidencias gráficas (imágenes).
2. **Control de Alcance y Blindaje de Estabilización:** Ratificación del alcance original pactado con la Gerencia General (Jorge Ponce). Sergio Gajardo enfatizó la necesidad de no abrir ciclos infinitos de desarrollo no planificado, mencionando el caso de requerimientos contables incorporados tardíamente sin la contraparte funcional (Maritza).
3. **Resolución Crítica de Firma de Contratos de Arriendo:** Se abordó el incidente que impedía a clientes (caso Royal Rental / Salfa Recabarren) abrir el enlace de firma digital por un error de token `HTTP 404`, confirmando su solución técnica y disponibilidad inmediata.
4. **Simplificación del Flujo de Aprobación de ITS (Paso 2 y Paso 3):** Determinación de que los cargos directivos (Jefe de Operaciones y Jefe de Contabilidad) no deben enfrentar formularios editables ni recalcular datos; su interfaz debe ser un visor de PDF oficial con dos botones deterministas: *Aprobar (con PIN FES)* o *Rechazar / Devolver con observaciones*. La edición queda reservada exclusivamente a Yiara Mendoza hasta el cierre.
5. **Configuración de Roles RBAC y Seguridad:** Ratificación del enrutamiento de flujos basado en roles del sistema y no en correos individuales. Sergio Gajardo remitirá la matriz técnica de permisos para que Alfonso configure los perfiles desde el mantenedor.
6. **Inclusión de Viáticos para Personal RER y Riggers:** Detección de una omisión en la liquidación de viáticos de alimentación en el ITS (Caso José Soto y Alfonso Maldonado), donde la exclusión de tarifa por hora del rol RER afectó indebidamente el viático de alimentación del acompañante.
7. **Pausa Estratégica en Módulo Combustible y Exportación Excel:** Revisión de inconsistencias en la imputación de combustible en vehículos complementarios y duplicidad de horas a las 18:00 en exportaciones Excel, acordando pausar temporalmente su tratamiento para priorizar el cierre del ciclo de facturación.

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

| Categoría | Decisión | Estado |
| :--- | :--- | :---: |
| **Gobernanza / Backlog** | Centralización de todos los requerimientos e incidencias en tickets del backlog con habilitación de adjuntos/imágenes. | ✅ **Acordada (En Firme)** |
| **Control Gestión / ITS** | Restricción total de edición en ITS para Jefatura de Operaciones y Contabilidad; visualización exclusiva de PDF y botones Aprobar/Devolver. | ✅ **Acordada (En Firme)** |
| **Control Gestión / ITS** | Edición y formulación económica del ITS reservada exclusivamente a Yiara Mendoza (Analista PMO). | ✅ **Acordada (En Firme)** |
| **Contratos / Legal** | Normalización de token de firma pública para contratos de arriendo (Caso Royal `RYL-2611-00001`). | ✅ **Acordada (Resuelto en Prod)** |
| **Costos / Viáticos** | Inclusión obligatoria de viáticos de alimentación para tripulantes con rol RER / Rigger en el ITS. | ✅ **Acordada (En Firme)** |
| **Seguridad / RBAC** | Enrutamiento de flujos por rol funcional; entrega de matriz de roles a Alfonso para mantenedor de usuarios. | ✅ **Acordada (En Firme)** |
| **Flota / Combustible** | Imputación de combustible a equipos secundarios/complementarios por OT. | ⏳ **Pausado Temporalmente** |
| **BI / Reportes** | Corrección de marca horaria 18:00 duplicada en exportación Excel de hitos de servicio. | ⏳ **Pausado Temporalmente** |

---

### 2.1. Metodología de Trabajo y Centralización en Backlog
*   **Timestamp:** [[00:05:24]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.z6wscd4dn9lm#heading=h.m09eeq3oibe2) — [[00:07:19]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.z6wscd4dn9lm#heading=h.m0vdgmy03ajy)
*   **Decisión / Regla de Negocio:**
    1. Alfonso Porperrello establece que toda solicitud operativa o reporte de error debe canalizarse formalmente mediante el módulo de *Backlog* de la plataforma.
    2. Para facilitar la carga de evidencia técnica sin depender de correos paralelos, la plataforma debe permitir que los usuarios adjunten capturas de pantalla e imágenes directamente en cada ticket de requerimiento.
    3. Se ratifica la vigencia del alcance contractual pactado con Jorge Ponce, evitando desviaciones que retrasen el hito de entrega final de la etapa de estabilización.
*   **Impacto en Plataforma / Arquitectura (`SPEC-071` / Backlog):**
    - Habilitación de componente de carga de imágenes en el formulario de creación/edición de tickets en `MantenedorBacklog.vue`, asociando el archivo a `tcfg_backlog` o `tged_documentos`.

### 2.2. Flujo Simplificado de Aprobación de ITS para Jefaturas
*   **Timestamp:** [[00:10:59]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.3rbcomtzqz09) — [[00:11:57]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.akkk5fdbck4g) — [[00:16:49]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.pu5e5anxelpj)
*   **Decisión / Regla de Negocio:**
    1. Actualmente, cuando el Jefe de Operaciones (Paso 2) o el Jefe de Contabilidad (Paso 3) abren el ITS para firmar, se les presenta el formulario interactivo completo con inputs de jornadas y costos, lo que induce a confusiones y alteraciones accidentales de datos calculados.
    2. Se acuerda implementar un **Modo de Revisión Ejecutiva**:
       - Si el usuario que ingresa tiene rol aprobador de Paso 2 o Paso 3 y el ITS ya fue elaborado por Yiara (`estado_its !== 'BORRADOR'`), el modal muestra directamente el **Visor de PDF oficial a pantalla completa**.
       - La interfaz ofrece únicamente dos botones principales: **Aprobar / Firmar FES** (solicita PIN OTP y estampa) y **Rechazar / Devolver** (solicita observaciones obligatorias y devuelve a estado `EN_CORRECCION` para Yiara).
       - Solo Yiara Mendoza puede editar valores de jornadas, costos y tarifas.
*   **Impacto en Plataforma / Arquitectura (`SPEC-047` / `SPEC-078`):**
    - Ajuste en `ModalITS.vue` y `ItsTransicionView.vue` para condicionar la renderización según `pasoPendienteActual.orden > 1` y rol del usuario.

### 2.3. Rectificación de Viáticos de Alimentación para Personal RER / Rigger
*   **Timestamp:** [[00:19:09]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.vx1vmbat7231) — [[00:21:53]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.reu3b3adn3vv)
*   **Decisión / Regla de Negocio:**
    1. En el análisis del ITS Caso N° 06 (Operador José Soto y Rigger Alfonso Maldonado), la sección de costos solo calculó y liquidó el viático del operador principal, omitiendo al rigger/acompañante.
    2. La regla comercial estipula que si bien el rol RER/Rigger no cobra tarifa de hora de grúa si está paquetizado o tarifado en otra línea, **sí genera derecho a viático de alimentación** cuando la jornada supera el umbral horario estipulado (más de 6 hrs efectivas en terreno o jornada completa).
*   **Impacto en Plataforma / Arquitectura (`SPEC-078` / `tarifasOperadorService.js`):**
    - Revisión del método `construirPropuestaPersonalDiaria` en `itsController.js` y `tarifasOperadorService.js` para asegurar que el array de personas para viáticos incluya de forma irrestricta a operadores y riggers registrados en los reports diarios o log de desplazamientos.

### 2.4. Matriz de Roles y Configuración RBAC
*   **Timestamp:** [[00:11:57]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.akkk5fdbck4g) — [[00:13:58]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.ei4fdvb6a0u)
*   **Decisión / Regla de Negocio:**
    1. Se reitera que ninguna lógica de permisos ni derivación de correos debe estar "hardcodeada" a correos electrónicos específicos, sino asociada a roles dinámicos (`GSP_ADMIN`, `GSP_OPERACIONES`, `GSP_CONTABILIDAD`, `GSP_COMERCIAL`, `GSP_SECRETARIA`).
    2. Sergio Gajardo enviará a Alfonso el documento canónico de especificación de roles y permisos para que Alfonso efectúe las asignaciones correspondientes a través del Mantenedor de Usuarios de la plataforma.
*   **Impacto en Plataforma / Arquitectura (`SPEC-040` / RBAC):**
    - Verificación del `MantenedorUsuarios.vue` y `tsec_user_roles` para asegurar autonomía de administración por parte de Alfonso.

### 2.5. Gestión de Combustible y Exportación Excel (Pausado)
*   **Timestamp:** [[00:22:56]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.q0lokb3qi4vu) — [[00:26:35]](https://docs.google.com/document/d/1Lc0pNuWeJ90cKvY0z2fCtneNag0Yl0jghYLMG7IFYe8/edit?tab=t.6rf3kqm08qb3)
*   **Decisión / Regla de Negocio:**
    1. Se identificó que las cargas de combustible de camiones complementarios de traslado (cama baja) se asignan solo a la máquina principal y no quedan vinculadas a la OT correspondiente.
    2. Asimismo, la exportación de datos a Excel presenta hitos con hora duplicada a las 18:00 hrs.
    3. De común acuerdo, se resolvió pausar temporalmente este requerimiento para enfocar los recursos en la estabilidad de liquidación y facturación.
*   **Impacto en Plataforma / Arquitectura:**
    - Registro en backlog como hito posterior a la estabilización.

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Plazo / Hito | Estado |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | **Verificación Enlace Contrato Royal:** Enviar enlace operativo de firma a Alfonso para comunicación a área comercial. | Sergio Gajardo | LeanGlobal | Inmediato (07-Nov) | ✅ **Completado** |
| 2 | **Restricción de Edición y Modo Revisión en ITS:** Configurar vista PDF exclusiva para Paso 2 (Operaciones) y Paso 3 (Contabilidad) con botones Aprobar/Rechazar. | Sergio Gajardo | LeanGlobal | 1 a 1.5 horas (07-Nov) | ⏳ **En Curso** |
| 3 | **Corrección de Viáticos RER / Rigger en ITS:** Ajustar cálculo para asegurar que personal secundario reciba viático de alimentación en Sección 4. | Sergio Gajardo | LeanGlobal | 07-Nov | ⏳ **Pendiente** |
| 4 | **Subida de Imágenes en Backlog:** Habilitar componente para adjuntar capturas gráficas en tickets de requerimiento. | Sergio Gajardo | LeanGlobal | 08-Nov | ⏳ **Pendiente** |
| 5 | **Entrega de Matriz de Roles y Permisos:** Remitir documentación técnica RBAC a Alfonso para parametrización en mantenedor. | Sergio Gajardo | LeanGlobal | 08-Nov | ⏳ **Pendiente** |
| 6 | **Configuración de Permisos en Mantenedor:** Revisar roles de usuarios clave y corregir asignaciones en la plataforma. | Alfonso Porperrello | Grúas San Pablo | Semana del 10-Nov | ⏳ **Pendiente** |
| 7 | **Revisión Módulo Combustible y Excel:** Retomar análisis de combustible multi-equipo y marcas horarias en Excel tras estabilización. | Sergio / Alfonso | Comité Conjunto | Post-Estabilización | 💤 **Pausado** |

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza
*   **Fecha Tentativa:** Lunes 10 de Noviembre de 2026.
*   **Participantes:** Sergio Gajardo, Alfonso Porperrello, Jorge Ponce (opcional).
*   **Objetivo:** Verificación del flujo de firma simplificado de ITS en producción y revisión de tickets ingresados en el backlog con soporte de imágenes.
