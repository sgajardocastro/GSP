const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectOT() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `SELECT id_ot, version, json_datos->'flotaItems' as flota_items, json_datos FROM sch_leangsp.tflw_orden_trabajo WHERE id_ot = 16;`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/inspect_ot.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/inspect_ot.sql"');
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

inspectOT().catch(console.error);
