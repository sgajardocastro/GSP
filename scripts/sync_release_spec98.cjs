const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sqlDev = `
    INSERT INTO sch_leangsp.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.157',
      'Portal Web GSP v1.0.157 - Disponibilidad E2E de PDF de Reports Diarios y Acceso Directo',
      'FEATURE',
      'REQ-1067 / SPEC-098: Apertura directa del PDF oficial de reportes en Gestor Documental y CRM con botón secundario Formulario Web. Generación inmediata en PWA al guardar jornada, diferenciación visual Nivel 1 y Nivel 2 FES, endpoint auto-reparable GET /api/operaciones/report/:id/pdf y regularización 100% de reportes en BD.',
      '["REQ-1067"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  const sqlProd = `
    INSERT INTO sch_leangsp_prod.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
    VALUES (
      'v1.0.157',
      'Portal Web GSP v1.0.157 - Disponibilidad E2E de PDF de Reports Diarios y Acceso Directo',
      'FEATURE',
      'REQ-1067 / SPEC-098: Apertura directa del PDF oficial de reportes en Gestor Documental y CRM con botón secundario Formulario Web. Generación inmediata en PWA al guardar jornada, diferenciación visual Nivel 1 y Nivel 2 FES, endpoint auto-reparable GET /api/operaciones/report/:id/pdf y regularización 100% de reportes en BD.',
      '["REQ-1067"]'::jsonb,
      'Sergio Gajardo'
    )
    ON CONFLICT (version) DO UPDATE SET 
      titulo = EXCLUDED.titulo,
      descripcion_impacto = EXCLUDED.descripcion_impacto,
      requerimientos_asociados = EXCLUDED.requerimientos_asociados;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v157.sql\n${sqlDev}\n${sqlProd}\nEOF`);
  const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v157.sql"`);
  console.log('Resultado SQL DEV y PROD:\n', resSql.stdout.trim() || resSql.stderr);

  const checkDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, fecha_release FROM sch_leangsp.tcfg_releases ORDER BY id DESC LIMIT 1;\\""`);
  console.log('\nÚltimo release en DEV:\n', checkDev.stdout);

  const checkProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, fecha_release FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 1;\\""`);
  console.log('Último release en PROD:\n', checkProd.stdout);

  await ssh.execCommand(`rm -f /tmp/sync_v157.sql`);
  ssh.dispose();
  console.log('✓ Release v1.0.157 registrado con éxito en BD DEV y PROD.');
}

main().catch(err => {
  console.error('Error:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
