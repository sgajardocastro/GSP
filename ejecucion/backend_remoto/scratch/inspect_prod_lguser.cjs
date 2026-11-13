const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== BUSCANDO USUARIOS LGUSER EN sch_leangsp_prod ===');
  const sql = `
    SELECT id_user, codi_user, rut, email, name_frst, apellido_pat, flag_proc_enrol, activo 
    FROM sch_leangsp_prod.tsec_users 
    WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%' OR rut ILIKE '%lguser%';
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout || res.stderr);

  console.log('\n=== REVISANDO TABLAS DE ENROLAMIENTO Y ROLES ASOCIADOS ===');
  const checkRoles = `
    SELECT r.id_user, r.id_rol, u.email 
    FROM sch_leangsp_prod.tsec_user_roles r
    JOIN sch_leangsp_prod.tsec_users u ON r.id_user = u.id_user
    WHERE u.email ILIKE '%lguser%' OR u.codi_user ILIKE '%lguser%';
  `;
  const resRoles = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${checkRoles.replace(/\n/g, ' ')}\\""`);
  console.log(resRoles.stdout || resRoles.stderr);

  console.log('\n=== REVISANDO SI HAY TRABAJADORES O DOCUMENTOS ENROLADOS ASOCIADOS ===');
  const checkTrabajador = `
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp_prod' AND table_name LIKE '%trabajador%' OR table_name LIKE '%enrol%';
  `;
  const resTables = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${checkTrabajador.replace(/\n/g, ' ')}\\""`);
  console.log(resTables.stdout || resTables.stderr);

  ssh.dispose();
}

inspect().catch(console.error);
