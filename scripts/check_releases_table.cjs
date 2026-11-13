const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkReleases() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tcfg_releases';\\""`);
  console.log('Columnas tcfg_releases:\n', res.stdout);

  const res2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id, version, titulo, fecha_release FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 5;\\""`);
  console.log('Últimos releases PROD:\n', res2.stdout);

  const res3 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id, version, titulo, fecha_release FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 5;\\""`);
  console.log('Últimos releases DEV:\n', res3.stdout);

  ssh.dispose();
}

checkReleases().catch(console.error);
