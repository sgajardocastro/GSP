const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function applyDdl() {
  console.log('Conectando a SSH para ejecutar DDL en sch_leangsp...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    ALTER TABLE sch_leangsp.tmnt_ot_actividad 
      ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb;
  `;

  console.log('Ejecutando SQL en PostgreSQL sch_leangsp...');
  const cmd = `su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`;
  const res = await ssh.execCommand(cmd);
  console.log('Resultado DDL:', res.stdout.trim() || res.stderr.trim());

  // Verificar columnas
  const checkCmd = `su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tmnt_ot_actividad';\\""`;
  const checkRes = await ssh.execCommand(checkCmd);
  console.log('Estructura tmnt_ot_actividad:\n', checkRes.stdout.trim());

  ssh.dispose();
}

applyDdl().catch(err => {
  console.error('Error aplicando DDL:', err);
  process.exit(1);
});
