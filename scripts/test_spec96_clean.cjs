const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const payload = {
    descripcion_trabajo: 'QA Test Multitécnico SPEC-096 (Taller Temuco)',
    fecha_trabajo: '2026-10-23',
    tecnicos: [
      { id_tecnico: 18, nombre_tecnico: 'Leonel Vergara', horas: 3.5 },
      { id_tecnico: 72, nombre_tecnico: 'Juan Espinoza', horas: 2.0 }
    ]
  };

  await ssh.execCommand(`echo '${JSON.stringify(payload)}' > /tmp/qa_spec96.json`);
  const checkJson = await ssh.execCommand('cat /tmp/qa_spec96.json');
  console.log('JSON en /tmp/qa_spec96.json:\n', checkJson.stdout);

  console.log('Ejecutando POST con curl -d @/tmp/qa_spec96.json...');
  const res = await ssh.execCommand('curl -s -X POST http://127.0.0.1:3016/api/mantenimiento/ots/10/hh -H "Content-Type: application/json" -d @/tmp/qa_spec96.json');
  console.log('RESPUESTA:', res.stdout);

  // Consultar filas insertadas en BD
  const dbCheck = await ssh.execCommand(`sudo -u postgres psql -d leangsp_prod -c "SELECT id_hh, nombre_tecnico, horas, tarifa, costo_calculado, descripcion_trabajo FROM sch_leangsp_prod.tmnt_ot_hh WHERE id_ot = 10 AND descripcion_trabajo LIKE '%QA Test%' ORDER BY id_hh ASC;"`);
  console.log('BD PROD:\n', dbCheck.stdout);

  // Limpiar
  await ssh.execCommand(`sudo -u postgres psql -d leangsp_prod -c "DELETE FROM sch_leangsp_prod.tmnt_ot_hh WHERE id_ot = 10 AND descripcion_trabajo LIKE '%QA Test%';"`);
  await ssh.execCommand('rm -f /tmp/qa_spec96.json');
  console.log('Limpieza completada.');

  ssh.dispose();
}

run().catch(console.error);
