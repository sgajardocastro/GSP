const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runTest() {
  console.log('--- Conectando al servidor para prueba de conectividad SMTP ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const testScript = `
const net = require('net');
const tls = require('tls');
const dns = require('dns');

console.log('=== 1. RESOLUCIÓN DNS ===');
dns.lookup('powercp2.zglobalhost.com', { all: true }, (err, addresses) => {
  if (err) console.error('Error DNS:', err);
  else console.log('Direcciones DNS:', addresses);

  // Probar conexiones TCP directas
  console.log('=== 2. PRUEBA DE CONEXIONES TCP ===');
  testTcp('138.255.101.224', 465, 'IPv4 :465 (SSL)');
  testTcp('138.255.101.224', 587, 'IPv4 :587 (Submission)');
  testTcp('138.255.101.224', 25, 'IPv4 :25 (SMTP Estándar)');
  
  // Probar hostname con family: 4
  testTcp('powercp2.zglobalhost.com', 465, 'Hostname :465 por defecto');
  testTcp('powercp2.zglobalhost.com', 587, 'Hostname :587 por defecto');
});

function testTcp(host, port, desc) {
  const start = Date.now();
  const socket = net.createConnection({ host, port, timeout: 5000 }, () => {
    const elapsed = Date.now() - start;
    console.log(\`✅ [\${desc}] CONEXION EXITOSA en \${elapsed}ms\`);
    socket.destroy();
  });
  socket.on('timeout', () => {
    console.log(\`❌ [\${desc}] TIMEOUT (5000ms)\`);
    socket.destroy();
  });
  socket.on('error', (err) => {
    console.log(\`❌ [\${desc}] ERROR: \${err.message}\`);
  });
}
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_smtp.js\n${testScript}\nEOF`);
  const res = await ssh.execCommand('node /tmp/test_smtp.js');
  console.log('--- SALIDA DE LA PRUEBA EN EL SERVIDOR ---');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

runTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
