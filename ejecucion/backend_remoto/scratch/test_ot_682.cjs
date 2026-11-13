const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function testOT() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const testScript = `
require('dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp/.env' });
const ProyectoModel = require('/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js');
const p = new ProyectoModel();

async function run() {
  const res = await p.pool.query("SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto = 'GSP-2610-4853-003'");
  if (res.rows.length === 0) {
    console.log('Proyecto no encontrado');
    process.exit(1);
  }
  const idPry = res.rows[0].id_proyecto;
  const otData = await p.generarOTVersion(idPry);
  console.log('OT Data:', JSON.stringify(otData.ot, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js\n${testScript}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node test_ot_exec.js"');
  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp/test_ot_exec.js');
  console.log(out.stdout);
  if (out.stderr) console.error('STDERR:', out.stderr);
  ssh.dispose();
}

testOT().catch(console.error);
