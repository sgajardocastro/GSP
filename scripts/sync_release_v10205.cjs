const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const { Pool } = require('pg');

async function syncSchema(schema, user, password) {
  const pool = new Pool({
    host: 'localhost',
    user: user,
    password: password,
    database: 'postgres',
    port: 5432
  });

  try {
    console.log('--- SINCRONIZANDO SCHEMA: ' + schema + ' ---');

    // 1. REQ-1135 en tcfg_backlog
    await pool.query(\`
      INSERT INTO \${schema}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_registro, fecha_implementacion, solicitado_por)
      VALUES (
        'REQ-1135',
        'Proyección de Servicios Mensuales y Multiequipo en Flota Gantt',
        'Resolución de ventana de fechas operativas y pertenencia multiequipo en Torre.vue para proyectar servicios mensuales como Inarco en Flota Gantt (SPEC-121).',
        'ALTA',
        'COMPLETADO',
        CURRENT_DATE,
        CURRENT_DATE,
        'Sergio Gajardo / Jorge Ponce'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'COMPLETADO',
        fecha_implementacion = CURRENT_DATE;
    \`);
    console.log('REQ-1135 sincronizado.');

    // 2. REQ-1136 en tcfg_backlog
    await pool.query(\`
      INSERT INTO \${schema}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_registro, fecha_implementacion, solicitado_por)
      VALUES (
        'REQ-1136',
        'Reestructuración Layout a Dos Paneles con Visor PDF Amplio y Consola Lateral de Firma FES en ModalITS',
        'Erradicación de compresión vertical del visor PDF en modo revisión ejecutiva. Implementación de layout 2 paneles con visor espacioso a la izquierda y consola de firma FES/observaciones a la derecha (SPEC-122).',
        'ALTA',
        'COMPLETADO',
        CURRENT_DATE,
        CURRENT_DATE,
        'Jorge Ponce / Alfonso Porperrello'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'COMPLETADO',
        fecha_implementacion = CURRENT_DATE;
    \`);
    console.log('REQ-1136 sincronizado.');

    // 3. REQ-1139 en tcfg_backlog
    await pool.query(\`
      INSERT INTO \${schema}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, estado, fecha_registro, fecha_implementacion, solicitado_por)
      VALUES (
        'REQ-1139',
        'Auditoría Forense Determinista de Salida de Planta y Jornada en Terreno OT 17 Nicolás Ceballos',
        'Auditoría en base de datos de producción comprobando que la salida y llegada de OT 17 fueron registradas consecutivamente en 34 seg con odómetro idéntico (618.888 km), esclareciendo la sensación de pérdida del operador (CASO-20261109-04).',
        'ALTA',
        'COMPLETADO',
        CURRENT_DATE,
        CURRENT_DATE,
        'Jorge Ponce'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'COMPLETADO',
        fecha_implementacion = CURRENT_DATE;
    \`);
    console.log('REQ-1139 sincronizado.');

    // 4. Versión 1.0.205 en tcfg_releases
    await pool.query(\`
      INSERT INTO \${schema}.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        '1.0.205',
        CURRENT_DATE,
        'Proyección Gantt Servicios Mensuales Inarco, Layout 2 Paneles ModalITS y Auditoría OT 17',
        'MINOR',
        'Proyección Gantt Servicios Mensuales Inarco (REQ-1135), Layout 2 Paneles con Visor PDF Amplio en ModalITS (REQ-1136) y Auditoría Forense Salida Planta OT 17 (REQ-1139)',
        '["REQ-1135", "REQ-1136", "REQ-1139"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        fecha_release = CURRENT_DATE;
    \`);
    console.log('Versión 1.0.205 sincronizada en tcfg_releases.');

  } catch (err) {
    console.error('Error en ' + schema + ':', err);
  } finally {
    await pool.end();
  }
}

async function main() {
  await syncSchema('sch_leangsp_prod', 'usr_leangsp_prod', 'usr_gsp_prod_2026!');
  await syncSchema('sch_leangsp', 'usr_leangsp', 'usr_gsp_123');
}

main();
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/sync_v205_correct.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node /tmp/sync_v205_correct.js');
  console.log(res.stdout || res.stderr);

  ssh.dispose();
}

run().catch(console.error);
