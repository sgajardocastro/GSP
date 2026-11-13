const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncReleaseAndBacklog() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
BEGIN;

-- 1. Insertar / Actualizar REQs recientes en DEV (sch_leangsp)
INSERT INTO sch_leangsp.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES 
(
  'REQ-990', 
  'Motivo de reverso y notificacion interna en devolucion Verificacion a Comercial', 
  'Modal con motivo obligatorio al devolver cotizacion a comercial, persistencia en crm_v1 y despacho omnicanal interno excluyendo al mandante.', 
  'Alta', 'Implementado', 'Jorge Ponce / Comercial', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-991', 
  'Pipeline Documental en Control en Vivo con Umbral SLA 13:00 hrs', 
  'Franja interactiva de 4 hitos (ITS > EDP > OC > Factura) con apertura 1-clic de modales e indicador de retraso SLA al dia habil siguiente 13:00 hrs.', 
  'Alta', 'Implementado', 'Yiara / Operaciones', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-992', 
  'Condiciones Comerciales Oficiales para Gruas y Plumas con Validez 5 Dias Habiles', 
  'Texto canonico de 6 secciones bajo estructurador de precios en CRM, preservando traslados, y vigencia formal de 5 dias habiles en PDF e interfaz.', 
  'Critica', 'Implementado', 'Jorge Ponce / Direccion', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-993', 
  'Registro y Fotos Separadas de Horometros y Odometros en PWA', 
  'Separacion de captura fotografica independiente para horometros (izajes/motor) y odometros (tacografo chasis en km) en Momento 1 y Momento 2.', 
  'Critica', 'Implementado', 'Direccion GSP / Terreno', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-994', 
  'Cotizador Express Movil en PWA (Spec 64)', 
  'Modulo mobile-first para cotizar servicios de izaje en terreno en menos de 60 segundos con despacho directo a WhatsApp y validez estricta de 5 dias habiles.', 
  'Alta', 'Especificado', 'Direccion GSP', 'Sistema', '2026-10-05', NULL, NOW()
)
ON CONFLICT (codigo_req) DO UPDATE SET
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  estado = EXCLUDED.estado,
  solicitado_por = EXCLUDED.solicitado_por,
  fecha_implementacion = EXCLUDED.fecha_implementacion,
  updated_at = NOW();

-- 2. Insertar / Actualizar REQs recientes en PROD (sch_leangsp_prod)
INSERT INTO sch_leangsp_prod.tcfg_backlog (
  codigo_req, nombre_requerimiento, descripcion, prioridad, estado, solicitado_por, creado_por, fecha_registro, fecha_implementacion, updated_at
) VALUES 
(
  'REQ-990', 
  'Motivo de reverso y notificacion interna en devolucion Verificacion a Comercial', 
  'Modal con motivo obligatorio al devolver cotizacion a comercial, persistencia en crm_v1 y despacho omnicanal interno excluyendo al mandante.', 
  'Alta', 'Implementado', 'Jorge Ponce / Comercial', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-991', 
  'Pipeline Documental en Control en Vivo con Umbral SLA 13:00 hrs', 
  'Franja interactiva de 4 hitos (ITS > EDP > OC > Factura) con apertura 1-clic de modales e indicador de retraso SLA al dia habil siguiente 13:00 hrs.', 
  'Alta', 'Implementado', 'Yiara / Operaciones', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-992', 
  'Condiciones Comerciales Oficiales para Gruas y Plumas con Validez 5 Dias Habiles', 
  'Texto canonico de 6 secciones bajo estructurador de precios en CRM, preservando traslados, y vigencia formal de 5 dias habiles en PDF e interfaz.', 
  'Critica', 'Implementado', 'Jorge Ponce / Direccion', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-993', 
  'Registro y Fotos Separadas de Horometros y Odometros en PWA', 
  'Separacion de captura fotografica independiente para horometros (izajes/motor) y odometros (tacografo chasis en km) en Momento 1 y Momento 2.', 
  'Critica', 'Implementado', 'Direccion GSP / Terreno', 'Sistema', '2026-10-05', '2026-10-05', NOW()
),
(
  'REQ-994', 
  'Cotizador Express Movil en PWA (Spec 64)', 
  'Modulo mobile-first para cotizar servicios de izaje en terreno en menos de 60 segundos con despacho directo a WhatsApp y validez estricta de 5 dias habiles.', 
  'Alta', 'Especificado', 'Direccion GSP', 'Sistema', '2026-10-05', NULL, NOW()
)
ON CONFLICT (codigo_req) DO UPDATE SET
  nombre_requerimiento = EXCLUDED.nombre_requerimiento,
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  estado = EXCLUDED.estado,
  solicitado_por = EXCLUDED.solicitado_por,
  fecha_implementacion = EXCLUDED.fecha_implementacion,
  updated_at = NOW();

