const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('=== APLICANDO DDL SPEC-094: TRASPASOS & TRASLADOS ENTRE BODEGAS (DEV) ===\n');
  
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schema = 'sch_leangsp';
  console.log(`--- Procesando esquema ${schema} en DEV ---`);

  // 1. Consultar estado actual de tinv_traspaso y tinv_traspaso_linea
  console.log('1. Inspeccionando estructura previa...');
  const resPrevCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name IN ('tinv_traspaso', 'tinv_traspaso_linea')
    ORDER BY table_name, ordinal_position;
  \\""`);
  console.log(resPrevCols.stdout);

  const sql = `
    -- Extensión de tinv_traspaso
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

    -- Permitir que la cabecera del traspaso sea multi-línea (líneas viven en tinv_traspaso_linea)
    ALTER TABLE ${schema}.tinv_traspaso ALTER COLUMN id_producto DROP NOT NULL;
    ALTER TABLE ${schema}.tinv_traspaso ALTER COLUMN cantidad DROP NOT NULL;
    ALTER TABLE ${schema}.tinv_traspaso ALTER COLUMN id_bodega_destino DROP NOT NULL;

    -- Extensión de tinv_traspaso_linea
    ALTER TABLE ${schema}.tinv_traspaso_linea
      ADD COLUMN IF NOT EXISTS id_ubicacion_origen BIGINT REFERENCES ${schema}.tinv_ubicacion(id_ubicacion),
      ADD COLUMN IF NOT EXISTS id_ubicacion_destino BIGINT REFERENCES ${schema}.tinv_ubicacion(id_ubicacion),
      ADD COLUMN IF NOT EXISTS costo_unitario_pmp NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS costo_total NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

    -- Secuencia de folios para Guías de Despacho Interno
    CREATE SEQUENCE IF NOT EXISTS ${schema}.seq_tinv_traspaso_folio START WITH 1;

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

    GRANT ALL PRIVILEGES ON TABLE ${schema}.tinv_traspaso TO usr_leangsp, usrpglgbl;
    GRANT ALL PRIVILEGES ON TABLE ${schema}.tinv_traspaso_linea TO usr_leangsp, usrpglgbl;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO usr_leangsp, usrpglgbl;
  `;

  const remoteFilePath = '/tmp/apply_spec94.sql';
  await ssh.execCommand(`cat << 'EOF' > ${remoteFilePath}\n${sql}\nEOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteFilePath}"`);
  console.log('Salida de ejecución DDL:');
  console.log(res.stdout || res.stderr);

  if (res.stderr && res.stderr.includes('ERROR:')) {
    throw new Error('Error al ejecutar DDL: ' + res.stderr);
  }

  console.log('\n=== VERIFICANDO COLUMNAS NUEVAS EN tinv_traspaso ===');
  const resCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'tinv_traspaso'
    ORDER BY ordinal_position;
  \\""`);
  console.log(resCols.stdout);

  console.log('\n=== VERIFICANDO COLUMNAS EN tinv_traspaso_linea ===');
  const resLineas = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'tinv_traspaso_linea'
    ORDER BY ordinal_position;
  \\""`);
  console.log(resLineas.stdout);

  await ssh.execCommand(`rm -f ${remoteFilePath}`);
  ssh.dispose();
  console.log('\n DDL SPEC-094 COMPLETADO EXITOSAMENTE');
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
