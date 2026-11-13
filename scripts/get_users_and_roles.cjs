const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const query = `
    SELECT 
      u.id_user,
      TRIM(CONCAT_WS(' ', u.name_frst, u.name_sec, u.apellido_pat, u.apellido_mat)) AS nombre_completo,
      u.email,
      COALESCE(u.rut, '-') AS rut,
      COALESCE(emp.name_empresa, 'Sin Empresa') AS empresa,
      COALESCE(STRING_AGG(DISTINCT r.name_rol, ', ' ORDER BY r.name_rol), 'SIN ROL') AS roles,
      CASE WHEN u.activo THEN 'ACTIVO' ELSE 'INACTIVO' END AS estado
    FROM sch_leangsp_prod.tsec_users u
    LEFT JOIN sch_leangsp_prod.tpar_empresas emp ON u.id_empresa = emp.id_empresa
    LEFT JOIN sch_leangsp_prod.tsec_user_roles ur ON u.id_user = ur.id_user
    LEFT JOIN sch_leangsp_prod.tsec_roles r ON ur.id_rol = r.id_rol
    GROUP BY u.id_user, u.name_frst, u.name_sec, u.apellido_pat, u.apellido_mat, u.email, u.rut, emp.name_empresa, u.activo
    ORDER BY u.id_user ASC;
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -F'|' -c \\"${query.replace(/\n/g, ' ')}\\""`);
  if (res.stderr) console.error('STDERR:', res.stderr);
  
  const lines = res.stdout.trim().split('\n').filter(Boolean);
  
  console.log('| ID | Nombre Completo | Email | RUT | Empresa | Roles Asociados | Estado |');
  console.log('| :---: | :--- | :--- | :--- | :--- | :--- | :---: |');
  for (const line of lines) {
    const [id, nombre, email, rut, empresa, roles, estado] = line.split('|');
    console.log(`| ${id} | ${nombre || '*(Sin nombre)*'} | ${email || '-'} | ${rut} | ${empresa} | ${roles} | ${estado} |`);
  }

  console.log('\n### Catálogo de Roles Disponibles (sch_leangsp_prod.tsec_roles)');
  const rolesRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -F'|' -c \\"SELECT id_rol, name_rol, COALESCE(description, '-') FROM sch_leangsp_prod.tsec_roles ORDER BY id_rol;\\""`);
  console.log('| ID Rol | Nombre Rol | Descripción |');
  console.log('| :---: | :--- | :--- |');
  for (const r of rolesRes.stdout.trim().split('\n').filter(Boolean)) {
    const [id_rol, name_rol, desc] = r.split('|');
    console.log(`| ${id_rol} | ${name_rol} | ${desc} |`);
  }

  ssh.dispose();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
