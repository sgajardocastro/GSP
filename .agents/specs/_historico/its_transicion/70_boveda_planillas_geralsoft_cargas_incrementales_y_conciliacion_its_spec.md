# SPEC-070: Bóveda Corporativa de Planillas GeraldSoft, Ingesta Incremental con Deduplicación (Upsert) y Matriz de Conciliación Geralsoft ⇄ ITS

**Versión:** 1.0.120  
**Fecha:** 2026-10-10  
**Estado:** EN APROBACIÓN POR USUARIO  
**Requerimiento Relacionado:** REQ-1022 (Bóveda centralizada compartida, ingesta incremental diaria de planillas GeraldSoft y semáforo de conciliación operativa de ITS)

---

## 1. Contexto y Problemas Detectados

Actualmente, el módulo de **ITS Transición** ([ItsTransicionView.vue](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue)) presenta tres brechas críticas para la operación diaria de Grúas San Pablo:

1. **Sensación de "Aislamiento Local" vs. Bóveda Central Compartida:**
   - Aunque existe persistencia básica en `tits_geraldsoft_planillas` (implementada en SPEC-068), los usuarios sienten que las planillas son "locales" porque la interfaz de usuario no evidencia de forma transparente el estado corporativo del servidor (quién subió la última versión, a qué hora, qué archivo y cuántos registros contiene).
   - Cuando un usuario sube un archivo nuevo, los demás usuarios en sus respectivas sesiones no reciben confirmación ni actualización clara de la fuente compartida en la nube.

2. **Riesgo en Cargas Diarias Incrementales (Sobreescritura Destructiva):**
   - El endpoint actual `POST /api/operaciones/its/transicion/planillas/subir` marca todas las planillas previas como `activo = false` e inserta el nuevo JSON.
   - Si la secretaria o analista sube una planilla diaria que únicamente contiene los servicios del día anterior (en lugar de todo el mes acumulado), los servicios de los días previos se pierden de la vista activa.
   - Es indispensable contar con un **motor de fusión incremental (Upsert)** que permita sumar las filas del nuevo día sin duplicar registros ya existentes ni perder la data acumulada del período.

3. **Falta de Conciliación Visual (Cruce Geralsoft ⇄ ITS):**
   - El selector actual de cotizaciones es una lista desplegable ciega que no indica si una cotización ya tiene un ITS creado, si está en borrador, si fue devuelto con observaciones o si ya está aprobado y con su PDF emitido.
   - Esto expone a la empresa a duplicidad de informes, confusiones en cobranza y dificulta la detección de servicios terminados en terreno que aún no han sido liquidados.

---

## 2. Objetivos de la Solución

1. **Bóveda Central de Planillas Compartidas (Cabecera Corporativa):**
   - Desplegar en la parte superior del módulo una tarjeta corporativa destacada con el estado de la bóveda activa en el servidor:
     - Archivos vigentes: `CONTROLES` y `ORDENES`.
     - Fecha y hora exacta de la última sincronización.
     - Nombre del usuario que realizó la carga.
     - Total de registros consolidados en la nube.
   - Botón directo de refresco para sincronizar la sesión con la nube en cualquier momento.

2. **Ingesta Incremental Inteligente (Deduplicación & Upsert):**
   - Permitir dos modalidades de carga al subir planillas:
     - **A) Carga Incremental / Fusión (Por Defecto):** Compara los registros del archivo nuevo contra los existentes en la bóveda usando una llave natural (`cotizacion` + `orden` + `fecha` + `patente` + `item/control`). Si el registro ya existe, actualiza campos operativos respetando los enlaces existentes; si es nuevo, lo incorpora a la base consolidada.
     - **B) Reemplazo Total del Período:** Para aperturas de mes o reseteo autorizado de la planilla mensual.
   - Reporte interactivo tras la subida: *"Procesados 450 registros: 18 incorporados hoy, 5 actualizados, 427 sin modificaciones"*.

