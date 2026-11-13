const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function updateDevRoles() {
  console.log('=== AJUSTANDO ROLES DE JORGE Y OMAR EN DEV (sch_leangsp) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    -- 1. Remover rol Admin (1) de Jorge Ponce (19) en DEV
    DELETE FROM sch_leangsp.tsec_user_roles WHERE id_user = 19 AND id_rol = 1;

    -- 2. Remover rol Admin (1) de Omar Ghiselini (66) en DEV
    DELETE FROM sch_leangsp.tsec_user_roles WHERE id_user = 66 AND id_rol = 1;

    -- 3. Modificar cargo de Omar en DEV para evitar coincidencia con Director
    UPDATE sch_leangsp.tsec_users 
    SET json_data = json_data || '{"cargo": "Operador (Dev)"}'::jsonb
    WHERE id_user = 66;

    -- 4. Consulta de verificación de administradores resultantes en DEV
    SELECT DISTINCT u.id_user, u.name_frst, u.apellido_pat, u.email, u.movil AS phone 
    FROM sch_leangsp.tsec_users u
    LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
    LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol
    WHERE u.activo = true
      AND (
        r.name_rol ILIKE '%Admin%' 
        OR r.name_rol ILIKE '%GSP_ADMIN%' 
        OR r.name_rol ILIKE '%OPERACIONES%'
        OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Director%'
        OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Jefe%'
      );
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/update_dev_roles.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/update_dev_roles.sql"');
  console.log(res.stdout || res.stderr);

  await ssh.execCommand('rm -f /tmp/update_dev_roles.sql');
  ssh.dispose();
  console.log('\nRoles actualizados en DEV.');
}

updateDevRoles().catch(console.error);
