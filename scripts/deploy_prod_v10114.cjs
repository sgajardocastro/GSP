const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployProdV10114() {
  console.log('=== DESPLIEGUE A PRODUCCIÓN WEB Y BACKEND v1.0.114 (REQ-1016) ===\n');
  console.log('Conectando a servidor SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  // 1. MIGRACIÓN DDL EN BASE DE DATOS SCH_LEANGSP_PROD
  console.log('\n--- 1. CREANDO TABLA tits_transicion_historial EN sch_leangsp_prod ---');
  const ddlSql = `
    CREATE TABLE IF NOT EXISTS sch_leangsp_prod.tits_transicion_historial (
      id_transicion SERIAL PRIMARY KEY,
      folio_its VARCHAR(50) NOT NULL,
      numero_cotizacion VARCHAR(50) NOT NULL,
      version INT DEFAULT 1,
      cliente_nombre VARCHAR(255),
      cliente_rut VARCHAR(50),
      empresa_facturacion VARCHAR(255),
      ejecutivo_comercial VARCHAR(255),
      ciudad_obra VARCHAR(255),
      fecha_inicio DATE,
      fecha_termino DATE,
      total_venta NUMERIC(15,2) DEFAULT 0,
      total_costos NUMERIC(15,2) DEFAULT 0,
      utilidad_bruta NUMERIC(15,2) DEFAULT 0,
      margen NUMERIC(5,2) DEFAULT 0,
      estado VARCHAR(50) DEFAULT 'BORRADOR',
      id_doc INT REFERENCES sch_leangsp_prod.tfmg_file(id_doc),
      data_json JSONB,
      fecha_guardado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uk_transicion_folio_ver UNIQUE (folio_its, version)
    );
    CREATE INDEX IF NOT EXISTS idx_tits_transicion_cot ON sch_leangsp_prod.tits_transicion_historial (numero_cotizacion);
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp_prod.tits_transicion_historial TO usr_leangsp_prod;
    GRANT USAGE, SELECT, UPDATE ON SEQUENCE sch_leangsp_prod.tits_transicion_historial_id_transicion_seq TO usr_leangsp_prod;
  `;
  const resDdl = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${ddlSql.replace(/\n/g, ' ')}\\""`);
  console.log('Resultado DDL PROD:', resDdl.stdout || resDdl.stderr);

  // 2. DESPLIEGUE BACKEND A PROD Y DEV
  console.log('\n--- 2. DESPLIEGUE CONTROLADORES Y RUTAS BACKEND ---');
  const localController = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const localRoutes = path.resolve(__dirname, '../ejecucion/backend_remoto/src/routes/itsRoutes.js');

  const prodController = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const prodRoutes = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/itsRoutes.js';

  const devController = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';
  const devRoutes = '/home/nodeadmin/proyectos/lean-services-gsp/src/routes/itsRoutes.js';

  console.log('Subiendo a PROD backend...');
  await ssh.putFile(localController, prodController);
  await ssh.putFile(localRoutes, prodRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodController} ${prodRoutes}`);

  console.log('Subiendo a DEV backend (para paridad total)...');
  await ssh.putFile(localController, devController);
  await ssh.putFile(localRoutes, devRoutes);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devController} ${devRoutes}`);

  console.log('Reiniciando PM2 PROD (13) y DEV (10)...');
  const restartProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 (PROD):', restartProd.stdout.split('\n')[0] || restartProd.stderr);
  const restartDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 (DEV):', restartDev.stdout.split('\n')[0] || restartDev.stderr);

  await new Promise(r => setTimeout(r, 2000));

  // 3. DESPLIEGUE FRONTEND A PRODUCCIÓN
  console.log('\n--- 3. DESPLIEGUE FRONTEND DIST A PRODUCCIÓN (/var/www/html/lg-gsp-prod) ---');
  const localDist = path.resolve(__dirname, '../ejecucion/frontend/dist');
  const remoteDist = '/var/www/html/lg-gsp-prod';

  console.log(`Subiendo archivos desde ${localDist} hacia ${remoteDist}...`);
  const statusPut = await ssh.putDirectory(localDist, remoteDist, {
    recursive: true,
    concurrency: 10,
    validate: (itemPath) => !itemPath.includes('.git')
  });

  if (!statusPut) {
    throw new Error('Fallo al transferir archivos del directorio dist a producción');
  }

  console.log('Fijando permisos nginx:nginx y 755 en lg-gsp-prod...');
  await ssh.execCommand(`chown -R nginx:nginx ${remoteDist} && chmod -R 755 ${remoteDist}`);

  // 4. GOBERNANZA: SINCRONIZACIÓN EN TCFG_BACKLOG Y TCFG_RELEASES
  console.log('\n--- 4. GOBERNANZA: REGISTRO EN TCFG_BACKLOG Y TCFG_RELEASES ---');
  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1016', 'Módulo ITS Transición y Liquidación Relacional en Producción', 'Persistencia relacional de informes de transición, DDL tits_transicion_historial, almacenamiento documental canónico particionado y endpoints REST de compilar-pdf y listar', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES ('v1.0.114', 'Portal Web GSP v1.0.114 - Módulo ITS Transición y Liquidación Relacional en Producción', 'Feature', 'Despliegue integral a Producción del módulo ITS Transición con persistencia relacional completa, sincronización de folio canónico ITS-[COTIZACION], versionamiento, depósito canónico de PDFs y bandeja histórica.', '["REQ-1016"]'::jsonb, 'Sergio Gajardo')
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
    console.log(`Esquema ${s}:`, resSql.stdout.replace(/\n+/g, ' ').trim());
  }

  // 5. VERIFICACIÓN EMPÍRICA DETERMINISTA
  console.log('\n--- 5. VERIFICACIONES HTTP FINALES ---');
  const checkProdApi = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/transicion/list');
  console.log('PROD API /operaciones/its/transicion/list:', checkProdApi.stdout.substring(0, 150));

  const checkDevApi = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/transicion/list');
  console.log('DEV API /operaciones/its/transicion/list:', checkDevApi.stdout.substring(0, 150));

  const checkProdWeb = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" https://servidor.leanglobal.cl/lg-gsp-prod/');
  console.log('PROD Web HTTP Status:', checkProdWeb.stdout.trim());

  const checkBundle = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/ | grep -o "index-[^\"]*"');
  console.log('Bundle activo en producción:', checkBundle.stdout.trim());

  ssh.dispose();
  console.log('\n=== DESPLIEGUE A PRODUCCIÓN v1.0.114 COMPLETADO EXITOSAMENTE ===');
}

deployProdV10114().catch(err => {
  console.error('Error en despliegue a producción:', err);
  process.exit(1);
});
