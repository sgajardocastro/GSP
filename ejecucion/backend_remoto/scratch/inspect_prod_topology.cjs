const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. PM2 INFO lean-services-gsp-prod ===');
  const pm2 = await ssh.execCommand('su - nodeadmin -c "pm2 describe lean-services-gsp-prod"');
  console.log(pm2.stdout.split('\n').filter(l => l.includes('exec cwd') || l.includes('script path') || l.includes('status') || l.includes('pm_uptime') || l.includes('restarts') || l.includes('node.js version')).join('\n'));

  console.log('\n=== 2. LOCALIZACIÓN DIRECTORIO PROD ===');
  const dirCheck = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/lean-services-gsp-prod/ 2>/dev/null');
  console.log(dirCheck.stdout || 'No existe ese path');

  console.log('\n=== 3. VARIABLES DE ENTORNO PROD (.env) ===');
  const envCheck = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp-prod/.env 2>/dev/null');
  console.log(envCheck.stdout || 'Sin .env');

  console.log('\n=== 4. CONFIG NGINX PARA PROD ===');
  const ngx = await ssh.execCommand('grep -rn "gsp-prod" /etc/nginx/ 2>/dev/null');
  console.log(ngx.stdout);

  console.log('\n=== 5. DIRECTORIOS WEB Y PWA PROD ===');
  const webDir = await ssh.execCommand('ls -ld /var/www/html/*gsp* 2>/dev/null');
  console.log(webDir.stdout);

  console.log('\n=== 6. TABLAS Y MIGRACIONES DDL EN sch_leangsp_prod ===');
  const ddlCheck = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT table_name FROM information_schema.tables WHERE table_schema = \'sch_leangsp_prod\' AND table_name IN (\'tnot_notification_web\', \'tedp_reporte_avance\', \'tpry_proyecto\', \'tcfg_releases\');\\""');
  console.log(ddlCheck.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
