const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkBothSchemas() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT 'PROD' as env, ur.id_user, ur.id_rol, r.name_rol 
FROM sch_leangsp_prod.tsec_user_roles ur 
JOIN sch_leangsp_prod.tsec_roles r ON ur.id_rol = r.id_rol 
WHERE ur.id_user = 10
UNION ALL
SELECT 'DEV' as env, ur.id_user, ur.id_rol, r.name_rol 
FROM sch_leangsp.tsec_user_roles ur 
JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol 
WHERE ur.id_user = 10;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

checkBothSchemas().catch(console.error);
