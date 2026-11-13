const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('Conectando a servidor remoto 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });
  console.log('SSH Conectado.');

  const sql = `
    DROP TRIGGER IF EXISTS trg_chk_cierre_ot_registro ON sch_leangsp.tmnt_ot_cierre;
    DROP TRIGGER IF EXISTS trg_chk_cierre_ot_registro ON sch_leangsp_prod.tmnt_ot_cierre;
    DROP TRIGGER IF EXISTS trg_chk_cierre_ot_estado ON sch_leangsp.tmnt_ot;
    DROP TRIGGER IF EXISTS trg_chk_cierre_ot_estado ON sch_leangsp_prod.tmnt_ot;
  `;

  console.log('Ejecutando DROP TRIGGER en PostgreSQL (DEV y PROD)...');
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
  console.log('Resultado SQL:\n', res.stdout);
  if (res.stderr) console.error('STDERR:', res.stderr);

  console.log('Verificando triggers restantes en tmnt_ot y tmnt_ot_cierre...');
  const verifySql = `
    SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
    FROM information_schema.triggers
    WHERE event_object_schema IN ('sch_leangsp', 'sch_leangsp_prod')
      AND event_object_table IN ('tmnt_ot', 'tmnt_ot_cierre');
  `;
  const resVerify = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${verifySql}\\""`);
  console.log('Triggers activos:\n', resVerify.stdout);

  ssh.dispose();
  console.log('Operación concluida exitosamente.');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
