const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const q = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, nomb_proyecto, json_field->'control_vivo_overrides' as overrides FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto LIKE '%038%' OR id_proyecto = 70;\\""`);
  console.log(q.stdout);
  const q2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_reporte, id_proyecto, id_equipo, fecha_reporte, hora_inicio_faena, hora_termino_faena, horas_operadas, horas_facturables, estado_reporte, id_doc_pdf, ajustes_analista FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = 70;\\""`);
  console.log(q2.stdout);
  ssh.dispose();
}

main().catch(console.error);
