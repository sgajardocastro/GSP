const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  console.log("Conectando al servidor DEV...");
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });
  console.log("Subiendo frontend compilado (dist_dev) a /var/www/html/lg-gsp-dev/...");
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist_dev');
  await ssh.putDirectory(localDist, '/var/www/html/lg-gsp-dev', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.endsWith('.map')
  });
  await ssh.execCommand('chown -R nginx:nginx /var/www/html/lg-gsp-dev/ && chmod -R 755 /var/www/html/lg-gsp-dev/');
  console.log("Despliegue de frontend a DEV completado con éxito.");
  ssh.dispose();
}

run().catch((err) => {
  console.error("Error en despliegue:", err);
  process.exit(1);
});
