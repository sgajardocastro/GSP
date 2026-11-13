const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== APLICANDO DDL SPEC-070: COLUMNAS DE INGESTA INCREMENTAL (DEV & PROD) ===\n');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];

  for (const s of schemas) {
    console.log(`--- Procesando esquema ${s} ---`);

    const sqlAlter = `
      ALTER TABLE ${s}.tits_geraldsoft_planillas 
      ADD COLUMN IF NOT EXISTS modo_carga VARCHAR(30) DEFAULT 'REEMPLAZO',
      ADD COLUMN IF NOT EXISTS registros_nuevos INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS registros_actualizados INTEGER DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_tits_geraldsoft_${s}_activo_fecha ON ${s}.tits_geraldsoft_planillas(tipo_planilla, activo, fecha_carga DESC);
    `;

    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlAlter.replace(/\n/g, ' ')}\\""`);
    console.log(`Alter ${s}.tits_geraldsoft_planillas:`, res.stdout.trim() || res.stderr.trim());
  }

  console.log('\n=== VERIFICANDO COLUMNAS EN AMBOS ESQUEMAS ===');
  for (const s of schemas) {
    const resCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${s}' AND table_name = 'tits_geraldsoft_planillas'
      ORDER BY ordinal_position;
    \\""`);
    console.log(`Esquema ${s}:`);
    resCheck.stdout.split('\n').filter(Boolean).forEach(c => console.log('  ' + c));
  }

  ssh.dispose();
  console.log('\n=== DDL SPEC-070 COMPLETADA EXITOSAMENTE ===');
}

run().catch(console.error);
