const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkProjects() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, nombre_proyecto, codi_proyecto, estado_solicitud_visita FROM sch_leangsp_prod.tpry_proyecto;\\""`);
  console.log('Proyectos en sch_leangsp_prod:');
  console.log(res.stdout);

  ssh.dispose();
}

checkProjects().catch(console.error);
