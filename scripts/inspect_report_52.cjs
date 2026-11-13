const { Client } = require('pg');
const client = new Client({
  host: '138.255.103.18',
  port: 5432,
  database: 'postgres',
  user: 'usr_leangsp_prod',
  password: 'usr_gsp_prod_2026!'
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_reporte_avance = 52');
  console.log('Report 52 row:', JSON.stringify(res.rows[0], null, 2));
  await client.end();
}
main().catch(console.error);
