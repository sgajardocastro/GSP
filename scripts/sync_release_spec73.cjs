const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleases() {
  console.log('=== SINCRONIZANDO RELEASES REQ-1038 / SPEC-073 (PWA v1.0.42) EN DEV Y PROD ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      -- 1. Actualizar / Insertar REQ-1038 en tcfg_backlog
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1038',
        'Rediseño Modular PWA Taller (Patrón Operación), Google SSO Exclusivo, Eliminación de Surveys y Concurrencia de OTMs',
        'Formalización canónica SPEC-073; acceso prioritario Google SSO corporativo en Login.vue con formulario clásico colapsable; transformación de TallerHomeView.vue con patrón modular canónico de 3 tarjetas (Apertura de Trabajos / Nueva OTM, Alertas de Terreno / Aviso de Falla y Trabajos en Curso / Bandeja de OTMs Activas); supresión total del bloque residual de surveys; erradicación del bloqueo EQUIPO_CON_OT_ACTIVA en backend para admitir múltiples OTMs concurrentes por grúa; migración completa DDL Mantenimiento Enterprise a sch_leangsp_prod.',
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

      -- 2. Registrar PWA v1.0.42 en tcfg_releases
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.42',
        'PWA GSP v1.0.42 - Rediseño Modular Taller, Google SSO Corporativo y Múltiples OTMs Concurrentes',
        'Inicio de sesión corporativo directo con Google Workspace; interfaz de Taller reorganizada en 3 bloques limpios idénticos a Operación; erradicación del candado que impedía abrir múltiples OTMs para una misma máquina; eliminación del bloque obsoleto de surveys.',
        '["REQ-1038"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
    console.log(`Esquema ${s}:`, res.stdout.trim() || res.stderr.trim());
  }

  ssh.dispose();
  console.log('\n🎉 Backlog y Releases sincronizados en DEV y PROD.');
}

syncReleases().catch(err => {
  console.error('Error sincronizando releases:', err);
  process.exit(1);
});
