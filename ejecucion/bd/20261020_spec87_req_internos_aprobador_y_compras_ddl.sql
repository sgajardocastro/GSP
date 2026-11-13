-- ============================================================================
-- SCRIPT DDL: SPEC 87 - REQUERIMIENTOS INTERNOS, APROBADOR MÓVIL GERENCIA 
--             (WEB TOKEN 1 USO) Y MÓDULO DE COMPRAS / OCs MULTI-EMPRESA
-- Proyecto: Grúas San Pablo (GSP) / LeanGlobal Platform
-- Esquemas objetivo: sch_leangsp (DEV) / sch_leangsp_prod (PROD)
-- Fecha: 2026-10-20
-- ============================================================================

-- Nota: El runner o sesión define el search_path (sch_leangsp o sch_leangsp_prod)
-- Por defecto apuntamos a sch_leangsp para ejecución directa en DEV:
SET search_path TO sch_leangsp, public;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIÓN DE tpry_proyecto PARA REQUERIMIENTOS INTERNOS Y V°B° GERENCIA
-- ----------------------------------------------------------------------------
ALTER TABLE tpry_proyecto
    ADD COLUMN IF NOT EXISTS es_interno BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS tipo_movimiento_interno VARCHAR(40),
    ADD COLUMN IF NOT EXISTS sucursal_origen VARCHAR(120),
    ADD COLUMN IF NOT EXISTS sucursal_destino VARCHAR(120),
    ADD COLUMN IF NOT EXISTS estado_vb_gerencia VARCHAR(25) NOT NULL DEFAULT 'NO_REQUERIDO',
    ADD COLUMN IF NOT EXISTS observacion_vb_gerencia TEXT,
    ADD COLUMN IF NOT EXISTS fecha_vb_gerencia TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tpry_proyecto_es_interno 
    ON tpry_proyecto(id_empresa, es_interno, id_proyecto_estado);

CREATE INDEX IF NOT EXISTS idx_tpry_proyecto_vb_gerencia 
    ON tpry_proyecto(id_empresa, estado_vb_gerencia);

