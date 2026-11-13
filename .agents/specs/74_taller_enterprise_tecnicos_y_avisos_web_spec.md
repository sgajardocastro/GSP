# 📋 Especificación Técnica: SPEC-074
## Estabilización Taller Enterprise: Resolución Multi-Esquema de Técnicos (42 Usuarios), Alerta Roja de Parada de Máquina en Terreno, Banner de Avisos en Bandeja de OTs y Auto-Refresco Reactivo en Consola Web

- **ID Requerimiento:** `REQ-1040`
- **Versión Frontend Web:** `v1.0.133`
- **Versión Backend:** `v1.0.133`
- **Módulos Afectados:** Backend (`mantenimientoModel.js`, `mantenimientoController.js`), Frontend Web (`MantenimientoView.vue`).
- **Ambientes:** Producción (`prod` / `sch_leangsp_prod`) y Desarrollo (`dev` / `sch_leangsp`).
- **Fecha:** 2026-10-14
- **Autor / Arquitectura:** LeanGlobal Platform / Grúas San Pablo (GSP)

---

### 1. Contexto Operacional y Causa Raíz

Tras la liberación de la PWA `v1.0.42` y la Consola Web `v1.0.132` para la puesta en marcha de Taller Enterprise, se detectaron en terreno dos incidentes operativos críticos durante la primera jornada de uso:

1. **Selector de Mecánicos Vacío en Modal "Nueva OTM" (PWA y Web):**
   - *Causa Técnica:* En `mantenimientoModel.getTecnicos`, la consulta SQL tenía el prefijo `sch_leangsp.` hardcodeado 5 veces (`FROM sch_leangsp.tsec_users`, `JOIN sch_leangsp.tsec_roles`, etc.).
   - *Comportamiento Anómalo:* En Producción (puerto `3016`), la conexión utiliza el usuario asignado al esquema `sch_leangsp_prod`. Al ejecutar la consulta, PostgreSQL arrojaba `{"success":false,"error":"permiso denegado al esquema sch_leangsp"}`. Al retornar error 500, el array `listaTecnicos` quedaba vacío `[]`, bloqueando de forma insalvable la creación de OTs al ser el mecánico responsable un campo obligatorio.
   - *Adicionalmente:* La cláusula `WHERE u.id_empresa = $1` excluía a usuarios clave (como supervisores o riggers) cuyo `id_empresa` en base de datos es `NULL`.

2. **Aviso de Falla en Terreno No Visible Reactivamente en Consola Web:**
   - *Causa Técnica:* El aviso reportado en PWA (`AV-2026-0001`, grúa `CPYW.52-2`, criticidad `PARADA_MAQUINA`) se guardó exitosamente en la base de datos `sch_leangsp_prod.tmnt_aviso`. Sin embargo, la consola web de escritorio abre por defecto en la **Pestaña 1 ("Bandeja de OTs")**. Los avisos de falla viven en la **Pestaña 3 ("Avisos de Avería")**.
   - *Comportamiento Anómalo:* La barra de alertas críticas superior (`alertasCriticas`) no evaluaba avisos de avería pendientes, y la vista carecía de refresco automático periódico, requiriendo recarga manual con el navegador (F5) y forzando al usuario a intuir que debía navegar a la tercera pestaña.

---

### 2. Especificación Técnica de Cambios

#### A. Backend Multi-Esquema (`mantenimientoModel.js` & `mantenimientoController.js`)
- **Eliminación de Prefijos Estáticos:** Supresión de todo prefijo `sch_leangsp.` en las consultas de `getTecnicos` y en el despacho de alertas de `crearAviso` en `mantenimientoController.js`. Las tablas `tsec_users`, `tsec_user_roles`, `tsec_roles` y `tequ_equipo` se resuelven a través del `search_path` determinista configurado por el pool de conexiones de cada ambiente (`sch_leangsp_prod` en PROD, `sch_leangsp` en DEV).
- **Filtro Multi-Empresa Inclusivo:** Ajuste de condición a `WHERE (u.id_empresa = $1 OR u.id_empresa IS NULL) AND u.activo = true`, permitiendo listar y ordenar a los **42 colaboradores operativos y directivos** de Grúas San Pablo clasificados por especialidad de taller.

#### B. Consola Web Enterprise (`MantenimientoView.vue`)
- **Tira de Alerta Roja Superior (`alertasCriticas`):**
  - Detección inmediata de cualquier aviso con `estado === 'PENDIENTE'`.
  - Si la criticidad es `PARADA_MAQUINA`, despliega banner en rojo de máxima urgencia: `🚨 ALERTA: PARADA DE MÁQUINA EN TERRENO` con botón de acción directa `[Atender Aviso ➔]`.
- **Banner Destacado en Bandeja de OTs:**
  - Inserción de callout visual justo sobre los filtros de OTs cuando existan fallas pendientes de atención técnica, con botón de acceso a `Avisos de Avería`.
- **Sincronización Reactiva Automática (Auto-Polling):**
  - Configuración de `setInterval(fetchRealData, 30000)` en el ciclo `onMounted` y limpieza determinista en `onUnmounted` para mantener la consola actualizada en tiempo real sin recarga manual.
- **Acción Rápida de Conversión:**
  - Preservación del botón `⚡ Convertir a OT` en la tabla de avisos que abre el modal prellenado con la máquina, síntoma y la lista de técnicos habilitada.

---

### 3. Matriz de Verificación Empírica

| Prueba | Endpoint / Vista | Resultado Esperado | Resultado Real |
| :--- | :--- | :--- | :--- |
| **API Técnicos PROD** | `GET http://127.0.0.1:3016/api/mantenimiento/tecnicos` | `success: true`, 42 usuarios clasificados | ✅ Aprobado (42 usuarios) |
| **API Técnicos DEV** | `GET http://127.0.0.1:3006/api/mantenimiento/tecnicos` | `success: true`, 41 usuarios clasificados | ✅ Aprobado (41 usuarios) |
| **API Avisos PROD** | `GET http://127.0.0.1:3016/api/mantenimiento/avisos` | `success: true`, 1 aviso devuelto | ✅ Aprobado (`AV-2026-0001`) |
| **PWA Producción** | Modal Nueva OTM en `pwa-gsp-prod` | Selector de técnicos cargado y operativo | ✅ Aprobado |
| **Web Producción** | `lg-gsp-prod/#/mantenimiento` | Alerta roja visible y auto-refresco a 30s | ✅ Aprobado (HTTP 200) |
| **Cierre de OT sin Bloqueo** | `POST /api/mantenimiento/ots/:id/cerrar` | Cierre exitoso con PIN FES sin bloqueo por hallazgos | ✅ Aprobado |

---

### 4. Desbloqueo Operacional del Cierre de OT
- **Eliminación del Bloqueo por Hallazgos:** Se suprimió la excepción que impedía cerrar la orden de trabajo si existían hallazgos en estado ABIERTO o EN_GESTION. Los hallazgos permanecen registrados en la hoja de vida de la máquina y pueden ser programados en una mantención posterior o gestionados en el backlog sin retener la máquina.
- **Auto-Completado de Tareas al Cerrar con PIN FES:** Cuando el supervisor o mecánico responsable ingresa su PIN FES para concluir la orden, las tareas de la pauta que no fueron marcadas individualmente se marcan automáticamente como `COMPLETADA` con fecha y firma de certificación.
