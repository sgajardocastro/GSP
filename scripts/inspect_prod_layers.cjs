const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectProd() {
  console.log('=== INSPECCIONANDO LAS 3 CAPAS EN PRODUCCIÓN ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  // 1. CAPA BD (sch_leangsp_prod)
  console.log('--- 1. CAPA BASE DE DATOS (sch_leangsp_prod) ---');
  const resTraspaso = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tinv_traspaso';\\""`);
  console.log('Columnas tinv_traspaso en PROD:');
  console.log(resTraspaso.stdout);

  const resRepuesto = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tmnt_ot_repuesto';\\""`);
  console.log('Columnas tmnt_ot_repuesto en PROD:');
  console.log(resRepuesto.stdout);

  const resUbic = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_bodega, count(*) FROM sch_leangsp_prod.tinv_ubicacion GROUP BY id_bodega;\\""`);
  console.log('Ubicaciones por bodega en PROD:');
  console.log(resUbic.stdout);

  // 2. CAPA BACKEND (/home/nodeadmin/proyectos/lean-services-gsp-prod)
  console.log('\n--- 2. CAPA BACKEND (lean-services-gsp-prod / PM2 13) ---');
  const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 show 13"');
  const pm2Lines = pm2Prod.stdout.split('\n').filter(l => l.includes('status') || l.includes('script path') || l.includes('exec cwd') || l.includes('node env'));
  console.log(pm2Lines.join('\n'));

  // 3. CAPA FRONTEND (/var/www/html/lg-gsp-prod)
  console.log('\n--- 3. CAPA FRONTEND WEB (/var/www/html/lg-gsp-prod) ---');
  const prodIndex = await ssh.execCommand('head -n 20 /var/www/html/lg-gsp-prod/index.html');
  console.log('PROD index.html:');
  console.log(prodIndex.stdout);

  ssh.dispose();
  console.log('\n=== FIN DE INSPECCIÓN ===');
}

inspectProd().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
