# 📝 Minuta de Reunión: Revisión de Matriz RBAC (Separación Control de Gestión vs. Secretaría), Acreditaciones, Calendario de Flota y Validación de Filtros Kanban

**Fecha:** 03 de Noviembre de 2026  
**Hora:** 11:00 - 11:35 CLT (GMT-03:00)  
**Proyecto:** Plataforma de Gestión Operativa, Comercial y Financiera - Grúas San Pablo (GSP)  
**Participantes Asistentes:**  
*   **Jorge Ponce** (Gerente General / Dirección de Operaciones - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Director de Proyecto / Arquitecto Senior - LeanGlobal - `sgajardoc@gmail.com`)  

**Stakeholders / Comité de Escalamiento Mencionados:**  
*   **Omar Ghiselini** (Gerente General / Directorio - Grúas San Pablo - `omar.ghiselini@arriendosanpablo.cl`) — Revisión ejecutiva y aprobación final de la Matriz de Permisos RBAC.  
*   **Yiara Mendoza** (Control de Gestión y Análisis de Operaciones - Grúas San Pablo - `ymendoza@arriendosanpablo.cl`) — Separación formal de su perfil estratégico de Control de Gestión respecto del rol de Secretaría.  
*   **Dayana** (Prevencionista de Riesgos / Acreditación Personal - Grúas San Pablo) — Gestión de carga y descarga de documentación en el módulo de Acreditación Personal.  
*   **Alfonso** (Encargado de Documentación de Flota - Grúas San Pablo) — Actualización y mantención documental de equipos.  

**Enlaces y Registros Oficiales:**  
*   **Transcripción Oficial de Google Docs:** [Notas y Transcripción de la Sesión (Google Docs)](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw)  

---

## 🎯 1. Resumen Ejecutivo y Contexto 360°

Sesión de alineación operativa y gobernanza de accesos entre **Jorge Ponce** y **Sergio Gajardo** orientada a estructurar la puesta en marcha gradual del modelo **RBAC (Control de Acceso Basado en Roles)**, validar las herramientas de filtrado de alta densidad en la Torre de Control y priorizar ajustes visuales en la planificación de flota. Los ejes estructurales abordados fueron:

1. **Módulo de Acreditación (Personal y Equipos) y Configuración Personalizable del Panel de Control por Rol:** Revisión de responsabilidades operativas de **Dayana** (documentación de personas) y **Alfonso** (documentación de equipos), junto con la definición de que el panel de control posee una configuración predeterminada parametrizable según el rol de cada usuario.
2. **Separación Estructural de Roles: Control de Gestión (Yiara) vs. Secretaría:** Definición de negocio que independiza el rol de **Control de Gestión y Análisis de Operaciones (`GSP_PROG` / `CONTROL_GESTION`)** respecto del rol administrativo de **Secretaría (`SECRETARIA`)**, dado el alcance estratégico y analítico superior de las funciones de Yiara.
3. **Plan de Implementación Gradual RBAC y Confirmación de Visibilidad Comercial:** Compromiso de actualización y entrega del documento de Matriz de Permisos RBAC para revisión conjunta entre **Jorge Ponce** y **Omar Ghiselini**, iniciando el despliegue gradual por los roles operativos en horario de mediodía, y ratificando que el aislamiento de cartera por ejecutivo comercial (`COMERCIAL`) ya se encuentra 100% activo en producción.
4. **Priorización de Ajustes en Botón "Abrir OT", Calendario de Flota (Gantt / Fleet Rent) y Validación de Filtros Kanban:** Identificación y priorización del ajuste en la extensión continua de barras multi-día en el Calendario de Flota al filtrar grúas telescópicas (caso **Inarco** del día 1 al 30), revisión del botón **"Abrir OT"** en gestión de proyectos, y validación exitosa en firme de los nuevos filtros del Tablero Kanban (Operador, Rigger, Equipo, Cliente, Comercial y selector dual `Fecha de Ejecución` vs. `Fecha de Venta`).

---

## 📌 2. Acuerdos, Decisiones de Negocio y Reglas de Arquitectura

### Matriz de Estado de Decisiones

| Categoría | Decisión / Regla | Estado |
| :--- | :--- | :---: |
| **Acreditación Personal y Flota** | Asignación de carga/descarga de documentos de personal a **Dayana** y actualización documental de equipos a **Alfonso**. | ✅ **En Firme** |
| **Separación de Roles RBAC** | Separar en dos perfiles independientes el rol estratégico de **Control de Gestión y Análisis de Operaciones (Yiara)** y el rol de **Secretaría**. | ✅ **En Firme** |
| **Aislamiento de Cartera Comercial** | Cada ejecutivo comercial (`COMERCIAL`) visualiza exclusivamente sus propios negocios y cotizaciones. | ✅ **En Firme (Activo)** |
| **Validación de Filtros Kanban** | Aprobación de los filtros multicriterio en Kanban y la distinción semántica entre `Fecha de Ejecución` (operativa) y `Fecha de Venta` (creación de cotización). | ✅ **En Firme (Validado)** |
| **Matriz Global RBAC e Implementación Gradual** | Actualizar el PDF/documento de la Matriz RBAC y someterlo a revisión conjunta de **Jorge Ponce** y **Omar Ghiselini**, aplicando primero los roles operativos. | ⏳ **Sujeto a Revisión con Omar** |

