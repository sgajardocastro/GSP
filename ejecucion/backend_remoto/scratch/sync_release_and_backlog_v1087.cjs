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

-- 1. Actualizar Backlog DEV y PROD con estado Implementado y fecha_implementacion
UPDATE sch_leangsp.tcfg_backlog SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW()
WHERE codigo_req IN ('REQ-896', 'REQ-835', 'REQ-957', 'REQ-773', 'REQ-804');

UPDATE sch_leangsp_prod.tcfg_backlog SET 
  estado = 'Implementado', 
  fecha_implementacion = CURRENT_DATE,
  updated_at = NOW()
WHERE codigo_req IN ('REQ-896', 'REQ-835', 'REQ-957', 'REQ-773', 'REQ-804');

-- 2. Asegurar estado de REQ-682 (En Revisión) y REQ-988 (Pendiente)
UPDATE sch_leangsp.tcfg_backlog SET estado = 'En Revisión', updated_at = NOW() WHERE codigo_req = 'REQ-682';
UPDATE sch_leangsp_prod.tcfg_backlog SET estado = 'En Revisión', updated_at = NOW() WHERE codigo_req = 'REQ-682';

UPDATE sch_leangsp.tcfg_backlog SET estado = 'Pendiente', updated_at = NOW() WHERE codigo_req = 'REQ-988';
UPDATE sch_leangsp_prod.tcfg_backlog SET estado = 'Pendiente', updated_at = NOW() WHERE codigo_req = 'REQ-988';

-- 3. Registrar Release v1.0.87 en DEV y PROD
INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.87',
  CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.87: Arribo Faena, Combustible % Llegada, Horómetros Duales y WhatsApp Tripulación',
  '["REQ-896", "REQ-835", "REQ-957", "REQ-773", "REQ-804"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, requerimientos_asociados)
VALUES (
  'v1.0.87',
  CURRENT_DATE,
  'Portal Web & PWA GSP v1.0.87: Arribo Faena, Combustible % Llegada, Horómetros Duales y WhatsApp Tripulación',
  '["REQ-896", "REQ-835", "REQ-957", "REQ-773", "REQ-804"]'::jsonb
) ON CONFLICT (version) DO UPDATE SET 
  fecha_release = EXCLUDED.fecha_release,
  titulo = EXCLUDED.titulo,
  requerimientos_asociados = EXCLUDED.requerimientos_asociados;

COMMIT;
`;

  console.log('Escribiendo script SQL temporal en el servidor...');
  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v1087.sql\n${sql}\nEOF`);

  console.log('Ejecutando SQL via psql...');
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_v1087.sql"');
  console.log(res.stdout || res.stderr);

  // Verificacion de Backlog
  const verifySql = `
    SELECT 'PROD' as env, codigo_req, estado, fecha_implementacion, left(nombre_requerimiento, 50) as req 
    FROM sch_leangsp_prod.tcfg_backlog 
    WHERE codigo_req IN ('REQ-569', 'REQ-620', 'REQ-651', 'REQ-682', 'REQ-773', 'REQ-804', 'REQ-835', 'REQ-896', 'REQ-957', 'REQ-988')
    ORDER BY codigo_req;
  `;
  await ssh.execCommand(`cat << 'EOF' > /tmp/verify_v1087.sql\n${verifySql}\nEOF`);
  const resVerify = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/verify_v1087.sql"');
  console.log('Estado de Backlog PROD:');
  console.log(resVerify.stdout || resVerify.stderr);

  // Verificacion de Release
  const verifyRel = `SELECT version, fecha_release, left(titulo, 60) as titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases ORDER BY fecha_release DESC, version DESC LIMIT 3;`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/verify_rel.sql\n${verifyRel}\nEOF`);
  const resRel = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/verify_rel.sql"');
  console.log('Estado de Releases PROD:');
  console.log(resRel.stdout || resRel.stderr);

  ssh.dispose();
}

syncReleaseAndBacklog().catch(console.error);
