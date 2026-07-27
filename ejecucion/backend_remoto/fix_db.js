const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public'
});

async function run() {
  try {
    await client.connect();
    await client.query('DROP TABLE IF EXISTS tpry_correlativos;');
    await client.query(`
      CREATE TABLE tpry_correlativos (
        prefijo VARCHAR(10), 
        anio_mes VARCHAR(4), 
        ultimo_valor INTEGER DEFAULT 0, 
        PRIMARY KEY (prefijo, anio_mes)
      );
    `);
    console.log('Schema fixed');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
