const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function run() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sqlProd = `INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado) VALUES ('REQ-1127', 'Modo de Revision Ejecutiva en Aprobacion de ITS para Jefaturas (Operaciones y Contabilidad)', 'SPEC-116: Modo de aprobacion simplificado en ModalITS.vue para Jefatura de Operaciones (Paso 2) y Contabilidad (Paso 3). Visualizacion de PDF oficial firmado por Yiara y dos botones de accion: Aprobar (PIN FES) y Devolver con Observaciones.', 'Critica', CURRENT_DATE, 'Alfonso Porperrello / Sergio Gajardo', 'Implementado') ON CONFLICT (codigo_req) DO UPDATE SET nombre_requerimiento = EXCLUDED.nombre_requerimiento, descripcion = EXCLUDED.descripcion, estado = 'Implementado', fecha_implementacion = CURRENT_DATE, solicitado_por = EXCLUDED.solicitado_por;`;

  const sqlDev = sqlProd.replace(/sch_leangsp_prod/g, 'sch_leangsp');

  const res1 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlProd}\\""`);
  console.log('PROD SQL:', res1.stdout || res1.stderr);

  const res2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlDev}\\""`);
  console.log('DEV SQL:', res2.stdout || res2.stderr);

  const check = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req = 'REQ-1127';\\""`);
  console.log('Verification:\n', check.stdout);

  ssh.dispose();
}

run().catch(console.error);
