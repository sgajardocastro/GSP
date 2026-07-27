const pool = require('./src/config/postgresPool');
pool.query("SELECT * FROM tpry_proyecto WHERE codi_proyecto = 'GSP-2607-001'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => pool.end());
