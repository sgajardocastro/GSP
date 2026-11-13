const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const fs = require('fs');

async function main() {
  const ssh = new NodeSSH();
  console.log('Connecting to SSH server 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('✔ SSH connection established.');

  const localBase = path.resolve(__dirname, '..');
  const localDistProd = path.join(localBase, 'ejecucion/frontend/dist_prod');
  const localDistDev = path.join(localBase, 'ejecucion/frontend/dist_dev');

  // Check remote directories
  const checkDirs = await ssh.execCommand('ls -d /var/www/html/lg-gsp*');
  console.log('Remote web directories:', checkDirs.stdout);

  // 1. Deploy PROD
  if (fs.existsSync(localDistProd)) {
    const remoteWebProd = '/var/www/html/lg-gsp-prod';
    console.log(`\n--- Deploying dist_prod to ${remoteWebProd} ---`);
    const okProd = await ssh.putDirectory(localDistProd, remoteWebProd, {
      recursive: true,
      concurrency: 10,
      validate: (item) => !item.includes('.git')
    });
    if (!okProd) throw new Error('Failed to transfer dist_prod');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebProd} && chmod -R 755 ${remoteWebProd}`);
    console.log('✔ PROD Frontend deployed successfully.');
  }

  // 2. Deploy DEV
  if (fs.existsSync(localDistDev)) {
    const remoteWebDev = '/var/www/html/lg-gsp-dev';
    console.log(`\n--- Deploying dist_dev to ${remoteWebDev} ---`);
    const okDev = await ssh.putDirectory(localDistDev, remoteWebDev, {
      recursive: true,
      concurrency: 10,
      validate: (item) => !item.includes('.git')
    });
    if (!okDev) throw new Error('Failed to transfer dist_dev');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteWebDev} && chmod -R 755 ${remoteWebDev}`);
    console.log('✔ DEV Frontend deployed successfully.');
  }

  // 3. Health check
  const curlProd = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-prod/ | head -n 1');
  const curlDev = await ssh.execCommand('curl -sI https://servidor.leanglobal.cl/lg-gsp-dev/ | head -n 1');
  console.log('\n--- Health Checks ---');
  console.log('PROD Status:', curlProd.stdout.trim());
  console.log('DEV Status:', curlDev.stdout.trim());

  // 4. Register in Backlog DB
  const { Pool } = require('../ejecucion/backend_remoto/node_modules/pg');
  const pool = new Pool({
    host: '138.255.103.18',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'lgbl2025.',
    database: 'db_leanglobal_prod'
  });

  const schemas = ['sch_leangsp_prod', 'sch_leangsp'];
  for (const s of schemas) {
    try {
      await pool.query(`
        INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
        VALUES (
          'REQ-1127',
          'Modo de Revisión Ejecutiva en Aprobación de ITS para Jefaturas (Operaciones y Contabilidad)',
          'SPEC-116: Simplificación de la experiencia de aprobación en ModalITS.vue para Jefatura de Operaciones (Paso 2) y Contabilidad (Paso 3). Despliegue de PDF oficial firmado por Yiara Mendoza a pantalla completa y dos botones de acción: Aprobar (PIN FES) y Devolver con Observaciones, bloqueando edición a roles directivos.',
          'Critica',
          CURRENT_DATE,
          'Alfonso Porperrello / Sergio Gajardo',
          'Implementado'
        )
        ON CONFLICT (codigo_req) DO UPDATE SET 
          nombre_requerimiento = EXCLUDED.nombre_requerimiento,
          descripcion = EXCLUDED.descripcion,
          estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          solicitado_por = EXCLUDED.solicitado_por;
      `);
      console.log(`✔ Governance recorded in ${s}.tcfg_backlog`);
    } catch (eDb) {
      console.warn(`Warning recording in ${s}:`, eDb.message);
    }
  }
  await pool.end();

  ssh.dispose();
  console.log('\nDeployment completed successfully.');
}

main().catch(err => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
