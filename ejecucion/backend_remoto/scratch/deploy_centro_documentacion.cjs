const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployDocs() {
  console.log('Conectando a servidor.leanglobal.cl (138.255.103.18:1295)...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión SSH establecida exitosamente.');

  const publicDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/frontend/public';
  
  const filesToDeploy = [
    'centro_documentacion_gsp.html',
    'politica_manejo_excepciones_gsp.html',
    'presentacion_pipeline_interactivo.html',
    'navegacion_cotizacion_web.html',
    'manual_cotizacion_paso_a_paso.html',
    'proceso_financiero_integral_y_protocolo_pruebas_gsp.html',
    'diagrama_flujo_financiero_gsp.svg',
    'marcha_blanca_casos_negocio.html',
    'compromiso_banner.png'
  ];

  const targets = [
    { name: 'DEV', remoteDir: '/var/www/html/lg-gsp-dev', baseUrl: 'https://servidor.leanglobal.cl/lg-gsp-dev' },
    { name: 'PROD', remoteDir: '/var/www/html/lg-gsp-prod', baseUrl: 'https://servidor.leanglobal.cl/lg-gsp-prod' }
  ];

  for (const target of targets) {
    console.log(`\n--- Desplegando en ${target.name} (${target.remoteDir}) ---`);
    for (const file of filesToDeploy) {
      const localPath = path.posix.join(publicDir.replace(/\\/g, '/'), file);
      const remotePath = `${target.remoteDir}/${file}`;
      await ssh.putFile(localPath, remotePath);
      console.log(`✔ Subido: ${file}`);
    }

    console.log(`Verificando HTTP Status en ${target.name}...`);
    for (const file of filesToDeploy) {
      const url = `${target.baseUrl}/${file}`;
      const res = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" ${url}`);
      const code = res.stdout.trim();
      console.log(`  [${code}] ${url}`);
    }
  }

  ssh.dispose();
  console.log('\nDespliegue finalizado con éxito.');
}

deployDocs().catch(err => {
  console.error('Error durante el despliegue:', err);
  process.exit(1);
});
