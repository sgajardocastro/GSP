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

  console.log("=== PM2 PROCESSES (Filtered GSP / BCH) ===");
  const pm2Res = await ssh.execCommand('pm2 jlist');
  try {
    const list = JSON.parse(pm2Res.stdout);
    for (const p of list) {
      if (p.name.includes('gsp') || p.name.includes('bch') || p.name.includes('lean')) {
        console.log(`[PM2 ID ${p.pm_id}] ${p.name} - status: ${p.pm2_env.status} - exec: ${p.pm2_env.pm_exec_path} - cwd: ${p.pm2_env.pm_cwd} - env.PORT: ${p.pm2_env.PORT || p.pm2_env.env?.PORT}`);
      }
    }
  } catch (e) {
    console.log(pm2Res.stdout);
  }

  console.log("\n=== NGINX CONFIGS FOR GSP AND BCH ===");
  const ngxGsp = await ssh.execCommand('grep -E -C 2 "(lg-gsp|pwa-gsp|lg-bch|pwa-bch)" /etc/nginx/default.d/*.conf /etc/nginx/conf.d/*.conf 2>/dev/null');
  console.log(ngxGsp.stdout);

  console.log("\n=== /var/www/html/ (GSP and BCH) ===");
  const htmlRes = await ssh.execCommand('ls -ld /var/www/html/*gsp* /var/www/html/*bch* 2>/dev/null');
  console.log(htmlRes.stdout);

  console.log("\n=== /var/www/backend/ (GSP and BCH) ===");
  const bkRes = await ssh.execCommand('ls -ld /var/www/backend/*gsp* /var/www/backend/*bch* 2>/dev/null');
  console.log(bkRes.stdout);

  console.log("\n=== POSTGRESQL SCHEMAS AND TABLES ===");
  const { Client } = pg;
  const client = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123',
  });
  await client.connect();

  const resSchemas = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE '%gsp%' OR schema_name LIKE '%bch%'
    ORDER BY schema_name;
  `);
  console.log("Schemas:", resSchemas.rows.map(r => r.schema_name));

  for (const row of resSchemas.rows) {
    const s = row.schema_name;
    const countRes = await client.query(`SELECT count(*) FROM information_schema.tables WHERE table_schema = $1`, [s]);
    console.log(`Schema ${s}: ${countRes.rows[0].count} tablas`);
  }

  // Check specific prod backend files if exist
  console.log("\n=== BACKEND PROD INSPECTION ===");
  const prodBkEnv = await ssh.execCommand('cat /var/www/backend/lean-services-gsp-prod/.env 2>/dev/null || cat /var/www/backend/lean-services-gsp/.env 2>/dev/null');
  console.log("Prod / Dev Backend .env:", prodBkEnv.stdout);

  await client.end();
  ssh.dispose();
}

inspect().catch(console.error);
