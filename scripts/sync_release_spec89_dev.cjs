const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('=== SINCRONIZANDO GOBERNANZA REQ-1061 EN DEV (sch_leangsp) ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
    VALUES (
      'REQ-1061',
      'Integración Híbrida de Mantenimiento de Flota e Inventario WMS-Lite (Descuento Atómico de Stock, Kardex inmutable, Compra Directa y Escáner QR PWA)',
      'SPEC-089: Modelo híbrido para imputación de repuestos y materiales en OTs de taller. Soporta repuestos oficiales de Pañol Central con descuento de stock y Kardex SALIDA_OT / DEVOLUCION_OT, y compras directas locales de terreno/faena sin alterar inventario.',
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
      'v1.0.152',
      'Portal Web GSP v1.0.152 & PWA GSP v1.0.54 - Integración Híbrida Mantenimiento e Inventario WMS-Lite',
      'FEATURE',
      'Integración transaccional híbrida entre OTs de Mantenimiento e Inventario WMS-Lite. Descuento atómico de stock físico en tinv_stock, asientos inmutables en Kardex (SALIDA_OT / DEVOLUCION_OT) con reversión automática al eliminar insumo, y soporte nativo para compras directas en terreno con factura/boleta.',
      '["REQ-1061"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v152_dev.sql\n${sql}\nEOF`);
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v152_dev.sql"`);
  console.log('Resultado SQL DEV:\n', resSql.stdout.trim() || resSql.stderr);

  // Verificación
  const checkRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 1;\\""`);
  console.log('\nÚltimo release verificado en DEV:\n', checkRes.stdout);

  ssh.dispose();
  console.log('✓ Sincronización de gobernanza en DEV completada con éxito.');
}

main().catch(err => {
  console.error('Error sincronizando release:', err);
  process.exit(1);
});
