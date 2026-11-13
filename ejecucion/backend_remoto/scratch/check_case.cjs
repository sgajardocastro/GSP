const client = require('../src/config/dbConfig.js');

async function listAllUsers() {
  try {
    const res = await client.query(`
      SELECT u.id_user, u.name_sec, r.name_rol
      FROM sch_leangsp.tsec_users u
      LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
      LEFT JOIN sch_leangsp.tsec_roles r ON ur.id_rol = r.id_rol
      ORDER BY u.id_user
    `);
    console.log('USUARIOS Y ROLES:');
    console.log(res.rows.filter(x => x.name_sec));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

listAllUsers();
