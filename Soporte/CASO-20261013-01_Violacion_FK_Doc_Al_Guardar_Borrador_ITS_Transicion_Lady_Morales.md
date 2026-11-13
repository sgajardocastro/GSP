# 🛠️ Caso de Soporte: CASO-20261013-01
## Bloqueo al Guardar Borrador de ITS Transición por Violación de Clave Foránea (`id_doc` Huérfano de DEV en PROD)

---

### 1. Ficha del Incidente

- **ID del Caso:** `CASO-20261013-01`
- **Fecha / Hora del Reporte:** 2026-10-13 16:55 – 17:00 CLT
- **Fecha / Hora de Resolución:** 2026-10-13 18:07 CLT
- **Usuario Afectado:** Lady Morales (`lmorales@arriendosanpablo.cl`, ID de usuario `14`, Secretaria de Operaciones Sucursal Los Ángeles)
- **Módulo / Componente:** Módulo Operaciones -> Informe de Término de Servicio (ITS Transición)
- **Cliente / Contexto:** Informe borrador para faena con costos operacionales de **$916.600** (asociado a la serie del cliente CHINA FIRST HIGHWAY ENG CO LTDA)
- **Ambiente:** Producción (`PROD` - `https://servidor.leanglobal.cl/lg-gsp-prod/`)
- **Severidad:** **Crítica** (Bloqueo absoluto de guardado en base de datos PostgreSQL, impidiendo registrar avances o borradores operacionales)
- **Estado:** **RESUELTO Y DESPLEGADO EN PRODUCCIÓN**

---

### 2. Síntoma Reportado por Terreno

La secretaria Lady Morales reportó mediante captura de pantalla de WhatsApp que al presionar el botón **"Guardar Borrador"** en la pantalla del ITS de Transición, la aplicación desplegaba una alerta modal de error bloqueante:

```text
❌ No se pudo guardar en el servidor PostgreSQL:
Error al guardar ITS transición: inserción o actualización en la tabla «tits_transicion_historial» viola la llave foránea «tits_transicion_historial_id_doc_fkey»
Los cambios NO han quedado registrados en la nube común.
```

Previamente, la usuaria había logrado guardar sin inconvenientes otro borrador (`ITS-3259`, `id_transicion = 33`, a las 17:55 CLT para el cliente *CHINA FIRST HIGHWAY ENG CO LTDA*). El error comenzó a manifestarse sistemáticamente al intentar trabajar en un segundo informe con costos de **$916.600**.

---

### 3. Diagnóstico Técnico & Evidencia Empírica

#### 3.1 Inspección de Logs PM2 en Servidor Remoto
Al inspeccionar `/home/nodeadmin/.pm2/logs/lean-services-gsp-prod-error.log` en el servidor de producción (`138.255.103.18`), se identificaron múltiples trazas idénticas entre las 16:55 y las 17:32:

```text
[ITS guardarItsTransicion] Error: error: inserción o actualización en la tabla «tits_transicion_historial» viola la llave foránea «tits_transicion_historial_id_doc_fkey»
    at /home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/pg-pool/index.js:45:11
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at async guardarItsTransicion (/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js:1329:22) {
  length: 359,
  severity: 'ERROR',
  code: '23503',
  detail: 'La llave (id_doc)=(1452) no está presente en la tabla «tfmg_file».',
  constraint: 'tits_transicion_historial_id_doc_fkey',
  file: 'ri_triggers.c',
  line: '2607',
  routine: 'ri_ReportViolation'
}
```

#### 3.2 Trazabilidad del ID de Documento (`id_doc = 1452`)
Se consultó la existencia de dicho documento en ambas bases de datos:
- `sch_leangsp.tfmg_file` (Desarrollo): **Existe 1 registro** (`id_doc = 1452`, creado el 2026-10-09 para `ITS-2948`).
- `sch_leangsp_prod.tfmg_file` (Producción): **0 registros** (`max(id_doc) = 1174`).

En la tabla de historial de transición de Producción (`sch_leangsp_prod.tits_transicion_historial`), el registro de `ITS-2948` tenía:
- Columna relacional `id_doc`: `NULL`.
- Columna JSON `data_json->'informe'->>'id_doc'`: **`1452`** (heredado de la importación inicial desde desarrollo).

---

### 4. Causa Raíz de Arquitectura

1. **Inconsistencia de Datos Migrados:**
   Al sincronizar los datos de prueba desde DEV hacia PROD, la restricción de integridad referencial impidió que la columna física `id_doc` tomara el valor `1452`, quedando en `NULL`. Sin embargo, dentro del campo desnormalizado `data_json`, el objeto `informe.id_doc = 1452` permaneció latente.

2. **Fallback No Auditado en el Frontend (`ItsTransicionView.vue`):**
   Al cargar la bandeja común desde el servidor, la función `cargarHistorialDesdeServidor` ejecutaba:
   ```javascript
   id_doc: item.id_doc || inf.id_doc || null
   ```
   Al estar `item.id_doc` nulo en base de datos, el cliente tomó `inf.id_doc = 1452` del JSON interno.

