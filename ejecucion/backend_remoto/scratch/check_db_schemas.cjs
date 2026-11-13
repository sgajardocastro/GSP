const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const devRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT table_schema, column_name, data_type FROM information_schema.columns WHERE table_schema IN ('sch_leangsp', 'sch_leangsp_prod') AND table_name = 'tedp_reporte_avance' AND column_name IN ('id_doc_pdf', 'ajustes_analista', 'tipo_respaldo', 'evidencia_fisica_adjunta') ORDER BY column_name, table_schema;\\""`);
  console.log(devRes.stdout);
  ssh.dispose();
}

main().catch(console.error);
