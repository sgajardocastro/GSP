const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });

    const res = await ssh.execCommand("sudo -u postgres psql -d postgres -c \"SET search_path TO sch_leangsp, public; SELECT json_field->'ejecucion_v1'->'preparacion_salida' FROM tpry_proyecto WHERE id_proyecto = 98;\"");
    console.log(res.stdout || res.stderr);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