---

### 2.1. Módulo de Acreditación (Dayana y Alfonso) y Separación de Roles: Control de Gestión vs. Secretaría
* **Marcas de Tiempo Trazables:** [[00:18:54]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.5bzy02jjhrxc) | [[00:20:09]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.b673x86lpnll) | [[00:21:32]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.x07i7rcbaeml)
* **Decisión / Regla de Negocio:**
  1. **Acreditación de Personal y Flota:** Se valida el flujo del módulo de acreditación personal para la carga y descarga de documentos administrados por **Dayana**, mientras que la actualización documental de los equipos/flota queda a cargo de **Alfonso**.
  2. **Panel de Control Personalizable por Rol:** La consola cuenta con una vista y configuración predeterminada por perfil, pero parametrizable y adaptable a las funciones específicas de cada rol.
  3. **Desacople Estricto entre Control de Gestión (`Yiara`) y Secretaría:** No se deben fusionar en un mismo perfil los permisos de **Yiara Mendoza** con los de **Secretaría**. El perfil de Yiara corresponde a **Control de Gestión y Análisis de Operaciones** (con alcance estratégico sobre la Matriz PMO / Control en Vivo, auditoría de Reports Diarios, costos operacionales en ITS y prefacturación EDP), superior y distinto a las labores administrativas de Secretaría.
* **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - En el catálogo RBAC (`tsec_roles`, `RbacMatrixTable.vue` y documento formal `Propuesta_Estructura_Permisos_RBAC_GSP.pdf`), separar explícitamente:
    - **`GSP_PROG` (Control de Gestión & Análisis de Operaciones — Yiara):** Acceso a Torre de Control (Kanban, Matriz PMO / Control en Vivo, Perspectiva Contabilidad / Prefactura EDP), validación FES de Reports Diarios, elaboración de ITS y 1° Firma FES de EDP.
    - **`SECRETARIA` (Secretaría Operativa / Administrativa):** Acceso acotado a apoyo administrativo, consulta de clientes/agenda, recepción documental e ingreso preliminar sin atribuciones de visación estratégica de costos ni liberación de prefacturas EDP.
    - **`GSP_PREV` / Documentación Flota:** Habilitar a **Dayana** en Acreditación Personal / Dossier y a **Alfonso** en la carga/actualización de certificados de equipos (`Vista360.vue` / `Documentos.vue`).

### 2.2. Plan de Implementación Gradual de RBAC y Confirmación de Privacidad Comercial
* **Marcas de Tiempo Trazables:** [[00:21:32]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.x07i7rcbaeml) | [[00:22:41]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.xwlts74wbkek)
* **Decisión / Regla de Negocio:**
  1. **Actualización y Validación con Gerencia:** **Sergio Gajardo** actualizará el documento de la Matriz de Permisos RBAC incorporando la separación de roles acordada y lo enviará a **Jorge Ponce** para su revisión conjunta con **Omar Ghiselini**.
  2. **Estrategia de Despliegue Gradual:** La activación de restricciones RBAC se ejecutará de manera progresiva, comenzando en primera instancia por los **roles operativos** (con liberación proyectada alrededor de la hora de almuerzo).
  3. **Filtro Comercial Confirmado:** Se ratifica que en producción ya está operando la regla mediante la cual cada ejecutivo con rol `COMERCIAL` visualiza exclusivamente sus propios negocios (`id_usuario_creacion = id_user`).
* **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - Regenerar `Gestión/Propuesta_Estructura_Permisos_RBAC_GSP.pdf` con la separación `GSP_PROG` (Control de Gestión) vs. `SECRETARIA` y los responsables documentales (`Dayana` y `Alfonso`).
  - Aplicar en Fase 1 de despliegue RBAC el filtrado de menú y rutas de los perfiles operativos (`GSP_EJEC`, `GSP_TALLER_*`, `GSP_BODEGA`, `GSP_PREV`, `GSP_PROG`, `SECRETARIA`).

### 2.3. Revisión de Botón "Abrir OT" y Corrección del Calendario de Flota (Gantt / Fleet Rent)
* **Marcas de Tiempo Trazables:** [[00:23:27]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.wgw94pmtns9q) | [[00:24:17]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.ip4wevu8ivpl)
* **Decisión / Regla de Negocio:**
  1. **Revisión de Botón "Abrir OT":** Verificar el comportamiento y acceso del botón **"Abrir OT"** dentro del módulo de gestión de proyectos / Torre de Control para asegurar su apertura fluida.
  2. **Continuidad Multi-Día en Calendario de Flota (Perspectiva Temporal / Gantt):** Corregir el defecto visual en el calendario de flota al filtrar por **Grúas Telescópicas**, donde servicios de larga duración o mensuales (ej. **Constructora Inarco**, programado del día 1 al 30 del mes) se dibujan únicamente en el primer día en lugar de proyectar la barra continua desde la fecha de inicio hasta la fecha de término.
