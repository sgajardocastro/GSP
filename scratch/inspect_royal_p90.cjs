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

  const sql1 = `
SELECT id_equipo, patente, modelo, marca, nro_serie, nro_motor, tipo_equipo, id_empresa
FROM sch_leangsp_prod.tequ_equipo
WHERE id_empresa = 11 OR patente ILIKE '%PTE%' OR modelo ILIKE '%TIJERA%' OR modelo ILIKE '%PLATAFORMA%';
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_royal_eq.sql\n${sql1}\nEOF`);
  const res1 = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/query_royal_eq.sql"');
  console.log('--- EQUIPOS ROYAL / PLATAFORMAS ---');
  console.log(res1.stdout);

  const sql2 = `
SELECT jsonb_pretty(json_field)
FROM sch_leangsp_prod.tpry_proyecto
WHERE id_proyecto = 90;
`;
  await ssh.execCommand(`cat << 'EOF' > /tmp/query_p90_jf.sql\n${sql2}\nEOF`);
  const res2 = await ssh.execCommand('su - postgres -c "psql -d postgres -t -A -f /tmp/query_p90_jf.sql"');
  console.log('--- JSON_FIELD P90 (chars: ' + res2.stdout.length + ') ---');
  const jf = JSON.parse(res2.stdout);
  console.log('contrato_arriendo:', jf.contrato_arriendo);
  console.log('crm_v1 contrato:', jf.crm_v1?.contrato);
  console.log('crm_v1 lineas:', jf.crm_v1?.lineas_operativas_vigentes || jf.crm_v1?.lineas_servicio);
  console.log('ejecucion_v1:', jf.ejecucion_v1);

  ssh.dispose();
}

run().catch(console.error);
