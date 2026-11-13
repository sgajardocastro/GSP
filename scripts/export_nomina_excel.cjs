const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const XLSX = require('../ejecucion/backend_remoto/node_modules/xlsx');
const path = require('path');
const fs = require('fs');

async function exportNomina() {
  console.log('=== 1. CONECTANDO A BD PRODUCCIÓN PARA EXTRAER NÓMINA ===');
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const queryUsers = `
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

  const queryRoles = `
    SELECT id_rol, name_rol, COALESCE(description, '-') AS descripcion
    FROM sch_leangsp_prod.tsec_roles
    ORDER BY id_rol ASC;
  `;

  const resUsers = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -F'|' -c \\"${queryUsers.replace(/\n/g, ' ')}\\""`);
  const resRoles = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -F'|' -c \\"${queryRoles.replace(/\n/g, ' ')}\\""`);
  ssh.dispose();

  console.log('=== 2. PROCESANDO DATOS Y AUDITORÍA DE SEGURIDAD ===');
  const userLines = resUsers.stdout.trim().split('\n').filter(Boolean);
  const rowsUsers = userLines.map(line => {
    const [id_user, nombre, email, rut, empresa, roles, estado] = line.split('|');
    
    // Clasificación y auditoría
    let auditoria = 'Conforme';
    if (['11', '13'].includes(id_user) && roles.includes('Admin')) {
      auditoria = '🚨 CRÍTICO: Rigger externo con rol Admin de plataforma';
    } else if (roles === 'SIN ROL') {
      auditoria = '⚠️ ALERTA: Usuario sin ningún rol asignado';
    } else if (roles === 'USR-CONSENT' && estado === 'ACTIVO') {
      auditoria = 'ℹ️ Pendiente: Solo rol consentimiento FES, falta GSP_EJEC';
    } else if (roles.includes('Admin')) {
      auditoria = 'Administrador de Plataforma';
    }

    return {
      'ID': Number(id_user),
      'Nombre Completo': nombre || '(Sin nombre registrado)',
      'Correo Electrónico': email || '-',
      'RUT': rut,
      'Empresa': empresa,
      'Roles Asignados': roles,
      'Estado': estado,
      'Diagnóstico / Auditoría de Seguridad': auditoria
    };
  });

  const roleLines = resRoles.stdout.trim().split('\n').filter(Boolean);
  const rowsRoles = roleLines.map(line => {
    const [id_rol, name_rol, descripcion] = line.split('|');
    return {
      'ID Rol': Number(id_rol),
      'Código Rol': name_rol,
      'Descripción / Alcance Operacional': descripcion
    };
  });

  console.log(`Procesados ${rowsUsers.length} usuarios y ${rowsRoles.length} roles.`);

  console.log('=== 3. CONSTRUYENDO ARCHIVO EXCEL (.XLSX) ===');
  const wb = XLSX.utils.book_new();

  // Hoja 1: Nómina de Usuarios
  const wsUsers = XLSX.utils.json_to_sheet(rowsUsers);
  wsUsers['!cols'] = [
    { wch: 6 },  // ID
    { wch: 38 }, // Nombre
    { wch: 38 }, // Email
    { wch: 14 }, // RUT
    { wch: 18 }, // Empresa
    { wch: 35 }, // Roles
    { wch: 12 }, // Estado
    { wch: 45 }  // Auditoría
  ];
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Nómina Usuarios y Roles');

  // Hoja 2: Catálogo de Roles
  const wsRoles = XLSX.utils.json_to_sheet(rowsRoles);
  wsRoles['!cols'] = [
    { wch: 10 }, // ID Rol
    { wch: 20 }, // Código Rol
    { wch: 65 }  // Descripción
  ];
  XLSX.utils.book_append_sheet(wb, wsRoles, 'Catálogo de Roles');

  // Destinos
  const targetGestion = path.resolve(__dirname, '../Gestión/nomina_usuarios_y_roles_gsp.xlsx');
  const targetRoot = path.resolve(__dirname, '../nomina_usuarios_y_roles_gsp.xlsx');

  XLSX.writeFile(wb, targetGestion);
  XLSX.writeFile(wb, targetRoot);

  console.log(`\nArchivo Excel generado exitosamente en:`);
  console.log(`1. ${targetGestion}`);
  console.log(`2. ${targetRoot}`);
}

exportNomina().catch(err => {
  console.error('Error generando Excel:', err);
  process.exit(1);
});
