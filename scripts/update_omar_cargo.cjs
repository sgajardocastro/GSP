const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runSingleUpdate() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const res1 = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"UPDATE sch_leangsp.tsec_users SET json_data = \'{\\\\\\"cargo\\\\\\": \\\\\\"Operador (Dev)\\\\\\", \\\\\\"genero\\\\\\": \\\\\\"M\\\\\\"}\'::jsonb WHERE id_user = 66;\\""');
  console.log('Update Omar:', res1.stdout || res1.stderr);

  const res2 = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT DISTINCT u.id_user, u.name_frst, u.apellido_pat, u.email, u.movil AS phone FROM sch_leangsp.tsec_users u LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol WHERE u.activo = true AND (r.name_rol ILIKE \'%Admin%\' OR r.name_rol ILIKE \'%GSP_ADMIN%\' OR r.name_rol ILIKE \'%OPERACIONES%\' OR COALESCE(u.json_data->>\'cargo\', \'\') ILIKE \'%Director%\' OR COALESCE(u.json_data->>\'cargo\', \'\') ILIKE \'%Jefe%\');\\""');
  console.log('Admins restantes en DEV:\n', res2.stdout || res2.stderr);

  ssh.dispose();
}

runSingleUpdate().catch(console.error);
