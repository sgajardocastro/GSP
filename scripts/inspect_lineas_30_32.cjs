const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
    SELECT id_proyecto, codi_proyecto,
           json_field->'crm_v1'->'lineas_servicio' as lineas_servicio,
           json_field->'crm_v1'->'lineas_operativas_vigentes' as lineas_op,
           json_field->'crm_v1'->'pisoMinimo' as piso_minimo,
           json_field->'crm_v1'->'es_valor_fijo' as es_valor_fijo,
           json_field->'crm_v1'->'requiere_rigger' as requiere_rigger
    FROM sch_leangsp_prod.tpry_proyecto
    WHERE id_proyecto IN (30, 32);
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"${q.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
