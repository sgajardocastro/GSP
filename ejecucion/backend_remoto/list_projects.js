const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
});

async function run() {
  try {
    await client.connect();
    await client.query("SET search_path TO sch_leangsp, public");

    const sql = `
      SELECT 
        p.id_proyecto,
        p.nombre_proyecto,
        p.codi_proyecto,
        p.id_proyecto_estado,
        est.nombre_estado,
        p.id_empresa,
        p.id_empresa_cliente,
        e.razon_social AS nombre_cliente
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      LEFT JOIN tpry_estado est ON p.id_proyecto_estado = est.id_proyecto_estado
      ORDER BY p.id_proyecto DESC;
    `;
    const res = await client.query(sql);
    console.log(`Total projects in database: ${res.rows.length}`);
    res.rows.forEach(p => {
      console.log(`ID: ${p.id_proyecto} | Code: ${p.codi_proyecto} | Name: ${p.nombre_proyecto} | Estado: ${p.id_proyecto_estado} (${p.nombre_estado}) | Empresa: ${p.id_empresa} | Cliente: ${p.nombre_cliente}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
