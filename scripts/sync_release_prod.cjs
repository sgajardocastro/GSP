const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncProd() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
INSERT INTO sch_leangsp_prod.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
VALUES (
  'REQ-1025',
  'Módulo de Mantenimiento Flota: Paridad Total Web/PWA, Aviso de Avería, OTM General, Buscador Autocomplete y Fotos 360',
  'Implementación integral según SPEC-071: normalización simétrica de payload y correlativo canónico AV-YYYY-XXXX en Aviso de Avería; botón Nueva OTM General con autocompletado de flota; buscador predictivo v-autocomplete con acciones directas (Ficha QR, Abrir OT, Atender OT); simetría en Consola Web con tarjeta Medidores de Entrada (PUT /ots/:id/medidores-inicio), subpestaña Fotos 360 con 6 slots oficiales y Ficha QR modal interactiva.',
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

INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.121',
  'Portal Web GSP v1.0.121 - Consola de Mantenimiento Desktop con Medidores Entrada, Fotos 360 y Ficha QR',
  'Feature',
  'Paridad total con SPEC-071 en Consola Web MantenimientoView: tarjeta interactiva de Medidores de Entrada con guardado en caliente, subpestaña Inspección Visual 360° con 6 slots normados y subida oficial a Storage/DB, y botón Ficha QR Oficial en cabecera y radar de flota.',
  jsonb_build_array('REQ-1025', 'REQ-1024'),
  'Sergio Gajardo'
)
ON CONFLICT (version) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  tipo_release = EXCLUDED.tipo_release,
  descripcion_impacto = EXCLUDED.descripcion_impacto,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
VALUES (
  'v1.0.122',
  'PWA Taller Móvil v1.0.122 - Hotfix Aviso Avería Folio Canónico, Nueva OTM General y Buscador Autocomplete Flota',
  'Feature & Hotfix',
  'Resolución definitiva de error 400 en Aviso de Falla mediante soporte bivalente descripcion/descripcion_sintoma y generación de folio canónico AV-YYYY-XXXX; habilitación de botón Nueva OTM General interactivo con selector v-autocomplete y precarga de medidores; buscador enriquecido con acciones directas Ficha QR, Abrir OT y Atender OT.',
  jsonb_build_array('REQ-1025'),
  'Sergio Gajardo'
)
ON CONFLICT (version) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  tipo_release = EXCLUDED.tipo_release,
  descripcion_impacto = EXCLUDED.descripcion_impacto,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v10122_prod.sql\n${sql}\nEOF`);

  const execRes = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v10122_prod.sql"');
  console.log('Resultado ejecucion SQL Prod:\n', execRes.stdout);
  if (execRes.stderr) console.error('Stderr Prod:', execRes.stderr);

  const verifFinal = await ssh.execCommand(`su - postgres -c "psql -d postgres -c 'SELECT id, version, titulo FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 5;'"` );
  console.log('\n--- VERIFICACIÓN RELEASES EN PROD ---');
  console.log(verifFinal.stdout.trim());

  await ssh.execCommand('rm -f /tmp/sync_v10122_prod.sql');
  ssh.dispose();
}

syncProd().catch(console.error);
