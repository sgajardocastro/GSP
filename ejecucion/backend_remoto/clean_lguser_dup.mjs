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

    // 1. Desactivar y renombrar el email del usuario 53 histórico para que no colisione y mantenga la integridad referencial de los proyectos
    const renameSql = `PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "UPDATE sch_leangsp.tsec_users SET email = 'lguser_antiguo_777@arriendosanpablo.cl', codi_user = 'lguser_antiguo_777@arriendosanpablo.cl', activo = false WHERE id_user = 53;"`;
    const renameRes = await ssh.execCommand(renameSql);
    console.log('Renombrar usuario histórico 53:', renameRes.stdout || renameRes.stderr);

    // 2. Verificar que sólo exista el 58 con lguser@arriendosanpablo.cl
    const check = await ssh.execCommand(`PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "SELECT id_user, rut, email, codi_user, flag_proc_enrol, activo FROM sch_leangsp.tsec_users WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%';"`);
    console.log('ESTADO FINAL:\n', check.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
