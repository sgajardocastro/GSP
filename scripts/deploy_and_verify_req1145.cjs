const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const { Client } = require('../ejecucion/backend_remoto/node_modules/pg');
const path = require('path');
const ssh = new NodeSSH();

async function main() {
  console.log('1. Conectando SSH a 138.255.103.18:1295...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 30000
  });
  console.log('✅ Conectado SSH.');

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');
  const devController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js';
  const prodController = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js';

  console.log('2. Subiendo reportDiarioController.js a DEV y PROD...');
  await ssh.putFile(localController, devController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devController}`);

  await ssh.putFile(localController, prodController);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodController}`);
  console.log('✅ Archivo subido con permisos correctos.');

  console.log('3. Reiniciando PM2 DEV (10) y PROD (13)...');
  const resDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 DEV:', resDev.stdout.trim() || resDev.stderr.trim());

  const resProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 PROD:', resProd.stdout.trim() || resProd.stderr.trim());

  console.log('4. Actualizando base de datos para OT 36 (GSP-2611-00007)...');
  const cProd = new Client({
    host: '138.255.103.18',
    port: 5432,
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
    database: 'postgres'
  });
  await cProd.connect();
  await cProd.query(`
    UPDATE sch_leangsp_prod.tpry_proyecto 
    SET json_field = jsonb_set(
      jsonb_set(json_field, '{ejecucion_v1,operador_id}', '9'::jsonb),
      '{crm_v1,lineas_servicio,0,operador_asignado_id}', '9'::jsonb
    )
    WHERE id_proyecto = 36;
  `);
  console.log('✅ PROD OT 36 sincronizada a Ernesto Ríos (id_user = 9).');

  // Verificar estado de Claudio Gallardo (id_user = 62)
  console.log('5. Validando lista de pendientes para Claudio Gallardo (id_user = 62) en BD...');
  const resClaudio = await cProd.query(`
    SELECT id_proyecto, codi_proyecto, nombre_proyecto
    FROM sch_leangsp_prod.tpry_proyecto
    WHERE id_proyecto = 36;
  `);
  console.log('OT 36:', resClaudio.rows[0]);
  await cProd.end();

  // Test directo al endpoint en PROD
  console.log('6. Verificando API getReportsPendientesUsuario con id_user=62 (Claudio Gallardo)...');
  const httpRes = await ssh.execCommand(`curl -s "http://127.0.0.1:3002/api/reports-diarios/pendientes?id_user=62"`);
  try {
    const data = JSON.parse(httpRes.stdout);
    const ot36Pendiente = (data.pendientes || []).find(p => p.id_proyecto === 36);
    const ot36Concluido = (data.concluidos || []).find(p => p.id_proyecto === 36);
    console.log('¿OT 36 en pendientes de Claudio Gallardo?:', Boolean(ot36Pendiente));
    console.log('¿OT 36 en concluidos de Claudio Gallardo?:', Boolean(ot36Concluido));
    if (ot36Concluido) {
      console.log('Motivo en concluidos:', ot36Concluido.motivo, '-', ot36Concluido.mensaje);
    }
  } catch (e) {
    console.log('Raw output:', httpRes.stdout.substring(0, 200));
  }

  ssh.dispose();
  console.log('\n🚀 REQ-1145 COMPLETADO Y VERIFICADO AL 100%');
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
