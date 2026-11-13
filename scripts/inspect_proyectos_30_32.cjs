const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  for (const s of ['sch_leangsp', 'sch_leangsp_prod']) {
    console.log(`\n=================== ESQUEMA: ${s} ===================`);
    
    // 1. Proyecto 32 y 30
    const qProy = `
      SELECT id_proyecto, codi_proyecto, id_proyecto_estado,
             json_field->'crm_v1'->>'pisoMinimo' as crm_piso_minimo,
             json_field->'crm_v1'->>'requiere_rigger' as requiere_rigger,
             jsonb_array_length(COALESCE(json_field->'crm_v1'->'lineas_servicio', '[]'::jsonb)) as count_lineas_servicio,
             jsonb_array_length(COALESCE(json_field->'crm_v1'->'lineas_operativas_vigentes', '[]'::jsonb)) as count_lineas_op_vigentes
      FROM ${s}.tpry_proyecto
      WHERE id_proyecto IN (30, 32);
    `;
    const rProy = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qProy.replace(/\n/g, ' ')}\\""`);
    console.log('Proyectos:\n', rProy.stdout);

    // 2. Líneas de servicio de proyecto 32
    const qLineas32 = `
      SELECT id_proyecto,
             json_field->'crm_v1'->'lineas_servicio' as lineas_servicio,
             json_field->'crm_v1'->'lineas_operativas_vigentes' as lineas_op
      FROM ${s}.tpry_proyecto
      WHERE id_proyecto = 32;
    `;
    const rLineas = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qLineas32.replace(/\n/g, ' ')}\\""`);
    console.log('Líneas Proyecto 32:\n', rLineas.stdout.substring(0, 1000));

    // 3. ITS de 30 y 32
    const qIts = `
      SELECT id_its, id_proyecto, folio_its, estado_its, valor_hora_pactado, horas_minimas_pactadas, valor_flete_pactado, total_ingresos_facturables, total_costos_operacionales
      FROM ${s}.tits_informe_termino
      WHERE id_proyecto IN (30, 32);
    `;
    const rIts = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qIts.replace(/\n/g, ' ')}\\""`);
    console.log('ITS Existentes:\n', rIts.stdout);

    // 4. Costos operacionales de 32
    const qCostos32 = `
      SELECT c.id_its, c.categoria, c.nombre_personal, c.monto_total, c.precio_unitario, c.cantidad_unidades, c.concepto_detalle
      FROM ${s}.tits_costo_operacional c
      JOIN ${s}.tits_informe_termino i ON c.id_its = i.id_its
      WHERE i.id_proyecto = 32
      ORDER BY c.categoria, c.id_costo_item;
    `;
    const rCostos32 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qCostos32.replace(/\n/g, ' ')}\\""`);
    console.log('Costos ITS 32:\n', rCostos32.stdout);
  }

  ssh.dispose();
}

main().catch(console.error);
