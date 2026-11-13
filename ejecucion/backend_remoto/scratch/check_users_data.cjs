const client = require('../src/config/dbConfig.js');

async function run() {
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp' AND table_name = 'tsec_users'
  `);
  console.log('Columns in tsec_users:', cols.rows.map(r => r.column_name));

  const users = await client.query(`
    SELECT id_user, name_frst, apellido_pat, email, movil, json_data
    FROM sch_leangsp.tsec_users
    ORDER BY id_user;
  `);
  console.log('Users:');
  for (const u of users.rows) {
    console.log(`- ID: ${u.id_user} | ${u.name_frst} ${u.apellido_pat} | ${u.email} | movil: ${u.movil}`);
  }

  await client.end();
}

run().catch(console.error);
