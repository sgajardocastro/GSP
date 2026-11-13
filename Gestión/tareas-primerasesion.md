# 📋 Registro de Tareas y Ajustes — Primera Sesión Marcha Blanca (Comercial Temuco)

**Fecha:** 29 de Septiembre, 2026  
**Contexto:** Sesión en vivo de Marcha Blanca Comercial (GSP - Temuco). Recopilación de observaciones, incidentes y requerimientos para despliegue consolidado.  
**Estado:** En Levantamiento y Diagnóstico (Modo Solo Lectura).

---

## 📌 Resumen de Puntos y Requerimientos

| # | Requerimiento / Observación | Área / Módulo | Prioridad | Estado |
|---|---|---|---|---|
| **0** | **Incidente:** Enlace de Visita a Terreno inválido o expirado | Backend / Notificaciones | 🔴 Alta | ✅ Resuelta & Desplegada (v1.0.60) |
| **1** | **Observación #1:** Estructurador no permite desplazarse a la derecha en laptops de 13" | Frontend CRM / Preventa | 🔴 Alta | ✅ Resuelta & Desplegada (v1.0.60) |
| **2** | **Observación #2:** Falta opción "Ida y Vuelta" en traslados/fletes | Frontend / Matriz Cobro | 🟡 Media | ✅ Implementada Local (Sin Desplegar) |
| **3** | **Observación #3:** Servicios de 1 día: No aplica panel de Proyección de Costos de Pensiones (EDP) | Frontend / EDP | 🟡 Media | ✅ Implementada Local (Sin Desplegar) |
| **4** | **Observación #4:** Restricción RBAC: Comerciales solo ven sus cotizaciones, gestión ve todo | Seguridad / RBAC | 🔴 Alta | ✅ Implementada Local (Sin Desplegar) |
| **5** | **Observación #5:** Requerimiento de Viaje: No está registrando/persistiendo Fecha y Hora | Backend / PWA Viajes | 🟡 Media | Pendiente detalle |
| **6** | **Observación #6:** Grupo de destinatarios definitivo para entrega formal de cotizaciones | Backend / Email Service | 🟢 Normal | Pendiente detalle |
| **7** | **Observación #7:** Registro de Oportunidad Light (captura rápida de prospectos) | Frontend CRM | 🟡 Media | Pendiente detalle |

---

## 🛠️ Detalle de Tareas

### Tarea #0: Incidente — Enlace de Asignación de Visita Inválido por Re-solicitud (Idempotencia de Token)

* **Incidente Reportado:** Al pinchar el enlace `https://servidor.leanglobal.cl/lg-gsp-dev/asignar-visita/faac5ee2-4c87-4753-a814-03d9537071b7`, el sistema muestra: *"Enlace inválido o expirado. El enlace de asignación no es válido o ya fue utilizado."*
* **Diagnóstico de Causa Raíz:**
  1. En `sch_leangsp.tnot_notification_log`, a las **12:09 CLST** (15:09 UTC) se generó la primera solicitud de visita para el proyecto 100 con el token `faac5ee2-4c87-4753-a814-03d9537071b7`.
  2. A las **12:22 CLST** (15:22 UTC), 13 minutos después, se modificaron datos de la cotización (se cambió el nombre de obra a *"pocuro"* y dirección a *"camino labranza km 3"*) y se volvió a presionar *"Solicitar Asignación de Visita"*.
  3. `visitaTerrenoController.solicitarVisita` generó un nuevo token `266dedc2-c8c2-4ee4-8748-d32e364f4893` y ejecutó `UPDATE sch_leangsp.tpry_proyecto SET token_visita = $1`, sobreescribiendo el valor escalar.
  4. El enlace abierto por el usuario era el del **primer correo/WhatsApp**. Al consultar `WHERE token_visita = 'faac5ee2...'`, la base de datos devolvió 0 filas (404 Not Found).
  5. Se verificó que el segundo enlace (`266dedc2-...`) está 100% activo y responde `HTTP 200 OK`.
