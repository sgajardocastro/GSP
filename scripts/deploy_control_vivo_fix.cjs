const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deploy() {
  console.log('=== DESPLEGANDO HOTFIX CONTROL EN VIVO (controlVivoController.js) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/controlVivoController.js');

  // 1. Subir a DEV
  console.log('1. Subiendo controlVivoController.js a DEV...');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/controlVivoController.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src/controllers/controlVivoController.js');

  // 2. Subir a PROD
  console.log('2. Subiendo controlVivoController.js a PROD...');
  await ssh.putFile(localController, '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/controlVivoController.js');
  await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/controlVivoController.js');

  // 3. Reiniciar PM2
  console.log('3. Reiniciando PM2 DEV (10) y PROD (13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');

  // Esperar 2 segundos para estabilización
  await new Promise(r => setTimeout(r, 2000));

  // 4. Test empírico directo en PROD (Puerto 3016) para el Día 1 (2026-10-06)
  console.log('4. Verificando respuesta en PROD para fecha 2026-10-06 (Día 1)...');
  const resDev = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/operaciones/control-vivo?fecha=2026-10-06"');
  try {
    const data = JSON.parse(resDev.stdout);
    const ot4 = data.servicios?.find(s => s.id_proyecto === 4 || s.codi_proyecto?.includes('233-004'));
    if (ot4) {
      console.log('✔ OT 4 encontrada en Control en Vivo:');
      console.log('  Estado OT:', ot4.estado_semaforo);
      const eqGrua = ot4.equipos?.find(e => e.id_equipo === 45 || e.patente === 'PJYY.20-1') || ot4.equipos?.[0];
      if (eqGrua) {
        console.log(`  Equipo: ${eqGrua.patente} (${eqGrua.modelo})`);
        console.log('  Actividades:');
        eqGrua.actividades?.forEach(act => {
          console.log(`    - ${act.clave.padEnd(18)}: Plan ${act.hora_plan} -> Real ${act.hora_real || '--:--'} [${act.estado}] (desvio: ${act.desvio_minutos}m)`);
        });
      }
    } else {
      console.log('⚠️ OT 4 no encontrada en fecha 2026-10-06');
    }
  } catch (err) {
    console.error('Error parseando respuesta:', err.message, resDev.stdout.slice(0, 200));
  }

  // 5. Test empírico en PROD para Hoy (2026-10-07)
  console.log('\n5. Verificando respuesta en PROD para fecha 2026-10-07 (Día 2 - Hoy)...');
  const resHoy = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/operaciones/control-vivo?fecha=2026-10-07"');
  try {
    const dataHoy = JSON.parse(resHoy.stdout);
    const ot4Hoy = dataHoy.servicios?.find(s => s.id_proyecto === 4 || s.codi_proyecto?.includes('233-004'));
    if (ot4Hoy) {
      const eqGruaHoy = ot4Hoy.equipos?.find(e => e.id_equipo === 45 || e.patente === 'PJYY.20-1') || ot4Hoy.equipos?.[0];
      if (eqGruaHoy) {
        console.log(`  Equipo: ${eqGruaHoy.patente} (${eqGruaHoy.modelo})`);
        console.log('  Actividades Hoy:');
        eqGruaHoy.actividades?.forEach(act => {
          console.log(`    - ${act.clave.padEnd(18)}: Plan ${act.hora_plan} -> Real ${act.hora_real || '--:--'} [${act.estado}]`);
        });
      }
    }
  } catch (err) {
    console.error('Error parseando respuesta hoy:', err.message);
  }

  ssh.dispose();
  console.log('\n=== DESPLIEGUE FINALIZADO ===');
}

deploy().catch(console.error);
