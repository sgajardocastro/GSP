const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public'
});

async function run() {
  try {
    await client.connect();
    // Update all projects that are state 4, 5, 6, 7 to state 3 (Preparación Operaciones)
    const res = await client.query(`
      UPDATE tpry_proyecto 
      SET id_proyecto_estado = 3 
      WHERE id_proyecto_estado IN (4, 5, 6, 7)
    `);
    console.log('Filas actualizadas:', res.rowCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
