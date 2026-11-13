const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function deleteLgUserProd() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== ELIMINANDO USUARIOS LGUSER Y ROLES EN sch_leangsp_prod ===');
  
  // 1. Identificar usuarios antes de borrar
  const qSelect = `SELECT id_user, codi_user, rut, email FROM sch_leangsp_prod.tsec_users WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%';`;
  const resSelect = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qSelect}\\""`);
  console.log('Usuarios a eliminar:');
  console.log(resSelect.stdout);

  // 2. Ejecutar transacción de borrado
  const qDelete = `
    BEGIN;
    DELETE FROM sch_leangsp_prod.tsec_user_roles 
    WHERE id_user IN (SELECT id_user FROM sch_leangsp_prod.tsec_users WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%');

    DELETE FROM sch_leangsp_prod.tsec_users 
    WHERE email ILIKE '%lguser%' OR codi_user ILIKE '%lguser%';
    COMMIT;
  `.replace(/\n/g, ' ');

  const resDel = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qDelete}\\""`);
  console.log('Resultado del borrado:');
  console.log(resDel.stdout || resDel.stderr);

  // 3. Verificación post-borrado
  console.log('\n=== VERIFICACIÓN POST-ELIMINACIÓN EN sch_leangsp_prod ===');
  const resVerify = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qSelect}\\""`);
  console.log(resVerify.stdout);

  const qCheckRoles = `SELECT * FROM sch_leangsp_prod.tsec_user_roles WHERE id_user IN (53, 59);`;
  const resCheckRoles = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${qCheckRoles}\\""`);
  console.log('Roles restantes (debe ser 0):');
  console.log(resCheckRoles.stdout);

  ssh.dispose();
}

deleteLgUserProd().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
