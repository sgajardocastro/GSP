import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== DEV BACKEND .env (/home/nodeadmin/proyectos/lean-services-gsp/.env) ===");
  const devEnv = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log(devEnv.stdout);

  console.log("\n=== PROD BACKEND .env (/home/nodeadmin/proyectos/lean-services-gsp-prod/.env) ===");
  const prodEnv = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp-prod/.env');
  console.log(prodEnv.stdout);

  console.log("\n=== NGINX CHECK FOR ANY PROD BLOCKS ===");
  const ngxAll = await ssh.execCommand('cat /etc/nginx/default.d/base.conf | grep -n "prod"');
  console.log(ngxAll.stdout);

  console.log("\n=== CHECK STORAGE DIRECTORY FOR GSP PROD ===");
  const storageCheck = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/prod/');
  console.log(storageCheck.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
