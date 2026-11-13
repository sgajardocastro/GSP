const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkUserRoles() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, ur.id_rol, r.name_rol, u.json_data->>'cargo' as cargo
    FROM sch_leangsp.tsec_users u
    LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
    LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol
    WHERE u.id_user IN (19, 66, 55);
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

checkUserRoles().catch(console.error);
