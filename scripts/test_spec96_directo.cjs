const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function test() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
    const http = require('http');
    const data = JSON.stringify({
      descripcion_trabajo: 'QA Test Multitécnico SPEC-096 (Taller Temuco)',
      fecha_trabajo: '2026-10-23',
      tecnicos: [
        { id_tecnico: 18, nombre_tecnico: 'Leonel Vergara', horas: 3.5 },
        { id_tecnico: 72, nombre_tecnico: 'Juan Espinoza', horas: 2.0 }
      ]
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3016,
      path: '/api/mantenimiento/ots/10/hh',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => console.log('RESPONSE:', res.statusCode, body));
    });

    req.write(data);
    req.end();
  `;

  const runRes = await ssh.execCommand(`node -e "${nodeScript.replace(/"/g, '\\"')}"`);
  console.log('Output:', runRes.stdout || runRes.stderr);

  // Check the inserted rows in DB
  const checkDb = await ssh.execCommand(`sudo -u postgres psql -d leangsp_prod -c "SELECT id_hh, nombre_tecnico, horas, tarifa, costo_calculado, descripcion_trabajo FROM sch_leangsp_prod.tmnt_ot_hh WHERE id_ot = 10 ORDER BY id_hh DESC LIMIT 5;"`);
  console.log('DB rows in PROD:\n', checkDb.stdout);

  // Cleanup QA rows
  await ssh.execCommand(`sudo -u postgres psql -d leangsp_prod -c "DELETE FROM sch_leangsp_prod.tmnt_ot_hh WHERE id_ot = 10 AND descripcion_trabajo LIKE '%QA Test%';"`);
  console.log('Cleaned QA rows from PROD.');

  ssh.dispose();
}

test().catch(console.error);
