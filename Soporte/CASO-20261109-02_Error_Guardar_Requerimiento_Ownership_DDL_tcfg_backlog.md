# Ficha de Caso de Soporte: CASO-20261109-02

## 1. Identificación del Incidente
- **Código:** CASO-20261109-02
- **Fecha:** 2026-11-09
- **Proyecto Involucrado:** Consola Web GSP / Módulo de Requerimientos y Backlog (`BacklogView.vue` y `backlogController.js`)
- **Usuario Afectado / Reportante:** Alfonso Porperrello / Sergio Gajardo
- **Equipo Involucrado:** No Aplica (Módulo de Ingeniería y Gobernanza de Producto)
- **Ambiente:** Producción (`sch_leangsp_prod`) y Desarrollo (`sch_leangsp`)
- **Severidad:** Alta (Bloqueo al intentar registrar requerimientos con capturas de pantalla pegadas en la vista web)
- **Estado:** RESUELTO Y DESPLEGADO EN PROD Y DEV (Mandato Constitucional Cero Parches)

---

## 2. Síntoma Reportado
Al intentar registrar un nuevo ticket de requerimiento con capturas adjuntas en la consola web (`BacklogView.vue`), el sistema arrojaba un mensaje modal de alerta bloqueante:
> `Error al guardar requerimiento: debe ser dueño de la tabla tcfg_backlog`

---

## 3. Causa Raíz Técnica
1. **Ejecución Dinámica de DDL en la Ruta Crítica de la API:**
   Dentro de `backlogController.js`, los endpoints `crearRequerimiento`, `actualizarRequerimiento` y `getRequerimientos` invocaban la función auxiliar `ensureTables()`, la cual contenía una instrucción `ALTER TABLE ${schema}.tcfg_backlog ADD COLUMN IF NOT EXISTS adjuntos JSONB DEFAULT '[]'::jsonb;`.
2. **Restricción de Seguridad de PostgreSQL (Ownership):**
   Las instrucciones DDL (`ALTER TABLE`) exigen obligatoriamente que la sesión pertenezca al usuario propietario de la tabla (*owner*) o a un superusuario (`postgres`).
3. **Desalineación de Roles de Base de Datos:**
   La aplicación web se conecta a través del rol de servicio `usr_leangsp_prod` (y `usr_leangsp` en dev). Como la tabla `tcfg_backlog` fue instanciada inicialmente bajo la propiedad del rol `postgres`, cualquier intento de `ALTER TABLE` ejecutado por `usr_leangsp_prod` era rechazado con el error `42501 (must be owner of table tcfg_backlog)`.

---

## 4. Solución Aplicada (Resolución de Fondo en 4 Niveles - Cero Parches)
1. **Nivel 1 (Erradicación Estructural de DDL en Controladores):**
   Se removió completamente la invocación de `ensureTables()` y la sentencia `ALTER TABLE` de las rutas calientes del backend (`crearRequerimiento`, `actualizarRequerimiento`, `getRequerimientos`). Las APIs transaccionales en producción procesan exclusivamente operaciones DML (`INSERT`, `UPDATE`, `SELECT`).
2. **Nivel 2 (Gobernanza de Ownership y Privilegios en PostgreSQL):**
   Se transfirió formalmente la propiedad de las tablas de configuración y se concedieron todos los privilegios sobre tablas y secuencias al usuario de aplicación en ambos esquemas:
   ```sql
   ALTER TABLE sch_leangsp_prod.tcfg_backlog OWNER TO usr_leangsp_prod;
   ALTER TABLE sch_leangsp_prod.tcfg_releases OWNER TO usr_leangsp_prod;
   GRANT ALL PRIVILEGES ON TABLE sch_leangsp_prod.tcfg_backlog TO usr_leangsp_prod;
   GRANT ALL PRIVILEGES ON TABLE sch_leangsp_prod.tcfg_releases TO usr_leangsp_prod;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;

   ALTER TABLE sch_leangsp.tcfg_backlog OWNER TO usr_leangsp;
   ALTER TABLE sch_leangsp.tcfg_releases OWNER TO usr_leangsp;
   GRANT ALL PRIVILEGES ON TABLE sch_leangsp.tcfg_backlog TO usr_leangsp;
   GRANT ALL PRIVILEGES ON TABLE sch_leangsp.tcfg_releases TO usr_leangsp;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sch_leangsp TO usr_leangsp;
   ```
3. **Nivel 3 (Despliegue y Recarga PM2 en DEV y PROD):**
   Se sincronizó `backlogController.js` saneado en `/home/nodeadmin/proyectos/lean-services-gsp-prod/` y `/home/nodeadmin/proyectos/lean-services-gsp/`, recargando de forma segura los procesos PM2 13 y 10.
4. **Nivel 4 (Verificación E2E de Inserción):**
   Se probó la creación de un requerimiento vía `POST` HTTP simulando el payload de la UI con adjuntos JSONB, confirmando respuesta `HTTP 201 Created` y persistencia determinista sin errores.

---

## 5. Archivos Intervenidos
- Backend: [`ejecucion/backend_remoto/src/controllers/backlogController.js`](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/src/controllers/backlogController.js)
- Base de Datos: Tablas `tcfg_backlog` y `tcfg_releases` en `sch_leangsp_prod` y `sch_leangsp`
- Script de validación E2E: `scratch/test_post_backlog.cjs`

---

## 6. Verificación y Resultados
- Invocación de `POST /api/backlog` en producción retorna `{"success":true,"data":{"id":2699,"codigo_req":"REQ-2699",...}}`.
- El endpoint `GET /api/backlog` responde `HTTP 200 OK` en milisegundos sin bloqueos de permisos.
- El usuario puede guardar sus requerimientos pegando imágenes desde el portapapeles (`Ctrl+V`) con total normalidad.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Prohibición Absoluta de DDL en Handlers HTTP:** Las tablas y columnas deben ser migradas en fases de setup o deployment scripts controlados; jamás mediante cláusulas `ALTER TABLE` o `CREATE TABLE` evaluadas en cada request de usuario.
- **Auditoría de Ownership:** Al aprovisionar o alterar tablas de esquemas de clientes, debe verificarse siempre que el propietario (*owner*) coincida con el usuario con el que corre el pool de conexiones del backend.
