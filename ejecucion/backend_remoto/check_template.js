const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id_template, body_seed FROM tsrv_templates WHERE id_template = 80');
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
