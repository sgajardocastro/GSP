const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const script = `
    SELECT 
      ls.id_proyecto,
      p.codi_proyecto,
      p.nombre_proyecto,
      p.id_proyecto_estado,
      COUNT(ls.id_linea_servicio) as total_lineas,
      STRING_AGG(DISTINCT ls.unidad, ' | ') as unidades,
      STRING_AGG(DISTINCT ls.descripcion, ' /// ') as descripciones,
      SUM(ls.subtotal) as total_cotizado
    FROM sch_leangsp_prod.tpry_linea_servicio ls
    JOIN sch_leangsp_prod.tpry_proyecto p ON ls.id_proyecto = p.id_proyecto
    WHERE ls.activo IS NOT FALSE
    GROUP BY ls.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado
    ORDER BY ls.id_proyecto ASC;
  `;

  const r = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${script.replace(/\n/g, ' ')}"`);
  console.log(r.stdout);

  ssh.dispose();
}

run().catch(console.error);
