const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function verify() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const dev = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/');
  const prod = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  const doc = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/centro_documentacion_gsp.html');
  const pol = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/politica_manejo_excepciones_gsp.html');
  
  console.log(`HTTP Status:`);
  console.log(`- lg-gsp-dev/ : ${dev.stdout}`);
  console.log(`- lg-gsp-prod/ : ${prod.stdout}`);
  console.log(`- centro_documentacion_gsp.html : ${doc.stdout}`);
  console.log(`- politica_manejo_excepciones_gsp.html : ${pol.stdout}`);

  const dbDev = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT version, fecha_release, titulo, requerimientos_asociados FROM sch_leangsp.tcfg_releases WHERE version = \'v1.0.96\';\\""');
  const dbProd = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT version, fecha_release, titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases WHERE version = \'v1.0.96\';\\""');
  
  console.log(`\nDB DEV (sch_leangsp):`);
  console.log(dbDev.stdout.trim());
  console.log(`\nDB PROD (sch_leangsp_prod):`);
  console.log(dbProd.stdout.trim());

  ssh.dispose();
}

verify().catch(console.error);
