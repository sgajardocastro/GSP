const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const script = `
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'usr_leangsp_prod',
      password: 'usr_gsp_prod_2026!',
      host: 'localhost',
      database: 'postgres',
      port: 5432
    });

    async function run() {
      // 1. Columnas de tits_costo_operacional
      const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tits_costo_operacional' ORDER BY ordinal_position;");
      console.log('Columnas tits_costo_operacional:', cols.rows.map(c => c.column_name));

      // 2. Registros de tits_costo_operacional para OT 30 y OT 32
      const costos = await pool.query("SELECT * FROM sch_leangsp_prod.tits_costo_operacional WHERE id_its IN (1, 9);");
      console.log('Costos guardados en id_its IN (1, 9):', costos.rows);

      // 3. Revisar en general algunos registros de tits_costo_operacional para ver cómo guardan concepto_detalle
      const sample = await pool.query("SELECT id_costo_item, id_its, categoria, concepto_detalle, monto_total FROM sch_leangsp_prod.tits_costo_operacional ORDER BY id_costo_item DESC LIMIT 15;");
      console.log('Muestra reciente tits_costo_operacional:', sample.rows);

      await pool.end();
    }
    run().catch(console.error);
  `;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/audit_costos_cols.js\n${script}\nEOF`);
  const res = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node audit_costos_cols.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

main().catch(console.error);
