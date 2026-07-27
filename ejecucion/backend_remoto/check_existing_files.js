const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
});

async function run() {
  try {
    await client.connect();
    await client.query("SET search_path TO sch_leangsp, public");

    const { rows } = await client.query("SELECT * FROM tfmg_file LIMIT 10");
    console.log("Sample tfmg_file records:\n", rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
