const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncRelease() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1030',
        'Tipificación y Edición Libre de Trayectos de Viaje en ITS Transición y Desacoplamiento de Entornos DEV/PROD',
        'SPEC-066 Master (Sección 4.2): Habilita edición libre y sugerencias con datalist para tipos de viaje (Ida y Vuelta, Solo Ida, Solo Vuelta, Fletes y Horas) en jornadas y traslados de ITS Transición. Corrige redirección errónea entre entornos DEV y PROD mediante compilación y despliegue desacoplado.',
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

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        '1.0.128',
        'Tipificación y Edición Libre de Trayectos de Viaje en ITS Transición y Desacoplamiento DEV/PROD',
        'FEATURE',
        'Permite editar con texto libre y autocompletar opciones de viaje (Ida y Vuelta, Solo Ida, Solo Vuelta) en costos de ITS Transición. Resuelve la redirección no deseada entre DEV y PROD asegurando bundles independientes.',
        'REQ-1030',
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        updated_at = NOW();
    `;
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/"/g, '\\"')}\\""`);
    console.log(`Base de Datos (${s}):`, resSql.stdout.trim() || resSql.stderr);
  }

  ssh.dispose();
  console.log('✅ Sincronización v1.0.128 completada en ambas bases de datos.');
}

syncRelease().catch(console.error);
