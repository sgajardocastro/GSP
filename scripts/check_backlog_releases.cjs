const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
    const { Pool } = require('pg');

    async function checkBacklog(schemaName, user, pass) {
      console.log('=== ESQUEMA: ' + schemaName + ' ===');
      const pool = new Pool({
        user: user,
        password: pass,
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      const lastRel = await pool.query("SELECT * FROM " + schemaName + ".tcfg_releases ORDER BY id DESC LIMIT 3;");
      console.log('Last releases (' + schemaName + '):', lastRel.rows);

      const bkgCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = '" + schemaName + "' AND table_name = 'tcfg_backlog' ORDER BY ordinal_position;");
      console.log('Columns tcfg_backlog:', bkgCols.rows.map(c => c.column_name));

      const lastBkg = await pool.query("SELECT * FROM " + schemaName + ".tcfg_backlog ORDER BY id DESC LIMIT 3;");
      console.log('Last backlog (' + schemaName + '):', lastBkg.rows);

      await pool.end();
    }

    async function main() {
      await checkBacklog('sch_leangsp_prod', 'usr_leangsp_prod', 'usr_gsp_prod_2026!');
      await checkBacklog('sch_leangsp', 'usr_leangsp', 'usr_gsp_123');
    }
    main().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  ssh.dispose();
}

run().catch(console.error);
