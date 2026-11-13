const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployDocs() {
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const baseDir = path.resolve(__dirname, '..');
  const filesToDeploy = [
    'centro_documentacion_gsp.html',
    'manual_operador_terreno_gsp.html',
    'manual_entrega_y_retorno_plataformas_bsm.html',
    'guia_asignacion_recursos_traslados_y_reports.html',
    'marcha_blanca_casos_negocio.html',
    'diseno_real_formularios_mantenimiento.html',
    'protocolo_verificacion_mantenimiento_e2e.html',
    'manual_operativo_inventario_wms_gsp.html',
    'maqueta_mobile_qr_wms.html',
    'navegacion_cotizacion_web.html',
    'manual_cotizacion_paso_a_paso.html',
    'simulador_cotizacion.html',
    'presentacion_pipeline_interactivo.html',
    'proceso_financiero_integral_y_protocolo_pruebas_gsp.html',
    'politica_manejo_excepciones_gsp.html'
  ];

  const targets = [
    '/var/www/html/lg-gsp-dev/'
  ];

  for (const t of targets) {
    console.log(`Subiendo archivos a ${t}...`);
    for (const f of filesToDeploy) {
      const localPath = path.join(baseDir, 'ejecucion/frontend/public', f);
      await ssh.putFile(localPath, t + f);
      console.log(`  ✓ ${f}`);
    }
    await ssh.execCommand(`chown -R nginx:nginx ${t}*.html && chmod 644 ${t}*.html`);
  }

  console.log('\nArchivos subidos y permisos fijados.');

  for (const f of ['centro_documentacion_gsp.html', 'manual_operativo_inventario_wms_gsp.html']) {
    const resDev = await ssh.execCommand(`curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-dev/${f}`);
    console.log(`HTTP Status DEV (${f}):`, resDev.stdout.trim());
  }

  ssh.dispose();
}

deployDocs().catch(err => {
  console.error('Error desplegando docs:', err);
  process.exit(1);
});
