const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/operaciones/report/pendientes-analista');
  console.log('HTTP 3016 /operaciones/report/pendientes-analista length:', res.stdout.length);
  const json = JSON.parse(res.stdout);
  console.log('Success:', json.success);
  console.log('Reports count:', json.data?.reports?.length);
  const rep56 = json.data?.reports?.find(r => r.id_proyecto === 56 || r.id_reporte_avance == 52);
  console.log('Rep 56 (Carran):', rep56 ? {
    id_reporte_avance: rep56.id_reporte_avance,
    id_proyecto: rep56.id_proyecto,
    estado_reporte: rep56.estado_reporte,
    dia_correlativo: rep56.dia_correlativo,
    fecha_reporte: rep56.fecha_reporte
  } : 'NOT FOUND');
  ssh.dispose();
}

main().catch(console.error);
