import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({
    connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
  });
  await client.connect();

  console.log('=== SCHEMAS EN DATABASE postgres ===');
  const schemas = await client.query("SELECT schema_name FROM information_schema.schemata;");
  console.log(schemas.rows.map(r => r.schema_name));

  console.log('\n=== TABLAS EN SCHEMAS sch_leangsp Y public ===');
  const tables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('sch_leangsp', 'public') AND (table_name LIKE 'tinv_%' OR table_name LIKE 'tmnt_%');");
  console.log(tables.rows);

  await client.end();
}

check();
