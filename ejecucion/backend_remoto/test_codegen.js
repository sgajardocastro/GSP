const pool = require('./src/config/postgresPool');
const ProyectoModel = require('./src/models/proyectoModel');

async function run() {
  try {
    const p = new ProyectoModel(pool);
    const codigo = await p.generarCodigoTransaccional(9);
    console.log('Generated code:', codigo);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
