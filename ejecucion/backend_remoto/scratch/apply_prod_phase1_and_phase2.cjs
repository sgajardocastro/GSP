const { NodeSSH } = require('../node_modules/node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function run() {
  console.log('==================================================================');
  console.log('🚀 PASE A PRODUCCIÓN GSP: PASOS 1 Y 2 (DDL BD + BACKEND API)');
  console.log('==================================================================');

  try {
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295
    });
    console.log('✅ Conectado por SSH como root.');

    // -------------------------------------------------------------------------
    // PASO 1: MIGRACIONES DDL Y PERMISOS EN sch_leangsp_prod
    // -------------------------------------------------------------------------
    console.log('\n🗄️ [PASO 1/2] Aplicando Migraciones DDL en sch_leangsp_prod...');
    const ddlSql = `
      -- 1. Tabla de Notificaciones Web Operativas
      CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tnot_notification_web (
        id_notificacion BIGSERIAL PRIMARY KEY,
        tipo_notificacion VARCHAR(50) NOT NULL,
        severidad VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
        hito_clave VARCHAR(50) NOT NULL,
        id_proyecto INTEGER,
        codigo_ot VARCHAR(50),
        id_usuario_destinatario INTEGER,
        rol_destinatario VARCHAR(50) DEFAULT 'ANALISTA_PMO',
        mensaje TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        fecha_operativa DATE NOT NULL DEFAULT CURRENT_DATE,
        leido_por VARCHAR(100),
        leido_en TIMESTAMP WITH TIME ZONE,
        creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notif_web_prod_fecha ON sch_leangsp_prod.tnot_notification_web(fecha_operativa);
      CREATE INDEX IF NOT EXISTS idx_notif_web_prod_proyecto ON sch_leangsp_prod.tnot_notification_web(id_proyecto);
      CREATE INDEX IF NOT EXISTS idx_notif_web_prod_leido ON sch_leangsp_prod.tnot_notification_web(leido_por);

      -- 2. Columnas de Colación y Horarios en Reportes de Avance
      ALTER TABLE sch_leangsp_prod.tedp_reporte_avance 
        ADD COLUMN IF NOT EXISTS hora_inicio_colacion TIME,
        ADD COLUMN IF NOT EXISTS hora_termino_colacion TIME,
        ADD COLUMN IF NOT EXISTS horas_colacion NUMERIC(4,2) DEFAULT 0.00;

      -- 3. Columnas de Plan Diario en Proyectos
      ALTER TABLE sch_leangsp_prod.tpry_proyecto 
        ADD COLUMN IF NOT EXISTS hora_llegada_plan TIME,
        ADD COLUMN IF NOT EXISTS plan_diario JSONB DEFAULT '[]'::jsonb;

      -- 4. Permisos para usr_leangsp_prod
      GRANT USAGE ON SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
      GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
    `;

    // Escribir SQL a archivo temporal en servidor y ejecutar con psql
    await ssh.execCommand(`cat << 'EOF' > /tmp/prod_ddl_spec63.sql\n${ddlSql}\nEOF`);
    const ddlExec = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/prod_ddl_spec63.sql"');
    console.log('Resultado DDL:\n', ddlExec.stdout.trim() || ddlExec.stderr.trim());
    await ssh.execCommand('rm -f /tmp/prod_ddl_spec63.sql');

    // Verificar que las tablas y columnas existan
    const verifyTables = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tnot_notification_web';\\""`);
    console.log('Verificación tnot_notification_web en PROD:\n', verifyTables.stdout.trim());

    const verifyCols = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance' AND column_name IN ('hora_inicio_colacion', 'hora_termino_colacion', 'horas_colacion');\\""`);
    console.log('Verificación columnas colación en PROD:\n', verifyCols.stdout.trim());

    // -------------------------------------------------------------------------
    // PASO 2: DESPLIEGUE DEL BACKEND EN PRODUCCIÓN (PM2 ID 13)
    // -------------------------------------------------------------------------
    console.log('\n📦 [PASO 2/2] Desplegando Backend a Producción (/home/nodeadmin/proyectos/lean-services-gsp-prod/src)...');
    const rootDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas';
    const localBackendSrc = `${rootDir}/ejecucion/backend_remoto/src`;
    const remoteBackendProdSrc = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src';

    // Respaldar src actual de prod por seguridad
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    await ssh.execCommand(`mkdir -p /home/nodeadmin/proyectos/backups`);
    await ssh.execCommand(`tar -czf /home/nodeadmin/proyectos/backups/gsp-prod-backend-src-${ts}.tar.gz -C /home/nodeadmin/proyectos/lean-services-gsp-prod src 2>/dev/null`);

    console.log('Subiendo archivos del backend...');
    const backendStatus = await ssh.putDirectory(localBackendSrc, remoteBackendProdSrc, {
      recursive: true,
      concurrency: 5
    });
    console.log('putDirectory Backend PROD:', backendStatus ? 'OK' : 'FAIL');

    console.log('Ajustando permisos a nodeadmin:nodeadmin...');
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod/src');

    console.log('Reiniciando PM2 proceso 13 (lean-services-gsp-prod)...');
    const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
    console.log(restartRes.stdout.trim());

    console.log('Esperando 3s para verificación de estabilidad...');
    await new Promise(r => setTimeout(r, 3000));

    const pm2Status = await ssh.execCommand('su - nodeadmin -c "pm2 status 13"');
    console.log(pm2Status.stdout.trim());

    // Probar endpoint en puerto 3016
    console.log('\n🧪 Probando Endpoint Control Vivo en Backend PROD (puerto 3016)...');
    const curlLocal = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/control-vivo');
    try {
      const jsonLocal = JSON.parse(curlLocal.stdout);
      console.log('✅ Endpoint Local 3016 Respondió con éxito:');
      console.log('   KPIs:', jsonLocal.kpis);
      console.log('   Servicios retornados:', jsonLocal.servicios?.length);
    } catch (e) {
      console.log('Respuesta Local 3016 (raw):', curlLocal.stdout.slice(0, 300));
    }

    console.log('\n🧪 Probando Endpoint Notificaciones en Backend PROD (puerto 3016)...');
    const curlNotif = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/control-vivo/notificaciones');
    try {
      const jsonNotif = JSON.parse(curlNotif.stdout);
      console.log('✅ Endpoint Notificaciones 3016 Respondió con éxito:', jsonNotif.success ? 'OK' : 'FAIL');
    } catch (e) {
      console.log('Respuesta Notif (raw):', curlNotif.stdout.slice(0, 300));
    }

    console.log('\n🧪 Probando Nginx Externo PROD (https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/control-vivo)...');
    const curlNginx = await ssh.execCommand('curl -s -k https://127.0.0.1/lg-gsp-prod/api/operaciones/control-vivo');
    try {
      const jsonNginx = JSON.parse(curlNginx.stdout);
      console.log('✅ Nginx PROD Respondió con éxito:');
      console.log('   KPIs:', jsonNginx.kpis);
    } catch (e) {
      console.log('Respuesta Nginx PROD (raw):', curlNginx.stdout.slice(0, 300));
    }

  } catch (err) {
    console.error('❌ Error en ejecución de Pasos 1 y 2:', err);
  } finally {
    ssh.dispose();
  }
}

run();
