const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function syncV10147() {
  console.log('=== SINCRONIZANDO SEEDS Y RELEASES v1.0.147 (SPEC-083) EN BD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
    -- =========================================================================
    -- 1. DEV: BACKLOG (tcfg_backlog) Y RELEASES (tcfg_releases)
    -- =========================================================================
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1054',
      'Normalización Global de Almacenamiento (LG-Storage Standard), Saneamiento de Base de Datos DEV/PROD, Regla Canónica de Gobernanza y Doble Indexación en Biblioteca Documental',
      'Formalización de SPEC-083 y regla canónica storage_and_database_governance.md; erradicación total de referencias hardcodeadas a sch_leangsp. en actaPlataformaModel.js y actaPlataformaController.js; normalización de relDir a GSP/actas; doble indexación en Documentos.vue para listar actas y contratos en Dimensión Equipos y Dimensión Procesos; elevación SemVer Web v1.0.147.',
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
      'v1.0.147',
      'Portal Web GSP v1.0.147 - Normalización Global de Almacenamiento y Doble Indexación en Biblioteca Documental',
      'Feature',
      'Saneamiento total de esquemas SQL en modelos/controladores; regla canónica de gobernanza inmutable; doble indexación de contratos y actas 360° en Dimensión Flota & Equipos y Dimensión Procesos OTs en Documentos.vue.',
      jsonb_build_array('REQ-1054'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    -- =========================================================================
    -- 2. PROD: BACKLOG Y RELEASES
    -- =========================================================================
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1054',
      'Normalización Global de Almacenamiento (LG-Storage Standard), Saneamiento de Base de Datos DEV/PROD, Regla Canónica de Gobernanza y Doble Indexación en Biblioteca Documental',
      'Formalización de SPEC-083 y regla canónica storage_and_database_governance.md; erradicación total de referencias hardcodeadas a sch_leangsp. en actaPlataformaModel.js y actaPlataformaController.js; normalización de relDir a GSP/actas; doble indexación en Documentos.vue para listar actas y contratos en Dimensión Equipos y Dimensión Procesos; elevación SemVer Web v1.0.147.',
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

    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.147',
      'Portal Web GSP v1.0.147 - Normalización Global de Almacenamiento y Doble Indexación en Biblioteca Documental',
      'Feature',
      'Saneamiento total de esquemas SQL en modelos/controladores; regla canónica de gobernanza inmutable; doble indexación de contratos y actas 360° en Dimensión Flota & Equipos y Dimensión Procesos OTs en Documentos.vue.',
      jsonb_build_array('REQ-1054'),
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      tipo_release = EXCLUDED.tipo_release,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  const localSql = path.join(__dirname, 'temp_sync_v10147.sql');
  fs.writeFileSync(localSql, sql);
  await ssh.putFile(localSql, '/tmp/sync_v10147.sql');
  fs.unlinkSync(localSql);

  const execRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10147.sql"');
  console.log('Resultado Ejecución SQL:\n', execRes.stdout || execRes.stderr);

  // Verificaciones en DEV
  console.log('--- VERIFICACIÓN BACKLOG DEV ---');
  const bDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp.tcfg_backlog WHERE codigo_req = 'REQ-1054';\\""`);
  console.log(bDev.stdout);

  console.log('--- VERIFICACIÓN RELEASES DEV ---');
  const rDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, publicado_en FROM sch_leangsp.tcfg_releases WHERE version = 'v1.0.147';\\""`);
  console.log(rDev.stdout);

  // Verificación de existencia de tabla tope_acta_plataforma en PROD
  console.log('--- VERIFICACIÓN TABLA tope_acta_plataforma EN PROD ---');
  const checkTableProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tope_acta_plataforma';\\""`);
  console.log(checkTableProd.stdout);

  ssh.dispose();
  console.log('\n=== SINCRONIZACIÓN EXITOSA ===');
}

syncV10147().catch(err => {
  console.error('Error en syncV10147:', err);
  ssh.dispose();
  process.exit(1);
});
