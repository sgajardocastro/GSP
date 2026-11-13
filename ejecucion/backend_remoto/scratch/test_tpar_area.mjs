import pg from 'pg';

async function check() {
  const { Client } = pg;
  const client = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
  });
  await client.connect();

  console.log("Testing search_path:");
  await client.query("SET search_path TO sch_leangsp_prod, public;");
  
  try {
    const res = await client.query("SELECT * FROM tpar_area LIMIT 1;");
    console.log("SELECT * FROM tpar_area SUCCEEDED!", res.rows);
  } catch (e) {
    console.log("SELECT * FROM tpar_area FAILED:", e.message);
  }

  try {
    const res2 = await client.query("SELECT * FROM sch_leangsp_prod.tpar_area LIMIT 1;");
    console.log("SELECT * FROM sch_leangsp_prod.tpar_area SUCCEEDED!", res2.rows);
  } catch (e) {
    console.log("SELECT * FROM sch_leangsp_prod.tpar_area FAILED:", e.message);
  }

  // Check table owners and grants
  const clientAdmin = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123',
  });
  await clientAdmin.connect();
  const owners = await clientAdmin.query(`
    SELECT table_schema, table_name, tableowner 
    FROM pg_tables 
    WHERE tablename = 'tpar_area';
  `);
  console.log("tpar_area info:", owners.rows);

  await client.end();
  await clientAdmin.end();
}

check().catch(console.error);
