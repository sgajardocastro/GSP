const { Client } = require("pg");
const client = new Client({
  connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public"
});

async function run() {
  await client.connect();
  
  const { rows } = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'tpar_empresas' 
    ORDER BY column_name
  `);
  console.log("Columnas de tpar_empresas:");
  console.log(rows);

  await client.end();
}

run().catch(console.error);
