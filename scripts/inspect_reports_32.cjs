const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const q = `
    SELECT id_reporte_avance, fecha_reporte, horas_operadas, horas_facturables, token_report, estado_reporte,
           id_user_operador, id_user_rigger, id_equipo
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE id_proyecto = 32;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${q.replace(/\n/g, ' ')}\\""`);
  console.log('Reports de Proyecto 32 en PROD:\n', res.stdout);

  ssh.dispose();
}

main().catch(console.error);
