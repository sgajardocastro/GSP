const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function readFullController() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `sed -n '102,150p' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/asignacionRecursosController.js`;
  const res = await ssh.execCommand(cmd);
  console.log('getAsignacionesEquipo full query:\n', res.stdout);

  const cmdQuery = `su - nodeadmin -c "node -e \\\"
    require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
    const { pool } = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/db');
    pool.query('SELECT re.id_rel_equipo, re.id_equipo, e.patente, re.rol_equipo, re.estado_real FROM tpry_rel_equipo re JOIN tequ_equipo e ON re.id_equipo = e.id_equipo WHERE re.id_proyecto = 97').then(r => {
      console.log('DB RESULT:', r.rows);
      process.exit(0);
    }).catch(e => { console.error(e); process.exit(1); });
  \\\""`;
  const resQuery = await ssh.execCommand(cmdQuery);
  console.log('DIRECT DB QUERY:\n', resQuery.stdout, resQuery.stderr);

  ssh.dispose();
}

readFullController().catch(console.error);
