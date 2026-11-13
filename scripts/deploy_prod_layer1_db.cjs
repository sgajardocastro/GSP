const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runLayer1() {
  console.log('=== CAPA 1: DESPLIEGUE DDL Y GOBERNANZA EN BD PRODUCCION (sch_leangsp_prod) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schema = 'sch_leangsp_prod';
  console.log(`Conectado. Ejecutando migraciones DDL en esquema ${schema}...`);

  const sql = `
    -- 1. SPEC-089: Modelo Híbrido en tmnt_ot_repuesto
    ALTER TABLE ${schema}.tmnt_ot_repuesto 
      ADD COLUMN IF NOT EXISTS origen_insumo VARCHAR(25) DEFAULT 'COMPRA_DIRECTA',
      ADD COLUMN IF NOT EXISTS id_ubicacion BIGINT REFERENCES ${schema}.tinv_ubicacion(id_ubicacion),
      ADD COLUMN IF NOT EXISTS id_movimiento_kardex BIGINT REFERENCES ${schema}.tinv_movimiento(id_movimiento),
      ADD COLUMN IF NOT EXISTS numero_documento_compra VARCHAR(100);

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_tmnt_ot_repuesto_origen_insumo' 
          AND conrelid = '${schema}.tmnt_ot_repuesto'::regclass
      ) THEN
        ALTER TABLE ${schema}.tmnt_ot_repuesto 
          ADD CONSTRAINT chk_tmnt_ot_repuesto_origen_insumo 
          CHECK (origen_insumo IN ('BODEGA_WMS', 'COMPRA_DIRECTA'));
      END IF;
    END $$;

    -- 2. SPEC-094: Traspasos & Traslados en tinv_traspaso
    ALTER TABLE ${schema}.tinv_traspaso 
      ADD COLUMN IF NOT EXISTS numero_guia VARCHAR(50),
      ADD COLUMN IF NOT EXISTS tipo_traspaso VARCHAR(50) DEFAULT 'INTERBODEGA',
      ADD COLUMN IF NOT EXISTS empresa_destino_nombre VARCHAR(100),
      ADD COLUMN IF NOT EXISTS chofer_transporte VARCHAR(150),
      ADD COLUMN IF NOT EXISTS patente_transporte VARCHAR(20),
      ADD COLUMN IF NOT EXISTS id_usuario_creacion BIGINT,
      ADD COLUMN IF NOT EXISTS id_usuario_recepcion BIGINT,
      ADD COLUMN IF NOT EXISTS fecha_recepcion TIMESTAMP,
      ADD COLUMN IF NOT EXISTS observaciones TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

    -- Permitir traspasos multi-línea en cabecera
    ALTER TABLE ${schema}.tinv_traspaso ALTER COLUMN id_producto DROP NOT NULL;
    ALTER TABLE ${schema}.tinv_traspaso ALTER COLUMN cantidad DROP NOT NULL;
    ALTER TABLE ${schema}.tinv_traspaso ALTER COLUMN id_bodega_destino DROP NOT NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_tinv_traspaso_tipo' 
          AND conrelid = '${schema}.tinv_traspaso'::regclass
      ) THEN
        ALTER TABLE ${schema}.tinv_traspaso 
          ADD CONSTRAINT chk_tinv_traspaso_tipo 
          CHECK (tipo_traspaso IN ('INTERBODEGA', 'INTEREMPRESA'));
      END IF;
    END $$;

    -- 3. SPEC-094: Líneas de traspaso en tinv_traspaso_linea
    ALTER TABLE ${schema}.tinv_traspaso_linea
      ADD COLUMN IF NOT EXISTS id_ubicacion_origen BIGINT REFERENCES ${schema}.tinv_ubicacion(id_ubicacion),
      ADD COLUMN IF NOT EXISTS id_ubicacion_destino BIGINT REFERENCES ${schema}.tinv_ubicacion(id_ubicacion),
      ADD COLUMN IF NOT EXISTS costo_unitario_pmp NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS costo_total NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

    -- 4. Secuencia de folios para Guías de Despacho Interno
    CREATE SEQUENCE IF NOT EXISTS ${schema}.seq_tinv_traspaso_folio START WITH 1;

    -- 5. Ubicaciones físicas operativas para Bodegas 2 y 3 en PROD
    INSERT INTO ${schema}.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 2, 'ANF-REC', 'REC', '1', '1', 'PULMON_RECEPCION', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM ${schema}.tinv_ubicacion WHERE id_bodega = 2 AND codigo = 'ANF-REC');

    INSERT INTO ${schema}.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 2, 'ANF-R1-A1', 'R1', 'A', '1', 'RACK', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM ${schema}.tinv_ubicacion WHERE id_bodega = 2 AND codigo = 'ANF-R1-A1');

    INSERT INTO ${schema}.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 2, 'ANF-PATIO', 'PATIO', '1', '1', 'CORRAL_PATIO', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM ${schema}.tinv_ubicacion WHERE id_bodega = 2 AND codigo = 'ANF-PATIO');

    INSERT INTO ${schema}.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 3, 'MOV-PANIOL', 'PANIOL', '1', '1', 'PULMON_RECEPCION', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM ${schema}.tinv_ubicacion WHERE id_bodega = 3 AND codigo = 'MOV-PANIOL');

    INSERT INTO ${schema}.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 3, 'MOV-CAJON-1', 'CAJON', '1', '1', 'RACK', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM ${schema}.tinv_ubicacion WHERE id_bodega = 3 AND codigo = 'MOV-CAJON-1');

    INSERT INTO ${schema}.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 3, 'MOV-CAJON-2', 'CAJON', '1', '2', 'RACK', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM ${schema}.tinv_ubicacion WHERE id_bodega = 3 AND codigo = 'MOV-CAJON-2');

    -- 6. Gobernanza de Releases en PROD
    INSERT INTO ${schema}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.156',
      'Portal Web GSP v1.0.156 - Reingeniería Enterprise de Traspasos & Traslados entre Bodegas y Erradicación Total de Alertas Mantenimiento',
      'FEATURE',
      'Erradicación total de datos mock y alerts en TraspasosTrasladosView.vue. Conexión nativa con backend transaccional y tablas PostgreSQL tinv_traspaso y tinv_traspaso_linea. 4 KPIs ejecutivos en tiempo real, stepper de ruta de 4 etapas, modal de emisión GDI con validación atómica de existencias, y modal de recepción con asignación de casillero físico en bodega destino. Pulido integral de MantenimientoView.vue sustituyendo los 14 alert() de navegador por sistema de toasts corporativos no invasivos.',
      '["REQ-1066", "REQ-1067"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    -- 7. Grants y permisos de seguridad
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO usr_leangsp_prod, usrpglgbl;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO usr_leangsp_prod, usrpglgbl;
  `;

  const remoteSqlFile = '/tmp/deploy_prod_layer1.sql';
  await ssh.execCommand(`cat << 'EOF' > ${remoteSqlFile}\n${sql}\nEOF`);

  console.log('Ejecutando SQL en PostgreSQL...');
  const resPsql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteSqlFile}"`);
  console.log('Salida SQL:');
  console.log(resPsql.stdout || resPsql.stderr);

  if (resPsql.stderr && resPsql.stderr.includes('ERROR:')) {
    throw new Error('Error ejecutando DDL en PROD: ' + resPsql.stderr);
  }

  // Verificación empírica
  console.log('\n--- VERIFICACIÓN EMPÍRICA CAPA 1 EN PROD ---');
  const resColsTrp = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = 'tinv_traspaso';\\""`);
  console.log('Columnas tinv_traspaso en PROD:\n', resColsTrp.stdout);

  const resColsRep = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = 'tmnt_ot_repuesto' AND column_name IN ('origen_insumo', 'id_ubicacion', 'id_movimiento_kardex', 'numero_documento_compra');\\""`);
  console.log('Columnas nuevas tmnt_ot_repuesto en PROD:\n', resColsRep.stdout);

  const resUbicProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_bodega, count(*) FROM ${schema}.tinv_ubicacion GROUP BY id_bodega ORDER BY id_bodega;\\""`);
  console.log('Ubicaciones por bodega en PROD:\n', resUbicProd.stdout);

  await ssh.execCommand(`rm -f ${remoteSqlFile}`);
  ssh.dispose();
  console.log('✅ CAPA 1 (BASE DE DATOS PRODUCCIÓN) DESPLEGADA EXITOSAMENTE.');
}

runLayer1().catch(err => {
  console.error('Error fatal en Capa 1:', err);
  process.exit(1);
});
