import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('✅ Conectado por SSH al servidor.');

    // 1. Consultar schemas existentes
    const findSchemas = `PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%gsp%';"`;
    const schemasRes = await ssh.execCommand(findSchemas);
    const schemas = schemasRes.stdout.trim().split('\n').map(s => s.trim()).filter(Boolean);
    console.log('Schemas GSP detectados:', schemas);

    for (const schema of schemas) {
      console.log(`\n--- REVISANDO SCHEMA: ${schema} ---`);
      
      // Buscar el usuario
      const selectSql = `PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "SET search_path TO ${schema}, public; SELECT id_user, codi_user, email, name_frst, apellido_pat, flag_proc_enrol FROM tsec_users WHERE LOWER(email) = 'lguser@transmac.cl' OR LOWER(codi_user) = 'lguser@transmac.cl';"`;
      const selectRes = await ssh.execCommand(selectSql);
      console.log(selectRes.stdout || selectRes.stderr);

      // Ejecutar borrado Option A
      const deleteSql = `PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "SET search_path TO ${schema}, public; DELETE FROM tsec_user_roles WHERE id_user IN (SELECT id_user FROM tsec_users WHERE LOWER(email) = 'lguser@transmac.cl' OR LOWER(codi_user) = 'lguser@transmac.cl'); DELETE FROM tsec_users WHERE LOWER(email) = 'lguser@transmac.cl' OR LOWER(codi_user) = 'lguser@transmac.cl';"`;
      const deleteRes = await ssh.execCommand(deleteSql);
      console.log(deleteRes.stdout || deleteRes.stderr);

      // Verificar borrado
      const verifyRes = await ssh.execCommand(selectSql);
      console.log('Verificación post-borrado:\n', verifyRes.stdout || verifyRes.stderr);
    }

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
