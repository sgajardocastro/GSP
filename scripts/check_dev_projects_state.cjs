const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();
async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: process.env.SSH_PASSWORD || 'lgbl2025.', port: 1295 });
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, json_field->'facturas_dte' as dtes FROM sch_leangsp.tpry_proyecto ORDER BY id_proyecto DESC LIMIT 5;\\""`);
  console.log(res.stdout);
  ssh.dispose();
}
main();
