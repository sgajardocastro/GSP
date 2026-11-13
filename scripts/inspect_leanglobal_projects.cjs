const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  for (const s of ['sch_leangsp', 'sch_leangsp_prod']) {
    console.log(`\n=== PROYECTOS LEANGLOBAL EN ${s} ===`);
    const q = `
      SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado,
             COALESCE(c.razon_social, c.name_empresa) as cliente,
             (p.json_field->'crm_v1'->>'monto_neto_total')::numeric as comprometido,
             (p.json_field->'edp_flujo_v1'->>'estado') as estado_edp,
             (p.json_field->'facturas_dte') as facturas_dte
      FROM ${s}.tpry_proyecto p
      LEFT JOIN ${s}.tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE c.name_empresa ILIKE '%lean%' 
         OR c.razon_social ILIKE '%lean%'
         OR p.nombre_proyecto ILIKE '%lean%'
         OR p.codi_proyecto ILIKE '%lean%'
      LIMIT 10;
    `;
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${q.replace(/"/g, '\\"')}\\""`);
    console.log(res.stdout.trim() || res.stderr);
  }

  ssh.dispose();
}

run().catch(console.error);
