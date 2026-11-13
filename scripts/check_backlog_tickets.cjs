const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkBacklog() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== ULTIMOS 15 REGISTROS EN sch_leangsp_prod.tcfg_backlog ===');
  const sqlProd = `
    SELECT 
      id, 
      codigo_req, 
      nombre_requerimiento, 
      prioridad, 
      fecha_registro, 
      solicitado_por, 
      estado, 
      creado_por,
      SUBSTRING(descripcion, 1, 120) as desc_corta
    FROM sch_leangsp_prod.tcfg_backlog 
    ORDER BY id DESC 
    LIMIT 15;
  `;
  const resProd = await ssh.execCommand(`PGPASSWORD='usr_gsp_prod_2026!' psql -U usr_leangsp_prod -d postgres -h localhost -c "${sqlProd}"`);
  console.log(resProd.stdout);

  console.log('=== TICKETS RECIENTES, PENDIENTES O DE JORGE EN DEV ===');
  const sqlDev = sqlProd.replace(/sch_leangsp_prod/g, 'sch_leangsp');
  const resDev = await ssh.execCommand(`PGPASSWORD='usr_gsp_123' psql -U usr_leangsp -d postgres -h localhost -c "${sqlDev}"`);
  console.log(resDev.stdout);

  ssh.dispose();
}

checkBacklog().catch(err => {
  console.error('Error consultando backlog:', err);
  process.exit(1);
});
