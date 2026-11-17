const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testAuthProd() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const script = `
const authModel = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/authModel');
const db = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/dbConfig');

async function test() {
  const user = await authModel.getUserByEmail('alfonsoporperello@gmail.com');
  console.log('User encontrado:', user ? { id_user: user.id_user, email: user.email, name_frst: user.name_frst } : null);

  const rolesRes = await db.query(
    "SELECT r.name_rol FROM tsec_user_roles ur JOIN tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = $1 AND (r.activo IS NULL OR r.activo = true)",
    [user.id_user]
  );
  console.log('Roles devueltos por db.query:', rolesRes.rows);
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_auth_alfonso.js\n${script}\nEOF`);
  const res = await ssh.execCommand('node /tmp/test_auth_alfonso.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

testAuthProd().catch(console.error);