3. **Matriz Operativa de Conciliación y Semáforo de ITS:**
   - Reemplazar la lista desplegable cerrada por una **Matriz de Conciliación y Pipeline Operativo**:
     - **Mini-KPIs de Gestión:**
       - Total Cotizaciones / Servicios en Bóveda.
       - ⚪ Pendientes de ITS (Por liquidar).
       - 🟡 En Trámite / Firmas FES (Borrador, Verificación, Admin, Contab).
       - 🔴 Observados / Devueltos.
       - 🟢 Concluidos / Aprobados.
     - **Tabla de Selección Rápida con Buscador y Semáforo de Estado:**
       - Cada fila muestra: `Cotización`, `Cliente`, `Fechas`, `Equipos/Patentes`, `OTs asociadas`, `Estado ITS en Plataforma` y `Acción Rápida`.
       - Si está 🟢 **Concluido (`ITS-XXXX`)**: Muestra botón `[👁️ Ver PDF]` y bloquea la re-creación accidental.
       - Si está 🟡 **En Trámite (`ITS-XXXX`)**: Muestra badge con estado y botón `[✏️ Continuar / Revisar]`.
       - Si está 🔴 **Observado (`ITS-XXXX`)**: Muestra badge de alerta y botón `[🛠️ Corregir]`.
       - Si está ⚪ **Sin ITS**: Muestra botón prioritario `[+ Elaborar ITS]`, que abre el formulario con toda la información precargada al instante.

---

## 3. Arquitectura y Modelo de Datos

### 3.1 Base de Datos PostgreSQL (`sch_leangsp` y `sch_leangsp_prod`)

Modificar la tabla `tits_geraldsoft_planillas` para soportar metadatos de sincronización e historial de cargas:

```sql
-- Agregar columnas para auditoría y tipo de operación
ALTER TABLE tits_geraldsoft_planillas 
ADD COLUMN IF NOT EXISTS modo_carga VARCHAR(30) DEFAULT 'REEMPLAZO', -- 'REEMPLAZO' o 'INCREMENTAL'
ADD COLUMN IF NOT EXISTS registros_nuevos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registros_actualizados INTEGER DEFAULT 0;

-- Índice para búsquedas rápidas de la versión activa
CREATE INDEX IF NOT EXISTS idx_tits_geraldsoft_activo_fecha 
ON tits_geraldsoft_planillas(tipo_planilla, activo, fecha_carga DESC);
```

### 3.2 Regla de Llave Natural de Deduplicación (Upsert)

Para la planilla de `CONTROLES`:
```javascript
const generarKeyControl = (r) => {
  const cot = String(r.cotizacion || r.COTIZACION || '').trim();
  const ot = String(r.orden || r.ORDEN || '').trim();
  const fecha = String(r.fecha || r.FECHA || r.__EMPTY || '').trim();
  const pat = String(r.patente || r.PATENTE || '').trim();
  const item = String(r.item || r.ITEM || r.nro_control || '').trim();
  return `${cot}_${ot}_${fecha}_${pat}_${item}`.toLowerCase();
};
```

Para la planilla de `ORDENES`:
```javascript
const generarKeyOrden = (r) => {
  const ot = String(r.ORDEN || r.orden || '').trim();
  const cot = String(r['Nro Cotizacion'] || r.cotizacion || '').trim();
  return `${ot}_${cot}`.toLowerCase();
};
```

---

## 4. Endpoints Backend (`itsController.js` y `itsRoutes.js`)

1. `GET /api/operaciones/its/transicion/planillas/activas`
   - Retorna las planillas vigentes (`CONTROLES` y `ORDENES`) con:
     - `data_json` (consolidado activo).
     - `nombre_archivo`, `fecha_carga`, `total_registros`.
     - `usuario_nombre` (nombre completo del usuario que realizó la carga).
     - `modo_carga`, `registros_nuevos`, `registros_actualizados`.

2. `POST /api/operaciones/its/transicion/planillas/subir`
   - Parámetros en body:
     - `tipo_planilla` (`CONTROLES` o `ORDENES`).
     - `nombre_archivo` (string).
     - `data_json` (array de objetos del Excel).
     - `modo` (`'incremental'` | `'reemplazo'`).
     - `id_user` (entero).
   - **Lógica de Ejecución:**
     - Si `modo === 'incremental'`:
       - Obtiene el registro activo anterior.
       - Ejecuta el merge en memoria identificando filas nuevas vs modificadas.
       - Marca la versión anterior como inactiva e inserta el consolidado resultante con `activo = true`, registrando `registros_nuevos` y `registros_actualizados`.
     - Si `modo === 'reemplazo'`:
       - Marca anterior como inactivo e inserta el nuevo dataset directo.
   - Retorna resumen con conteo de nuevos y actualizados.

