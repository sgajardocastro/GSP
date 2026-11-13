const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function verify() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO VERSIONES BACKEND ===');
  const vDev = await ssh.execCommand('curl -s http://localhost:3006/api/backlog/version');
  console.log('DEV (3006):', vDev.stdout);

  const vProd = await ssh.execCommand('curl -s http://localhost:3016/api/backlog/version');
  console.log('PROD (3016):', vProd.stdout);

  console.log('\n=== VERIFICANDO TABLAS BD EN PROD ===');
  const dbProd = await ssh.execCommand(`
    NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "
      const { Pool } = require('pg');
      const pool = new Pool({ user: 'usr_leangsp_prod', password: 'usr_gsp_prod_2026!', host: 'localhost', database: 'postgres', port: 5432 });
      async function q() {
        const r1 = await pool.query(\\"SELECT version, titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases WHERE version LIKE '%1.0.206%'\\");
        console.log('Release PROD:', r1.rows);
        const r2 = await pool.query(\\"SELECT codigo_req, nombre_requerimiento, estado, fecha_implementacion FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req IN ('REQ-1144', 'REQ-1137', 'REQ-1140') ORDER BY codigo_req\\");
        console.log('Backlog PROD:', r2.rows);
        await pool.end();
      }
      q();
    "
  `);
  console.log(dbProd.stdout);

  console.log('\n=== VERIFICANDO TABLAS BD EN DEV ===');
  const dbDev = await ssh.execCommand(`
    NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "
      const { Pool } = require('pg');
      const pool = new Pool({ user: 'usr_leangsp', password: 'usr_gsp_123', host: 'localhost', database: 'postgres', port: 5432 });
      async function q() {
        const r1 = await pool.query(\\"SELECT version, titulo, requerimientos_asociados FROM sch_leangsp.tcfg_releases WHERE version LIKE '%1.0.206%'\\");
        console.log('Release DEV:', r1.rows);
        const r2 = await pool.query(\\"SELECT codigo_req, nombre_requerimiento, estado, fecha_implementacion FROM sch_leangsp.tcfg_backlog WHERE codigo_req IN ('REQ-1144', 'REQ-1137', 'REQ-1140') ORDER BY codigo_req\\");
        console.log('Backlog DEV:', r2.rows);
        await pool.end();
      }
      q();
    "
  `);
  console.log(dbDev.stdout);

  console.log('\n=== VERIFICANDO PREVIEW PDF OT 32 Y OT 30 ===');
  await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/its/preview-pdf/32 -o /tmp/preview_ot32_final.pdf && pdftotext /tmp/preview_ot32_final.pdf /tmp/preview_ot32_final.txt');
  const pdf32 = await ssh.execCommand('cat /tmp/preview_ot32_final.txt');
  console.log('OT 32 PDF contiene (IDA Y RETORNO):', pdf32.stdout.includes('IDA Y RETORNO'));
  console.log('OT 32 PDF contiene Traslado y apoyo logístico en convoy a faena:', pdf32.stdout.includes('Traslado y apoyo logístico en convoy a faena'));
  console.log('OT 32 PDF contiene PJYY.20-1:', pdf32.stdout.includes('PJYY.20-1'));
  console.log('OT 32 PDF contiene RWJL.23-K:', pdf32.stdout.includes('RWJL.23-K'));
  console.log('OT 32 PDF contiene ROBERT RODRIGUEZ:', pdf32.stdout.includes('ROBERT RODRIGUEZ') || pdf32.stdout.includes('ROBERT RODRÍGUEZ'));
  console.log('OT 32 PDF contiene MATIAS BARRALES:', pdf32.stdout.includes('MATIAS BARRALES') || pdf32.stdout.includes('MATÍAS BARRALES'));
  console.log('OT 32 PDF contiene LUIS MERCADO:', pdf32.stdout.includes('LUIS MERCADO'));

  await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/its/preview-pdf/30 -o /tmp/preview_ot30_final.pdf && pdftotext /tmp/preview_ot30_final.pdf /tmp/preview_ot30_final.txt');
  const pdf30 = await ssh.execCommand('cat /tmp/preview_ot30_final.txt');
  console.log('OT 30 PDF contiene TLXF.37-9:', pdf30.stdout.includes('TLXF.37-9'));
  console.log('OT 30 PDF contiene MATIAS BARRALES:', pdf30.stdout.includes('MATIAS BARRALES') || pdf30.stdout.includes('MATÍAS BARRALES'));

  ssh.dispose();
}

verify().catch(console.error);
