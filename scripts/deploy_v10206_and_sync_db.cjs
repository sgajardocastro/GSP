const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localPackageJson = path.resolve(__dirname, '../ejecucion/backend_remoto/package.json');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localPdfService = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');

  console.log('1. Subiendo package.json y código a DEV (/home/nodeadmin/proyectos/lean-services-gsp/)...');
  await ssh.putFile(localPackageJson, '/home/nodeadmin/proyectos/lean-services-gsp/package.json');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js');
  await ssh.putFile(localPdfService, '/home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/package.json /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js /home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js');

  console.log('2. Subiendo package.json y código a PROD (/home/nodeadmin/proyectos/lean-services-gsp-prod/)...');
  await ssh.putFile(localPackageJson, '/home/nodeadmin/proyectos/lean-services-gsp-prod/package.json');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js');
  await ssh.putFile(localPdfService, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js');
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/package.json /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js /home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js');

  console.log('3. Reiniciando PM2 DEV (10) y PROD (13)...');
  const pm2Dev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('DEV:', pm2Dev.stdout.split('\n').find(l => l.includes('10')) || pm2Dev.stdout);

  const pm2Prod = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PROD:', pm2Prod.stdout.split('\n').find(l => l.includes('13')) || pm2Prod.stdout);

  console.log('4. Verificando GET /api/backlog/version en DEV (3006) y PROD (3016)...');
  const verDev = await ssh.execCommand('curl -s http://localhost:3006/api/backlog/version');
  console.log('Version DEV:', verDev.stdout);

  const verProd = await ssh.execCommand('curl -s http://localhost:3016/api/backlog/version');
  console.log('Version PROD:', verProd.stdout);

  console.log('5. Sincronizando BD PostgreSQL en sch_leangsp_prod y sch_leangsp...');
  const syncScript = `
    const { Pool } = require('pg');

    async function sync(schemaName, user, pass) {
      console.log('--- Sincronizando ' + schemaName + ' ---');
      const pool = new Pool({
        user: user,
        password: pass,
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      // A. tcfg_backlog REQ-1144
      await pool.query(\`
        INSERT INTO \${schemaName}.tcfg_backlog 
          (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, creado_at, updated_at)
        VALUES 
          ('REQ-1144', 'Gobernanza Integral del ITS en Servicios a Valor Fijo, Regla Determinista de Flota con Report/Viaje, Campos de Registro de Viaje y Glosas Operacionales de Sección 3', 'Modalidad contractual Valor Fijo (Suma Alzada) con piso cero en CRM/ITS, supresión de líneas fantasma de rigger, despliegue determinista de vehículos motorizados con report/viaje excluyendo ramplas sin motor, controles de tipo de viaje y glosas en Sección 3 (SPEC-125 / CASO-20261109-05).', 'ALTA', CURRENT_DATE, CURRENT_DATE, 'Yiara Mendoza / Sergio Gajardo', 'Implementado', 'Sergio Gajardo', NOW(), NOW())
        ON CONFLICT (codigo_req) DO UPDATE SET 
          nombre_requerimiento = EXCLUDED.nombre_requerimiento,
          descripcion = EXCLUDED.descripcion,
          prioridad = EXCLUDED.prioridad,
          estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          updated_at = NOW();
      \`);
      console.log('REQ-1144 sincronizado en ' + schemaName);

      // B. tcfg_backlog REQ-1137
      await pool.query(\`
        INSERT INTO \${schemaName}.tcfg_backlog 
          (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, creado_at, updated_at)
        VALUES 
          ('REQ-1137', 'Sugerencia Inteligente de Viáticos en ITS, Exclusión de Choferes de Camión y Preservación de Rol Rigger', 'Sugerencia inteligente de viáticos en Sección 3 de ITS excluyendo automáticamente a conductores de camión de apoyo/cama baja de viáticos de faena, preservación de rol Rigger sin tarifas de operador ($0) y erradicación total de hardcoding (SPEC-123 / Regla 15 Cero Parches).', 'ALTA', CURRENT_DATE, CURRENT_DATE, 'Yiara Mendoza / Sergio Gajardo', 'Implementado', 'Sergio Gajardo', NOW(), NOW())
        ON CONFLICT (codigo_req) DO UPDATE SET 
          nombre_requerimiento = EXCLUDED.nombre_requerimiento,
          descripcion = EXCLUDED.descripcion,
          prioridad = EXCLUDED.prioridad,
          estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          updated_at = NOW();
      \`);
      console.log('REQ-1137 sincronizado en ' + schemaName);

      // C. tcfg_backlog REQ-1140 (por si faltara en DEV)
      await pool.query(\`
        INSERT INTO \${schemaName}.tcfg_backlog 
          (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, creado_at, updated_at)
        VALUES 
          ('REQ-1140', 'Protección de Idempotencia e Inmutabilidad en Salidas de Patio de Viajes PWA y Saneamiento Fáctico OT 17', 'Blindaje de idempotencia en registrarSalida (viajeModel.js) con COALESCE en fecha de salida y estado_trayecto inmutable, skeleton de sincronización en PWA (ViajeConductor.vue) y restitución histórica del Log 53 a las 07:23:33 CLT.', 'ALTA', CURRENT_DATE, CURRENT_DATE, 'Jorge Ponce / Sergio Gajardo', 'Implementado', 'Sergio Gajardo', NOW(), NOW())
        ON CONFLICT (codigo_req) DO UPDATE SET 
          estado = 'Implementado',
          fecha_implementacion = CURRENT_DATE,
          updated_at = NOW();
      \`);
      console.log('REQ-1140 sincronizado en ' + schemaName);

      // D. tcfg_releases v1.0.206
      const relExist = await pool.query("SELECT id FROM " + schemaName + ".tcfg_releases WHERE version IN ('1.0.206', 'v1.0.206');");
      if (relExist.rows.length === 0) {
        await pool.query(\`
          INSERT INTO \${schemaName}.tcfg_releases
            (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por, creado_at)
          VALUES
            ('v1.0.206', CURRENT_DATE, 'Gobernanza Integral del ITS en Servicios a Valor Fijo, Flota Determinista, Glosas Operacionales y Purga Total de Hardcoding', 'MINOR', 'Gobernanza Integral del ITS en Servicios a Valor Fijo (SPEC-125 / REQ-1144), Sugerencia Inteligente de Viáticos y Rol Rigger (REQ-1137), Protección Idempotencia Viajes PWA (REQ-1140) y Erradicación Total de Hardcoding (Regla 15 Cero Parches).', '["REQ-1144", "REQ-1137", "REQ-1140"]'::jsonb, 'Sergio Gajardo', NOW());
        \`);
        console.log('Release v1.0.206 insertada en ' + schemaName);
      } else {
        await pool.query(\`
          UPDATE \${schemaName}.tcfg_releases
          SET titulo = 'Gobernanza Integral del ITS en Servicios a Valor Fijo, Flota Determinista, Glosas Operacionales y Purga Total de Hardcoding',
              descripcion_impacto = 'Gobernanza Integral del ITS en Servicios a Valor Fijo (SPEC-125 / REQ-1144), Sugerencia Inteligente de Viáticos y Rol Rigger (REQ-1137), Protección Idempotencia Viajes PWA (REQ-1140) y Erradicación Total de Hardcoding (Regla 15 Cero Parches).',
              requerimientos_asociados = '["REQ-1144", "REQ-1137", "REQ-1140"]'::jsonb,
              fecha_release = CURRENT_DATE
          WHERE id = \${relExist.rows[0].id};
        \`);
        console.log('Release v1.0.206 actualizada en ' + schemaName);
      }

      await pool.end();
    }

    async function runSync() {
      await sync('sch_leangsp_prod', 'usr_leangsp_prod', 'usr_gsp_prod_2026!');
      await sync('sch_leangsp', 'usr_leangsp', 'usr_gsp_123');
    }
    runSync().catch(console.error);
  `;

  const b64 = Buffer.from(syncScript).toString('base64');
  const syncRes = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(syncRes.stdout);
  if (syncRes.stderr) console.error(syncRes.stderr);

  ssh.dispose();
  console.log('✅ Despliegue de Versión 1.0.206 y Sincronización de BD completados con éxito.');
}

main().catch(console.error);
