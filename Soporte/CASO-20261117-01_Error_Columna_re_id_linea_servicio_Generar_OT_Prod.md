# Ficha de Soporte & Resolución de Incidente Crítico

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261117-01`
- **Fecha / Hora:** 2026-11-17 16:05 (-03:00)
- **Operador / Usuario Afectado:** Alfonso Porperello (`alfonsoporperello@gmail.com`, `id_user = 10`, Administrador de Operaciones)
- **Negocio / OT:** `GSP-2611-00039` (`id_proyecto = 86`), `GSP-2611-00051` (`id_proyecto = 103`), `GSP-2611-00052` (`id_proyecto = 104`) y generación global de OTs.
- **Equipo Involucrado:** Flota General (Liebherr LTM-1070 `TLXF.37-9`, LTM-1055, etc.)
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Crítica (Bloqueo operacional total en la emisión de Órdenes de Trabajo en el CRM)

---

## 2. Síntoma Reportado por Terreno
Alfonso Porperello intentó generar una nueva versión de OT en producción para el proyecto `GSP-2611-00039` (ID 86). La plataforma web arrojó un diálogo de error modal en pantalla bloqueando el proceso:
> *"servidor.leanglobal.cl says: Error al generar la Orden de Trabajo en el servidor: no existe la columna re.id_linea_servicio"*

Posteriormente, el usuario constató que el error se replicaba sistemáticamente en proyectos existentes (`GSP-2611-00051`) y en proyectos nuevos recién creados (`GSP-2611-00052`), impidiendo la emisión y despacho de toda Orden de Trabajo en la empresa.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
Al inspeccionar las tablas en la base de datos PostgreSQL de producción (`sch_leangsp_prod`):
1. La tabla `tpry_linea_servicio` sí existía en `sch_leangsp_prod`.
2. Sin embargo, las tablas relacionales de asignación `tpry_rel_equipo` y `tpry_rel_persona` en `sch_leangsp_prod` no tenían agregada la columna `id_linea_servicio` (ni `activo`), las cuales sí habían sido migradas en el esquema de desarrollo (`sch_leangsp`).
3. Además, en `sch_leangsp_prod.tpry_linea_servicio` faltaban las columnas `activo` y `orden`.
4. Al ejecutarse `generarOTVersion` en `proyectoModel.js`, la consulta relacional `SELECT re.id_linea_servicio ... FROM tpry_rel_equipo re` provocaba una excepción fatal de PostgreSQL (`column re.id_linea_servicio does not exist`), abortando la transacción y denegando la generación del PDF.

---

## 4. Causa Raíz de Arquitectura
Discrepancia de esquema DDL entre el entorno de desarrollo y producción:
- El código backend v1.0.226 asumía la presencia de las columnas canónicas `id_linea_servicio` y `activo` en las tablas `tpry_rel_equipo`, `tpry_rel_persona` y `tpry_linea_servicio`.
- Al no haberse ejecutado previamente las sentencias `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en `sch_leangsp_prod`, cualquier consulta que intentara resolver la asignación relacional de equipos o dotación reventaba a nivel de PostgreSQL.

---

## 5. Plan de Mitigación y Resolución
Se aplicaron de forma inmediata las sentencias DDL en la base de datos de producción (`sch_leangsp_prod`):

```sql
-- 1. Normalización de asignaciones de flota en PROD
ALTER TABLE sch_leangsp_prod.tpry_rel_equipo 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp_prod.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_tpry_rel_equipo_linea ON sch_leangsp_prod.tpry_rel_equipo(id_linea_servicio);

-- 2. Normalización de asignaciones de dotación en PROD
ALTER TABLE sch_leangsp_prod.tpry_rel_persona 
    ADD COLUMN IF NOT EXISTS id_linea_servicio BIGINT REFERENCES sch_leangsp_prod.tpry_linea_servicio(id_linea_servicio) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_tpry_rel_persona_linea ON sch_leangsp_prod.tpry_rel_persona(id_linea_servicio);

-- 3. Columnas de orden y estado en líneas de servicio (PROD y DEV)
ALTER TABLE sch_leangsp_prod.tpry_linea_servicio 
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS id_categoria INT,
    ADD COLUMN IF NOT EXISTS id_subcategoria INT;

ALTER TABLE sch_leangsp.tpry_linea_servicio 
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1;
```

---

## 6. Verificación Empírica E2E en Producción
Tras la aplicación del DDL, se ejecutaron pruebas de emisión en caliente sobre los tres proyectos afectados, resultando 100% exitosas:

1. **`GSP-2611-00039` (`id_proyecto = 86`):**
   - Generada versión 10: `OT-GSP-2611-00039V10-272.pdf` (`id_doc = 2092`, 52.2 KB).
   - Verificado con `curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/2092` ➔ **HTTP 200 OK**.
2. **`GSP-2611-00051` (`id_proyecto = 103`):**
   - Generada versión 8: `OT-GSP-2611-00051V8-273.pdf` (`id_doc = 2093`, 52.9 KB).
   - Verificado con `curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/2093` ➔ **HTTP 200 OK**.
3. **`GSP-2611-00052` (`id_proyecto = 104`):**
   - Generada versión 1: `OT-GSP-2611-00052V1-274.pdf` (`id_doc = 2094`, 53.6 KB).
   - Verificado con `curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/2094` ➔ **HTTP 200 OK**.

---

## 7. Protocolo de Respuesta al Usuario
> *"Alfonso, el error `no existe la columna re.id_linea_servicio` quedó completamente solucionado en producción. Se actualizó el esquema de base de datos y se verificó la generación exitosa de OTs en los proyectos 0039 (Versión 10 generada), 0051 (Versión 8 generada) y 0052 (Versión 1 generada). Ya puedes generar y despachar OTs normalmente en el CRM."*
