const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id_costo, id_its, categoria, fecha, concepto_detalle, cantidad_unidades, precio_unitario, monto_total, auditoria_metadata FROM sch_leangsp_prod.tits_costo_operacional WHERE id_its = 9 ORDER BY id_costo ASC;'"`);
  console.log('Costos de id_its = 9:\n', res.stdout);

  ssh.dispose();
}

main().catch(console.error);
