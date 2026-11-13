const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();
async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: process.env.SSH_PASSWORD || 'lgbl2025.', port: 1295 });
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, json_field->\'facturas_dte\' as dtes, json_field->\'factura\' as fac, json_field->\'liquidacion_v1\' as liq FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 105;\\""');
  console.log(res.stdout);
  ssh.dispose();
}
main();
