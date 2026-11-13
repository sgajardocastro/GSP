const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function main() {
  console.log('=== DESPLEGANDO HOTFIX SECUENCIA GDI A DEV Y PROD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/inventarioModel.js');

  // 1. Despliegue en DEV
  const remoteDev = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/inventarioModel.js';
  console.log('Subiendo a DEV:', remoteDev);
  await ssh.putFile(localFile, remoteDev);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteDev}`);
  console.log('Reiniciando PM2 10 (DEV)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');

  // 2. Despliegue en PROD
  const remoteProd = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/inventarioModel.js';
  console.log('Subiendo a PROD:', remoteProd);
  await ssh.putFile(localFile, remoteProd);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteProd}`);
  console.log('Reiniciando PM2 13 (PROD)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');

  console.log('Esperando estabilización de servicios...');
  await new Promise(r => setTimeout(r, 3000));

  // 3. Verificación de endpoints
  const devCheck = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/inventario/traspasos"');
  console.log('DEV /traspasos:', devCheck.stdout);

  const prodCheck = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/inventario/traspasos"');
  console.log('PROD /traspasos:', prodCheck.stdout);

  ssh.dispose();
  console.log('\n✅ HOTFIX DESPLEGADO EXITOSAMENTE A DEV Y PROD.');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
