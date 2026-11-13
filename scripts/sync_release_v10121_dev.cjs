const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleaseDev() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
INSERT INTO sch_leangsp.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
VALUES ('REQ-1024', 'Taller Movil PWA Ficha QR, Medidores Entrada/Cierre y Fotos 360', 'Integracion de Ficha QR oficial, captura de medidores al inicio/cierre (doble horometro y odometro) y slots 360 segun SPEC-071', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
ON CONFLICT (codigo_req) DO UPDATE SET 
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  estado = 'Implementado',
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW();

INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
VALUES ('v1.0.121', 'PWA Taller Movil v1.0.121 - Ficha QR Oficial, Medidores Entrada/Cierre e Inspeccion 360', 'Feature', 'Ficha QR oficial, captura y sincronizacion de doble horometro y odometro, y 6 slots de fotos 360 para recepcion de gruas en taller (SPEC-071)', jsonb_build_array('REQ-1024'), 'Sergio Gajardo')
ON CONFLICT (version) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  tipo_release = EXCLUDED.tipo_release,
  descripcion_impacto = EXCLUDED.descripcion_impacto,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10121.sql\n${sql}\nEOF`);

  const execRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10121.sql"');
  console.log('Resultado ejecucion SQL:\n', execRes.stdout);
  if (execRes.stderr) console.error('Stderr:', execRes.stderr);

  const verifFinal = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo, requerimientos_asociados FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 4;'"`);
  console.log('\n--- VERIFICACIÓN RELEASES EN DEV ---');
  console.log(verifFinal.stdout.trim());

  const verifBacklog = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp.tcfg_backlog WHERE codigo_req = \\'REQ-1024\\';'"`);
  console.log('\n--- VERIFICACIÓN BACKLOG EN DEV ---');
  console.log(verifBacklog.stdout.trim());

  await ssh.execCommand('rm -f /tmp/sync_v10121.sql');
  ssh.dispose();
}

syncReleaseDev().catch(console.error);
