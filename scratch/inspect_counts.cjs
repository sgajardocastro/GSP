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

  // Buscar en todas las tablas de sch_leangsp_prod donde id_proyecto = 74
  const sql = `
SELECT 'tpry_proyecto' as tabla, count(*) FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 74
UNION ALL
SELECT 'tpry_rel_equipo' as tabla, count(*) FROM sch_leangsp_prod.tpry_rel_equipo WHERE id_proyecto = 74
UNION ALL
SELECT 'tedp_reporte_avance' as tabla, count(*) FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 74
UNION ALL
SELECT 'tits_informe_termino' as tabla, count(*) FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = 74
UNION ALL
SELECT 'tits_jornada_detalle' as tabla, count(*) FROM sch_leangsp_prod.tits_jornada_detalle WHERE id_its IN (SELECT id_its FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = 74);
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_p74_counts.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_p74_counts.sql"');
  console.log(res.stdout);

  ssh.dispose();
}

run().catch(console.error);
