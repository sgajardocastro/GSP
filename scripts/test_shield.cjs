const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function testShield() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
const ProyectoModel = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel');
const pm = new ProyectoModel();

async function test() {
  const current = await pm.getProyectoById(97);
  console.log('GET 97 linea0_eq inicial:', current.json_field.crm_v1.lineas_servicio[0].equipo_asignado_id);

  // Intentar forzar equipo 52 (el reemplazado) como si viniera de una pestaña desactualizada
  const payload = JSON.parse(JSON.stringify(current));
  payload.json_field.crm_v1.lineas_servicio[0].equipo_asignado_id = 52;
  payload.json_field.ejecucion_v1.equipo_id = 52;

  await pm.updateProyecto(97, payload);

  const after = await pm.getProyectoById(97);
  console.log('GET 97 TRAS INTENTO DE SOBREESCRITURA CON 52:');
  console.log('  linea0_eq:', after.json_field.crm_v1.lineas_servicio[0].equipo_asignado_id);
  console.log('  ejecucion.equipo_id:', after.json_field.ejecucion_v1.equipo_id);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_shield.js\n" + script + "\nEOF");
  const res = await ssh.execCommand('su - nodeadmin -c "node /tmp/test_shield.js"');
  console.log('STDOUT:\n', res.stdout);
  if (res.stderr) console.log('STDERR:\n', res.stderr);
  ssh.dispose();
}

testShield().catch(console.error);
