const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  try {
    const res = await pool.query('SELECT body_seed FROM tsrv_templates WHERE id_template = 80');
    
    if (res.rows.length > 0) {
        const template = res.rows[0].body_seed;
        const segment = template.segmentos.find(s => s.label.includes('RECOMENDACIÓN'));
        if (segment) {
            const exists = segment.attributes.find(a => a.type === 'signature');
            if (!exists) {
                segment.attributes.push({
                    "type": "signature",
                    "label": "FIRMA DEL CLIENTE",
                    "nullable": true
                });
                
                await pool.query('UPDATE tsrv_templates SET body_seed = $1 WHERE id_template = 80', [JSON.stringify(template)]);
                console.log("Template 80 updated with signature field!");
            } else {
                console.log("Signature field already exists in template 80");
            }
        } else {
            console.log("Segment not found");
        }
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
