const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function cargarTecnicos() {
  console.log('==================================================================');
  console.log('🚀 CARGA DE NÓMINA DE TÉCNICOS DE TALLER EN PRODUCCIÓN (GSP)');
  console.log('==================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ Conexión SSH establecida con éxito.');

  const schema = 'sch_leangsp_prod';

  const sql = `
  BEGIN;

  -- 1. Actualizar usuario ID 18 con los nombres oficiales de Leonel Vergara
  UPDATE ${schema}.tsec_users
  SET name_frst = 'LEONEL EDUARDO',
      name_sec = NULL,
      apellido_pat = 'VERGARA',
      apellido_mat = 'GALLARDO',
      rut = '18644892-8',
      movil = '+5697840185',
      id_empresa = 9,
      activo = true,
      json_data = '{"cargo": "Encargado Mantención Taller", "especialidad": "ENCARGADO MANTENCION"}'::jsonb,
      fecha_actualizacion = NOW()
  WHERE id_user = 18;

  -- 2. Limpiar técnicos si ya estuvieran para evitar duplicados
  DELETE FROM ${schema}.tsec_user_roles WHERE id_user IN (
    SELECT id_user FROM ${schema}.tsec_users WHERE email IN (
      'jose0506espinoza@gmail.com', 'masr.tass@gmail.com', 'g.scaaff.h@gmail.com',
      'jriquelmerino@gmail.com', 'victor34-mec@gmail.com', 'henryperez_40@gmail.com',
      'dayan.gormaz@gmail.com', 'lv391137@gmail.com', 'altacumbia1989@gmail.com'
    )
  );

  DELETE FROM ${schema}.tsec_users 
  WHERE email IN (
    'jose0506espinoza@gmail.com', 'masr.tass@gmail.com', 'g.scaaff.h@gmail.com',
    'jriquelmerino@gmail.com', 'victor34-mec@gmail.com', 'henryperez_40@gmail.com',
    'dayan.gormaz@gmail.com', 'lv391137@gmail.com', 'altacumbia1989@gmail.com'
  );

  -- 3. Insertar los 9 técnicos de taller
  INSERT INTO ${schema}.tsec_users (
    email, name_frst, apellido_pat, apellido_mat, rut, movil, id_empresa, activo, codi_user, flag_proc_enrol, json_data, fecha_creacion, fecha_actualizacion
  ) VALUES 
  ('jose0506espinoza@gmail.com', 'JUAN JOSE', 'ESPINOZA', 'SAAVEDRA', '20766608-4', '+56931951111', 9, true, 'jose0506espinoza@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "AYUDANTE MECÁNICO"}'::jsonb, NOW(), NOW()),
  ('masr.tass@gmail.com', 'MAURICIO ALEJANDRO', 'SEPÚLVEDA', 'RIQUELME', '12931289-0', '+56984001659', 9, true, 'masr.tass@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "ELECTROMECÁNICO"}'::jsonb, NOW(), NOW()),
  ('g.scaaff.h@gmail.com', 'GUILLERMO ENRIQUE', 'SCHAAFF', 'HALABI', '9243228-9', '+56942918381', 9, true, 'g.scaaff.h@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "MECÁNICO"}'::jsonb, NOW(), NOW()),
  ('jriquelmerino@gmail.com', 'JOSE RUBEN', 'RIQUELME', 'MERINO', '10975397-1', '+56964439228', 9, true, 'jriquelmerino@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "MECÁNICO"}'::jsonb, NOW(), NOW()),
  ('victor34-mec@gmail.com', 'VICTOR FREDDY', 'RUIZ', 'RIFFO', '12192744-6', '+56968419040', 9, true, 'victor34-mec@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "MECÁNICO"}'::jsonb, NOW(), NOW()),
  ('henryperez_40@gmail.com', 'JOSE HENRY', 'PEREZ', 'JARA', '13113937-3', '+56949576591', 9, true, 'henryperez_40@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "SOLDADOR"}'::jsonb, NOW(), NOW()),
  ('dayan.gormaz@gmail.com', 'DAYAN ANDRES', 'GORMAZ', 'MUÑOZ', '16632333-9', '+56946986113', 9, true, 'dayan.gormaz@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "PINTOR AUTOMOTRIZ"}'::jsonb, NOW(), NOW()),
  ('lv391137@gmail.com', 'LUIS GERARDO', 'VASQUEZ', 'BERBERIA', '27137851-3', '+56932398457', 9, true, 'lv391137@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "SOLDADOR"}'::jsonb, NOW(), NOW()),
  ('altacumbia1989@gmail.com', 'RODRIGO ARIEL', 'MARILAO', 'CURRIMAN', '17255018-5', '+56930738590', 9, true, 'altacumbia1989@gmail.com', false, '{"cargo": "Técnico Taller Mantenimiento", "especialidad": "AYUDANTE PINTOR AUTOMOTRIZ"}'::jsonb, NOW(), NOW());

  -- 4. Asignar rol de taller si existe
  DO $$
  DECLARE
    v_id_rol BIGINT;
    u RECORD;
  BEGIN
    SELECT id_rol INTO v_id_rol FROM ${schema}.tsec_roles WHERE name_rol ILIKE '%TALLER%' OR name_rol ILIKE '%EJEC%' LIMIT 1;
    IF v_id_rol IS NOT NULL THEN
      FOR u IN (
        SELECT id_user FROM ${schema}.tsec_users 
        WHERE email IN (
          'jose0506espinoza@gmail.com', 'masr.tass@gmail.com', 'g.scaaff.h@gmail.com',
          'jriquelmerino@gmail.com', 'victor34-mec@gmail.com', 'henryperez_40@gmail.com',
          'dayan.gormaz@gmail.com', 'lv391137@gmail.com', 'altacumbia1989@gmail.com',
          'mantencion@arriendosanpablo.cl'
        )
      ) LOOP
        INSERT INTO ${schema}.tsec_user_roles (id_user, id_rol)
        VALUES (u.id_user, v_id_rol)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END $$;

  COMMIT;
  `;

  console.log('Subiendo archivo SQL temporal hacia el servidor...');
  await ssh.execCommand(`cat << 'EOF' > /tmp/carga_tecnicos_taller.sql\n${sql}\nEOF`);
  await ssh.execCommand('chmod 777 /tmp/carga_tecnicos_taller.sql');

  console.log('Ejecutando transacción SQL en PostgreSQL...');
  const resPsql = await ssh.execCommand('su - postgres -c "psql -v ON_ERROR_STOP=1 -d postgres -f /tmp/carga_tecnicos_taller.sql"');
  console.log('STDOUT:\n', resPsql.stdout);
  console.log('STDERR:\n', resPsql.stderr);

  await ssh.execCommand('rm -f /tmp/carga_tecnicos_taller.sql');

  console.log('\n--- VERIFICACIÓN DE TÉCNICOS EN BASE DE DATOS ---');
  const verifyRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_user, name_frst || ' ' || apellido_pat AS nombre_completo, rut, email, movil, json_data->>'cargo' AS cargo, json_data->>'especialidad' AS especialidad FROM ${schema}.tsec_users WHERE email IN ('jose0506espinoza@gmail.com', 'masr.tass@gmail.com', 'g.scaaff.h@gmail.com', 'jriquelmerino@gmail.com', 'victor34-mec@gmail.com', 'henryperez_40@gmail.com', 'dayan.gormaz@gmail.com', 'lv391137@gmail.com', 'altacumbia1989@gmail.com', 'mantencion@arriendosanpablo.cl') ORDER BY id_user;\\""`);
  console.log(verifyRes.stdout);

  ssh.dispose();
  console.log('\n🎉 ¡NÓMINA DE TALLER CARGADA Y CONFIGURADA EXITOSAMENTE EN PRODUCCIÓN!');
}

cargarTecnicos().catch(err => {
  console.error('❌ Error cargando técnicos:', err);
  process.exit(1);
});
