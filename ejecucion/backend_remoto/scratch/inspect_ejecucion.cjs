const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -c \\"SELECT json_field->\'ejecucion_v1\' FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 76;\\""');
  const d = JSON.parse(res.stdout);
  console.log('Keys in ejecucion_v1:', Object.keys(d));
  console.log('plan_diario:', d.plan_diario);
  console.log('fecha_salida_plan:', d.fecha_salida_plan, 'hora:', d.hora_salida_plan);
  console.log('equipos:', d.equipos);
  console.log('control_vivo_overrides in d:', d.control_vivo_overrides);
  ssh.dispose();
}

run().catch(console.error);
