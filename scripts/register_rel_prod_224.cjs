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
    '1.0.224', CURRENT_DATE,
    'Hotfix Quirurgico: Sanitizacion determinista de fechas, limites input y supresion rigger fantasma',
    'Hotfix',
    'Restriccion min/max en inputs date, sanitizarFechaLocal anti-crash toISOString, regex 4 digitos en Torre.vue y eliminacion de reinyector zombi en proyectoModel.js',
    '["REQ-1182"]'::jsonb,
    'Alfonso Porperello / S. Gajardo'
  ) ON CONFLICT (version) DO UPDATE 
    SET titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;

  SELECT id, version, fecha_release, titulo, publicado_por 
  FROM sch_leangsp_prod.tcfg_releases 
  ORDER BY id DESC LIMIT 3;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/register_rel_224.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/register_rel_224.sql"`);
  console.log(res.stdout || res.stderr);
  await ssh.execCommand(`rm -f /tmp/register_rel_224.sql`);

  ssh.dispose();
}

run().catch(console.error);
