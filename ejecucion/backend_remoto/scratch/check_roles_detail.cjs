const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  console.log('=== TEST PROD USERS API ===');
  const u = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/servicio/leanglobal/obtenerUsuarios');
  const parsed = JSON.parse(u.stdout);
  const omars = parsed.filter(user => (user.name_frst || '').toLowerCase().includes('omar') || (user.apellido_pat || '').toLowerCase().includes('omar') || (user.email || '').toLowerCase().includes('omar'));
  console.log('Usuarios Omar en PROD API:\n', JSON.stringify(omars, null, 2));

  console.log('=== TEST PROD ROLES DE OMAR ===');
  const ur = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/servicio/leanglobal/obtenerUsuariosRoles');
  const parsedUr = JSON.parse(ur.stdout);
  const omarIds = omars.map(o => o.id_user);
  console.log('Roles de los Omar:', parsedUr.filter(r => omarIds.includes(r.id_user)));

  ssh.dispose();
}

run().catch(console.error);
