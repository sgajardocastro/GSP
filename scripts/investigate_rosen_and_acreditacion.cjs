const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: 'servidor.leanglobal.cl', port: 1295, username: 'root', password: 'lgbl2025.' });
  
  console.log('=== tpry_rel_equipo DE PROYECTO 76 ===');
  const rEquipos = await ssh.execCommand(`sudo -u postgres psql -c "SELECT id_rel_equipo, id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, estado_real FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = 76;"`);
  console.log(rEquipos.stdout);

  console.log('=== tpry_rel_persona DE PROYECTO 76 ===');
  const rPersonas = await ssh.execCommand(`sudo -u postgres psql -c "SELECT id_rel_persona, id_proyecto, id_persona, id_usuario, rol_persona, fecha_inicio, fecha_fin, estado FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = 76;"`);
  console.log(rPersonas.stdout);

  console.log('=== json_field crm_v1 Y ejecucion_v1 DE PROYECTO 76 ===');
  const rJson = await ssh.execCommand(`sudo -u postgres psql -c "SELECT json_field->'crm_v1'->'lineas_servicio' as lineas_crm, json_field->'crm_v1'->'lineas_operativas_vigentes' as lineas_vigentes, json_field->'ejecucion_v1' as ejecucion, json_field->'tripulacion_asignada' as tripulacion FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 76;"`);
  console.log(rJson.stdout);

  ssh.dispose();
}

run().catch(console.error);
