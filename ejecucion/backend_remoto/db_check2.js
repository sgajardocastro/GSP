const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public'
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM tpry_correlativos LIMIT 10');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