* **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - En `Torre.vue` (Perspectiva Temporal / Gantt de Flota) y su mapeo de fechas de reserva de equipos (`tpry_rel_equipo`, `crm_v1.lineas_servicio`, `fecha_hora_inicio` / `fecha_hora_termino` y `duracion_plan`), asegurar que el cálculo del `endDate` del bloque Gantt tome el rango completo contratado (`fecha_fin_plan` o `fecha_inicio + duracion_plan`), renderizando la ocupación continua durante todos los días del servicio.

### 2.4. Validación en Firme de Filtros Multicriterio en el Tablero Kanban (`REQ-1096`)
* **Marcas de Tiempo Trazables:** [[00:25:05]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.lnwe3s4zsubm) | [[00:25:51]](https://docs.google.com/document/d/1m6k-inrZ30W-SHNc9w9vR1JnCgluSCRDJxwdREVcCkI/edit?tab=t.man5sy8nl9tw#heading=h.eadqrzohe9xd)
* **Decisión / Regla de Negocio:**
  - **Jorge Ponce** y **Sergio Gajardo** evalúan y validan formalmente la barra de filtros del Tablero Kanban (`⚡ Kanban + Filtros` y `🗄️ Cardex 3D`), que permite filtrar en tiempo real por **Operador**, **Rigger**, **Equipo / Patente**, **Cliente**, **Ejecutivo Comercial** y **Rango de Fechas (Inicio y Término)**.
  - Se ratifica la distinción conceptual y práctica de ambos ejes temporales:
    - **`Fecha de Ejecución`:** Fecha operativa programada o real del servicio en obra.
    - **`Fecha de Venta`:** Fecha de creación/emisión de la cotización comercial.
* **Impacto en Plataforma / Arquitectura (Spec-Driven):**
  - Funcionalidad `REQ-1096` (`SPEC-016 v4.1.0`) validada satisfactoriamente por Dirección de Operaciones sin requerir cambios en su lógica de negocio.

---

## 🤝 3. Compromisos y Próximos Pasos (Plan de Acción / TODOs)

| # | Tarea / Entregable | Responsable | Organización | Fecha Límite / Hito | Estado |
| :- | :--- | :--- | :--- | :---: | :---: |
| **1** | **Actualizar Matriz RBAC separando `Control de Gestión` (Yiara) de `Secretaría` e incluyendo alcances de `Dayana` (Acreditación Personal) y `Alfonso` (Documentación Equipos):** Ajustar el documento PDF `Propuesta_Estructura_Permisos_RBAC_GSP.pdf` y enviarlo a Jorge Ponce para revisión con Omar Ghiselini. | **Sergio Gajardo** | LeanGlobal | 2026-11-03 (Mediodía) | ⏳ En Ejecución |
| **2** | **Revisar y validar Matriz de Permisos RBAC con Gerencia General (Omar Ghiselini):** Evaluar la matriz actualizada junto a Omar para autorizar el cierre de permisos por perfil. | **Jorge Ponce / Omar Ghiselini** | Grúas San Pablo | 2026-11-03 | ⏳ Pendiente |
| **3** | **Implementación gradual de RBAC (Fase 1 — Roles Operativos):** Aplicar en la plataforma la configuración de vistas y accesos comenzando por los perfiles operativos alrededor de la hora de almuerzo (`REQ-1093`). | **Sergio Gajardo** | LeanGlobal | 2026-11-03 (Almuerzo) | ⏳ Pendiente |
| **4** | **Corregir extensión de fechas inicio–término en Calendario de Flota (Gantt / Fleet Rent):** Resolver el cálculo de rango de fechas al filtrar grúas telescópicas para que servicios multi-día o mensuales (ej. Inarco del 1 al 30) se visualicen como una barra continua durante todo el período (`REQ-1097`). | **Sergio Gajardo** | LeanGlobal | 2026-11-03 (Prioritario) | ⏳ Pendiente |
| **5** | **Revisar botón "Abrir OT" en el módulo de Gestión de Proyectos / Torre de Control:** Auditar y corregir la acción del botón "Abrir OT" para garantizar su correcto funcionamiento operativo (`REQ-1098`). | **Sergio Gajardo** | LeanGlobal | 2026-11-03 | ⏳ Pendiente |

---

## 📅 4. Siguiente Reunión e Hito de Gobernanza

* **Fecha y Hora Propuesta:** Martes 03 de Noviembre de 2026 (Tarde / Post-almuerzo).
* **Participantes Convocados:** **Jorge Ponce**, **Omar Ghiselini** y **Sergio Gajardo**.
* **Foco Principal de la Sesión:**
  1. Aprobación definitiva de la Matriz RBAC revisada con **Omar Ghiselini**.
  2. Verificación en vivo de la Fase 1 de roles operativos desplegada al mediodía.
  3. Validación visual del **Calendario de Flota (Gantt)** con el servicio mensual de **Constructora Inarco** desplegado del día 1 al 30 y prueba del botón **"Abrir OT"**.
