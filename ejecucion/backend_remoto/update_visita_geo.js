require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});
async function updateTemplate() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id_template, body_seed FROM sch_leangsp.tsrv_templates WHERE id_template = 80 OR name_template_srv ILIKE '%visita%'");
    if (res.rows.length === 0) {
      console.log("No template found");
      return;
    }
    
    for (const row of res.rows) {
      let seed = row.body_seed;
      if (typeof seed === 'string') seed = JSON.parse(seed);
      
      const seg2 = seed.segmentos?.find(s => s.label && (s.label.includes('DATOS GENERALES') || s.label.includes('2.')));
      if (seg2) {
        const hasGeo = seg2.attributes.some(a => a.type === 'geoLocation');
        if (!hasGeo) {
          seg2.attributes.splice(3, 0, {
            type: "geoLocation",
            label: "GEOLOCALIZACION OBRA",
            nullable: true
          });
          
          await client.query("UPDATE sch_leangsp.tsrv_templates SET body_seed = $1 WHERE id_template = $2", [JSON.stringify(seed), row.id_template]);
          console.log(`Updated template ${row.id_template} with geoLocation attribute!`);
        } else {
          console.log(`Template ${row.id_template} already has geoLocation attribute.`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}
updateTemplate();
