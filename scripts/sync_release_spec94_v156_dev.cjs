const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('=== SINCRONIZANDO GOBERNANZA REQ-1066 / SPEC-094 v1.0.156 EN DEV (sch_leangsp) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.156',
      'Portal Web GSP v1.0.156 - Reingeniería Enterprise de Traspasos & Traslados entre Bodegas y Erradicación Total de Alertas Mantenimiento',
      'FEATURE',
      'Erradicación total de datos mock y alerts en TraspasosTrasladosView.vue. Conexión nativa con backend transaccional y tablas PostgreSQL tinv_traspaso y tinv_traspaso_linea. 4 KPIs ejecutivos en tiempo real, stepper de ruta de 4 etapas, modal de emisión GDI con validación atómica de existencias, y modal de recepción con asignación de casillero físico en bodega destino. Pulido integral de MantenimientoView.vue sustituyendo los 14 alert() de navegador por sistema de toasts corporativos no invasivos.',
      '["REQ-1066", "REQ-1067"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v156_dev.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v156_dev.sql"`);
  console.log('Resultado SQL DEV:\n', resSql.stdout.trim() || resSql.stderr);

  const checkRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 3;\\""`);
  console.log('\nÚltimos releases verificados en DEV:\n', checkRes.stdout);

  await ssh.execCommand(`rm -f /tmp/sync_v156_dev.sql`);
  ssh.dispose();
  console.log('✓ Sincronización de gobernanza v1.0.156 en DEV completada con éxito.');
}

main().catch(err => {
  console.error('Error sincronizando release v156:', err);
  process.exit(1);
});
