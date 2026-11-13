const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });

  const sqlContent = (schema) => `
DO $block$
DECLARE
  v_id_omar INT;
  v_id_rol_admin INT;
  v_id_rol_ejec INT;
BEGIN
  SELECT id_rol INTO v_id_rol_admin FROM ${schema}.tsec_roles WHERE LOWER(name_rol) = 'admin' LIMIT 1;
  SELECT id_rol INTO v_id_rol_ejec FROM ${schema}.tsec_roles WHERE name_rol = 'GSP_EJEC' LIMIT 1;

  -- 1. Quitar rol Admin a Omar Soffia (user 46)
  DELETE FROM ${schema}.tsec_user_roles WHERE id_user = 46 AND id_rol = v_id_rol_admin;

  -- 2. Asignar rol Operador a Omar Soffia si no lo tiene
  IF v_id_rol_ejec IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM ${schema}.tsec_user_roles WHERE id_user = 46 AND id_rol = v_id_rol_ejec) THEN
      INSERT INTO ${schema}.tsec_user_roles (id_user, id_rol) VALUES (46, v_id_rol_ejec);
    END IF;
  END IF;

  -- 3. Crear o actualizar Omar Ghiselini
  SELECT id_user INTO v_id_omar FROM ${schema}.tsec_users WHERE email = 'omar.ghiselini@arriendosanpablo.cl';
  IF v_id_omar IS NULL THEN
    INSERT INTO ${schema}.tsec_users (
      email, name_frst, apellido_pat, apellido_mat, rut, id_empresa, movil, activo, codi_user, email_alternativo, json_data, fecha_creacion
    ) VALUES (
      'omar.ghiselini@arriendosanpablo.cl',
      'Omar',
      'Ghiselini',
      'Jara',
      '52004162-1',
      9,
      '+56994437725',
      true,
      'omar.ghiselini@arriendosanpablo.cl',
      'omar.ghisellini@arriendosanpablo.cl',
      '{"cargo":"Director General","genero":"M"}'::jsonb,
      NOW()
    ) RETURNING id_user INTO v_id_omar;
  ELSE
    UPDATE ${schema}.tsec_users 
    SET name_frst = 'Omar', apellido_pat = 'Ghiselini', apellido_mat = 'Jara', activo = true,
        email_alternativo = 'omar.ghisellini@arriendosanpablo.cl'
    WHERE id_user = v_id_omar;
  END IF;

  -- 4. Asignar rol Admin a Omar Ghiselini
  IF v_id_rol_admin IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM ${schema}.tsec_user_roles WHERE id_user = v_id_omar AND id_rol = v_id_rol_admin) THEN
      INSERT INTO ${schema}.tsec_user_roles (id_user, id_rol) VALUES (v_id_omar, v_id_rol_admin);
    END IF;
  END IF;
END $block$;
`;

  console.log('=== SUBIENDO Y EJECUTANDO SQL EN PROD ===');
  await ssh.execCommand("cat << 'EOF' > /tmp/fix_omar_prod.sql\n" + sqlContent('sch_leangsp_prod') + "\nEOF");
  const resProd = await ssh.execCommand('PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -f /tmp/fix_omar_prod.sql');
  console.log('Prod:\n', resProd.stdout, resProd.stderr);

  console.log('=== SUBIENDO Y EJECUTANDO SQL EN DEV ===');
  await ssh.execCommand("cat << 'EOF' > /tmp/fix_omar_dev.sql\n" + sqlContent('sch_leangsp') + "\nEOF");
  const resDev = await ssh.execCommand('PGPASSWORD=usr_gsp_123 psql -h localhost -U usr_leangsp -d postgres -f /tmp/fix_omar_dev.sql');
  console.log('Dev:\n', resDev.stdout, resDev.stderr);

  console.log('=== VERIFICAR ADMINS EN PROD ===');
  const adminsProd = await ssh.execCommand("PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -c \"SELECT u.id_user, u.name_frst, u.apellido_pat, u.email, r.name_rol FROM sch_leangsp_prod.tsec_users u JOIN sch_leangsp_prod.tsec_user_roles ur ON u.id_user = ur.id_user JOIN sch_leangsp_prod.tsec_roles r ON ur.id_rol = r.id_rol WHERE LOWER(r.name_rol) = 'admin';\"");
  console.log(adminsProd.stdout);

  console.log('=== VERIFICAR ROLES DE USER 46 (OMAR SOFFIA) EN PROD ===');
  const roles46 = await ssh.execCommand("PGPASSWORD=usr_gsp_prod_2026! psql -h localhost -U usr_leangsp_prod -d postgres -c \"SELECT ur.id_user, u.name_frst, u.apellido_pat, ur.id_rol, r.name_rol FROM sch_leangsp_prod.tsec_user_roles ur JOIN sch_leangsp_prod.tsec_users u ON ur.id_user = u.id_user JOIN sch_leangsp_prod.tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = 46;\"");
  console.log(roles46.stdout);

  ssh.dispose();
}

run().catch(console.error);
