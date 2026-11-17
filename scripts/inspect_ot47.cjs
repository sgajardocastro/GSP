const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectOt47() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
SELECT id_proyecto, codi_proyecto, json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion_json
FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto = 'GSP-2611-00047';

SELECT rp.id_rel_persona, rp.id_proyecto, rp.id_user, rp.rol_asignado, rp.estado_real,
       u.name_frst || ' ' || u.apellido_pat as nombre
FROM sch_leangsp_prod.tpry_rel_persona rp
JOIN sch_leangsp_prod.tsec_users u ON rp.id_user = u.id_user
WHERE rp.id_proyecto IN (SELECT id_proyecto FROM sch_leangsp_prod.tpry_proyecto WHERE codi_proyecto = 'GSP-2611-00047');
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/query_ot47.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_ot47.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

inspectOt47().catch(console.error);
