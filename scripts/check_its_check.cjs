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

  const res = await ssh.execCommand('su - nodeadmin -c "PGPASSWORD=usr_gsp_123 psql -U usr_leangsp -h localhost -d postgres -c \\"SELECT n.nspname, c.conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE c.conname = \x27tits_jornada_detalle_tipo_servicio_check\x27;\\""');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
