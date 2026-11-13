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

    const qRes = await ssh.execCommand(`PGPASSWORD=usr_gsp_123 psql -h 127.0.0.1 -U usr_leangsp -d postgres -c "SET search_path TO sch_leangsp, public; SELECT id_user, rut, email, codi_user, name_frst, apellido_pat, flag_proc_enrol, activo FROM tsec_users WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%' OR email ILIKE '%arriendosanpablo%';"`);
    console.log(qRes.stdout || qRes.stderr);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
