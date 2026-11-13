const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  
  console.log('=== VERIFICANDO BACKEND EN PROD ===');
  const checkRoutes = await ssh.execCommand("grep 'adjuntar-respaldo-fisico' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/reportDiarioRoutes.js");
  console.log('PROD ROUTES:', checkRoutes.stdout.trim());
  const checkCtrl = await ssh.execCommand("grep 'adjuntarRespaldoFisico' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js");
  console.log('PROD REPORT CTRL:', checkCtrl.stdout.trim());
  const checkVivo = await ssh.execCommand("grep 'REGULARIZADO_MANUAL' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/controlVivoController.js");
  console.log('PROD VIVO CTRL:', checkVivo.stdout.trim());
  const checkIts = await ssh.execCommand("grep 'FISICO_MANUAL' /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js");
  console.log('PROD ITS CTRL:', checkIts.stdout.trim());

  console.log('\n=== VERIFICANDO PM2 EN PROD ===');
  const pm2 = await ssh.execCommand("su - nodeadmin -c 'pm2 jlist'");
  const jsonStr = pm2.stdout.substring(pm2.stdout.indexOf('['));
  const list = JSON.parse(jsonStr);
  const prodProc = list.find(p => p.name === 'lean-services-gsp-prod');
  console.log(`PROD Process: ID=${prodProc.pm_id}, PID=${prodProc.pid}, status=${prodProc.pm2_env.status}, restarts=${prodProc.pm2_env.restart_time}`);

  console.log('\n=== VERIFICANDO BD PROD (tcfg_releases & tcfg_backlog) ===');
  const dbRel = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, fecha_release, titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases WHERE version = 'v1.0.97';\\""`);
  console.log(dbRel.stdout.trim());
  const dbBck = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado, fecha_implementacion FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = 'REQ-1000';\\""`);
  console.log(dbBck.stdout.trim());

  console.log('\n=== VERIFICANDO HTTP CODES ===');
  const httpDev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const httpProd = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log(`HTTP DEV: ${httpDev.stdout} | HTTP PROD: ${httpProd.stdout}`);

  ssh.dispose();
}

main().catch(console.error);
