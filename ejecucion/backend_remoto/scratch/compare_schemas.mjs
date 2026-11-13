import pg from 'pg';

async function compareSchemas() {
  const { Client } = pg;
  const client = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123',
  });
  await client.connect();

  // 1. Tables in dev
  const devTablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  const devTables = new Set(devTablesRes.rows.map(r => r.table_name));

  // 2. Tables in prod
  const prodTablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp_prod' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  const prodTables = new Set(prodTablesRes.rows.map(r => r.table_name));

  const missingInProd = [...devTables].filter(t => !prodTables.has(t));
  const onlyInProd = [...prodTables].filter(t => !devTables.has(t));

  console.log("=== COMPARACIÓN DE TABLAS ===");
  console.log(`Tablas en DEV (sch_leangsp): ${devTables.size}`);
  console.log(`Tablas en PROD (sch_leangsp_prod): ${prodTables.size}`);
  console.log("Tablas en DEV pero FALTAN en PROD:", missingInProd);
  console.log("Tablas solo en PROD:", onlyInProd);

  // 3. Check sequences in dev vs prod
  const devSeqRes = await client.query(`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'sch_leangsp';
  `);
  const prodSeqRes = await client.query(`
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'sch_leangsp_prod';
  `);
  console.log(`\nSecuencias en DEV: ${devSeqRes.rows.length} | en PROD: ${prodSeqRes.rows.length}`);

  // 4. Check user search_path setting
  const userRole = await client.query(`
    SELECT rolname, rolconfig 
    FROM pg_roles 
    WHERE rolname IN ('usr_leangsp', 'usr_leangsp_prod');
  `);
  console.log("\nConfiguración de roles (search_path):", userRole.rows);

  await client.end();
}

compareSchemas().catch(console.error);
