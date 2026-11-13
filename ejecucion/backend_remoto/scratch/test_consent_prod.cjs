const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function testConsent() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('Testing crearConsentimientoEnrolamiento inside lean-services-gsp-prod:');
  const code = `
    const { crearConsentimientoEnrolamiento } = require('./src/services/enrolamientoService');
    (async () => {
      try {
        console.log('Ejecutando para id_user: 1, rut: 12345678-9...');
        const res = await crearConsentimientoEnrolamiento({ id_user: 1, rut: '12345678-9' });
        console.log('SUCCESS:', JSON.stringify(res));
        process.exit(0);
      } catch (err) {
        console.error('ERROR EN CONSENTIMIENTO:', err);
        process.exit(1);
      }
    })();
  `;

  const res = await ssh.execCommand(`su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node -e \\"${code.replace(/\n/g, ' ')}\\""`);
  console.log('STDOUT:', res.stdout);
  console.log('STDERR:', res.stderr);

  ssh.dispose();
}

testConsent().catch(console.error);
