const path = require('path');
const fs = require('fs');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  console.log('--- 1. AJUSTAR PROPIETARIO Y PERMISOS EN POSTGRESQL ---');
  const sqlPerms = `
    BEGIN;
    ALTER TABLE sch_leangsp_prod.tcfg_backlog OWNER TO usr_leangsp_prod;
    ALTER TABLE sch_leangsp_prod.tcfg_releases OWNER TO usr_leangsp_prod;
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp_prod.tcfg_backlog TO usr_leangsp_prod;
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp_prod.tcfg_releases TO usr_leangsp_prod;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;

    ALTER TABLE sch_leangsp.tcfg_backlog OWNER TO usr_leangsp;
    ALTER TABLE sch_leangsp.tcfg_releases OWNER TO usr_leangsp;
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp.tcfg_backlog TO usr_leangsp;
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp.tcfg_releases TO usr_leangsp;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sch_leangsp TO usr_leangsp;
    COMMIT;
  `;
  const resPerms = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlPerms.replace(/\n/g, ' ')}\\""`);
  console.log('PERMS OUTPUT:\n', resPerms.stdout || resPerms.stderr);

  console.log('--- 2. SUBIR BACKLOGCONTROLLER.JS A DEV Y PROD ---');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/backlogController.js');
  const prodPath = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/backlogController.js';
  const devPath = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/backlogController.js';

  await ssh.putFile(localController, prodPath);
  console.log('Copiado a PROD:', prodPath);
  await ssh.putFile(localController, devPath);
  console.log('Copiado a DEV:', devPath);

  console.log('--- 3. REINICIAR PM2 PROCESOS 13 Y 10 ---');
  const resPm2Prod = await ssh.execCommand('pm2 reload 13');
  console.log('PM2 PROD (13):', resPm2Prod.stdout.slice(0, 300));
  const resPm2Dev = await ssh.execCommand('pm2 reload 10');
  console.log('PM2 DEV (10):', resPm2Dev.stdout.slice(0, 300));

  console.log('--- 4. VERIFICACIÓN HTTP ENDPOINT BACKLOG PROD Y DEV ---');
  // Esperar 2 segundos para asegurar reinicio
  await new Promise(r => setTimeout(r, 2000));

  const checkProd = await ssh.execCommand('curl -s http://localhost:3000/api/backlog | head -c 200');
  console.log('HTTP PROD (3000):', checkProd.stdout);

  const checkDev = await ssh.execCommand('curl -s http://localhost:3001/api/backlog | head -c 200');
  console.log('HTTP DEV (3001):', checkDev.stdout);

  ssh.dispose();
}

main().catch(err => {
  console.error('ERROR:', err);
  ssh.dispose();
});
