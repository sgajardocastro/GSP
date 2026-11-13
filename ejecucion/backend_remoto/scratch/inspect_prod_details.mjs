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

  console.log("=== PM2 LOGS FOR lean-services-gsp-prod ===");
  const pm2Logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs lean-services-gsp-prod --lines 30 --nostream"');
  console.log(pm2Logs.stdout);
  console.log(pm2Logs.stderr);

  console.log("\n=== TEST PG LOGIN WITH usr_leangsp_prod ===");
  const { Client } = pg;
  const clientProd = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
  });
  try {
    await clientProd.connect();
    console.log("Conectado exitosamente con usr_leangsp_prod!");
    const res = await clientProd.query('SELECT current_schema(), session_user;');
    console.log("Session info:", res.rows[0]);
    const schemas = await clientProd.query("SELECT schema_name FROM information_schema.schemata;");
    console.log("Schemas visibles para usr_leangsp_prod:", schemas.rows.map(r => r.schema_name));
    await clientProd.end();
  } catch (err) {
    console.error("Error conectando con usr_leangsp_prod:", err.message);
  }

  console.log("\n=== PG USERS IN POSTGRESQL ===");
  const clientRoot = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123',
  });
  await clientRoot.connect();
  const usersRes = await clientRoot.query("SELECT usename FROM pg_user WHERE usename LIKE '%gsp%' OR usename LIKE '%lean%';");
  console.log("Usuarios PG:", usersRes.rows.map(r => r.usename));
  await clientRoot.end();

  console.log("\n=== /var/www/html/lg-gsp-prod/index.html & config ===");
  const htmlCheck = await ssh.execCommand('head -n 25 /var/www/html/lg-gsp-prod/index.html');
  console.log(htmlCheck.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
