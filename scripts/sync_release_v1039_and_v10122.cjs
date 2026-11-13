const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleases() {
  console.log('=== SINCRONIZANDO RELEASES INDEPENDIENTES (PWA v1.0.39 & Web v1.0.122) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      -- 1. Actualizar / Insertar REQ-1025 en tcfg_backlog
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1025',
        'Mantenimiento y Taller: Fotos 360°, Tareas Base en OTMs, Notificaciones RBAC y Parada de Máquina',
        'Resolución determinista de Fotos 360 en PWA y Web con resolverFotoUrl; inyección de tareas base de taller en OTMs sin pauta; selector de técnicos con ordenamiento RBAC; notificaciones omnicanal de asignación OT y paradas de máquina; erradicación de solapamiento en avisos.',
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

      -- 2. Registrar Portal Web v1.0.122
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.122',
        'Portal Web GSP v1.0.122 - Fotos 360°, Tareas Base en OTMs, Notificaciones Omnicanal Parada Máquina y Asignación Mecánicos',
        'Feature',
        'Resolución canónica de fotos 360 con resolverFotoUrl en consola web; inyección de 4 tareas base obligatorias en OTMs; notificaciones automáticas por Email y WhatsApp al asignar técnicos y alertas urgentes a administradores ante Parada de Máquina.',
        '["REQ-1025"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

      -- 3. Registrar PWA Taller Móvil v1.0.39
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.39',
        'PWA Taller Móvil v1.0.39 - Fotos 360°, Selector de Técnicos RBAC Priorizado y Erradicación Solapamiento en Aviso de Avería',
        'Feature',
        'Resolución determinista de fotos 360 en ranuras y visor modal; selector de técnicos priorizado con iconos por rol (🛠️, 👷, 👤); erradicación total de solapamiento de etiquetas en aviso de falla desacoplando labels con hide-details.',
        '["REQ-1024", "REQ-1025"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    await ssh.execCommand(`cat << 'EOF' > /tmp/sync_releases_new.sql\n${sql}\nEOF`);
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_releases_new.sql"`);
    console.log(`Esquema ${s}:`, res.stdout.replace(/\n+/g, ' ').trim());
  }

  const verifDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo, requerimientos_asociados FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 5;'"`);
  console.log('\n--- VERIFICACIÓN RELEASES EN DEV ---');
  console.log(verifDev.stdout.trim());

  await ssh.execCommand('rm -f /tmp/sync_releases_new.sql');
  ssh.dispose();
  console.log('\n🎉 Sincronización de releases completada.');
}

syncReleases().catch(console.error);
