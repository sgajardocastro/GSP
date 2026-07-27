const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id_survey, id_proyecto, id_template, estado_srv FROM tsrv_survey WHERE id_survey = 174');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
