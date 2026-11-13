const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const token = '169e71446108c163606d5743fa0c76d1c703e661585f7f19';
  const signPayload = JSON.stringify({
    token: token,
    nombre: 'Sergio Gajardo Valenzuela',
    rut: '12.345.678-9',
    cargo: 'Gerente General Arrendataria',
    firma_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  });

  console.log('--- Probando firma digital del contrato vía POST /api/proyectos/contrato/public/:token/firmar ---');
  const curlCmd = `curl -s -X POST http://127.0.0.1:3006/api/proyectos/contrato/public/${token}/firmar -H "Content-Type: application/json" -d '${signPayload}'`;
  const curlRes = await ssh.execCommand(curlCmd);
  console.log('Respuesta firma backend:\n', curlRes.stdout.trim() || curlRes.stderr);

  ssh.dispose();
}

run();
