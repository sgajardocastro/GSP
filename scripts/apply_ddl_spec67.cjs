const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== APLICANDO DDL SPEC-067 (DEV & PROD) ===\n');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];

  for (const s of schemas) {
    console.log(`--- Procesando esquema ${s} ---`);

    // 1. Rol SECRETARIA
    const sqlRol = `
      INSERT INTO ${s}.tsec_roles (name_rol, description, activo, id_empresa)
      VALUES ('SECRETARIA', 'Secretaria de Operaciones - Confección y liquidación de informes ITS', true, 1)
      ON CONFLICT (name_rol) DO UPDATE SET 
        description = EXCLUDED.description,
        activo = true;
    `;
    const resRol = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlRol.replace(/\n/g, ' ')}\\""`);
    console.log('Rol SECRETARIA:', resRol.stdout.trim() || resRol.stderr.trim());

    // 2. Columnas en tits_transicion_historial
    const sqlCols = `
      ALTER TABLE ${s}.tits_transicion_historial 
        ADD COLUMN IF NOT EXISTS firmas_fes JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS historial_observaciones JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS id_usuario_elaborador INT,
        ADD COLUMN IF NOT EXISTS id_usuario_verificador INT,
        ADD COLUMN IF NOT EXISTS id_usuario_aprobador INT;
    `;
    const resCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlCols.replace(/\n/g, ' ')}\\""`);
    console.log('Columnas tits_transicion_historial:', resCols.stdout.trim() || resCols.stderr.trim());
  }

  console.log('\n=== VERIFICANDO COLUMNAS EN TITS_TRANSICION_HISTORIAL ===');
  for (const s of schemas) {
    const resCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${s}' AND table_name = 'tits_transicion_historial'
      ORDER BY ordinal_position;
    \\""`);
    console.log(`Esquema ${s}:`);
    resCheck.stdout.split('\n').filter(Boolean).forEach(c => console.log('  ' + c));
  }

  ssh.dispose();
  console.log('\n=== DDL SPEC-067 COMPLETADA EXITOSAMENTE ===');
}

run().catch(console.error);
