const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectOt51() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
\\x on
SELECT id_proyecto, codi_proyecto, nombre_proyecto, fecha_plan_ini, fecha_plan_fin, 
       fecha_creacion, id_proyecto_estado,
       json_field->'crm_v1' as crm_v1,
       json_field->'cotizacion_v1' as cotizacion_v1,
       json_field->'asignaciones_v1' as asignaciones_v1,
       json_field->'ejecucion_v1' as ejecucion_v1
FROM sch_leangsp_prod.tpry_proyecto 
WHERE codi_proyecto = 'GSP-2611-00051';

\\x off
SELECT id_rel_equipo, id_proyecto, id_equipo, rol_equipo, fecha_asignacion, fecha_ini, fecha_fin, json_datos 
FROM sch_leangsp_prod.tpry_rel_equipo 
WHERE id_proyecto IN (SELECT id_proyecto FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto = 'GSP-2611-00051');

SELECT rp.id_rel_persona, rp.id_proyecto, rp.id_user, rp.rol_persona, rp.fecha_asignacion,
       u.name_frst || ' ' || u.apellido_pat as nombre_persona
FROM sch_leangsp_prod.tpry_rel_persona rp
JOIN sch_leangsp_prod.tsec_users u ON rp.id_user = u.id_user
WHERE rp.id_proyecto IN (SELECT id_proyecto FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto = 'GSP-2611-00051');
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query_ot51.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_ot51.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

inspectOt51().catch(console.error);
