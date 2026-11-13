const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectDoc1175() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. EMPRESAS 7, 8, 9, 11 EN TPAR_EMPRESAS ===');
  const qEmp = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id_empresa, name_empresa, rut_empresa, razon_social, giro, logo_empresa FROM sch_leangsp_prod.tpar_empresas WHERE id_empresa IN (7, 8, 9, 11);\\""');
  console.log(qEmp.stdout);

  console.log('=== 2. BUSCAR ARCHIVO 1175 EN TFMG_FILES ===');
  const qFile = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT * FROM sch_leangsp_prod.tfmg_files WHERE id_doc = 1175;\\""');
  console.log(qFile.stdout);

  console.log('=== 2. BUSCAR PROYECTO CON ID_DOC 1175 EN JSON_FIELD ===');
  const qProy = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_empresa, id_empresa_cliente, id_proyecto_estado, json_field->'crm_v1'->'id_empresa' as crm_id_empresa, json_field->'crm_v1'->'empresa_emisora' as crm_empresa_emisora, json_field->'crm_v1'->'cotizaciones_historicas' as cots FROM sch_leangsp_prod.tpry_proyecto WHERE json_field::text LIKE '%1175%' OR id_proyecto = 18;\\""`);
  console.log('tpry_proyecto:', qProy.stdout || qProy.stderr);

  console.log('=== 3. TODOS LOS PROYECTOS RECIENTES (ID >= 15) ===');
  const qAll = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_empresa, id_empresa_cliente, id_proyecto_estado, fecha_creacion, json_field->'crm_v1'->'id_empresa_emisora' as emisora FROM sch_leangsp_prod.tpry_proyecto ORDER BY id_proyecto DESC LIMIT 5;\\""`);
  console.log('tpry_proyecto recientes:', qAll.stdout || qAll.stderr);

  console.log('=== 4. VER FILTROS DE VERIFICACIÓN / TORRE ===');
  const qEst = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT * FROM sch_leangsp_prod.tpry_estado;\\""`);
  console.log('Estados:', qEst.stdout || qEst.stderr);

  ssh.dispose();
}

inspectDoc1175().catch(console.error);
