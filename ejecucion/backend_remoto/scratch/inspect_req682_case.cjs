const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectCase() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `SELECT json_build_object(
    'lineas_crm', json_field->'crm_v1'->'lineas_servicio',
    'equipos_extra', json_field->'ejecucion_v1'->'equipos_extra',
    'ejec_equipo_id', json_field->'ejecucion_v1'->'equipo_id',
    'crm_equipo_id', json_field->'crm_v1'->'equipo_id',
    'ot_actual', json_field->'ejecucion_v1'->'ot_actual'
  ) FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto = 'GSP-2610-4853-003';`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/inspect_json.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/inspect_json.sql"');
  
  try {
    const obj = JSON.parse(res.stdout);
    console.log(JSON.stringify(obj, null, 2));
  } catch (e) {
    console.log(res.stdout || res.stderr);
  }

  ssh.dispose();
}

inspectCase().catch(console.error);