3. **Carga y Edición de Informes:**
   Lady Morales abrió para revisión o edición el registro histórico `ITS-2948` (del mismo mandante *CHINA FIRST HIGHWAY*). La función `cargarInformeParaEdicion` asignó reactivamente `informe.id_doc = 1452`. Al proceder a elaborar y presionar *"Guardar Borrador"*, el payload enviado al endpoint `/operaciones/its/transicion/guardar` incluyó `id_doc: 1452`.

4. **Ausencia de Validación Relacional en el Controlador Backend (`itsController.js`):**
   El método `guardarItsTransicion` aceptaba `id_doc` directamente del cliente y lo inyectaba en la consulta `INSERT ... ON CONFLICT` sin verificar su existencia en `tfmg_file` y sin contemplar que un informe en estado `BORRADOR` nunca debe portar un PDF compilado. Al intentar la inserción, PostgreSQL rechazó la operación con código `23503`.

---

### 5. Plan de Mitigación y Resolución Implementado

#### 5.1 Capa Backend (`itsController.js`)
Se incorporó validación determinista de clave foránea antes de persistir y blindaje contra valores no numéricos en márgenes:
```javascript
// Sanitizar y validar existencia de id_doc en tfmg_file para prevenir violación de FK (23503)
let validIdDoc = null;
if (id_doc && estado !== 'BORRADOR') {
  const docCheck = await pool.query('SELECT id_doc FROM tfmg_file WHERE id_doc = $1', [parseInt(id_doc)]);
  if (docCheck.rows.length > 0) {
    validIdDoc = parseInt(id_doc);
  } else {
    console.warn(`[ITS guardarItsTransicion] id_doc (${id_doc}) no existe en tfmg_file. Se asigna null.`);
  }
}
```
En los valores del query:
- `isFinite(parseFloat(margen)) ? parseFloat(margen) : 0`
- `validIdDoc` en lugar de `id_doc` directo.

#### 5.2 Capa de Base de Datos (`sch_leangsp_prod`)
Se ejecutó el saneamiento de los 2 registros de producción que arrastraban referencias huérfanas de DEV en su JSON:
```sql
UPDATE sch_leangsp_prod.tits_transicion_historial
SET data_json = jsonb_set(data_json::jsonb, '{informe,id_doc}', 'null'::jsonb)::json
WHERE folio_its IN ('ITS-11439', 'ITS-2948') AND data_json->'informe'->>'id_doc' IS NOT NULL;
```
*Resultado:* `UPDATE 2` ejecutado exitosamente.

#### 5.3 Capa Frontend (`ItsTransicionView.vue`)
- En `cargarHistorialDesdeServidor`: Se eliminó el fallback a `inf.id_doc`, usando estrictamente la columna relacional sanitizada `item.id_doc ? parseInt(item.id_doc) : null`.
- En `guardarInformeConEstado`: Se garantizó que si el estado es `BORRADOR`, el atributo `id_doc` se envíe siempre como `null`.
- En `cargarInformeParaEdicion`: Se condicionó la carga de `id_doc` exclusivamente a informes que no estén en estado borrador.

---

### 6. Despliegue y Verificación Empírica

1. **Backend Remoto:**
   - Archivo `src/controllers/itsController.js` actualizado en DEV (`lean-services-gsp`) y PROD (`lean-services-gsp-prod`).
   - Reinicio de servicios PM2: Instancia 10 (DEV) y 13 (PROD) activas en estado `online`.
2. **Frontend:**
   - Compilación con Vite: 0 errores (`built in 1m 20s`).
   - Sincronización a `/var/www/html/lg-gsp-dev` y `/var/www/html/lg-gsp-prod` completada con permisos `www-data`.
3. **Verificación de Conectividad:**
   - `https://servidor.leanglobal.cl/lg-gsp-dev/` -> **HTTP 200 OK**
   - `https://servidor.leanglobal.cl/lg-gsp-prod/` -> **HTTP 200 OK**

---

### 7. Protocolo de Respuesta y Guía al Usuario

> **Estimada Lady Morales:**
> El problema que impedía guardar el borrador del ITS en la plataforma ha sido completamente resuelto.
> 
> **Instrucciones para continuar:**
> 1. Presione `Ctrl + F5` en su navegador (o refresque la página) para cargar la versión actualizada.
> 2. Ingrese nuevamente al informe ITS en el que estaba trabajando.
> 3. Haga clic en **"Guardar Borrador"**. El sistema guardará los datos sin ningún mensaje de error y sus costos ($916.600) quedarán respaldados en la nube común de San Pablo.

---

### 8. Lecciones Aprendidas & Acciones Preventivas

1. **Principio de Autoridad Relacional:** Los campos desnormalizados o JSON embebidos (`data_json`) nunca deben ser utilizados como fuente de verdad para claves foráneas (`id_doc`, `id_usuario`, `id_proyecto`). La columna física relacional es la única fuente válida.
2. **Validación Preventiva en Controladores:** Todo endpoint que reciba una clave foránea opcional debe validar su existencia mediante una consulta relacional rápida o manejar la excepción `23503` con degradación elegante hacia `NULL`, evitando la caída catastrófica de la transacción de guardado del usuario.
3. **Inmutabilidad de Borradores:** Un borrador de liquidación o informe nunca debe poseer un `id_doc` asociado hasta que sea formalmente compilado, firmado o emitido.
