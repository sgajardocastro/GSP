const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
    -- REQ-1128
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
    VALUES ('REQ-1128', 'Inclusión de Viáticos para Personal RER y Riggers en Sección 4 del ITS', 'Resolución de fondo con fallback dinámico desde tripulación asignada de OT a reportes de avance y liquidación tabular obligatoria según escala de horas de servicio.', 'Alta', '2026-11-07', '2026-11-07', 'Alfonso Porperrello / Sergio Gajardo', 'Implementado', 'Sergio Gajardo', '[]'::jsonb)
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = EXCLUDED.fecha_implementacion,
      estado = EXCLUDED.estado;

    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
    VALUES ('REQ-1128', 'Inclusión de Viáticos para Personal RER y Riggers en Sección 4 del ITS', 'Resolución de fondo con fallback dinámico desde tripulación asignada de OT a reportes de avance y liquidación tabular obligatoria según escala de horas de servicio.', 'Alta', '2026-11-07', '2026-11-07', 'Alfonso Porperrello / Sergio Gajardo', 'Implementado', 'Sergio Gajardo', '[]'::jsonb)
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = EXCLUDED.fecha_implementacion,
      estado = EXCLUDED.estado;

    -- REQ-1129
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
    VALUES ('REQ-1129', 'Soporte de Carga y Pegado (Ctrl+V) de Imágenes en Tickets del Backlog', 'Habilitación de captura directa desde portapapeles (Ctrl+V), selector de imágenes, galería de miniaturas y visor lightbox en pantalla completa persistiendo en tcfg_backlog.adjuntos.', 'Alta', '2026-11-07', '2026-11-07', 'Alfonso Porperrello', 'Implementado', 'Sergio Gajardo', '[]'::jsonb)
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = EXCLUDED.fecha_implementacion,
      estado = EXCLUDED.estado;

    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
    VALUES ('REQ-1129', 'Soporte de Carga y Pegado (Ctrl+V) de Imágenes en Tickets del Backlog', 'Habilitación de captura directa desde portapapeles (Ctrl+V), selector de imágenes, galería de miniaturas y visor lightbox en pantalla completa persistiendo en tcfg_backlog.adjuntos.', 'Alta', '2026-11-07', '2026-11-07', 'Alfonso Porperrello', 'Implementado', 'Sergio Gajardo', '[]'::jsonb)
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = EXCLUDED.fecha_implementacion,
      estado = EXCLUDED.estado;

    -- REQ-1131
    INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
    VALUES ('REQ-1131', 'Imputación de Combustible Multiequipo por OT y Formateo Determinista de Hitos en Excel', 'Soporte de combustible para convoy y vehículos de apoyo (camión rampla / cama baja) en el ITS y formateo en tiempo real de hitos en zona horaria America/Santiago sin duplicidad ni hora fija 18:00.', 'Alta', '2026-11-07', '2026-11-07', 'Alfonso Porperrello', 'Implementado', 'Sergio Gajardo', '[]'::jsonb)
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = EXCLUDED.fecha_implementacion,
      estado = EXCLUDED.estado;

    INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_registro, fecha_implementacion, solicitado_por, estado, creado_por, adjuntos)
    VALUES ('REQ-1131', 'Imputación de Combustible Multiequipo por OT y Formateo Determinista de Hitos en Excel', 'Soporte de combustible para convoy y vehículos de apoyo (camión rampla / cama baja) en el ITS y formateo en tiempo real de hitos en zona horaria America/Santiago sin duplicidad ni hora fija 18:00.', 'Alta', '2026-11-07', '2026-11-07', 'Alfonso Porperrello', 'Implementado', 'Sergio Gajardo', '[]'::jsonb)
    ON CONFLICT (codigo_req) DO UPDATE SET 
      nombre_requerimiento = EXCLUDED.nombre_requerimiento,
      descripcion = EXCLUDED.descripcion,
      fecha_implementacion = EXCLUDED.fecha_implementacion,
      estado = EXCLUDED.estado;
  `;

  await ssh.execCommand('cat << \'EOF\' > /tmp/sync_backlog_reqs.sql\n' + sql + '\nEOF');
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_backlog_reqs.sql"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
  console.log('Backlog sync completed.');
}

main().catch(console.error);
