// Despliegue REQ-1060 / SPEC-088 (Backend reportDiarioController + PWA v1.0.53)
// Uso: node scripts/deploy_req1060.cjs dev|prod
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

const ENV = (process.argv[2] || '').toLowerCase();
const CFG = {
  dev: { backend: '/home/nodeadmin/proyectos/lean-services-gsp', pm2: 10, pwaDir: '/var/www/html/pwa-gsp-dev', dist: 'dist_dev', url: 'https://servidor.leanglobal.cl/pwa-gsp-dev/', port: null },
  prod: { backend: '/home/nodeadmin/proyectos/lean-services-gsp-prod', pm2: 13, pwaDir: '/var/www/html/pwa-gsp-prod', dist: 'dist_prod', url: 'https://servidor.leanglobal.cl/pwa-gsp-prod/', port: 3016 }
}[ENV];
if (!CFG) { console.error('Uso: node scripts/deploy_req1060.cjs dev|prod'); process.exit(1); }

const checkUrl = (url) => new Promise((resolve) => {
  https.get(url, (res) => resolve(res.statusCode)).on('error', (e) => resolve(e.message));
});

(async () => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  console.log(`=== DEPLOY REQ-1060 -> ${ENV.toUpperCase()} (${ts}) ===`);
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295, readyTimeout: 20000 });

  // 1. Respaldos
  const bk = `/var/www/html/backups/req1060_${ENV}_${ts}`;
  await ssh.execCommand(`mkdir -p ${bk} && cp ${CFG.backend}/src/controllers/reportDiarioController.js ${bk}/ && tar -czf ${bk}/pwa.tar.gz -C ${path.posix.dirname(CFG.pwaDir)} ${path.posix.basename(CFG.pwaDir)}`);
  const lsBk = await ssh.execCommand(`ls -la ${bk}`);
  console.log('Respaldo:', bk, '\n', lsBk.stdout.trim());

  // 2. Backend
  const localCtrl = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');
  const remoteCtrl = `${CFG.backend}/src/controllers/reportDiarioController.js`;
  await ssh.putFile(localCtrl, remoteCtrl);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${remoteCtrl}`);
  const chk = await ssh.execCommand(`su - nodeadmin -c "node --check ${remoteCtrl}" && grep -c "REQ-1060" ${remoteCtrl}`);
  console.log('Backend node --check + marcas REQ-1060:', chk.stdout.trim() || chk.stderr.trim());
  const rs = await ssh.execCommand(`su - nodeadmin -c "pm2 restart ${CFG.pm2}"`);
  console.log(`PM2 restart ${CFG.pm2}:`, (rs.stdout || rs.stderr).split('\n').filter(l => /online|errored|stopped|restart/i.test(l)).slice(0, 4).join('\n'));
  await new Promise(r => setTimeout(r, 6000));
  const st = await ssh.execCommand(`su - nodeadmin -c "pm2 jlist"`);
  try {
    const raw = st.stdout.slice(st.stdout.indexOf('['));
    const p = JSON.parse(raw).find(x => x.pm_id === CFG.pm2);
    console.log('PM2 estado:', p ? `${p.name} ${p.pm2_env.status} pid=${p.pid} restarts=${p.pm2_env.restart_time}` : 'NO_ENCONTRADO');
  } catch (e) { console.log('PM2 estado err:', e.message); }
  const errLog = await ssh.execCommand(`su - nodeadmin -c "pm2 logs ${CFG.pm2} --err --lines 15 --nostream" 2>&1 | tail -n 15`);
  console.log('PM2 err log (últimas líneas):\n', errLog.stdout.trim());

  // 3. PWA
  const localDist = path.resolve(__dirname, `../ejecucion/pwa/${CFG.dist}`);
  await ssh.putDirectory(localDist, CFG.pwaDir, { recursive: true, concurrency: 10, validate: (p) => !p.endsWith('.map') });
  await ssh.execCommand(`chown -R nginx:nginx ${CFG.pwaDir} && chmod -R 755 ${CFG.pwaDir}`);
  const ver = await ssh.execCommand(`grep -l "1.0.53" ${CFG.pwaDir}/js/app.*.js | head -n 1; grep -o "id_reporte_avance" -r ${CFG.pwaDir}/js | wc -l`);
  console.log('PWA bundle (archivo con v1.0.53 / ocurrencias id_reporte_avance):\n', ver.stdout.trim());

  // 4. Verificación HTTP
  console.log(`HTTP PWA ${ENV}:`, await checkUrl(CFG.url));
  const apiBase = ENV === 'prod' ? 'https://servidor.leanglobal.cl/lg-gsp-prod/api' : 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
  console.log(`HTTP API ${ENV} /operaciones/report/contexto/16:`, await checkUrl(`${apiBase}/operaciones/report/contexto/16?id_equipo=45&id_user=49`));

  ssh.dispose();
  console.log(`=== FIN DEPLOY ${ENV.toUpperCase()} ===`);
})().catch((e) => { console.error('ERROR DEPLOY:', e); process.exit(1); });
