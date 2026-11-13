const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  console.log('=== TEST GENERAR COTIZACION EN PROD BACKEND DIRECTO (PORT 3016) ===');
  const curlGen = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3016/api/proyectos/1/generar-cotizacion -H "Content-Type: application/json" -d '{"monto": 1250000}'`);
  console.log('Respuesta generar-cotizacion PROD:\n', curlGen.stdout);

  console.log('=== VERIFICAR EN BASE DE DATOS PROD (sch_leangsp_prod.tfmg_file) ===');
  const dbProd = await ssh.execCommand("PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -c 'SELECT id_doc, tipo_doc, name_doc_orig, path_doc, fecha_creacion FROM sch_leangsp_prod.tfmg_file ORDER BY id_doc DESC LIMIT 2;'");
  console.log(dbProd.stdout);

  console.log('=== VERIFICAR RUTA FISICA EN DISCO (/u05/LeanDocs/GSP/prod/cotizaciones/...) ===');
  const checkDisk = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/prod/cotizaciones/2026/10/ 2>/dev/null');
  console.log(checkDisk.stdout || 'Directorio no creado aun');

  ssh.dispose();
}

run().catch(console.error);
