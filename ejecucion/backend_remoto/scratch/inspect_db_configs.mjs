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

  console.log("=== DB QUERY / CONNECTION IN DEV ===");
  const devDb = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/src/config/dbConfig.js 2>/dev/null || cat /home/nodeadmin/proyectos/lean-services-gsp/src/config/dbQuery.js 2>/dev/null');
  console.log(devDb.stdout);

  console.log("\n=== DB QUERY / CONNECTION IN PROD ===");
  const prodDb = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/dbConfig.js 2>/dev/null || cat /home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/dbQuery.js 2>/dev/null');
  console.log(prodDb.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
