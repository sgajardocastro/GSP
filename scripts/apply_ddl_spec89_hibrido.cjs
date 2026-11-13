const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('=== APLICANDO DDL SPEC-089: INTEGRACION HIBRIDA MANTENIMIENTO - INVENTARIO (DEV) ===\n');
  
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schema = 'sch_leangsp';
  console.log(`--- Procesando esquema ${schema} en DEV ---`);

  const sql = `
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

    GRANT ALL PRIVILEGES ON TABLE ${schema}.tmnt_ot_repuesto TO usr_leangsp, usrpglgbl;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO usr_leangsp, usrpglgbl;
  `;

  // Escribir script a archivo temporal remoto para evitar problemas de escape de bash ($$)
  const remoteFilePath = '/tmp/apply_spec89.sql';
  await ssh.execCommand(`cat << 'EOF' > ${remoteFilePath}\n${sql}\nEOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteFilePath}"`);
  console.log('Salida de ejecución DDL:');
  console.log(res.stdout || res.stderr);

  if (res.stderr && res.stderr.includes('ERROR:')) {
    throw new Error('Error al ejecutar DDL: ' + res.stderr);
  }

  console.log('\n=== VERIFICANDO COLUMNAS EN sch_leangsp.tmnt_ot_repuesto ===');
  const resCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'tmnt_ot_repuesto'
    ORDER BY ordinal_position;
  \\""`);
  console.log(resCols.stdout);

  console.log('=== VERIFICANDO CONSTRAINTS EN sch_leangsp.tmnt_ot_repuesto ===');
  const resConstraints = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = '${schema}.tmnt_ot_repuesto'::regclass;
  \\""`);
  console.log(resConstraints.stdout);

  // Limpiar archivo temporal
  await ssh.execCommand(`rm -f ${remoteFilePath}`);

  ssh.dispose();
  console.log('\n=== DDL SPEC-089 COMPLETADO CON 0 ERRORES ===');
}

run().catch((err) => {
  console.error('Error fatal al ejecutar DDL:', err);
  process.exit(1);
});
