const { Client } = require('pg');

const client = new Client({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'servidor.leanglobal.cl',
  database: 'postgres',
  port: 5432,
});

async function findProject() {
  try {
    await client.connect();
    
    // Buscar por identificador formal u otros campos si es necesario
    const res = await client.query(`SELECT id_proyecto, identificador_formal FROM tpry_proyecto WHERE identificador_formal LIKE '%GSP-2608-4851-030%'`);
    console.log('Resultados exactos:', res.rows);
    
    // Si no lo encuentra, buscar por ID 2608 y 4851
    const res2 = await client.query(`SELECT id_proyecto, identificador_formal FROM tpry_proyecto WHERE id_proyecto IN (2608, 4851)`);
    console.log('Resultados por IDs 2608 o 4851:', res2.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

findProject();
