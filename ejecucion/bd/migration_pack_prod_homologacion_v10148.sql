-- ============================================================================
-- PAQUETE MAESTRO DE HOMOLOGACIÓN DDL PRODUCCIÓN (PROD) & PARIDAD DEV
-- Proyecto: Grúas San Pablo (GSP) / LeanGlobal Platform
-- Versión objetivo: Web v1.0.148 / PWA v1.0.51 / Backend Canónico
-- Fecha: 2026-10-17
-- Carácter: 100% Idempotente (ADD COLUMN IF NOT EXISTS / CREATE IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- FASE 1: PARIDAD INVERSA EN DESARROLLO (sch_leangsp)
-- Incorporar en DEV los campos que existen en PROD para erradicar divergencias
-- ============================================================================

-- 1.1 Reportes Diarios de Faena (tedp_reporte_avance)
ALTER TABLE sch_leangsp.tedp_reporte_avance 
  ADD COLUMN IF NOT EXISTS hora_inicio_colacion time without time zone,
  ADD COLUMN IF NOT EXISTS hora_termino_colacion time without time zone;

-- 1.2 Proyectos y Planificación (tpry_proyecto)
ALTER TABLE sch_leangsp.tpry_proyecto 
  ADD COLUMN IF NOT EXISTS hora_llegada_plan time without time zone,
  ADD COLUMN IF NOT EXISTS plan_diario jsonb;

-- 1.3 Notificaciones Web (tnot_notification_web)
ALTER TABLE sch_leangsp.tnot_notification_web 
  ADD COLUMN IF NOT EXISTS id_usuario_destinatario integer,
  ADD COLUMN IF NOT EXISTS leido_en timestamp with time zone,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS rol_destinatario character varying,
  ADD COLUMN IF NOT EXISTS tipo_notificacion character varying;

-- ============================================================================
-- FASE 2: HOMOLOGACIÓN PRODUCCIÓN (sch_leangsp_prod)
-- MÓDULO 1: OPERACIONES PLATAFORMAS (tope_acta_plataforma)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS sch_leangsp_prod.tope_acta_plataforma_id_acta_seq;

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tope_acta_plataforma (
  id_acta integer NOT NULL DEFAULT nextval('sch_leangsp_prod.tope_acta_plataforma_id_acta_seq'::regclass),
  id_proyecto integer NOT NULL,
  id_equipo_plataforma integer NOT NULL,
  id_camion_traslado integer,
  id_desplazamiento_ida bigint,
  id_desplazamiento_retorno bigint,
  folio_acta character varying(50) NOT NULL,
  numero_contrato character varying(100),
  estado character varying(30) NOT NULL DEFAULT 'ENTREGADA',
  fecha_entrega timestamp without time zone DEFAULT now(),
  id_chofer_entrega integer,
  horometro_in numeric,
  combustible_in character varying(20),
  checklist_entrega jsonb NOT NULL DEFAULT '[]'::jsonb,
  fotos_entrega jsonb NOT NULL DEFAULT '[]'::jsonb,
  obs_entrega text,
  receptor_entrega_nombre character varying(150),
  receptor_entrega_rut character varying(20),
  receptor_entrega_cargo character varying(100),
  id_file_firma_entrega bigint,
  id_file_pdf_entrega bigint,
  fecha_retiro timestamp without time zone,
  id_chofer_retiro integer,
  horometro_out numeric,
  combustible_out character varying(20),
  checklist_retiro jsonb NOT NULL DEFAULT '[]'::jsonb,
  fotos_retiro jsonb NOT NULL DEFAULT '[]'::jsonb,
  obs_retiro text,
  receptor_retiro_nombre character varying(150),
  receptor_retiro_rut character varying(20),
  receptor_retiro_cargo character varying(100),
  id_file_firma_retiro bigint,
  id_file_pdf_final bigint,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT tope_acta_plataforma_pkey PRIMARY KEY (id_acta),
  CONSTRAINT tope_acta_plataforma_folio_acta_key UNIQUE (folio_acta),
  CONSTRAINT tope_acta_plataforma_id_proyecto_fkey FOREIGN KEY (id_proyecto) REFERENCES sch_leangsp_prod.tpry_proyecto(id_proyecto),
  CONSTRAINT tope_acta_plataforma_id_equipo_plataforma_fkey FOREIGN KEY (id_equipo_plataforma) REFERENCES sch_leangsp_prod.tequ_equipo(id_equipo),
  CONSTRAINT tope_acta_plataforma_id_chofer_entrega_fkey FOREIGN KEY (id_chofer_entrega) REFERENCES sch_leangsp_prod.tsec_users(id_user),
  CONSTRAINT tope_acta_plataforma_id_chofer_retiro_fkey FOREIGN KEY (id_chofer_retiro) REFERENCES sch_leangsp_prod.tsec_users(id_user),
  CONSTRAINT tope_acta_plataforma_id_file_firma_entrega_fkey FOREIGN KEY (id_file_firma_entrega) REFERENCES sch_leangsp_prod.tfmg_file(id_doc),
  CONSTRAINT tope_acta_plataforma_id_file_pdf_entrega_fkey FOREIGN KEY (id_file_pdf_entrega) REFERENCES sch_leangsp_prod.tfmg_file(id_doc),
  CONSTRAINT tope_acta_plataforma_id_file_firma_retiro_fkey FOREIGN KEY (id_file_firma_retiro) REFERENCES sch_leangsp_prod.tfmg_file(id_doc),
  CONSTRAINT tope_acta_plataforma_id_file_pdf_final_fkey FOREIGN KEY (id_file_pdf_final) REFERENCES sch_leangsp_prod.tfmg_file(id_doc)
);

CREATE INDEX IF NOT EXISTS idx_tope_acta_plataforma_proyecto 
  ON sch_leangsp_prod.tope_acta_plataforma(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tope_acta_plataforma_equipo 
  ON sch_leangsp_prod.tope_acta_plataforma(id_equipo_plataforma);

GRANT ALL ON TABLE sch_leangsp_prod.tope_acta_plataforma TO usr_leangsp_prod;
GRANT USAGE, SELECT ON SEQUENCE sch_leangsp_prod.tope_acta_plataforma_id_acta_seq TO usr_leangsp_prod;

-- 2.2 Extensión Standby en sch_leangsp_prod.tedp_reporte_avance (Idempotente)
ALTER TABLE sch_leangsp_prod.tedp_reporte_avance
  ADD COLUMN IF NOT EXISTS horas_standby_cliente NUMERIC(4,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS horas_standby_gsp NUMERIC(4,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS motivo_standby TEXT;

-- ============================================================================
-- FASE 3: HOMOLOGACIÓN PRODUCCIÓN (sch_leangsp_prod)
-- MÓDULO 2: INVENTARIO & BODEGAS WMS LITE (tinv_*)
-- ============================================================================

-- 3.1 Secuencias de Inventario
CREATE SEQUENCE IF NOT EXISTS sch_leangsp_prod.seq_tinv_producto_sku START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sch_leangsp_prod.seq_tinv_recepcion_folio START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sch_leangsp_prod.seq_tinv_traspaso_folio START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS sch_leangsp_prod.seq_tinv_conteo_folio START WITH 1 INCREMENT BY 1;

-- 3.2 Ampliación de Columnas en tinv_bodega
ALTER TABLE sch_leangsp_prod.tinv_bodega 
  ADD COLUMN IF NOT EXISTS id_sucursal BIGINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS responsable VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tipo_bodega VARCHAR(50) DEFAULT 'CENTRAL',
  ADD COLUMN IF NOT EXISTS consolida_stock BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tinv_bodega_empresa_nombre 
  ON sch_leangsp_prod.tinv_bodega (id_empresa, nombre);

-- 3.3 Tabla tinv_ubicacion
CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_ubicacion (
    id_ubicacion BIGSERIAL PRIMARY KEY,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_bodega(id_bodega),
    codigo VARCHAR(30) NOT NULL,
    estanteria VARCHAR(10),
    nivel VARCHAR(5),
    posicion VARCHAR(5),
    tipo_zona VARCHAR(30) NOT NULL DEFAULT 'RACK',
    permite_mezcla_sku BOOLEAN NOT NULL DEFAULT true,
    estado VARCHAR(20) NOT NULL DEFAULT 'OPERATIVA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_ubicacion_bodega_codigo UNIQUE (id_bodega, codigo)
);

CREATE INDEX IF NOT EXISTS idx_tinv_ubicacion_coords 
  ON sch_leangsp_prod.tinv_ubicacion(id_bodega, estanteria, nivel, posicion);

-- 3.4 Ampliación de Columnas en tinv_producto
ALTER TABLE sch_leangsp_prod.tinv_producto 
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_tinv_producto_empresa_sku 
  ON sch_leangsp_prod.tinv_producto (id_empresa, sku);

CREATE INDEX IF NOT EXISTS idx_tinv_producto_busqueda 
  ON sch_leangsp_prod.tinv_producto(id_empresa, familia, impacto_operacional, estado);

CREATE INDEX IF NOT EXISTS idx_tinv_producto_legado 
  ON sch_leangsp_prod.tinv_producto(id_empresa, codigo_legado);

-- 3.5 Tablas Relacionales de Catálogo
CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_producto_referencia (
    id_referencia BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto) ON DELETE CASCADE,
    tipo_referencia VARCHAR(20) NOT NULL DEFAULT 'OEM',
    marca VARCHAR(50) NOT NULL,
    codigo_referencia VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_producto_referencia UNIQUE (id_producto, tipo_referencia, marca, codigo_referencia)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_producto_compatibilidad (
    id_compatibilidad BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto) ON DELETE CASCADE,
    modelo_equipo VARCHAR(100) NOT NULL,
    notas VARCHAR(255),
    CONSTRAINT uq_tinv_producto_compatibilidad UNIQUE (id_producto, modelo_equipo)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_lote (
    id_lote BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto),
    numero_lote VARCHAR(50) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    proveedor VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_lote_producto_numero UNIQUE (id_producto, numero_lote)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_serie (
    id_serie BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto),
    numero_serie VARCHAR(100) NOT NULL,
    estado_rotable VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE_BODEGA',
    id_equipo_instalado BIGINT,
    horometro_instalacion NUMERIC(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_serie_producto_numero UNIQUE (id_producto, numero_serie)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_stock (
    id_stock BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto),
    id_ubicacion BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_ubicacion(id_ubicacion),
    id_lote BIGINT REFERENCES sch_leangsp_prod.tinv_lote(id_lote),
    id_serie BIGINT REFERENCES sch_leangsp_prod.tinv_serie(id_serie),
    cantidad_fisica NUMERIC(14,4) NOT NULL DEFAULT 0.0000,
    cantidad_reservada NUMERIC(14,4) NOT NULL DEFAULT 0.0000,
    estado_stock VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Ampliación de Columnas en tinv_movimiento
ALTER TABLE sch_leangsp_prod.tinv_movimiento 
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

-- 3.7 Tablas Transaccionales de Recepción, Traspaso y Conteo
CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_recepcion (
    id_recepcion BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    numero_folio VARCHAR(30) NOT NULL,
    tipo_ingreso VARCHAR(30) NOT NULL DEFAULT 'ORDEN_COMPRA',
    documento_referencia VARCHAR(50),
    proveedor_o_origen VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    id_usuario_recepcion BIGINT NOT NULL,
    id_usuario_aprobacion BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tinv_recepcion_folio UNIQUE (id_empresa, numero_folio)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_recepcion_linea (
    id_linea BIGSERIAL PRIMARY KEY,
    id_recepcion BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_recepcion(id_recepcion) ON DELETE CASCADE,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto),
    id_ubicacion_destino BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_ubicacion(id_ubicacion),
    cantidad_recibida NUMERIC(14,4) NOT NULL,
    unidad_presentacion VARCHAR(20),
    factor_conversion NUMERIC(12,4) DEFAULT 1.0,
    cantidad_base NUMERIC(14,4) NOT NULL,
    costo_unitario_moneda NUMERIC(15,2) DEFAULT 0.00,
    costo_unitario_base NUMERIC(15,2) DEFAULT 0.00,
    lote_texto VARCHAR(50),
    serie_texto VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_traspaso_linea (
    id_traspaso_linea BIGSERIAL PRIMARY KEY,
    id_traspaso BIGINT NOT NULL,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto),
    id_ubicacion_origen BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_ubicacion(id_ubicacion),
    id_ubicacion_destino BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_ubicacion(id_ubicacion),
    cantidad NUMERIC(14,4) NOT NULL,
    costo_unitario_pmp NUMERIC(15,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_conteo (
    id_conteo BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    codigo_proceso VARCHAR(30) NOT NULL,
    id_bodega BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_bodega(id_bodega),
    tipo_conteo VARCHAR(20) NOT NULL DEFAULT 'TOTAL',
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    id_usuario_responsable BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cerrado_at TIMESTAMPTZ,
    CONSTRAINT uq_tinv_conteo_empresa_codigo UNIQUE (id_empresa, codigo_proceso)
);

CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tinv_conteo_linea (
    id_linea BIGSERIAL PRIMARY KEY,
    id_conteo BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_conteo(id_conteo) ON DELETE CASCADE,
    id_producto BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_producto(id_producto),
    id_ubicacion BIGINT NOT NULL REFERENCES sch_leangsp_prod.tinv_ubicacion(id_ubicacion),
    stock_sistema NUMERIC(14,4) NOT NULL,
    stock_fisico NUMERIC(14,4),
    diferencia NUMERIC(14,4) GENERATED ALWAYS AS (COALESCE(stock_fisico, 0) - stock_sistema) STORED,
    justificacion_ajuste TEXT
);

-- Permisos y Grants a usuario de producción
GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;

-- ============================================================================
-- FASE 4: GOBERNANZA BD (tcfg_backlog y tcfg_releases)
-- ============================================================================

-- 4.1 DEV: tcfg_backlog
INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
VALUES 
(
  'REQ-1055',
  'Ajustes Operacionales PWA Operador, Combustible en Patio, Horómetros Opcionales, Horas Standby y Extensión Comercial Multi-Día',
  'Implementación de SPEC-084: Registro de combustible estricto en Salida/Llegada de Patio; pantalla En Ruta simplificada; horómetro de superestructura opcional universal; segregación de Standby Cliente y Standby GSP con recálculo de efectivas/facturables; inducción de viaje de retorno al cerrar último día; modal de extensión comercial multi-día en Gestor de Oportunidades.',
  'Alta',
  CURRENT_DATE,
  'Sergio Gajardo',
  'Implementado'
),
(
  'REQ-1056',
  'Integración Multicanal del Centro de Documentación y Manuales Oficiales del Ecosistema GSP',
  'Implementación de SPEC-085: Sincronización de 15 manuales HTML enriquecidos con matriz de 5 columnas; nuevo Centro de Documentación en Web CRM (/documentacion) y Sidebar; accesos táctiles directos en PWA Operador; enlace contextual de asistencia técnica en Hoja de Ruta de choferes.',
  'Alta',
  CURRENT_DATE,
  'Sergio Gajardo',
  'Implementado'
)
ON CONFLICT (codigo_req) DO UPDATE SET 
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- 4.2 DEV: tcfg_releases
INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
VALUES 
(
  'v1.0.148',
  'Portal Web GSP v1.0.148 - Centro de Documentación Multicanal, Extensión de Servicios y Gestión de Standby',
  'Feature',
  'Integración de Centro de Documentación oficial (/documentacion) con visor embebido y 15 manuales interactivos; soporte de extensión multi-día en CRM; visualización de horas standby imputables vs deducibles en reportes de avance.',
  jsonb_build_array('REQ-1055', 'REQ-1056'),
  'Sergio Gajardo'
)
ON CONFLICT (version) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  tipo_release = EXCLUDED.tipo_release,
  descripcion_impacto = EXCLUDED.descripcion_impacto,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- 4.3 PROD: tcfg_backlog
INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
VALUES 
(
  'REQ-1055',
  'Ajustes Operacionales PWA Operador, Combustible en Patio, Horómetros Opcionales, Horas Standby y Extensión Comercial Multi-Día',
  'Implementación de SPEC-084: Registro de combustible estricto en Salida/Llegada de Patio; pantalla En Ruta simplificada; horómetro de superestructura opcional universal; segregación de Standby Cliente y Standby GSP con recálculo de efectivas/facturables; inducción de viaje de retorno al cerrar último día; modal de extensión comercial multi-día en Gestor de Oportunidades.',
  'Alta',
  CURRENT_DATE,
  'Sergio Gajardo',
  'Implementado'
),
(
  'REQ-1056',
  'Integración Multicanal del Centro de Documentación y Manuales Oficiales del Ecosistema GSP',
  'Implementación de SPEC-085: Sincronización de 15 manuales HTML enriquecidos con matriz de 5 columnas; nuevo Centro de Documentación en Web CRM (/documentacion) y Sidebar; accesos táctiles directos en PWA Operador; enlace contextual de asistencia técnica en Hoja de Ruta de choferes.',
  'Alta',
  CURRENT_DATE,
  'Sergio Gajardo',
  'Implementado'
)
ON CONFLICT (codigo_req) DO UPDATE SET 
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

-- 4.4 PROD: tcfg_releases
INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
VALUES 
(
  'v1.0.148',
  'Portal Web GSP v1.0.148 - Centro de Documentación Multicanal, Extensión de Servicios y Gestión de Standby',
  'Feature',
  'Integración de Centro de Documentación oficial (/documentacion) con visor embebido y 15 manuales interactivos; soporte de extensión multi-día en CRM; visualización de horas standby imputables vs deducibles en reportes de avance.',
  jsonb_build_array('REQ-1055', 'REQ-1056'),
  'Sergio Gajardo'
)
ON CONFLICT (version) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  tipo_release = EXCLUDED.tipo_release,
  descripcion_impacto = EXCLUDED.descripcion_impacto,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;
