const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== ESTADO PROYECTO 86 (GSP-2611-00039) ===');
  const q86 = `
    SELECT 
      id_proyecto, 
      codi_proyecto, 
      nombre_proyecto, 
      id_proyecto_estado,
      json_field->'estado_operativo' as estado_operativo,
      json_field->'ejecucion_v1'->'fase_actual' as fase_actual
    FROM sch_leangsp_prod.tpry_proyecto 
    WHERE id_proyecto = 86;
  `;
  const r86 = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${q86.replace(/\n/g, ' ')}"`);
  console.log(r86.stdout);

  console.log('=== REPORTES DE AVANCE EN PROYECTO 86 ===');
  const qRep86 = `
    SELECT 
      id_reporte_avance, 
      id_proyecto, 
      numero_reporte, 
      fecha_reporte, 
      id_equipo, 
      horas_trabajadas, 
      horas_facturables, 
      horas_efectivas, 
      estado_reporte
    FROM sch_leangsp_prod.tedp_reporte_avance 
    WHERE id_proyecto = 86;
  `;
  const rRep86 = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${qRep86.replace(/\n/g, ' ')}"`);
  console.log(rRep86.stdout);

  console.log('=== EDP EN PROYECTO 86 ===');
  const qEdp86 = `
    SELECT * FROM sch_leangsp_prod.tedp_estado_pago WHERE id_proyecto = 86;
  `;
  const rEdp86 = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${qEdp86.replace(/\n/g, ' ')}"`);
  console.log(rEdp86.stdout);

  ssh.dispose();
}

run().catch(console.error);
