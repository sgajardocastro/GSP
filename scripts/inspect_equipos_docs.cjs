const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO CERTIFICADOS EQUIPO EN DEV Y PROD ===');
  const r1 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT count(*) FROM sch_leangsp.tequ_certificados_equipo;'\"");
  console.log('DEV tequ_certificados_equipo count:\n', r1.stdout.trim());

  const r2 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT count(*) FROM sch_leangsp_prod.tequ_certificados_equipo;'\"");
  console.log('PROD tequ_certificados_equipo count:\n', r2.stdout.trim());

  const r3 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT * FROM sch_leangsp.tequ_certificados_equipo LIMIT 5;'\"");
  console.log('DEV sample:\n', r3.stdout.trim());

  const r4 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT * FROM sch_leangsp_prod.tequ_certificados_equipo LIMIT 5;'\"");
  console.log('PROD sample:\n', r4.stdout.trim());

  const r5 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT count(*) FROM sch_leangsp.tequ_equipo;'\"");
  console.log('DEV tequ_equipo count:\n', r5.stdout.trim());

  const r6 = await ssh.execCommand("su - postgres -c \"psql -d postgres -c 'SELECT count(*) FROM sch_leangsp_prod.tequ_equipo;'\"");
  console.log('PROD tequ_equipo count:\n', r6.stdout.trim());

  ssh.dispose();
}

check().catch(console.error);
