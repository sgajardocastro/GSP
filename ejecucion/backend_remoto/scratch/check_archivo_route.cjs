const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- PM2 PROCESSES ---');
  const pm2 = await ssh.execCommand('su - nodeadmin -c "pm2 jlist"');
  const jsonStr = pm2.stdout.substring(pm2.stdout.indexOf('['));
  const list = JSON.parse(jsonStr);
  console.log(list.map(p => ({
    id: p.pm_id,
    name: p.name,
    status: p.pm2_env?.status,
    port: p.pm2_env?.PORT || p.pm2_env?.env?.PORT,
    path: p.pm2_env?.pm_cwd
  })));

  console.log('\n--- NGINX CONFIG FOR /lg-gsp ---');
  const ngx = await ssh.execCommand('grep -rn "location /lg-gsp" /etc/nginx/');
  console.log(ngx.stdout);

  console.log('\n--- ARCHIVO 1434 EN BD PROD vs DEV ---');
  const arcProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_archivo, id_proyecto, nombre_archivo, ruta_archivo, mimetype, fecha_creacion FROM sch_leangsp_prod.tsrv_archivos WHERE id_archivo = 1434;\\""`);
  console.log('PROD tsrv_archivos:', arcProd.stdout);

  const arcDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_archivo, id_proyecto, nombre_archivo, ruta_archivo, mimetype, fecha_creacion FROM sch_leangsp.tsrv_archivos WHERE id_archivo = 1434;\\""`);
  console.log('DEV tsrv_archivos:', arcDev.stdout);

  ssh.dispose();
}

run();
