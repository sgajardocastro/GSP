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
    INSERT INTO sch_leangsp_prod.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      '1.0.202',
      CURRENT_DATE,
      'Estabilización Ejecutiva y Resolución de Fondo Cero Parches (ITS, Viáticos RER/Riggers, Colación, Backlog Multimedia y Combustible Convoy)',
      'Feature & Mejoras',
      'Resolución estructural en 4 niveles de viáticos para riggers/RER, erradicación de fallbacks de 60m colación, carga/pegado de imágenes en backlog (Ctrl+V) y soporte de combustible multiequipo.',
      '["REQ-1127", "REQ-1128", "REQ-1129", "REQ-1131"]'::jsonb,
      'Sergio Gajardo'
    ) ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;

    INSERT INTO sch_leangsp.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      '1.0.202',
      CURRENT_DATE,
      'Estabilización Ejecutiva y Resolución de Fondo Cero Parches (ITS, Viáticos RER/Riggers, Colación, Backlog Multimedia y Combustible Convoy)',
      'Feature & Mejoras',
      'Resolución estructural en 4 niveles de viáticos para riggers/RER, erradicación de fallbacks de 60m colación, carga/pegado de imágenes en backlog (Ctrl+V) y soporte de combustible multiequipo.',
      '["REQ-1127", "REQ-1128", "REQ-1129", "REQ-1131"]'::jsonb,
      'Sergio Gajardo'
    ) ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand('cat << \'EOF\' > /tmp/sync_release_202.sql\n' + sql + '\nEOF');
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/sync_release_202.sql"');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
  console.log('Release 1.0.202 registered in DB.');
}

main().catch(console.error);
