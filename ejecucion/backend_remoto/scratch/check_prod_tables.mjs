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

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp_prod' 
    ORDER BY table_name;
  `);
  console.log(`sch_leangsp_prod tiene ${tables.rows.length} tablas:`);
  console.log(tables.rows.map(t => t.table_name).join(', '));

  await client.end();
}

check().catch(console.error);
