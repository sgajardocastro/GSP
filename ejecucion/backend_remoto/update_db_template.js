const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres?schema=public'
});

async function run() {
  try {
    await client.connect();
    
    // Read the local file
    const filePath = path.join(__dirname, '..', '..', 'Template_Visita_Terreno.json');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Validate it's proper JSON
    const parsed = JSON.parse(content);
    
    // Update the database
    const query = 'UPDATE tsrv_templates SET body_seed = $1 WHERE id_template = 80 RETURNING id_template';
    const res = await client.query(query, [JSON.stringify(parsed)]);
    
    console.log('Update result:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
