const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== APLICANDO DDL SPEC-068: PERSISTENCIA PLANILLAS GERALDSOFT (DEV & PROD) ===\n');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];

  for (const s of schemas) {
    console.log(`--- Procesando esquema ${s} ---`);

    const sqlTable = `
      CREATE TABLE IF NOT EXISTS ${s}.tits_geraldsoft_planillas (
        id_planilla SERIAL PRIMARY KEY,
        tipo_planilla VARCHAR(50) NOT NULL,
        nombre_archivo VARCHAR(255) NOT NULL,
        total_registros INTEGER DEFAULT 0,
        data_json JSONB NOT NULL,
        id_usuario INTEGER REFERENCES ${s}.tsec_users(id_user),
        fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT TRUE
      );
      CREATE INDEX IF NOT EXISTS idx_tits_geraldsoft_${s}_tipo ON ${s}.tits_geraldsoft_planillas(tipo_planilla, activo);
    `;

    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlTable.replace(/\n/g, ' ')}\\""`);
    console.log(`Tabla ${s}.tits_geraldsoft_planillas:`, res.stdout.trim() || res.stderr.trim());
  }

  console.log('\n=== VERIFICANDO EXISTENCIA EN AMBOS ESQUEMAS ===');
  for (const s of schemas) {
    const resCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${s}' AND table_name = 'tits_geraldsoft_planillas'
      ORDER BY ordinal_position;
    \\""`);
    console.log(`Esquema ${s}:`);
    resCheck.stdout.split('\n').filter(Boolean).forEach(c => console.log('  ' + c));
  }

  ssh.dispose();
  console.log('\n=== DDL SPEC-068 COMPLETADA EXITOSAMENTE ===');
}

run().catch(console.error);
