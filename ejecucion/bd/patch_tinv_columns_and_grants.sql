-- 1. DROP NOT NULL en columnas legacy que bloquean inserción canónica
ALTER TABLE sch_leangsp.tinv_producto ALTER COLUMN prefijo_sku DROP NOT NULL;
ALTER TABLE sch_leangsp.tinv_producto ALTER COLUMN correlativo_sku DROP NOT NULL;
ALTER TABLE sch_leangsp.tinv_producto ALTER COLUMN unidad_medida DROP NOT NULL;
ALTER TABLE sch_leangsp.tinv_producto ALTER COLUMN categoria DROP NOT NULL;
ALTER TABLE sch_leangsp.tinv_bodega ALTER COLUMN ubicacion DROP NOT NULL;

-- 2. Asegurar columnas nuevas en tinv_bodega y tinv_producto
ALTER TABLE sch_leangsp.tinv_bodega 
  ADD COLUMN IF NOT EXISTS id_sucursal BIGINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS responsable VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tipo_bodega VARCHAR(50) DEFAULT 'CENTRAL',
  ADD COLUMN IF NOT EXISTS consolida_stock BOOLEAN DEFAULT TRUE;

ALTER TABLE sch_leangsp.tinv_producto 
  ADD COLUMN IF NOT EXISTS codigo_legado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS familia VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subfamilia VARCHAR(100),
  ADD COLUMN IF NOT EXISTS unidad_medida_base VARCHAR(20) DEFAULT 'UN',
  ADD COLUMN IF NOT EXISTS presentacion_compra VARCHAR(50),
  ADD COLUMN IF NOT EXISTS factor_conversion NUMERIC(12,4) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS tipo_control VARCHAR(20) DEFAULT 'CANTIDAD',
  ADD COLUMN IF NOT EXISTS es_rotable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS impacto_operacional VARCHAR(20) DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS lead_time VARCHAR(20) DEFAULT 'CORTO',
  ADD COLUMN IF NOT EXISTS clase_abc VARCHAR(1) DEFAULT 'C',
  ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_maximo NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS punto_reorden NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_pmp_vigente NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requiere_revalorizacion BOOLEAN DEFAULT FALSE;

-- 3. Asegurar columnas nuevas y DROP NOT NULL en tinv_movimiento
ALTER TABLE sch_leangsp.tinv_movimiento ALTER COLUMN id_bodega DROP NOT NULL;
ALTER TABLE sch_leangsp.tinv_movimiento ALTER COLUMN usuario_registro DROP NOT NULL;
ALTER TABLE sch_leangsp.tinv_movimiento ALTER COLUMN stock_nuevo DROP NOT NULL;

ALTER TABLE sch_leangsp.tinv_movimiento 
  ADD COLUMN IF NOT EXISTS documento_tipo VARCHAR(30),
  ADD COLUMN IF NOT EXISTS documento_folio VARCHAR(100),
  ADD COLUMN IF NOT EXISTS id_ubicacion BIGINT,
  ADD COLUMN IF NOT EXISTS id_lote BIGINT,
  ADD COLUMN IF NOT EXISTS id_serie BIGINT,
  ADD COLUMN IF NOT EXISTS costo_unitario_pmp NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_posterior NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS id_usuario BIGINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS id_movimiento_reversado BIGINT,
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 4. Índices únicos necesarios para cláusulas ON CONFLICT del SEED
CREATE UNIQUE INDEX IF NOT EXISTS uq_tinv_bodega_empresa_nombre 
  ON sch_leangsp.tinv_bodega (id_empresa, nombre);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tinv_producto_empresa_sku 
  ON sch_leangsp.tinv_producto (id_empresa, sku);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tinv_conteo_empresa_codigo 
  ON sch_leangsp.tinv_conteo (id_empresa, codigo_proceso);

-- 5. Concesión de privilegios a roles de aplicación
GRANT ALL PRIVILEGES ON SCHEMA sch_leangsp TO usr_leangsp, usrpglgbl;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sch_leangsp TO usr_leangsp, usrpglgbl;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sch_leangsp TO usr_leangsp, usrpglgbl;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_leangsp GRANT ALL ON TABLES TO usr_leangsp, usrpglgbl;
ALTER DEFAULT PRIVILEGES IN SCHEMA sch_leangsp GRANT ALL ON SEQUENCES TO usr_leangsp, usrpglgbl;
