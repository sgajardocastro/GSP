const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  const sql = `
    SELECT 
      p.id_proyecto,
      p.codi_proyecto,
      p.id_proyecto_estado,
      e.razon_social AS nombre_cliente,
      its.id_its,
      its.folio_its,
      its.estado_its
    FROM sch_leangsp_prod.tpry_proyecto p
    LEFT JOIN sch_leangsp_prod.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
    LEFT JOIN LATERAL (
      SELECT id_its, folio_its, estado_its 
      FROM sch_leangsp_prod.tits_informe_termino its 
      WHERE its.id_proyecto = p.id_proyecto 
      ORDER BY its.id_its DESC 
      LIMIT 1
    ) its ON true
    WHERE p.id_proyecto = 2;
  `;

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log('QUERY TEST ALTUMAC:\n', res.stdout);

  ssh.dispose();
}

run().catch(console.error);
