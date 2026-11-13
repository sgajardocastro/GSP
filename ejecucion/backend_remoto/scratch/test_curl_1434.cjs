const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('--- TEST CURL A PROD DIRECTO (/lg-gsp-prod/api/archivo/ver/1434) ---');
  const curlProd = await ssh.execCommand('curl -s -I -k https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/1434');
  console.log(curlProd.stdout);

  console.log('--- TEST CURL A DEV DIRECTO (/lg-gsp-dev/api/archivo/ver/1434) ---');
  const curlDev = await ssh.execCommand('curl -s -I -k https://servidor.leanglobal.cl/lg-gsp-dev/api/archivo/ver/1434');
  console.log(curlDev.stdout);

  console.log('--- TEST CURL A LEGACY (/lg-gsp/api/archivo/ver/1434) ---');
  const curlLegacy = await ssh.execCommand('curl -s -I -k https://servidor.leanglobal.cl/lg-gsp/api/archivo/ver/1434');
  console.log(curlLegacy.stdout);

  console.log('--- DONDE ESTA GUARDADO EL PROYECTO 189? ---');
  const p189 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT 'sch_leangsp' as s, id_proyecto, nombre_proyecto, codi_proyecto, fecha_creacion FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 189 UNION ALL SELECT 'sch_leangsp_prod' as s, id_proyecto, nombre_proyecto, codi_proyecto, fecha_creacion FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 189;\\""`);
  console.log(p189.stdout);

  ssh.dispose();
}

run();
