const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
require('dotenv').config();
const ProyectoModel = require('./src/models/proyectoModel');
const proyectoModel = new ProyectoModel();

async function testOT() {
  try {
    console.log('Llamando a generarOTVersion(204)...');
    const result = await proyectoModel.generarOTVersion(204);
    console.log('OT GENERADA EXITOSAMENTE:');
    console.log(JSON.stringify(result.ot, null, 2));

    const pool = require('./src/config/postgresPool');
    const { rows: relE } = await pool.query(\`
      SELECT re.id_rel_equipo, re.id_equipo, e.patente, e.tipo, re.id_linea_servicio, re.estado_real
      FROM tpry_rel_equipo re
      JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
      WHERE re.id_proyecto = 204
      ORDER BY re.id_rel_equipo ASC
    \`);
    console.log('TPRY_REL_EQUIPO ACTUALES EN PROYECTO 204:');
    console.table(relE);

    // Parse newly generated OT PDF with pdftotext
    const otFileName = result.ot.nombre_archivo;
    console.log('Buscando archivo PDF:', otFileName);
    process.exit(0);
  } catch (err) {
    console.error('Error generando OT:', err);
    process.exit(1);
  }
}
testOT();
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/test_ot_204.cjs
${script}
EOF`);
  await ssh.execCommand(`chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/test_ot_204.cjs`);

  const res = await ssh.execCommand(`su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node test_ot_204.cjs"`);
  console.log("Salida de generar OT:\n", res.stdout || res.stderr);

  await ssh.execCommand(`rm -f /home/nodeadmin/proyectos/lean-services-gsp/test_ot_204.cjs`);

  ssh.dispose();
}

run().catch(console.error);