-- ----------------------------------------------------------------------------
-- 2. TABLA POLIMÓRFICA: tapr_gerencia_token (Web Token de 1 Solo Uso - Omar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tapr_gerencia_token (
    id_token            BIGSERIAL PRIMARY KEY,
    token_uuid          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    id_empresa          BIGINT NOT NULL, -- 9: GSP, 11: Royal Rental, 7: Bestmaq, 8: Logística del Sur
    tipo_entidad        VARCHAR(30) NOT NULL 
                        CHECK (tipo_entidad IN ('NEGOCIO_COMERCIAL', 'REQUERIMIENTO_INTERNO', 'ORDEN_COMPRA')),
    id_entidad_ref      BIGINT NOT NULL, -- id_proyecto o id_oc
    folio_referencia    VARCHAR(50) NOT NULL, -- 'GSP-2610-084', 'INT-2610-001', 'OC-GSP-2610-042'
    es_monetario        BOOLEAN NOT NULL DEFAULT true,
    monto_neto_ref      NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    resumen_variables   JSONB NOT NULL DEFAULT '{}'::jsonb, -- Snapshot exacto de variables mostradas a Omar
    estado_token        VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (estado_token IN ('PENDIENTE', 'APROBADO', 'APROBADO_CON_OBS', 'RECHAZADO', 'ANULADO')),
    observacion_omar    TEXT,
    id_usuario_solicita BIGINT,
    nombre_solicita     VARCHAR(150),
    id_usuario_aprueba  BIGINT,
    nombre_aprueba      VARCHAR(150) DEFAULT 'Luis Omar Ghisellini Jara',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
    fecha_resolucion    TIMESTAMPTZ,
    ip_resolucion       VARCHAR(60),
    user_agent          TEXT,
    firma_hash_fes      VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_tapr_gerencia_token_entidad 
    ON tapr_gerencia_token(tipo_entidad, id_entidad_ref, estado_token);

CREATE INDEX IF NOT EXISTS idx_tapr_gerencia_token_pendientes 
    ON tapr_gerencia_token(id_empresa, estado_token, fecha_creacion DESC);

-- ----------------------------------------------------------------------------
-- 3. SECUENCIAS Y TABLA: tcmp_solicitud_pedido (Tickets Operaciones / Taller)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_tcmp_solicitud_folio START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_tcmp_oc_folio START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS tcmp_solicitud_pedido (
    id_solicitud        BIGSERIAL PRIMARY KEY,
    folio_solicitud     VARCHAR(40) NOT NULL UNIQUE, -- 'SP-2610-0001'
    id_empresa          BIGINT NOT NULL,             -- Razón social sugerida (9, 11, 7, 8)
    origen_solicitud    VARCHAR(30) NOT NULL DEFAULT 'OPERACIONES_OT'
                        CHECK (origen_solicitud IN ('OPERACIONES_OT', 'TALLER_BODEGA', 'ADMINISTRACION')),
    id_proyecto         BIGINT REFERENCES tpry_proyecto(id_proyecto) ON DELETE SET NULL,
    id_ot_mantenimiento BIGINT,                      -- Referencia a tmnt_ot(id_ot)
    id_equipo           BIGINT,                      -- Referencia a tequ_equipo(id_equipo)
    rubro_its           VARCHAR(40) DEFAULT 'GASTO_EXTRA'
                        CHECK (rubro_its IN (
                            'FLETE_EXTERNO', 'PERSONAL_EXTERNO', 'PENSION_ALOJAMIENTO', 
                            'VIATICO_ALIMENTACION', 'MOVILIZACION', 'PEAJE_TAG', 
                            'GASTO_EXTRA', 'REPUESTOS_TALLER', 'INSUMOS_BODEGA'
                        )),
    titulo_necesidad    VARCHAR(255) NOT NULL,
    justificacion       TEXT,
    proveedor_sugerido  VARCHAR(150),
    monto_estimado_neto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    prioridad           VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
                        CHECK (prioridad IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE_PARADA')),
    items_json          JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado              VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_COMPRAS'
                        CHECK (estado IN ('PENDIENTE_COMPRAS', 'EN_COTIZACION', 'CONVERTIDA_OC', 'RECHAZADA', 'ANULADA')),
    id_usuario_solicita BIGINT NOT NULL,
    nombre_solicita     VARCHAR(150),
    observacion_compras TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tcmp_solicitud_estado 
    ON tcmp_solicitud_pedido(id_empresa, estado, prioridad, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tcmp_solicitud_proyecto 
    ON tcmp_solicitud_pedido(id_proyecto);

-- ----------------------------------------------------------------------------
-- 4. TABLAS: tcmp_orden_compra y tcmp_orden_compra_linea (Eduardo ➔ Omar ➔ Laudus)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tcmp_orden_compra (
    id_oc                       BIGSERIAL PRIMARY KEY,
    folio_oc                    VARCHAR(50) NOT NULL UNIQUE, -- 'OC-GSP-2610-0001', 'OC-RYL-2610-0002'
    id_empresa                  BIGINT NOT NULL,             -- Razón Social Emisora (9: GSP, 11: Royal, 7: Bestmaq, 8: Logística)
    id_solicitud                BIGINT REFERENCES tcmp_solicitud_pedido(id_solicitud) ON DELETE SET NULL,
    id_proyecto                 BIGINT REFERENCES tpry_proyecto(id_proyecto) ON DELETE SET NULL,
    id_ot_mantenimiento         BIGINT,
    rubro_its                   VARCHAR(40),
    -- Datos del Proveedor
    id_empresa_proveedor        BIGINT,
    rut_proveedor               VARCHAR(30) NOT NULL,
    razon_social_proveedor      VARCHAR(200) NOT NULL,
    contacto_proveedor          VARCHAR(150),
    email_proveedor             VARCHAR(150),
    telefono_proveedor          VARCHAR(50),
    condicion_pago              VARCHAR(60) NOT NULL DEFAULT 'Crédito 30 días',
    moneda                      VARCHAR(10) NOT NULL DEFAULT 'CLP',
    -- Totales Financieros
    monto_neto                  NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monto_exento                NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monto_iva                   NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monto_total                 NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    glosa_general               TEXT,
    -- Ciclo de Vida y Autorización Móvil de Omar
    estado_oc                   VARCHAR(30) NOT NULL DEFAULT 'BORRADOR'
                                CHECK (estado_oc IN (
                                    'BORRADOR', 'PENDIENTE_VB_OMAR', 'AUTORIZADA', 
                                    'AUTORIZADA_CON_OBS', 'RECHAZADA', 'ENVIADA_PROVEEDOR', 
                                    'RECEPCIONADA_BODEGA', 'FACTURADA_LAUDUS', 'ANULADA'
                                )),
    id_token_vigente            BIGINT REFERENCES tapr_gerencia_token(id_token) ON DELETE SET NULL,
    observacion_gerencia        TEXT,
    fecha_autorizacion_gerencia TIMESTAMPTZ,
    id_doc_pdf                  BIGINT, -- Referencia a tfmg_file(id_doc) con el PDF timbrado FES
    -- Integración Contable Laudus ERP (Maritza)
    imputado_en_its             BOOLEAN NOT NULL DEFAULT false,
    id_recepcion_bodega         BIGINT, -- Referencia a tinv_recepcion(id_recepcion)
    folio_laudus_oc             VARCHAR(50),
    folio_dte_factura_compra    VARCHAR(50),
    fecha_sincronizacion_laudus TIMESTAMPTZ,
    -- Trazabilidad de Usuarios
    id_usuario_emite            BIGINT NOT NULL, -- Eduardo / Adquisiciones
    nombre_emite                VARCHAR(150),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tcmp_oc_empresa_estado 
    ON tcmp_orden_compra(id_empresa, estado_oc, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tcmp_oc_proyecto 
    ON tcmp_orden_compra(id_proyecto);

CREATE TABLE IF NOT EXISTS tcmp_orden_compra_linea (
    id_oc_linea         BIGSERIAL PRIMARY KEY,
    id_oc               BIGINT NOT NULL REFERENCES tcmp_orden_compra(id_oc) ON DELETE CASCADE,
    numero_item         INT NOT NULL DEFAULT 1,
    id_producto         BIGINT, -- Opcional: FK hacia tinv_producto(id_producto) si es repuesto catalogado
    sku_codigo          VARCHAR(50),
    descripcion          VARCHAR(255) NOT NULL,
    unidad_medida       VARCHAR(20) NOT NULL DEFAULT 'UN',
    cantidad            NUMERIC(14,4) NOT NULL DEFAULT 1.0000 CHECK (cantidad > 0),
    precio_unitario     NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    descuento_pct       NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    subtotal_neto       NUMERIC(15,2) GENERATED ALWAYS AS (ROUND(cantidad * precio_unitario * (1 - descuento_pct / 100.0), 0)) STORED
);

CREATE INDEX IF NOT EXISTS idx_tcmp_oc_linea_oc 
    ON tcmp_orden_compra_linea(id_oc);

-- ============================================================================
-- FIN DDL SPEC 87
-- ============================================================================
