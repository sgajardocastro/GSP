// SOLO LECTURA - Compara archivos locales vs servidor (DEV y PROD)
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

const ROOT = path.resolve(__dirname, '..');
const files = [
  'src/controllers/reportDiarioController.js',
  'src/routes/reportDiarioRoutes.js',
  'src/config/dbConfig.js'
];
const envs = {
  DEV: '/home/nodeadmin/proyectos/lean-services-gsp',
  PROD: '/home/nodeadmin/proyectos/lean-services-gsp-prod'
};
const norm = (s) => s.replace(/\r\n/g, '\n');
const h = (s) => crypto.createHash('md5').update(norm(s)).digest('hex');

(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const outDir = path.join(ROOT, 'scripts', '_server_snapshots_20261020');
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    const localPath = path.join(ROOT, 'ejecucion', 'backend_remoto', f);
    const local = fs.existsSync(localPath) ? fs.readFileSync(localPath, 'utf8') : '';
    for (const [env, base] of Object.entries(envs)) {
      const r = await ssh.execCommand(`cat ${base}/${f}`);
      const remote = r.stdout || '';
      fs.writeFileSync(path.join(outDir, `${env}_${path.basename(f)}`), remote);
      console.log(`${f} | ${env} | local=${h(local).slice(0, 8)} remote=${h(remote).slice(0, 8)} | ${h(local) === h(remote) ? 'IDENTICO' : 'DIFERENTE'} | lines L=${norm(local).split('\n').length} R=${norm(remote).split('\n').length}`);
    }
  }
  for (const [env, dir] of Object.entries({ DEV: '/var/www/html/pwa-gsp-dev', PROD: '/var/www/html/pwa-gsp-prod' })) {
    const r = await ssh.execCommand(`ls -la --time-style=long-iso ${dir}/index.html; grep -o 'v1\\.0\\.[0-9]*' -r ${dir}/js/app.*.js | sort -u | head -n 3`);
    console.log(`PWA ${env}:`, r.stdout.trim());
  }
  const g = await ssh.execCommand(`cd ${envs.PROD} && git log --oneline -3 2>&1; git status --short 2>&1 | head -n 15`);
  console.log('GIT PROD BACKEND:\n', g.stdout || g.stderr);
  ssh.dispose();
})().catch(e => { console.error(e); process.exit(1); });
