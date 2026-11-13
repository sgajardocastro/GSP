const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('=== SINCRONIZANDO GOBERNANZA REQ-1062 / SPEC-090 EN DEV (sch_leangsp) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1062',
      'Reingeniería Enterprise de Experiencia de Usuario en Inventario & WMS (Navegación Persistente, Auditoría de Racks, Dualidad de QRs y Expediente 360° de Existencias)',
      'SPEC-090: Rediseño visual y funcional de Bodegas y Racks WMS. Erradicación del sufijo Lite, menú lateral persistente sin autocierre, dualidad de QRs (casillero vs SKU individual), modal interactivo de Expediente 360° con Kardex y formateo numérico humano.',
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
      'v1.0.153',
      'Portal Web GSP v1.0.153 - Reingeniería Enterprise de Experiencia de Usuario en Inventario & WMS',
      'FEATURE',
      'Erradicación del término Lite, navegación lateral persistente con fijación de submenú en almacenes, supresión de pestaña técnica de migración legada, dualidad clara de QRs en casilleros (impresión individual por SKU y etiqueta física de viga), formateo sin decimales para unidades discretas y Expediente 360° con trazabilidad Kardex en tiempo real.',
      '["REQ-1062"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v153_dev.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v153_dev.sql"`);
  console.log('Resultado SQL DEV:\n', resSql.stdout.trim() || resSql.stderr);

  const checkRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 1;\\""`);
  console.log('\nÚltimo release verificado en DEV:\n', checkRes.stdout);

  ssh.dispose();
  console.log('✓ Sincronización de gobernanza v1.0.153 en DEV completada con éxito.');
}

main().catch(err => {
  console.error('Error sincronizando release v153:', err);
  process.exit(1);
});
