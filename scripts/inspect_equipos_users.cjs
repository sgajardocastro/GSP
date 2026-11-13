const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
    SELECT e.id_equipo, e.patente, e.modelo, e.tipo_equipo
    FROM sch_leangsp_prod.tequ_equipo e
    WHERE e.id_equipo IN (45, 85, 39);

    SELECT id_user, name_frst, apellido_pat, cargo
    FROM sch_leangsp_prod.tsec_user
    WHERE id_user IN (49, 13, 94);
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${q.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
