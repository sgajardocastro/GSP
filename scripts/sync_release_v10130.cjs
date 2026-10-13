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
    const sqlReleases = `
      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.130',
        'Mejoras de Soporte CRM: Alimentación Flexible, Camión Plataforma y PDF Paramétrico (SPEC-075)',
        'Feature & Mejoras',
        'Desbloqueo de edición de viáticos en servicios de 1 día, nueva categoría de Camión Plataforma en traslados, blindaje anti-autofill en formularios CRM y personalización completa de ejecutivo y empresa emisora en cotizaciones PDF.',
        '["REQ-1031", "REQ-1032", "REQ-1033", "REQ-1034", "REQ-1035", "REQ-1036"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        tipo_release = EXCLUDED.tipo_release,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados,
        fecha_release = CURRENT_DATE;
    `;
    const res = await ssh.execCommand('su - postgres -c "psql -d postgres"', { stdin: sqlReleases });
    console.log(`Releases ${s}:`, res.stdout.trim() || res.stderr);
  }

  const resReleases = await ssh.execCommand('su - postgres -c "psql -d postgres -c \\"SELECT id, version, titulo, fecha_release FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 5;\\""');
  console.log('\n--- VERIFICACIÓN RELEASES EN PROD ---');
  console.log(resReleases.stdout);

  ssh.dispose();
  console.log('✅ Sincronización v1.0.130 en BD verificada con éxito.');
}

syncRelease().catch(console.error);
