const client = require('../src/config/dbConfig.js');

async function run() {
  const users = await client.query(`
    SELECT * FROM sch_leangsp.tsec_users WHERE email ILIKE '%pamela%' OR name_frst ILIKE '%pamela%' OR apellido_pat ILIKE '%pamela%';
  `);
  console.log('Pamela in users:', users.rows);

  const emp = await client.query(`
    SELECT * FROM sch_leangsp.tpar_empresas WHERE json_field::text ILIKE '%pamela%' OR contacto_comercial ILIKE '%pamela%' OR email ILIKE '%pamela%';
  `);
  console.log('Pamela in empresas:', emp.rows.length);

  await client.end();
}
run().catch(console.error);
