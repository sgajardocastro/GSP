import { NodeSSH } from 'node-ssh';
import pg from 'pg';

const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== RAW PM2 LIST ===");
  const pm2Res = await ssh.execCommand('pm2 list');
  console.log(pm2Res.stdout);

  console.log("\n=== DOCKER PS ===");
  const dkrRes = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
  console.log(dkrRes.stdout);

  console.log("\n=== NGINX /lg-gsp-dev/api/ & PROD BLOCKS ===");
  const ngxBlocks = await ssh.execCommand('sed -n "/location \\/lg-gsp/,/}/p" /etc/nginx/default.d/base.conf');
  console.log(ngxBlocks.stdout);

  console.log("\n=== ALL GSP BLOCKS IN NGINX ===");
  const allNginx = await ssh.execCommand('grep -A 10 -B 2 "gsp" /etc/nginx/default.d/base.conf');
  console.log(allNginx.stdout);

  console.log("\n=== WHERE IS BACKEND RUNNING? (ss -tulpn | grep node) ===");
  const portsRes = await ssh.execCommand('ss -tulpn | grep node');
  console.log(portsRes.stdout);

  console.log("\n=== POSTGRESQL ALL DATABASES AND ALL SCHEMAS ===");
  const { Client } = pg;
  const client = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123',
  });
  await client.connect();

  const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
  console.log("Databases:", dbs.rows.map(r => r.datname));

  const allSchemas = await client.query('SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;');
  console.log("All Schemas in postgres db:", allSchemas.rows.map(r => r.schema_name));

  await client.end();
  ssh.dispose();
}

inspect().catch(console.error);
