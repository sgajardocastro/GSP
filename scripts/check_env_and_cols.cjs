const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const devEnv = await ssh.execCommand('grep -i "DB_\\|POSTGRES" /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log('DEV .env DB config:\n', devEnv.stdout);

  const prodEnv = await ssh.execCommand('grep -i "DB_\\|POSTGRES" /home/nodeadmin/proyectos/lean-services-gsp-prod/.env');
  console.log('PROD .env DB config:\n', prodEnv.stdout);

  const colRes = await ssh.execCommand(`
    NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "
      const { Pool } = require('pg');
      const pool = new Pool({ user: 'usr_leangsp_prod', password: 'usr_gsp_prod_2026!', host: 'localhost', database: 'postgres', port: 5432 });
      pool.query(\`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance'
        ORDER BY ordinal_position;
      \`).then(r => console.log('Columns tedp_reporte_avance:', r.rows.map(c => c.column_name))).finally(() => pool.end());
    "
  `);
  console.log(colRes.stdout);
  ssh.dispose();
}

run().catch(console.error);
