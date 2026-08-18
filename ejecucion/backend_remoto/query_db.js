const pool = require('./src/config/postgresPool');

async function fixUsers() {
  try {
    const query = `
      UPDATE sch_leangsp.tsec_users 
      SET activo = true, id_empresa = 9
      WHERE email IN ('sgajardoc@gmail.com', 'lguser@arriendosanpablo.cl')
      RETURNING id_user, email, activo, id_empresa;
    `;
    const res = await pool.query(query);
    console.log("Usuarios corregidos:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

fixUsers();
