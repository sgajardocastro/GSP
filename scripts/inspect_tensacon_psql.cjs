const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function inspectTensaconPsql() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. BUSCAR PROYECTO 233-004 ===');
  const resP = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
    SELECT json_build_object(
      'id_proyecto', id_proyecto,
      'codi_proyecto', codi_proyecto,
      'nombre_proyecto', nombre_proyecto,
      'json_field', json_field
    )
    FROM sch_leangsp_prod.tpry_proyecto 
    WHERE codi_proyecto ILIKE '%233-004%' OR codi_proyecto = 'GSP-2610-233-004';
  \\""`);
  
  if (resP.stdout) {
    fs.writeFileSync('scripts/tensacon_proyecto_prod.json', resP.stdout.trim());
    console.log('Guardado en scripts/tensacon_proyecto_prod.json (Bytes:', resP.stdout.length, ')');
  } else {
    console.log('No stdout:', resP.stderr);
  }

  console.log('=== 2. REPORTS DE AVANCE ===');
  const resReps = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
    SELECT json_agg(json_build_object(
      'id_reporte_avance', id_reporte_avance,
      'id_proyecto', id_proyecto,
      'horas_operadas', horas_operadas,
      'horas_facturables', horas_facturables,
      'horas_sobretiempo', horas_sobretiempo,
      'json_field', json_field
    ))
    FROM sch_leangsp_prod.tedp_reporte_avance 
    WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto ILIKE '%233-004%');
  \\""`);
  if (resReps.stdout) {
    fs.writeFileSync('scripts/tensacon_reports_prod.json', resReps.stdout.trim());
    console.log('Guardado en scripts/tensacon_reports_prod.json');
  }

  console.log('=== 3. LINEAS DE COTIZACION / TAREAS GANTT ===');
  const resLineas = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"
    SELECT json_agg(json_build_object(
      'id_tarea', id_tarea,
      'id_proyecto', id_proyecto,
      'nombre_tarea', nombre_tarea,
      'unidad_cobro', unidad_cobro,
      'cantidad', cantidad,
      'precio_unitario', precio_unitario,
      'total', total,
      'json_field', json_field
    ))
    FROM sch_leangsp_prod.tpry_gantt_tarea_v2 
    WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto ILIKE '%233-004%');
  \\""`);
  if (resLineas.stdout) {
    fs.writeFileSync('scripts/tensacon_lineas_prod.json', resLineas.stdout.trim());
    console.log('Guardado en scripts/tensacon_lineas_prod.json');
  }

  ssh.dispose();
}

inspectTensaconPsql().catch(e => { console.error(e); if (ssh) ssh.dispose(); });
