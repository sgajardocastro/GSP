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

  console.log("=== DBQUERY.JS IN PROD ===");
  const prodDbQuery = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/dbQuery.js');
  console.log(prodDbQuery.stdout);

  console.log("\n=== DBQUERY.JS IN DEV ===");
  const devDbQuery = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/src/config/dbQuery.js');
  console.log(devDbQuery.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