3. `GET /api/operaciones/its/transicion/planillas/historial`
   - Retorna la bitácora de las últimas 15 cargas realizadas con fecha, nombre de archivo, usuario y resultados de sincronización.

---

## 5. Diseño de Interfaz de Usuario (Frontend Vue 3)

### 5.1 Tarjeta de Bóveda Central (Header)
```html
+------------------------------------------------------------------------------------------------------+
| 📦 BÓVEDA CENTRAL GERALDSOFT EN LA NUBE                  [🔄 Sincronizar]  [📂 Subir Nueva Planilla] |
| Última actualización: Hoy 09:15 hrs por Pamela González                                             |
| • CONTROLES: CONTROLES_OCT_2026.xlsx (465 registros activos en el servidor)                         |
| • ÓRDENES:   OT_OCTUBRE_2026.xlsx (182 órdenes activas en el servidor)                               |
+------------------------------------------------------------------------------------------------------+
```

### 5.2 Modal / Diálogo de Subida Inteligente
* Permite seleccionar el archivo Excel.
* Selector de modo:
  - 🔘 **Fusión Incremental (Recomendado):** Incorpora los nuevos servicios del día sin alterar los previos.
  - ⚪ **Reemplazo Completo:** Sustituye íntegramente la planilla del período.
* Barra de progreso y notificación con el desglose exacto de filas procesadas.

### 5.3 Matriz de Conciliación y Pipeline Operativo
```html
+------------------------------------------------------------------------------------------------------+
| PIPELINE DE SERVICIOS Y CONCILIACIÓN ITS (OCTUBRE 2026)                                               |
| [ Total: 120 ]  [ ⚪ Pendientes: 25 ]  [ 🟡 En Trámite: 10 ]  [ 🔴 Observados: 2 ]  [ 🟢 Concluidos: 83 ]|
| Filtros: [ Buscar Cotización, Cliente, Patente... ] [ Desde: DD/MM/AAAA ] [ Hasta: DD/MM/AAAA ]       |
+------------------------------------------------------------------------------------------------------+
| Cotización | Cliente         | Fechas       | Equipos / Patente | Estado ITS      | Acciones         |
|------------+-----------------+--------------+-------------------+-----------------+------------------|
| 11493      | BESALCO S.A.    | 08/10/2026   | GRÚA 80T (ABCD12) | 🟢 Concluido    | [👁️ Ver PDF]     |
| 11495      | MINERA SALVADOR | 09/10/2026   | C. PLUMA (EFGH34) | 🟡 Firma Admin  | [✏️ Continuar]   |
| 11501      | ECHEVERRÍA I.   | 10/10/2026   | GRÚA 120T(IJKL56) | ⚪ Sin ITS      | [+ Elaborar ITS] |
+------------------------------------------------------------------------------------------------------+
```

---

## 6. Criterios de Aceptación (QA Determinista)

1. **Persistencia y Visibilidad Compartida:**
   - Al entrar cualquier usuario desde cualquier dispositivo/sesión, la cabecera muestra inmediatamente los datos del archivo activo en el servidor y quién lo cargó.
2. **Carga Incremental sin Pérdida de Datos:**
   - Al cargar un Excel diario que contenga 5 servicios nuevos correspondientes al día de hoy, el total de registros en la bóveda aumenta de 450 a 455 sin borrar los 450 anteriores.
   - Si se vuelven a cargar las mismas filas del día, el sistema detecta que ya existen y no genera duplicados.
3. **Semáforo y Conciliación Precisa:**
   - Toda cotización que cuente con un ITS registrado en `tits_transicion_historial` se vincula automáticamente y muestra su folio y estado (`BORRADOR`, `PENDIENTE_VERIFICACION`, `PENDIENTE_ADMIN`, `PENDIENTE_CONTABILIDAD`, `APROBADO`, `OBSERVADO`).
   - El botón `[+ Elaborar ITS]` solo aparece para cotizaciones sin ITS previo o cuando se solicite explícitamente una nueva versión.
   - Al pulsar `[👁️ Ver PDF]` en un registro concluido, se despliega de inmediato el visor oficial del informe firmado.
4. **Verificación de Compilación y Salud de API:**
   - Frontend compila con Vite sin advertencias críticas ni errores (`0 errors`).
   - Endpoints responden con código HTTP 200 OK en DEV (`sch_leangsp`) y PROD (`sch_leangsp_prod`).
