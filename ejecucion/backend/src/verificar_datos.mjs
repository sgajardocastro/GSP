import pkg from 'pg';
const { Client } = pkg;

async function check() {
  const client = new Client({
    connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
  });
  await client.connect();

  console.log('=== REGISTROS REALES EN sch_leangsp.tinv_bodega ===');
  const bodegas = await client.query("SELECT * FROM sch_leangsp.tinv_bodega;");
  console.log(bodegas.rows);

  console.log('\n=== REGISTROS REALES EN sch_leangsp.tinv_producto (Maestro de Productos) ===');
  const productos = await client.query("SELECT * FROM sch_leangsp.tinv_producto;");
  console.log(productos.rows);

  console.log('\n=== REGISTROS REALES EN sch_leangsp.tinv_existencia ===');
  const existencias = await client.query("SELECT * FROM sch_leangsp.tinv_existencia;");
  console.log(existencias.rows);

  await client.end();
}

check();
