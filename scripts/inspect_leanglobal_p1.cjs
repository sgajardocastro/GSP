const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field
    FROM sch_leangsp_prod.tpry_proyecto
    WHERE id_proyecto = 1;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${q.replace(/"/g, '\\"')}\\""`);
  console.log(res.stdout.trim() || res.stderr);

  ssh.dispose();
}

run().catch(console.error);
