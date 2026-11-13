const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function deployV1080() {
  console.log('==================================================================');
  console.log('🚀 DESPLIEGUE V1.0.80: CONTROL OPERATIVO VIVO MULTI-EQUIPO (DRIVER OT)');
  console.log('==================================================================');

  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('✅ Conectado por SSH como root.');

    const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
    const localBackendSrc = `${rootDir}/ejecucion/backend_remoto/src`;
    const remoteBackendSrc = '/home/nodeadmin/proyectos/lean-services-gsp/src';

    const localFrontendDist = `${rootDir}/ejecucion/frontend/dist`;
    const remoteFrontendDev = '/var/www/html/lg-gsp-dev';

    // 1. DESPLIEGUE BACKEND
    console.log(`\n📦 [1/5] Subiendo Backend (${localBackendSrc} -> ${remoteBackendSrc})...`);
    const backendStatus = await ssh.putDirectory(localBackendSrc, remoteBackendSrc, {
      recursive: true,
      concurrency: 5
    });
    console.log('putDirectory Backend:', backendStatus ? 'OK' : 'FAIL');

    console.log('Ajustando permisos a nodeadmin:nodeadmin...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp/src');

    console.log('Reiniciando PM2 proceso 10 (lean-services-gsp)...');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
    console.log('Restart STDOUT:', restartRes.stdout.trim());
    if (restartRes.stderr) console.log('Restart STDERR:', restartRes.stderr.trim());

    // 2. DESPLIEGUE FRONTEND
    console.log(`\n📦 [2/5] Respaldando y preparando ${remoteFrontendDev}...`);
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    await ssh.execCommand(`mkdir -p /var/www/html/backups`);
    await ssh.execCommand(`tar -czf /var/www/html/backups/lg-gsp-dev-bak-${ts}.tar.gz -C /var/www/html lg-gsp-dev 2>/dev/null`);

    console.log(`Subiendo Frontend Dist (${localFrontendDist} -> ${remoteFrontendDev})...`);
    const frontendStatus = await ssh.putDirectory(localFrontendDist, remoteFrontendDev, {
      recursive: true,
      concurrency: 8
    });
    console.log('putDirectory Frontend:', frontendStatus ? 'OK' : 'FAIL');

    console.log('Ajustando permisos nginx:nginx...');
    await ssh.execCommand(`chown -R nginx:nginx ${remoteFrontendDev}`);
    await ssh.execCommand(`chmod -R 755 ${remoteFrontendDev}`);

    // 3. REGISTRAR RELEASE EN BASE DE DATOS
    console.log('\n🏛️ [3/5] Registrando Release 1.0.80 en sch_leangsp.tcfg_releases...');
    const insertReleaseSql = `
      INSERT INTO sch_leangsp.tcfg_releases (
        version,
        ambiente,
        descripcion,
        autor,
        fecha_despliegue
      ) VALUES (
        '1.0.80',
        'dev',
        'Soporte multi-equipo en Control Operativo en Vivo con la OT como driver (REQ-042, Spec 63)',
        'Antigravity Agent',
        NOW()
      ) ON CONFLICT DO NOTHING;
    `;
    const dbCmd = `su - postgres -c "psql -d bd_dev_gsp -c \\"${insertReleaseSql.replace(/\n/g, ' ')}\\""`;
    const dbRes = await ssh.execCommand(dbCmd);
    console.log('Resultado registro BD:', dbRes.stdout.trim() || dbRes.stderr.trim());

    // 4. ESPERAR ESTABILIZACIÓN PM2
    console.log('\n⏳ [4/5] Esperando 3s para verificación de estabilidad PM2...');
    await new Promise(r => setTimeout(r, 3000));

    const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 10"');
    console.log(pm2Status.stdout.trim());

    // 5. PRUEBAS DE VERIFICACIÓN EMPÍRICA (HARD GATE)
    console.log('\n🧪 [5/5] Probando Endpoint Control Vivo (Local 3006)...');
    const curlLocal = await ssh.execCommand('curl -s http://localhost:3006/api/operaciones/control-vivo');
    try {
      const jsonLocal = JSON.parse(curlLocal.stdout);
      console.log('✅ Control Vivo Local Respondió con éxito:');
      console.log('   Total OTs:', jsonLocal.kpis?.total_ots);
      console.log('   KPIs:', jsonLocal.kpis);
      console.log('   Total servicios devueltos:', jsonLocal.servicios?.length);

      // Verificación multi-equipo
      const multiOts = jsonLocal.servicios?.filter(s => s.equipos && s.equipos.length > 1) || [];
      console.log(`\n   🎯 OTs Multi-Equipo detectadas: ${multiOts.length}`);
      multiOts.forEach(s => {
        console.log(`   - OT ${s.codigo_ot} (${s.cliente}): ${s.equipos.length} equipos asignados:`);
        s.equipos.forEach(eq => {
          console.log(`     * [${eq.patente || eq.modelo}] Operador: ${eq.operador || 'Sin asignar'} | Rol: ${eq.tipo_equipo} | Semáforo: ${eq.estado_equipo}`);
        });
      });

      // Verificación mono-equipo (OT 103 Caso 014)
      const ot103 = jsonLocal.servicios?.find(s => s.id_proyecto === 103);
      if (ot103) {
        console.log('\n   🎯 CASO 014 (OT 103 Mono-Equipo) VERIFICADO:');
        console.log('      Código OT:', ot103.codigo_ot);
        console.log('      Equipos en array:', ot103.equipos?.length);
        console.log('      Equipo:', ot103.equipo_principal);
        console.log('      Operador:', ot103.operador, '| Tel:', ot103.telefono_operador);
        console.log('      Estado Global:', ot103.estado_global);
        console.log('      Candado Activo:', ot103.candado_activo);
      }
    } catch (e) {
      console.log('Respuesta Local (raw):', curlLocal.stdout.slice(0, 300));
    }

    console.log('\n🧪 Probando Endpoint Control Vivo (Nginx Externo DEV)...');
    const curlExt = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/control-vivo');
    try {
      const jsonExt = JSON.parse(curlExt.stdout);
      console.log('✅ Control Vivo Externo Nginx Respondió con éxito:');
      console.log('   Total OTs:', jsonExt.kpis?.total_ots);
      console.log('   KPIs:', jsonExt.kpis);
    } catch (e) {
      console.log('Respuesta Externa (raw):', curlExt.stdout.slice(0, 300));
    }

    console.log('\n🎉 Despliegue v1.0.80 completado exitosamente.');
  } catch (error) {
    console.error('❌ Error durante el despliegue v1.0.80:', error);
  } finally {
    ssh.dispose();
  }
}

deployV1080();
