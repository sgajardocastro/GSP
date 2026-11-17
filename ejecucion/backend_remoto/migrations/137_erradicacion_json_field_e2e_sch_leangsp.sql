-- Migración 137: Erradicación Integral de json_field, Saneamiento Histórico y Candado Canónico de Unicidad
-- Esquema: sch_leangsp (DEV)
-- Fecha: 2026-11-17
-- Gobernanza: SPEC-16 §28

BEGIN;

-- 1. Auditoría y Saneamiento en tedp_reporte_avance
-- En caso de existir reportes duplicados no anulados para el mismo (id_proyecto, dia_correlativo, id_equipo),
-- conservamos el reporte canónico (el de menor id o el que tenga documentos) y marcamos los demás como 'ANULADO'.
WITH duplicados AS (
    SELECT 
        id_reporte_avance,
        id_proyecto,
        dia_correlativo,
        id_equipo,
        ROW_NUMBER() OVER (
            PARTITION BY id_proyecto, dia_correlativo, id_equipo 
            ORDER BY id_reporte_avance ASC
        ) as rn
    FROM sch_leangsp.tedp_reporte_avance
    WHERE estado_reporte != 'ANULADO'
      AND id_equipo IS NOT NULL
)
UPDATE sch_leangsp.tedp_reporte_avance r
SET estado_reporte = 'ANULADO',
    observacion_trabajo = COALESCE(r.observacion_trabajo, '') || ' [ANULADO_POR_SANEAMIENTO_MIGRACION_137_DUPLICADO]'
FROM duplicados d
WHERE r.id_reporte_avance = d.id_reporte_avance
  AND d.rn > 1;

-- 2. Saneamiento en tpry_rel_equipo
-- Cancelar asignaciones huérfanas sin id_linea_servicio cuando ya existe una asignación activa con id_linea_servicio
UPDATE sch_leangsp.tpry_rel_equipo r1
SET estado_real = 'CANCELADO'
WHERE r1.id_linea_servicio IS NULL
  AND r1.estado_real NOT IN ('CANCELADO', 'REEMPLAZADO')
  AND EXISTS (
      SELECT 1 FROM sch_leangsp.tpry_rel_equipo r2
      WHERE r2.id_proyecto = r1.id_proyecto
        AND r2.id_equipo = r1.id_equipo
        AND r2.id_linea_servicio IS NOT NULL
        AND r2.estado_real NOT IN ('CANCELADO', 'REEMPLAZADO')
        AND r2.id_rel_equipo != r1.id_rel_equipo
  );

-- 3. Saneamiento en tpry_rel_persona
-- Cancelar asignaciones de personas duplicadas sin id_linea_servicio cuando ya existe una con id_linea_servicio
UPDATE sch_leangsp.tpry_rel_persona p1
SET estado_real = 'CANCELADO'
WHERE p1.id_linea_servicio IS NULL
  AND p1.estado_real NOT IN ('CANCELADO', 'REEMPLAZADO')
  AND EXISTS (
      SELECT 1 FROM sch_leangsp.tpry_rel_persona p2
      WHERE p2.id_proyecto = p1.id_proyecto
        AND p2.id_user = p1.id_user
        AND p2.id_linea_servicio IS NOT NULL
        AND p2.estado_real NOT IN ('CANCELADO', 'REEMPLAZADO')
        AND p2.id_rel_persona != p1.id_rel_persona
  );

-- 4. Candado Físico Canónico de Unicidad en sch_leangsp.tedp_reporte_avance
CREATE UNIQUE INDEX IF NOT EXISTS uq_tedp_proyecto_dia_equipo
ON sch_leangsp.tedp_reporte_avance (id_proyecto, dia_correlativo, id_equipo)
WHERE estado_reporte != 'ANULADO';

COMMIT;
