const pool = require('./src/config/postgresPool');

async function test() {
  try {
    const sql = `
      SELECT DISTINCT TRIM(json_data->>'cargo') AS cargo 
      FROM sch_leangsp.tsec_users 
      WHERE json_data->>'cargo' IS NOT NULL AND TRIM(json_data->>'cargo') != ''
      ORDER BY cargo ASC;
    `;
    const res = await pool.query(sql);
    console.log("CARGOS EN DB:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
test();
