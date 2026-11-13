const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/reports-diarios/usuario/pendientes?id_user=62"');
  const data = JSON.parse(res.stdout);
  console.log('--- CLAUDIO GALLARDO (id_user = 62) ---');
  console.log('Pendientes count:', (data.pendientes || []).length);
  console.log('Pendientes:', data.pendientes?.map(p => ({ id: p.id_proyecto, codi: p.codi_proyecto, motivo: p.motivo })));
  console.log('Concluidos count:', (data.concluidos || []).length);
  const ot36 = data.concluidos?.find(p => p.id_proyecto === 36);
  console.log('OT 36 en concluidos:', ot36 ? { id: ot36.id_proyecto, codi: ot36.codi_proyecto, motivo: ot36.motivo, msg: ot36.mensaje } : 'NO ENCONTRADA');

  console.log('\n--- ERNESTO RÍOS (id_user = 9) ---');
  const resE = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/reports-diarios/usuario/pendientes?id_user=9"');
  const dataE = JSON.parse(resE.stdout);
  const ot36E = dataE.pendientes?.find(p => p.id_proyecto === 36);
  console.log('OT 36 en pendientes de Ernesto:', ot36E ? { id: ot36E.id_proyecto, codi: ot36E.codi_proyecto, motivo: ot36E.motivo, msg: ot36E.mensaje } : 'NO ENCONTRADA');

  ssh.dispose();
}

main().catch(console.error);
