const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('=== SINCRONIZANDO GOBERNANZA REQ-1062 / SPEC-090 v1.0.154 EN DEV (sch_leangsp) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.154',
      'Portal Web GSP v1.0.154 - Rediseño Enterprise de Maestro de Existencias y Modal Único 360°',
      'FEATURE',
      'Erradicación total de la ventana lateral deslizante (drawer), reemplazada por el Modal Enterprise Centrado del Formulario Único de Existencias con Kardex 360°. Incorporación de 5 KPIs superiores ejecutivos en tiempo real, barra ejecutiva con búsqueda universal y filtros por familia, criticidad y disponibilidad física. Renombrado oficial de menú lateral a 2. Maestro de Existencias y 1. Bodegas & Ubicaciones.',
      '["REQ-1062"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v154_dev.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v154_dev.sql"`);
  console.log('Resultado SQL DEV:\n', resSql.stdout.trim() || resSql.stderr);

  const checkRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 2;\\""`);
  console.log('\nÚltimos releases verificados en DEV:\n', checkRes.stdout);

  ssh.dispose();
  console.log('✓ Sincronización de gobernanza v1.0.154 en DEV completada con éxito.');
}

main().catch(err => {
  console.error('Error sincronizando release v154:', err);
  process.exit(1);
});
