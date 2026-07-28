import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({
    connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
  });
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp' AND (table_name LIKE 'tinv_%' OR table_name LIKE 'tmnt_%') ORDER BY table_name;");
  console.log('✅ TABLAS CREADAS EN SCH_LEANGSP (servidor.leanglobal.cl):');
  res.rows.forEach(r => console.log('  - ' + r.table_name));
  await client.end();
}

check();
