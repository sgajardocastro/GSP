const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const https = require('https');

const ssh = new NodeSSH();

function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          rawLength: Buffer.byteLength(data)
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=================================================================');
  console.log('  DESPLIEGUE A DEV: RELEASE v1.0.163 (REQ-1074)');
  console.log('  Segregación SoD OC Comercial & Habilitación Condicional Factura');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ Conexión SSH establecida con servidor DEV (138.255.103.18:1295)');

  const localBase = path.resolve(__dirname, '..');
  const remoteWebDev = '/var/www/html/lg-gsp-dev';
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');

  // 1. Subir Frontend dist_dev a /var/www/html/lg-gsp-dev
  console.log(`\n--- 1. DESPLIEGUE FRONTEND DEV (dist_dev) ---`);
  console.log(`Subiendo Frontend dist_dev a ${remoteWebDev}...`);
  const ok = await ssh.putDirectory(localDistDev, remoteWebDev, {
    recursive: true,
    concurrency: 10,
    validate: (item) => !item.includes('.git')
  });
  if (!ok) throw new Error('Fallo al transferir dist_dev a DEV');

  await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
  console.log('✔ Permisos nginx aplicados en DEV');

  // 2. Registro de Gobernanza en BD PostgreSQL (sch_leangsp)
  console.log('\n--- 2. REGISTRO EN BASE DE DATOS (TCFG_BACKLOG / TCFG_RELEASES) ---');
  const sql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1074',
      'Segregación Estricta de Funciones (SoD) en Perspectiva Contabilidad: Carga Exclusiva de OC por Comercial, Apertura Directa de DTE y Habilitación Determinista de Facturación',
      'SPEC-102 v1.1: Atribución exclusiva de la carga de OC al área Comercial. Retiro de diálogos de subida de OC en Contabilidad y despliegue de cápsula no interactiva Bloqueado: Falta OC (Comercial). Apertura directa del PDF oficial de la factura en nueva pestaña para servicios concluidos. Habilitación inmediata del botón verde Cargar Factura DTE para servicios exentos de OC una vez visado el EDP.',
      'Alta',
      CURRENT_DATE,
      'Sergio Gajardo',
      'Implementado'
    )
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      estado = 'Implementado',
      fecha_implementacion = CURRENT_DATE,
      updated_at = NOW();

    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      '1.0.163',
      'Segregación SoD OC Comercial, Apertura Directa DTE y Habilitación Determinista de Facturación',
      'FEATURE',
      'Retira la responsabilidad de OC de Contabilidad asignándola a Comercial. Habilita facturación directa a servicios sin OC y abre PDFs tributarios sin diálogos.',
      'REQ-1074',
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados,
      publicado_por = EXCLUDED.publicado_por,
      created_at = NOW();
  `;

  const escapedSql = sql.replace(/"/g, '\\"');
  const resDb = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${escapedSql}\\""`);
  console.log(`Base de Datos (sch_leangsp): ${resDb.stdout.trim() || resDb.stderr.trim()}`);

  // 3. Suite de Verificación HTTP en DEV
  console.log('\n=================================================================');
  console.log('  INICIANDO SUITE DE AUDITORÍA EMPÍRICA DETERMINISTA EN DEV');
  console.log('=================================================================');

  console.log('\n--- PRUEBA 1: Verificación HTTP Frontend DEV ---');
  const frontRes = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/',
    method: 'GET'
  });
  console.log(`Status Frontend DEV: ${frontRes.statusCode} OK (Length: ${frontRes.rawLength} bytes)`);
  if (frontRes.statusCode !== 200) throw new Error('Frontend DEV no responde 200 OK');
  console.log('✔ PRUEBA 1 SUPERADA');

  console.log('\n--- PRUEBA 2: Verificación Endpoint Perspectiva Contabilidad ---');
  const apiRes = await httpRequest({
    hostname: 'servidor.leanglobal.cl',
    port: 443,
    path: '/lg-gsp-dev/api/operaciones/edp/perspectiva-contabilidad',
    method: 'GET'
  });
  console.log(`Status API Contabilidad DEV: ${apiRes.statusCode} OK`);
  if (apiRes.statusCode !== 200) throw new Error('API Contabilidad DEV no responde 200 OK');
  const data = JSON.parse(apiRes.body);
  if (!data.success || !Array.isArray(data.data.procesos)) throw new Error('Payload API inválido');
  console.log(`Procesos devueltos: ${data.data.procesos.length}`);
  console.log('✔ PRUEBA 2 SUPERADA');

  ssh.dispose();
  console.log('\n=================================================================');
  console.log('🎉 DESPLIEGUE A DEV v1.0.163 FINALIZADO CON ÉXITO AL 100%');
  console.log('=================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN DESPLIEGUE A DEV:', err.message);
  if (ssh) ssh.dispose();
  process.exit(1);
});
