const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleases() {
  console.log('=== SINCRONIZANDO RELEASES INDEPENDIENTES (PWA v1.0.41 & Web v1.0.125 - REQ-1027) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp'];
  for (const s of schemas) {
    const sql = `
      -- 1. Actualizar / Insertar REQ-1027 en tcfg_backlog
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1027',
        'Resolución Integral de Hallazgos con Evidencias Fotográficas Antes/Después y Sincronización en Detalle de OT',
        'Formalización canónica de ciclo de vida de hallazgos (SPEC-072); captura y renderizado de evidencias antes/después en subtab de OT en Consola Web y en PWA Móvil; normalización de getOtById con fotos parseadas y nombres de usuario; modal interactivo con decisiones de ingeniería (RESUELTO_EN_OT, OT_DERIVADA, BACKLOG, RESTRICCION_OPERACION, FUERA_DE_SERVICIO).',
        'Critica',
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

      -- 2. Registrar Portal Web v1.0.125
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.125',
        'Portal Web GSP v1.0.125 - Visualización de Evidencias Antes/Después y Resolución Técnica en Subtab de OT',
        'Feature',
        'Galería de evidencias iniciales (Antes) y de solución (Después) en el subtab de la OT con visor modal a pantalla completa; botón de resolución interactiva [🛠️ Resolver] directamente en el expediente de la grúa; normalización de parseo de fotos y nombres de usuario en getOtById.',
        '["REQ-1027"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

      -- 3. Registrar PWA Taller Móvil v1.0.41
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.41',
        'PWA Taller Móvil v1.0.41 - Evidencias Fotográficas Antes/Después y Cierre de Hallazgos en Detalle de OTM',
        'Feature',
        'Soporte completo en terreno para captura fotográfica de anomalías (Antes) y reparación final (Después); modal de resolución técnica para mecánicos in situ; sincronización de URLs de fotos con resolverFotoUrl.',
        '["REQ-1027"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    console.log(`Ejecutando sincronización en esquema ${s}...`);
    await ssh.execCommand(`cat << 'EOF' > /tmp/sync_releases_1027.sql\n${sql}\nEOF`);
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_releases_1027.sql"`);
    console.log(`Resultado en ${s}:\n`, res.stdout.trim() || res.stderr.trim());
  }

  // Verificación
  console.log('\n--- VERIFICACIÓN EN sch_leangsp.tcfg_releases ---');
  const checkRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT version, fecha_release, titulo, requerimientos_asociados FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 5;'"`);
  console.log(checkRes.stdout);

  console.log('\n--- VERIFICACIÓN EN sch_leangsp.tcfg_backlog ---');
  const checkB = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT codigo_req, nombre_requerimiento, estado, fecha_implementacion FROM sch_leangsp.tcfg_backlog WHERE codigo_req = \\'REQ-1027\\';'"`);
  console.log(checkB.stdout);

  await ssh.execCommand('rm -f /tmp/sync_releases_1027.sql');
  ssh.dispose();
  console.log('✅ Sincronización de base de datos finalizada exitosamente.');
}

syncReleases().catch(err => {
  console.error('Error sincronizando releases:', err);
  process.exit(1);
});
