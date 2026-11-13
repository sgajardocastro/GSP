const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function alterHallazgoTable() {
  console.log('Conectando a servidor SSH para migración DDL en tmnt_hallazgo (sch_leangsp)...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    console.log(`Aplicando columnas a ${s}.tmnt_hallazgo...`);
    const sql = `
      ALTER TABLE ${s}.tmnt_hallazgo ADD COLUMN IF NOT EXISTS fotos_cierre JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE ${s}.tmnt_hallazgo ADD COLUMN IF NOT EXISTS solucion_aplicada TEXT NULL;
    `;
    const cmd = `su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`;
    const res = await ssh.execCommand(cmd);
    console.log(`Resultado ${s}:\n`, res.stdout || res.stderr);
  }

  ssh.dispose();
}

alterHallazgoTable().catch(err => {
  console.error('Error alterando tmnt_hallazgo:', err);
  process.exit(1);
});
