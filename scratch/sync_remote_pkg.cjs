const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const localPkg = path.resolve('ejecucion/backend_remoto/package.json');
  await ssh.putFile(localPkg, '/home/nodeadmin/proyectos/lean-services-gsp-prod/package.json');
  await ssh.putFile(localPkg, '/home/nodeadmin/proyectos/lean-services-gsp/package.json');

  const resProd = await ssh.execCommand('node -p "require(\'/home/nodeadmin/proyectos/lean-services-gsp-prod/package.json\').version"');
  const resDev = await ssh.execCommand('node -p "require(\'/home/nodeadmin/proyectos/lean-services-gsp/package.json\').version"');
  console.log('REMOTE PROD VERSION:', resProd.stdout.trim());
  console.log('REMOTE DEV VERSION:', resDev.stdout.trim());

  ssh.dispose();
}

main().catch(console.error);