* **Solución Técnica Planificada:**
  1. **Idempotencia de Token en Backend (`visitaTerrenoController.js`):**  
     Si `estado_solicitud_visita === 'PENDIENTE_ASIGNACION'` y ya existe un `token_visita` activo en `tpry_proyecto`, **reutilizar dicho token** en lugar de generar un nuevo UUID. Así, si el comercial actualiza la dirección o reenvía la notificación antes de que el coordinador asigne, los enlaces anteriores en el correo y WhatsApp del coordinador continúan funcionando sin romperse.
  2. **Historial de Tokens Válidos:** Guardar un array `tokens_historicos` en `json_field` para permitir que tokens anteriores sigan resolviendo el proyecto mientras el estado sea `PENDIENTE_ASIGNACION`.
  3. **Feedback Frontend (`GestorOportunidades.vue`):** Deshabilitar o etiquetar como *"Reenviar Notificación"* si ya existe una solicitud en curso.

---

### Tarea #1: Observación #1 — Visualización y Desplazamiento Horizontal del Estructurador en Laptops de 13"

* **Problema Reportado:** En equipos portátiles de 13 pulgadas (ej. usuario Natalia), la tabla del Estructurador de Servicios se corta hacia la derecha y no permite desplazarse ni ver las columnas de Subtotal o Acciones, estropeando en ocasiones la vista de Preventa. En pantallas de 15" no ocurre.
* **Diagnóstico Técnico de Causa Raíz:**
  1. **Viewport efectivo en 13":** Un monitor de 13" suele operar a 1920x1080 con escala Windows de 125% o 150%, dejando un ancho CSS disponible de ~1000px a 1280px.
  2. **Columna Estructurador asfixiada:** En `GestorOportunidades.vue` (L3126), la cuadrícula es `grid-cols-1 lg:grid-cols-[1.5fr_3.5fr]`. Al restar el menú lateral de la app (~240px) y el panel izquierdo del cliente (30%), el contenedor derecho del Estructurador solo recibe entre **600px y 700px** de ancho.
  3. **Ancho Mínimo de la Tabla (1130px):** Las 8 columnas del Estructurador tienen `min-w` acumulado de 1130px:
     - Categoría (210px), Subcategoría (170px), Descripción (150px con `w-full`), Unidad (150px), Cantidades (170px), Valor Unit (110px), Subtotal (120px), Botón (40px).
     - La clase `w-full` en el `<th>` de Descripción fuerza al navegador a inflar artificialmente esa celda al 100% del contenedor.
  4. **Scrollbar Oculto (`scrollbar-hide` y `overflow-hidden`):**
     - En Preventa (L3805): `<div class="... overflow-auto scrollbar-hide">` oculta completamente la barra de scroll horizontal en Chrome/Edge en Windows. Sin trackpad de gestos o rueda horizontal, el usuario no puede mover la tabla.
     - En Operaciones Pestaña B (L349): `<div class="... overflow-hidden bg-black/20 overflow-y-auto scrollbar-hide">` tiene `overflow-hidden`, bloqueando totalmente el scroll horizontal.
