const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

async function runProdDeployAndVerify() {
  console.log('==================================================================');
  console.log('🚀 FASE 2: COMPILACIÓN, SUBIDA PWA PROD Y CERTIFICACIÓN E2E');
  console.log('==================================================================');

  const pwaDir = path.resolve(__dirname, '../../pwa');
  const distDir = path.join(pwaDir, 'dist');

  // Asegurar entorno prod
  fs.copyFileSync(path.join(pwaDir, '.env.prod'), path.join(pwaDir, '.env'));
  fs.copyFileSync(path.join(pwaDir, '.env.prod'), path.join(pwaDir, '.env.production'));

  console.log('\n--- 1. COMPILANDO PWA PROD ---');
  execSync('npm run build', { cwd: pwaDir, stdio: 'inherit' });
  console.log('✔ PWA PROD compilado exitosamente.');

  console.log('\n--- 2. CONECTANDO SSH ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ SSH Conectado.');

  console.log('\n--- 3. SUBIENDO A /var/www/html/pwa-gsp-prod ---');
  await ssh.execCommand('mkdir -p /var/www/html/backups');
  await ssh.execCommand('tar -czf /var/www/html/backups/pwa-prod-v10101.tar.gz -C /var/www/html pwa-gsp-prod 2>/dev/null');

  await ssh.putDirectory(distDir, '/var/www/html/pwa-gsp-prod', {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.map')
  });

  await ssh.execCommand('chown -R nginx:nginx /var/www/html/pwa-gsp-prod && chmod -R 755 /var/www/html/pwa-gsp-prod');
  await ssh.execCommand('systemctl reload nginx');
  console.log('✔ PWA PROD desplegado y NGINX recargado.');

  console.log('\n--- 4. CERTIFICACIÓN HTTP ---');
  const devStatus = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-dev/');
  console.log(`🌐 PWA DEV HTTP: ${devStatus.stdout.trim()}`);

  const prodStatus = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/pwa-gsp-prod/');
  console.log(`🌐 PWA PROD HTTP: ${prodStatus.stdout.trim()}`);

  const devCat = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/proyectos/express/catalogo');
  console.log('📦 Catálogo DEV:\n', devCat.stdout);

  const prodCat = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos/express/catalogo');
  console.log('📦 Catálogo PROD:\n', prodCat.stdout);

  console.log('\n--- 5. PRUEBA E2E: EMISIÓN DE COTIZACIÓN EXPRESS EN DEV ---');
  const payloadPrueba = {
    id_empresa_emisora: 9,
    cliente: {
      nombre: 'CONSTRUCTORA PRUEBA E2E LIMITADA',
      telefono: '56912345678',
      email: 'contacto@pruebae2e.cl',
      contacto_nombre: 'Ing. Carlos Mardones',
      obra_nombre: 'Montaje Estructuras Puerto Montt',
      obra_comuna: 'Puerto Montt'
    },
    servicio: {
      tipo_equipo: 'GRUAS_TELESCOPICAS',
      equipo_id: 'gt_70',
      capacidad_label: '70 TON',
      dias_servicio: 2,
      horas_minimas_dia: 9,
      tarifa_dia: 1650000,
      incluye_traslado: true,
      valor_traslado: 450000
    },
    condiciones: {
      moneda: 'CLP',
      validez_dias: 5,
      condicion_servicio: 'programado',
      cliente_pone_combustible: false
    }
  };

  const payloadEscaped = JSON.stringify(payloadPrueba).replace(/"/g, '\\"');
  const curlCmd = `curl -s -X POST -H "Content-Type: application/json" -d "${payloadEscaped}" https://servidor.leanglobal.cl/lg-gsp-dev/api/proyectos/express/cotizar`;
  
  const resE2E = await ssh.execCommand(curlCmd);
  console.log('Respuesta POST /api/proyectos/express/cotizar:');
  console.log(resE2E.stdout || resE2E.stderr);

  let parsed = null;
  try {
    parsed = JSON.parse(resE2E.stdout);
  } catch (e) {}

  if (parsed && parsed.success) {
    console.log('\n✅ PRUEBA E2E EXITOSA:');
    console.log('• ID Proyecto:', parsed.id_proyecto);
    console.log('• Folio Oficial:', parsed.codi_proyecto);
    console.log('• Total Neto:', parsed.total_neto);
    console.log('• PDF URL:', parsed.pdf_full_url);
    console.log('• WhatsApp Link:', parsed.whatsapp_share_link ? 'GENERADO OK' : 'NO GENERADO');

    // Verificar en BD sch_leangsp
    const sqlCheck = `SELECT id_proyecto, codi_proyecto, id_proyecto_estado, json_field->'crm_v1'->'lineas_servicio' as lineas FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = ${parsed.id_proyecto};`;
    const dbRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlCheck}\\""`);
    console.log('\nRegistro en Base de Datos:\n', dbRes.stdout);
  } else {
    console.error('❌ Error en prueba E2E:', resE2E.stdout);
  }

  ssh.dispose();
  console.log('\n==================================================================');
  console.log('🏁 PROCESO CONCLUIDO');
  console.log('==================================================================');
}

runProdDeployAndVerify().catch(console.error);