-- 3. Registrar Releases v1.0.88, v1.0.89, v1.0.90 y v1.0.91 en DEV
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES 
(
  'v1.0.88', CURRENT_DATE,
  'Portal Web GSP v1.0.88: Deduplicacion de Traslado en PDF Cotizacion y Motivo Obligatorio en Reverso a Comercial',
  '["REQ-682", "REQ-990"]'::jsonb
),
(
  'v1.0.89', CURRENT_DATE,
  'Portal Web GSP v1.0.89: Retorno a Base con Hoja de Ruta Inversa y Pipeline Documental en Control Vivo',
  '["REQ-988", "REQ-991"]'::jsonb
),
(
  'v1.0.90', CURRENT_DATE,
  'Portal Web GSP v1.0.90: Condiciones Comerciales Canonicas Gruas/Plumas y Validez Estricta 5 Dias Habiles',
  '["REQ-992"]'::jsonb
),
(
  'v1.0.91', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.91: Fotos Independientes Horometros/Odometros PWA, Spec 64 Cotizador Express y Simulador Web Interactivo',
  '["REQ-993", "REQ-994"]'::jsonb
)
ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

-- 4. Registrar Releases en PROD
INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES 
(
  'v1.0.88', CURRENT_DATE,
  'Portal Web GSP v1.0.88: Deduplicacion de Traslado en PDF Cotizacion y Motivo Obligatorio en Reverso a Comercial',
  '["REQ-682", "REQ-990"]'::jsonb
),
(
  'v1.0.89', CURRENT_DATE,
  'Portal Web GSP v1.0.89: Retorno a Base con Hoja de Ruta Inversa y Pipeline Documental en Control Vivo',
  '["REQ-988", "REQ-991"]'::jsonb
),
(
  'v1.0.90', CURRENT_DATE,
  'Portal Web GSP v1.0.90: Condiciones Comerciales Canonicas Gruas/Plumas y Validez Estricta 5 Dias Habiles',
  '["REQ-992"]'::jsonb
),
(
  'v1.0.91', CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.91: Fotos Independientes Horometros/Odometros PWA, Spec 64 Cotizador Express y Simulador Web Interactivo',
  '["REQ-993", "REQ-994"]'::jsonb
)
ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  console.log('Escribiendo script SQL temporal en el servidor...');
  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v1091.sql\n${sql}\nEOF`);

  console.log('Ejecutando SQL via psql...');
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v1091.sql"');
  console.log(res.stdout || res.stderr);

  // Verificacion de Backlog PROD
  const verifySql = `
    SELECT 'PROD' as env, codigo_req, estado, fecha_implementacion, left(nombre_requerimiento, 50) as req 
    FROM sch_leangsp_prod.tcfg_backlog 
    WHERE codigo_req IN ('REQ-990', 'REQ-991', 'REQ-992', 'REQ-993', 'REQ-994')
    ORDER BY codigo_req;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/verify_v1091.sql\n${verifySql}\nEOF`);
  const resVerify = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/verify_v1091.sql"');
  console.log('Estado de Backlog PROD:');
  console.log(resVerify.stdout || resVerify.stderr);

  // Verificacion de Releases PROD
  const verifyRel = `SELECT version, fecha_release, left(titulo, 60) as titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases ORDER BY version DESC LIMIT 5;`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/verify_rel.sql\n${verifyRel}\nEOF`);
  const resRel = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/verify_rel.sql"');
  console.log('Estado de Releases PROD:');
  console.log(resRel.stdout || resRel.stderr);

  ssh.dispose();
}

syncReleaseAndBacklog().catch(console.error);