* **Opciones de Solución Técnica Propuestas:**
  1. **Solución Inmediata (Scrollbar Visible + Ajuste de Anchos):**
     - Retirar `scrollbar-hide` e incorporar una barra de scroll horizontal visible y estilizada (`overflow-x-auto` con track sutil oscuro/ámbar).
     - Quitar `w-full` de la columna *Descripción / Equipo*.
     - Compactar anchos mínimos (`min-w`) de columnas secundarias (ej: Categoría a 170px, Subcategoría a 140px, Unidad a 120px, Cantidades a 140px), bajando el ancho base total a ~850px.
  2. **Solución Ergonómica Avanzada (Modo Foco / Toggle de Panel Lateral):**
     - Incorporar un botón `[◀ Minimizar Panel Cliente]` o toggle *"Modo Expandido"*.
     - Al minimizar el panel izquierdo de datos de cliente, el Estructurador toma el 100% del ancho de la pantalla (más de 1000px útiles en 13"), permitiendo a los comerciales trabajar de forma holgada sin compresión visual.
  3. **Columnas Fijas (Sticky Right):**
     - Dejar fija la columna de *Subtotal* y *Acciones* (`sticky right-0 bg-[#0a0f1e]`) para que el comercial siempre tenga a la vista el valor y botón de borrado, sin importar cuánto se desplace.

---

### Tarea #2: Observación #2 — Opción Explícita de "Ida" e "Ida/Vuelta" en Traslados y Regla de Devengado (50% Ida / 50% Vuelta)

* **Requerimiento Reportado:**
  - En el estructurador comercial y operacional, la categoría `TRASLADOS` (utilizada tanto en servicios normalizados Casos 1 a 4 como en ítems adicionales manuales) debe permitir dos opciones de unidad de cobro: `"TRASLADO IDA"` y `"TRASLADO IDA/VUELTA"`.
  - Comportamiento operativo:
    - Cuando sea `"TRASLADO IDA"`: al completarse el viaje de ida (registrado en el control de viajes), en *"6. REPORTES DIARIOS DE IZAJE"* se devenga el **100%** del ítem.
    - Cuando sea `"TRASLADO IDA/VUELTA"`: al completarse el viaje de ida hacia faena, en *"6. REPORTES DIARIOS DE IZAJE"* se debe imputar y reflejar el **50% del devengado** de ese ítem, quedando pendiente el **otro 50%** que se cargará cuando se registre y realice el viaje de retorno (desmovilización a patio/base).
* **Diagnóstico Técnico de Causa Raíz:**
  1. **Bloqueo Rígido en Estructurador:** En `GestorOportunidades.vue` (tanto en la vista de Operaciones L417-422 como en Preventa L3869-3873), el `<select>` de la columna *Unidad* tiene `:disabled="line.tipo === 'TRASLADOS'"`, forzando el valor fijo `'Traslado'`. No existe diferenciación entre ida o ida y vuelta.
  2. **Inyección en Casos Canónicos:** En `aplicarConfiguracionCaso` (L9458, L9472, L9487, L9499), los Casos 2, 3 y 4 inyectan líneas de `tipo: 'TRASLADOS'` con `unidad: 'Traslado'` invariable.
  3. **Ausencia de Cálculo de Devengado Proporcional en Sub-tab 6:** En la Sub-pestaña *"6. Reportes Diarios de Izaje"* (L2365-2436), se monitorea el estado del viaje del equipo (`tieneViajeCompletado(eq.id_equipo)`), pero no existe un desglose de las líneas de traslado que impute el 50% al arribar a faena y reserve el 50% restante para el retorno a patio (`tipo_trayecto === 'RETORNO'` en `tequ_log_desplazamiento`).
* **Solución Técnica Planificada:**
  1. **Habilitación de Opciones en Select de Unidad:**
     - En el estructurador (Preventa y Operaciones), si `line.tipo === 'TRASLADOS'`, el select de unidad se desbloquea y ofrece exactamente:
       - `<option value="TRASLADO IDA">TRASLADO IDA</option>`
       - `<option value="TRASLADO IDA/VUELTA">TRASLADO IDA/VUELTA</option>`
     - En `onTipoChange`, al seleccionar `TRASLADOS`, asignar por defecto `line.unidad = 'TRASLADO IDA/VUELTA'`.
     - En los Casos 2, 3 y 4 de `aplicarConfiguracionCaso`, inicializar con `unidad: 'TRASLADO IDA/VUELTA'`.
  2. **Motor de Cálculo de Devengado en Sub-tab 6:**
     - Identificar las líneas de traslado del proyecto (`tipo === 'TRASLADOS'`).
     - Consultar los viajes del proyecto (`viajesProyecto`):
       - *Viaje de Ida:* equipo con trayecto hacia faena completado (`estado_trayecto === 'LLEGADO'` o `fecha_llegada_faena`).
       - *Viaje de Retorno:* equipo con trayecto retorno completado (`fecha_llegada_patio` o viaje de retorno `LLEGADO`).
     - Lógica de imputación:
       - Si `unidad === 'TRASLADO IDA'`:
         - Con ida completada: **100% Devengado**.
         - Sin ida: **0% Devengado** (Pendiente de inicio de trayecto).
       - Si `unidad === 'TRASLADO IDA/VUELTA'`:
         - Con ida completada y retorno pendiente: **50% Devengado** (50% imputado a la fecha / 50% retenido hasta retorno).
         - Con retorno completado: **100% Devengado**.
         - Sin viaje: **0% Devengado**.
  3. **Visualización en "6. Reportes Diarios de Izaje":**
     - En el bloque de traslados, mostrar las tarjetas de devengado por cada ítem de flete con badges semánticos (`50% Devengado - Retorno Pendiente`, `100% Devengado - Ida y Retorno OK`, `Pendiente de Salida`), mostrando montos exactos en moneda.

---

### Tarea #3: Observación #3 — Deshabilitación Automática de Costos de Pensiones en Servicios de 1 Día

* **Requerimiento Reportado:**
  - En servicios cuya duración sea de 1 solo día, **NO aplica** el panel de *"Proyección de Costos de Pensiones (Base para EDP)"* (alojamiento, desayuno, almuerzo, cena, traslado personal en faena).
  - El panel debe deshabilitarse automáticamente con indicación clara en la interfaz y seteando los conceptos a `NA` (No Aplica).
* **Diagnóstico Técnico de Causa Raíz:**
  1. **Panel Siempre Activo:** En `GestorOportunidades.vue` (L4301-4361), el panel `🏠 Proyección de Costos de Pensiones (Base para EDP)` permanece siempre editable e interactivo, independiente de la duración o características de las faenas.
  2. **Valores por Defecto Inapropiados para 1 Día:** Actualmente se inicializa con `alojamiento_costeado = 'CLIENTE'` y `almuerzo_costeado = 'SAN_PABLO'` (L9048-9060), lo cual induce a error de imputación para servicios puntuales de una sola jornada donde el personal no pernocta ni requiere viáticos extendidos.
* **Solución Técnica Planificada:**
  1. **Propiedad Computada `esServicioUnDia`:**
     - Analizar de forma reactiva las líneas del estructurador (`lines.value`):
       - Si alguna línea tiene `unidad === 'Horas Mes Minimas'` con cantidad $\ge 1$, no es servicio de 1 día.
       - Si hay líneas con `unidad === 'Horas Diarias Minimas'`, calcular el máximo de `cantidad_dias`: si es 1 (y ninguna supera 1), es servicio de 1 día.
       - Si todas las líneas son traslados o servicios únicos de 1 día, se evalúa como servicio de 1 día.
  2. **Seteo Automático a 'NA':**
     - Crear función watcher / reactiva que, al cumplirse `esServicioUnDia === true`, configure automáticamente todos los campos de `comercial.value.pensiones` (`alojamiento_costeado`, `desayuno_costeado`, `almuerzo_costeado`, `cena_costeado`, `traslado_costeado`) en `'NA'`.
  3. **Indicador Visual y Deshabilitación de Interfaz:**
     - Envolver el panel con estilos de deshabilitado (`opacity-50 pointer-events-none select-none bg-slate-900/60`).
     - Desplegar un banner informativo destacado:
       `ℹ️ En servicios de 1 solo día, los costos de pensión y viáticos no aplican para la base de EDP (Deshabilitado automáticamente en N/A).`
     - Si el comercial incrementa la duración a más de 1 día, el panel se reactiva permitiendo selección manual.

---

### Tarea #4: Observación #4 — Restricción de Scope Comercial (RBAC), Depuración de Roles Legacy y Creación de Nuevos Roles (ADM_COM, COMERCIAL, COORD)

* **Requerimiento Reportado:**
  - En la marcha blanca comercial, los ejecutivos comerciales (ej: Natalia Ghisellini, `id_user: 56`) solo deben tener acceso y visibilidad sobre sus propios procesos comerciales y cotizaciones creadas por ellos, a través de todas las empresas.
  - Los roles de Gestión/Admin (Sergio Gajardo `id_user: 55`, Jorge Ponce `id_user: 19`, Omar Soffia `id_user: 46`) no tienen restricción y deben ver todo el tablero operacional y comercial de todas las empresas.
  - Depuración de roles: eliminar los roles residuales heredados de Transmac en `tsec_roles`, conservando únicamente los roles básicos del sistema (`id_rol = 1` [Admin], `id_rol = 3` [USR-CONSENT]) y los roles GSP (`id_rol >= 31`).
  - Creación de nuevos roles:
    - `ADM_COM`: Administrador comercial, puede ver todos los procesos comerciales de todas las empresas.
    - `COMERCIAL`: Ejecutivo comercial, puede ver solo sus procesos comerciales de todas las empresas.
    - `COORD`: Coordinador de Operaciones (ej: Richard Jara `id_user: 57`).
* **Diagnóstico Técnico de Causa Raíz:**
  1. **Roles Obsoletos en BD:** Existían 24 roles heredados de Transmac, Codelco y AMSA (`4 <= id_rol <= 27`) con 43 asignaciones históricas en `tsec_user_roles`.
  2. **Columna Física de Autoría en `tpry_proyecto`:** En PostgreSQL (`sch_leangsp.tpry_proyecto`), la columna que registra al creador de la cotización es `id_usuario_creacion` (tipo `integer`).
  3. **Consulta sin Scope en Backend:** `proyectosController.getProyectos` ejecutaba `SELECT * FROM tpry_proyecto` filtrando únicamente por `id_empresa`, sin comprobar el usuario creador, permitiendo que cualquier comercial viera el 100% de las oportunidades.
  4. **Ausencia de Roles en Sesión JWT:** `authController.js` y `authMiddleware.js` no inyectaban el array de roles del usuario en el payload del JWT ni en el request `req.user`.
* **Solución Técnica Implementada Localmente:**
  1. **Migración en Base de Datos PostgreSQL (`sch_leangsp`):**
     - Eliminadas 43 asignaciones obsoletas en `tsec_user_roles WHERE id_rol NOT IN (1, 3) AND id_rol < 31`.
     - Eliminados 24 roles legacy en `tsec_roles WHERE id_rol NOT IN (1, 3) AND id_rol < 31`.
     - Creados nuevos roles: `ADM_COM` (`id_rol: 35`), `COMERCIAL` (`id_rol: 36`), `COORD` (`id_rol: 37`).
     - Asignado rol `Admin` (`id_rol: 1`) a Sergio Gajardo (`id_user: 55`), Jorge Ponce (`id_user: 19`) y Omar Soffia (`id_user: 46`).
     - Asignado rol `COMERCIAL` (`id_rol: 36`) a Natalia Ghisellini (`id_user: 56`).
     - Asignado rol `COORD` (`id_rol: 37`) a Richard Jara (`id_user: 57`).
  2. **Inyección Dinámica de Roles en Backend:**
     - En `authController.js` (`login`, `loginPorEmail`, `loginGoogle`), se consultan los roles activos en `tsec_user_roles` y se adjunta `roles: [...]` tanto al token JWT como al objeto `safeUser`.
     - En `authMiddleware.js`, se implementó un fallback dinámico que consulta PostgreSQL si el token del request carece de la propiedad `roles`, asegurando compatibilidad total sin forzar relogueo.
  3. **Filtro de Scope Determinista en Backend (`proyectosController.js` y `proyectoModel.js`):**
     - En `proyectosController.getProyectos`:
       - Si el usuario es `Admin`, `ADM_COM`, `COORD`, rol operacional GSP o usuario privilegiado (1, 19, 46, 55): Scope Global (acceso completo a todas las oportunidades).
       - Si el usuario tiene rol `COMERCIAL` (y no posee privilegios globales): Se aplica automáticamente `scope = { solo_propios: true, id_user: req.user.id_user }`, inyectando `WHERE p.id_usuario_creacion = $id_user` en la consulta SQL.
     - En `getProyectoById`: Protección estricta contra manipulación de URL; si un `COMERCIAL` intenta consultar una cotización ajena, el backend responde `HTTP 403 Forbidden`.
  4. **Frontend Torre de Control (`Torre.vue`):**
     - Incorporado badge semántico reactivo en el header:
       - `[👤 Scope: Mis Cotizaciones]` (verde esmeralda) para usuarios comerciales restringidos.
       - `[🌐 Scope: Global (Todas las Empresas)]` (azul) para administradores y gestión comercial.
       - `[🏗️ Scope: Coordinación Operativa]` (púrpura) para coordinadores de faena.
* **Estado:** ✅ Implementada Local y en Base de Datos de Desarrollo (Doble candado de Scope y refresco dinámico de roles en Frontend). Compilación Vite exitosa (0 errores). **Sin Desplegar.**
* **Ampliación Mantenedor de Usuarios (Modal "Editar Perfil de Usuario"):**
  - **Diagnóstico:** `RbacMatrixTable.vue` y `EditUsuarioDialog.vue` conservaban la matriz estática de empresas de Transmac/Codelco (`TMAC`, `CDLC`, `AMSA`, etc.), filtrando y descartando los roles de GSP al guardar.
  - **Solución Implementada Localmente:**
    1. `RbacMatrixTable.vue`: Rediseñado íntegramente con tarjetas horizontales compactas de 1 sola línea (sin scrollbars ni alturas forzadas), presentando los 9 roles oficiales de Grúas San Pablo categorizados en 3 grupos (Gestión Comercial & Scope: `Admin`, `ADM_COM`, `COMERCIAL`, `COORD`; Operaciones & Terreno: `GSP_PROG`, `GSP_EJEC`, `GSP_APROB`, `GSP_CONTA`; Sistema & Enrolamiento: `USR-CONSENT`). Títulos completos sin truncamiento.
    2. `EditUsuarioDialog.vue`: Modal ampliado a `w-[95vw] max-w-[1380px]` con Layout Split en 2 columnas fijas (Izquierda 4 cols: Atributos, RR.HH, Proyectos; Derecha 8 cols: Roles RBAC GSP), eliminando `overflow-y-auto` exterior para que todo quede 100% visible a la vista sin scrollbars. Mapeo directo de `rolesIds` contra el catálogo de roles de PostgreSQL persistido en `tsec_user_roles` vía `/usuarios/updUsuario`.
  - **Verificación:** Compilación Vite exitosa (0 errores en 39.75s). **Sin Desplegar.**

---

### Tarea #6: Observación #6 — Distribución y Notificaciones: Destinatarios Parametrizados para Envío Formal de Cotizaciones

* **Requerimiento Reportado:**
  - Definir y parametrizar la lista/grupo de destinatarios definitivos para el envío formal de cotizaciones:
    - **Destinatario Principal (`Para:`):** Cliente solicitante (`cliente.email` / `contacto.email`).
    - **Copia Obligatoria (`CC:`):**
      1. Ejecutivo comercial Emisor (`currentUser.email` / creador del proyecto).
      2. Personas con el Rol `COORD` (Coordinadores de Operaciones, ej: `logistica@arriendosanpablo.cl`).
      3. Personas con el Rol `Admin` (Administradores, ej: `sgajardoc@gmail.com`, `j.poncenavarrete@gmail.com`, `omar.soffia@arriendosanpablo.cl`).
* **Diagnóstico Técnico de Causa Raíz:**
  1. `messageModel.js` y `messageController.js` no soportaban el campo `cc` en el cuerpo del request ni en las opciones de `nodemailer` (`mailOptions`), impidiendo el despacho de copias carbón.
  2. `ModalEnviarCotizacion.vue` cargaba una lista indiscriminada de usuarios mediante `fetchEnrolledUsers` basada únicamente en tener PIN FES, sin segmentar roles ni garantizar la copia al emisor, coordinadores ni administradores.
  3. `usuario_envio` en el registro del evento de auditoría estaba fijado como texto estático (`'Sergio Gajardo'`).
* **Solución Técnica Implementada Localmente:**
  1. **Backend (`messageModel.js` y `messageController.js`):**
     - Soportado el parámetro `cc` en `postMessage` (`req.body.cc`).
     - Pasado `cc: cc || undefined` en `mailOptions` de `this.transporter.sendMail(...)` en `messageModel.enviarYRegistrarCorreo`.
  2. **Frontend (`ModalEnviarCotizacion.vue`):**
     - Reemplazada la función legacy por `fetchDestinatariosParametrizados`, consultando concurrentemente `/servicio/leanglobal/obtenerUsuarios`, `/servicio/leanglobal/obtenerRoles` y `/servicio/leanglobal/obtenerUsuariosRoles`.
     - Parametrizada automáticamente la lista de Copia Conforme (CC):
       - **EMISOR:** El comercial en sesión (`currentUser.email`).
       - **COORD:** Usuarios con rol `COORD` (con fallback canónico a `logistica@arriendosanpablo.cl`).
       - **ADMIN:** Usuarios con rol `Admin` (con fallback canónico a `sgajardoc@gmail.com`, `j.poncenavarrete@gmail.com`, `omar.soffia@arriendosanpablo.cl`).
     - Interfaz rediseñada con badges semánticos por rol (`EMISOR`, `COORD`, `ADMIN`), selector interactivo con conteo en tiempo real y preselección obligatoria.
     - Registro de auditoría de envío (`eventoEnvio`) con `usuario_envio` dinámico obtenido de la sesión activa (`currentUser`).
* **Estado:** ✅ Implementada Localmente. Compilación Vite exitosa (0 errores en 3m 39s). **Sin Desplegar.**

---
