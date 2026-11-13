# 🛠️ Ficha de Incidente Crítico: `CASO-20261104-02`

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261104-02`
- **Requerimiento Asociado:** `REQ-1112`
- **Fecha / Hora del Incidente:** `2026-11-04 15:54:33.118Z` (`12:54:33 CLT`)
- **Fecha / Hora de Resolución:** `2026-11-04 14:40:00 (-03:00)`
- **Operador / Usuarios Afectados:**
  - **Wilson Navarrete** (`id_user = 64`, `wnavarrete@arriendosanpablo.cl`, Ejecutivo Comercial que reenvió correo desde pestaña obsoleta)
  - **Jonathan Castillo** (`id_user = 17`, Coordinador de Operaciones)
  - **Yiara Mendoza** (`id_user = 65`, Analista de Control de Gestión PMO)
  - **Osvaldo Elías Balboa Márquez** (`id_user = 94`, Operador) & **Matías Barrales** (`id_user = 13`, Rigger)
- **Negocio / OT:** `GSP-2611-00001` (`id_proyecto = 30`, Obra `PLANTA FEPASA`, Mandante `FERROCARRILES DE PACIFICO S.A.`, `id_empresa_cliente = 96`)
- **Equipo Involucrado:** Grúa Móvil 70 Ton `LIEBHERR LTM-1070` (`id_equipo = 39`, Patente `TLXF.37-9`, Código Interno `GPT-131`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** Crítica (Regresión involuntaria de proceso finalizado/en operación al Estado `1` Preventa Comercial y vaciamiento de `json_field.ejecucion_v1`)

---

## 2. Síntoma Reportado por Terreno / Jefatura
- El proceso `GSP-2611-00001` (`id_proyecto = 30`, `PLANTA FEPASA`), que ya había ejecutado su servicio en terreno, contaba con 5 versiones de Orden de Trabajo emitidas (`OT-GSP-2611-00001V1-32.pdf` a `V5-83.pdf`), viaje arribado (`id_log_desplazamiento = 12`) y Report Diario Día 1 validado por PMO (`id_reporte_avance = 10`, `9.00 hrs`), **apareció repentinamente en la Columna 1 (`Estado 1 — Oportunidad / Preventa Comercial`)** del tablero Kanban.
- Al abrir la ficha del negocio, su bloque operativo (`json_field.ejecucion_v1`) se encontraba vacío (`{}`) y su historial de cotizaciones sólo mostraba la `v1` (`id_doc = 1326`), habiendo desaparecido la `v2` (`id_doc = 1504`).

---

## 3. Diagnóstico Técnico & Evidencia Forense Empírica
La auditoría forense sobre `sch_leangsp_prod` (`tpry_proyecto`, `tfmg_file`, `tequ_log_desplazamiento`, `tedp_reporte_avance`) y los logs de Nginx/PM2 demostró la cronología exacta al milisegundo:

1. **Estado Operativo Previo (`15:20:51Z` / `12:20:51 CLT`):**
   - El proyecto `id_proyecto = 30` estaba en operación activa (`id_proyecto_estado = 5`, proyectado a `6` Cierre/ITS por tener su Report Diario `id_reporte_avance = 10` en `VALIDADO_ANALISTA`).
   - En `tfmg_file` existían las 5 versiones de OT (`id_doc` `1408`, `1438`, `1512`, `1560`, `1573`, la última `OT-GSP-2611-00001V5-83.pdf` generada a las `15:20:51.646Z`) y las 2 versiones de cotización (`id_doc = 1326` `V1-44` del `02-Nov` y `id_doc = 1504` `V2-57` del `03-Nov`).
2. **Evento Detonante (`15:54:33.118Z` / `12:54:33 CLT`):**
   - El ejecutivo comercial **Wilson Navarrete** (`id_user = 64`) mantenía abierta en su navegador una **pestaña antigua** de `GSP-2611-00001` que había sido cargada el **02 de noviembre de 2026** cuando el negocio aún estaba en **Preventa (`id_proyecto_estado = 1`)**, con `ejecucion_v1 = {}` y únicamente la Cotización `v1` en memoria RAM de Vue.
   - Desde esa pestaña sin refrescar, pulsó `[ENVIAR COTIZACIÓN]` para reenviar por correo la Cotización `v1` a `jorge.herrera@fepasa.cl` (`id_evento = "env_1793807673118"`).
3. **Mutación Destructiva tras el Envío de Correo:**
   - Al completarse `POST /api/proyectos/30/enviar-cotizacion`, el callback `onEmailSent` en `GestorOportunidades.vue` invocó `const payload = buildPayload()` y ejecutó `PUT /api/proyectos/30` enviando todo el estado en memoria de esa pestaña obsoleta (`id_proyecto_estado: 1`, `ejecucion_v1: {}`, `cotizaciones_historicas: [v1]`).
   - En el backend, `proyectoModel.updateProyecto` ejecutó `UPDATE tpry_proyecto SET id_proyecto_estado = $4, json_field = $12 WHERE id_proyecto = 30` sin validar si el proyecto en base de datos ya se encontraba en una etapa superior (`>= 3`), sobrescribiendo el estado `5` con `1` y vaciando `ejecucion_v1`.
4. **Hallazgo Colateral en `asignacionRecursosController.js`:**
   - Se detectó además que `GET /api/proyectos/:id/asignaciones/equipos` consultaba `e.codigo_equipo` en `tequ_equipo` en lugar de `e.codigo_interno AS codigo_equipo`, arrojando `HTTP 500` al consultar asignaciones relacionales.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Acoplamiento de `onEmailSent` con `buildPayload()` completo en Frontend (`GestorOportunidades.vue`):**
   - Para guardar únicamente la traza de envío del correo (`eventos_envio`), el frontend serializaba y enviaba el proyecto entero desde la memoria local de la pestaña activa sin consultar primero el estado vigente en PostgreSQL (`GET /proyectos/:id`).
2. **Ausencia de Candado Anti-Regresión en `proyectoModel.updateProyecto`:**
   - El método `updateProyecto` aceptaba cualquier `id_proyecto_estado` y `json_field` entrante en un `PUT /api/proyectos/:id` ordinario, permitiendo que una pestaña desactualizada degradara un proyecto desde Operación (`>= 3`) a Preventa (`1` o `2`) y sobrescribiera `ejecucion_v1` o truncara `cotizaciones_historicas`.
3. **Ausencia de Guardián de Versión Web vs. Servidor en el Portal Web (`App.vue`):**
   - A diferencia de la PWA móvil (que cuenta con Service Worker), la consola web SPA permitía mantener pestañas abiertas durante días con bundles JS y estados en memoria desactualizados tras nuevos despliegues en el servidor.

---

## 5. Plan de Mitigación y Resolución Aplicado (`v1.0.195` / `REQ-1112`)
1. **Restauración Forense Íntegra de `GSP-2611-00001` (`id_proyecto = 30`) en `sch_leangsp_prod`:**
   - Reconstrucción exacta de `id_proyecto_estado = 5` (con proyección automática a `6` Cierre/ITS por tener su Report Diario `id_reporte_avance = 10` validado con PDF `id_doc_pdf = 1527`), restitución íntegra de `json_field.ejecucion_v1` (Grúa 70 Ton `id_equipo = 39` `TLXF.37-9`, Operador `id_user = 94` Osvaldo Balboa, Rigger `id_user = 13` Matías Barrales, `ot_versiones` `V1` a `V5` con `id_doc = 1573`, `preparacion_salida` y `plan_diario`) y fusión de `crm_v1.cotizaciones_historicas` conservando `v2` (`id_doc = 1504`) y `v1` (`id_doc = 1326` con sus 2 eventos de envío).
   - Inserción de las filas relacionales en `tpry_asignacion_equipo` (`id_equipo = 39`) y `tpry_asignacion_persona` (`id_user = 94` Operador, `id_user = 13` Rigger).
2. **Candado Anti-Regresión en Backend (`proyectoModel.js` & `asignacionRecursosController.js`):**
   - En `proyectoModel.updateProyecto`:
     - Bloqueo determinista de regresión de estado: si `estadoDB > 1 && estadoEntrante < estadoDB`, se preserva `estadoDB` (las únicas vías autorizadas para retroceder un proceso son los endpoints explícitos de excepción auditada `/retroceder-etapa` y `/reabrir-operacion`).
     - Preservación profunda de `ejecucion_v1` (`equipo_id`, `operador_id`, `rigger_id`, `ot_versiones`, `preparacion_salida`, `plan_diario`, `tripulacion_asignada`, `especialistas_terreno`, `regimen_operacional`, `subtab_activa`) y de claves raíz (`dossier_documentos`, `control_vivo_overrides`, `dias_laborales_override`, `contrato_arriendo`).
     - Fusión no destructiva por `version` de `crm_v1.cotizaciones_historicas`, impidiendo que una pestaña antigua borre versiones más recientes de cotización.
   - En `asignacionRecursosController.getAsignacionesEquipo`: corrección de `e.codigo_interno AS codigo_equipo`.
3. **Sincronización Previa en `onEmailSent` (`GestorOportunidades.vue`):**
   - Antes de ejecutar `PUT /proyectos/:id` al enviar un correo de cotización, `onEmailSent` consulta `GET /proyectos/:id`, fusiona `cotizaciones_historicas` por `version` y preserva `id_proyecto_estado` y `ejecucion_v1` vigentes en BD.
4. **Verificador Automático de Versión Web vs. Servidor (`App.vue` & `GET /api/backlog/version`):**
   - Nuevo endpoint sin caché `GET /api/backlog/version` en `backlogController.js` / `backlogRoutes.js`.
   - En `App.vue`, `verificarVersionServidor()` compara `__APP_VERSION__` contra `/api/backlog/version` al montar la app, al cambiar de ruta, al recuperar foco/visibilidad de pestaña (`focus` / `visibilitychange`) y cada 3 minutos, ejecutando `window.location.reload()` automáticamente cuando detecta una nueva versión desplegada en el servidor.

---

## 6. Protocolo de Respuesta y Guía al Usuario
- Se informa a Jefatura de Operaciones y Administración que el proceso **`GSP-2611-00001` (`PLANTA FEPASA`)** ha sido restituido íntegramente a su etapa de operación/cierre con sus 5 versiones de OT, sus 2 versiones de cotización, su grúa `TLXF.37-9`, su tripulación (Osvaldo Balboa y Matías Barrales) y su Report Diario validado (`9.00 hrs`).
- Adicionalmente, quedó activo el blindaje anti-regresión en servidor y el detector automático de versión web para que ninguna pestaña abierta de días anteriores pueda volver a retroceder el estado de un servicio en curso.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Inmutabilidad de Transiciones de Estado en `PUT` General:** Un endpoint de actualización general de formulario (`PUT /proyectos/:id`) jamás debe permitir disminuir `id_proyecto_estado` ni vaciar sub-objetos de etapas posteriores (`ejecucion_v1`).
- **Paridad de Ciclo de Vida SPA vs. PWA:** Toda aplicación web corporativa de misión crítica debe verificar periódicamente y al recuperar foco (`visibilitychange` / `focus`) su versión compilada (`__APP_VERSION__`) contra el backend para forzar la recarga transparente de pestañas obsoletas.
