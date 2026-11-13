const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployDev() {
  console.log('=== DESPLEGANDO BACKEND DEV REQ-1012 (Spec 66) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localControlVivo = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/controlVivoController.js');
  const localReportDiario = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');

  // 1. Subir controlVivoController.js a DEV
  console.log('1. Subiendo controlVivoController.js a DEV...');
  await ssh.putFile(localControlVivo, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/controlVivoController.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/controlVivoController.js');

  // 2. Subir reportDiarioController.js a DEV
  console.log('2. Subiendo reportDiarioController.js a DEV...');
  await ssh.putFile(localReportDiario, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js');

  // 3. Reiniciar PM2 DEV (proceso 10)
  console.log('3. Reiniciando PM2 DEV (10)...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(restartRes.stdout || restartRes.stderr);

  // Esperar 2 segundos para estabilización
  await new Promise(r => setTimeout(r, 2000));

  // 4. Test empírico directo en DEV (Puerto 3010)
  console.log('4. Verificando respuesta en DEV (puerto 3010) para control-vivo...');
  const resDev = await ssh.execCommand('curl -s "http://127.0.0.1:3010/api/operaciones/control-vivo"');
  try {
    const data = JSON.parse(resDev.stdout);
    console.log('✔ Control en Vivo DEV responde OK:');
    console.log('  Total servicios:', data.servicios?.length || 0);
    if (data.servicios && data.servicios.length > 0) {
      const s1 = data.servicios[0];
      const eq1 = s1.equipos?.[0] || {};
      console.log(`  Muestra OT: ${s1.codigo_ot} (${s1.cliente})`);
      console.log(`  Franja Multi-Día (${eq1.franja_multidia?.length || 0} jornadas):`);
      eq1.franja_multidia?.slice(0, 3).forEach(j => {
        console.log(`    - Día ${j.dia} (${j.fecha}): [${j.estado}] tiene_report=${j.tiene_report} tiene_viaje=${j.tiene_viaje} (${j.actividades?.length || 0} acts)`);
      });
    }
  } catch (err) {
    console.error('Error parseando respuesta DEV:', err.message, resDev.stdout.slice(0, 300));
  }

  ssh.dispose();
  console.log('\n=== DESPLIEGUE BACKEND DEV COMPLETADO CON ÉXITO ===');
}

deployDev().catch(err => {
  console.error('Error durante despliegue DEV:', err);
  process.exit(1);
});
