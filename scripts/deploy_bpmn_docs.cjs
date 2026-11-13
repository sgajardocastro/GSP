const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
}

async function deployBpmnDocs() {
  console.log('Conectando a servidor SSH (138.255.103.18:1295)...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✓ Conexión SSH establecida.');

  const baseDir = path.resolve(__dirname, '..');
  const filesToDeploy = [
    'centro_documentacion_gsp.html',
    'presentacion_pipeline_interactivo.html',
    'bpmn_proceso_servicio_gsp.html'
  ];

  const targets = [
    '/var/www/html/lg-gsp-dev/',
    '/var/www/html/lg-gsp-prod/'
  ];

  // Comprobar si /var/www/html/lg-gsp/ existe como alias o dir
  const checkAlias = await ssh.execCommand('test -d /var/www/html/lg-gsp/ && echo "YES" || echo "NO"');
  if (checkAlias.stdout.trim() === 'YES') {
    targets.push('/var/www/html/lg-gsp/');
  }

  for (const t of targets) {
    console.log(`\nSubiendo archivos a ${t}...`);
    for (const f of filesToDeploy) {
      const localPath = path.join(baseDir, 'ejecucion/frontend/public', f);
      await ssh.putFile(localPath, t + f);
      console.log(`  ✓ Subido: ${f}`);
    }
    await ssh.execCommand(`chown -R nginx:nginx ${t}centro_documentacion_gsp.html ${t}presentacion_pipeline_interactivo.html ${t}bpmn_proceso_servicio_gsp.html && chmod 644 ${t}centro_documentacion_gsp.html ${t}presentacion_pipeline_interactivo.html ${t}bpmn_proceso_servicio_gsp.html`);
  }

  console.log('\n--- VERIFICACIÓN HTTP ---');
  const urlsToCheck = [
    'https://servidor.leanglobal.cl/lg-gsp-dev/centro_documentacion_gsp.html',
    'https://servidor.leanglobal.cl/lg-gsp-dev/presentacion_pipeline_interactivo.html',
    'https://servidor.leanglobal.cl/lg-gsp-dev/bpmn_proceso_servicio_gsp.html',
    'https://servidor.leanglobal.cl/lg-gsp-prod/centro_documentacion_gsp.html',
    'https://servidor.leanglobal.cl/lg-gsp-prod/presentacion_pipeline_interactivo.html',
    'https://servidor.leanglobal.cl/lg-gsp-prod/bpmn_proceso_servicio_gsp.html',
    'https://servidor.leanglobal.cl/lg-gsp/centro_documentacion_gsp.html',
    'https://servidor.leanglobal.cl/lg-gsp/presentacion_pipeline_interactivo.html',
    'https://servidor.leanglobal.cl/lg-gsp/bpmn_proceso_servicio_gsp.html'
  ];

  for (const u of urlsToCheck) {
    const res = await checkUrl(u);
    console.log(`${u} -> HTTP ${res.status || res.error}`);
  }

  ssh.dispose();
  console.log('\n✓ Despliegue completado con éxito.');
}

deployBpmnDocs().catch(err => {
  console.error('Error desplegando documentación:', err);
  process.exit(1);
});
