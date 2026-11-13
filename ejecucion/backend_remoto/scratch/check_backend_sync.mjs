import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkBackendSync() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== DEV BACKEND GIT / FILE STATUS ===");
  const gitDev = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp && git status 2>/dev/null || ls -lt src/controllers/ | head -n 10');
  console.log(gitDev.stdout);

  console.log("\n=== BACKEND PROD STATUS ===");
  const gitProd = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp-prod && ls -lt src/controllers/ | head -n 10');
  console.log(gitProd.stdout);

  ssh.dispose();
}

checkBackendSync().catch(console.error);
