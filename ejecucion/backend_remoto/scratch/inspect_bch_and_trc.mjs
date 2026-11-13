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

  console.log("=== BACHELET DEV .ENV ===");
  const bchEnv = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-bch-dev/.env');
  console.log(bchEnv.stdout);

  console.log("\n=== BACHELET NGINX CONFIG ===");
  const bchNgx = await ssh.execCommand('grep -A 25 "BACHELET DEV" /etc/nginx/default.d/base.conf');
  console.log(bchNgx.stdout);

  console.log("\n=== TRANSMAC PROD .ENV (REFERENCE GOLD STANDARD) ===");
  const trcProdEnv = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-transmac-prod/.env 2>/dev/null || cat /home/nodeadmin/proyectos/transmac-sst-backend-prod/.env 2>/dev/null');
  console.log(trcProdEnv.stdout);

  console.log("\n=== TRANSMAC PROD NGINX CONFIG ===");
  const trcProdNgx = await ssh.execCommand('grep -A 30 "lg-transmac-prod" /etc/nginx/default.d/base.conf');
  console.log(trcProdNgx.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
