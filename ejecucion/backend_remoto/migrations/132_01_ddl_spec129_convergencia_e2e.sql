-- =============================================================================
-- MIGRACION DDL IDEMPOTENTE: SPEC-129 / SPEC-132 (CONVERGENCIA MATRIZ E2E)
-- FECHA: 14/11/2026
-- NOTA: Ejecutar sobre el esquema objetivo tras fijar search_path correspondiente.
-- =============================================================================

ALTER TABLE tpry_linea_servicio DROP CONSTRAINT IF EXISTS tpry_linea_servicio_linea_negocio_check;
ALTER TABLE tpry_linea_servicio ADD CONSTRAINT tpry_linea_servicio_linea_negocio_check
  CHECK (linea_negocio IN ('IZAJE', 'RENTAL', 'TRANSPORTE', 'PROFESIONAL', 'INTERNAS'));

ALTER TABLE tpry_linea_servicio DROP CONSTRAINT IF EXISTS tpry_linea_servicio_tipo_ot_check;
ALTER TABLE tpry_linea_servicio ADD CONSTRAINT tpry_linea_servicio_tipo_ot_check
  CHECK (tipo_ot IN ('OT-MANIOBRA', 'OT-RENTAL', 'OT-FLETE', 'OT-LOGISTICA', 'OT-STAFF', 'OT-INTERNA'));

ALTER TABLE tpry_linea_servicio DROP CONSTRAINT IF EXISTS tpry_linea_servicio_rol_nodo_check;
ALTER TABLE tpry_linea_servicio ADD CONSTRAINT tpry_linea_servicio_rol_nodo_check
  CHECK (rol_nodo IN ('RAIZ', 'HIJO_COMERCIAL', 'APOYO_OPERATIVO', 'ACCESORIO', 'PERSONAL', 'TRASLADO', 'OTROS'));

ALTER TABLE tpry_linea_servicio DROP CONSTRAINT IF EXISTS tpry_linea_servicio_unidad_check;
ALTER TABLE tpry_linea_servicio ADD CONSTRAINT tpry_linea_servicio_unidad_check
  CHECK (unidad IN (
    'Valor Fijo',
    'Traslado Ida',
    'Traslado Vuelta',
    'Traslado Ida/Vuelta',
    'Hora Efectiva',
    'Horas Diarias Minimas',
    'Horas Mes Minimas',
    'Valor Fijo Diario',
    'Valor Fijo Semanal',
    'Valor Fijo Mensual',
    'Tarifa por Km'
  ));

ALTER TABLE tpry_linea_servicio ADD COLUMN IF NOT EXISTS cantidad_km NUMERIC(10, 2);

ALTER TABLE tope_acta_plataforma
  ALTER COLUMN combustible_in TYPE VARCHAR(100),
  ALTER COLUMN combustible_out TYPE VARCHAR(100),
  ALTER COLUMN estado TYPE VARCHAR(50),
  ALTER COLUMN folio_acta TYPE VARCHAR(50),
  ALTER COLUMN numero_contrato TYPE VARCHAR(100);
