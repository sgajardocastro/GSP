require('dotenv').config();
const pool = require('./src/config/postgresPool');

async function test() {
  const client = await pool.connect();
  try {
    const resPub = await client.query("SELECT id_user, email FROM public.tsec_users WHERE id_user = 54");
    console.log("PUBLIC:", resPub.rows);
  } catch (err) {
    console.error("Error public:", err.message);
  } finally {
    client.release();
    pool.end();
  }
}
test();
