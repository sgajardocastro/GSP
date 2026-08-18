const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres'
});
client.connect();
client.query(process.argv[2], (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  client.end();
});
