const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const sql = `
  INSERT INTO sch_leangsp_prod.tcfg_releases (
    version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por
  ) VALUES (
    '1.0.225', CURRENT_DATE,
    'Blindaje Operacional: Sincronización Relacional de OTs y Despliegue PWA v1.0.68 con Fail-Open',
    'Operacional / Hotfix',
    'OTs leen tripulación y equipos directamente de tpry_rel_persona y tpry_rel_equipo. PWA v1.0.68 desplegada en prod con fail-open operativo (desbloqueo de días adicionales en faena) y compresión liviana de fotos Canvas 1024px.',
    '["REQ-1183"]'::jsonb,
    'Alfonso Porperello / S. Gajardo'
  ) ON CONFLICT (version) DO UPDATE 
    SET titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

  SELECT id, version, fecha_release, titulo, publicado_por 
  FROM sch_leangsp_prod.tcfg_releases 
  ORDER BY id DESC LIMIT 3;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/register_rel_225.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/register_rel_225.sql"');
  console.log(res.stdout || res.stderr);
  await ssh.execCommand('rm -f /tmp/register_rel_225.sql');

  ssh.dispose();
}

run().catch(console.error);
