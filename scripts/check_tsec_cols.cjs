const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  await ssh.execCommand(`cat << 'EOF' > /tmp/search_adm.sql
SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, u.movil,
       (SELECT string_agg(r.name_rol, ', ') FROM sch_leangsp.tsec_user_roles ur JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = u.id_user) as roles
FROM sch_leangsp.tsec_users u
WHERE u.activo = true 
  AND (
    EXISTS (SELECT 1 FROM sch_leangsp.tsec_user_roles ur JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = u.id_user AND (r.name_rol ILIKE '%Admin%' OR r.name_rol ILIKE '%GSP_ADMIN%' OR r.name_rol ILIKE '%OPERACIONES%'))
    OR u.email ILIKE '%sgajardo%'
  );
EOF`);

  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/search_adm.sql"');
  console.log(res.stdout);
  ssh.dispose();
}

run().catch(console.error);
