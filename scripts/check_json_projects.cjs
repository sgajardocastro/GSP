const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const remoteScript = `
    const { Pool } = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/pg');
    const fs = require('fs');
    const envContent = fs.readFileSync('/home/nodeadmin/proyectos/lean-services-gsp-prod/.env', 'utf8');
    const env = {};
    envContent.split('\\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          let v = trimmed.substring(idx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          env[trimmed.substring(0, idx).trim()] = v;
        }
      }
    });

    const pool = new Pool({
      host: env.DB_HOST || '127.0.0.1',
      user: env.DB_USER || 'postgres',
      password: env.DB_PASSWORD,
      database: env.DB_NAME || 'postgres',
      port: env.DB_PORT || 5432
    });

    async function checkJsonProjects() {
      const pRes = await pool.query("SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, json_field FROM sch_leangsp_prod.tpry_proyecto ORDER BY id_proyecto DESC;");
      console.log('TOTAL PROYECTOS INSPECCIONADOS:', pRes.rows.length);
      const matches = [];

      for (const p of pRes.rows) {
        if (!p.json_field) continue;
        const j = p.json_field;
        const cot = j.cotizacion || {};
        const ejec = j.ejecucion_v1 || {};
        const items = cot.items || ejec.items || [];
        
        let hasHora = false;
        let hasFijo = false;
        let hasRigger = false;
        let details = [];

        for (const it of items) {
          const u = String(it.unidad || it.tipo_tarifa || '').toUpperCase();
          const d = String(it.descripcion || it.nombre || '').toUpperCase();
          if (u.includes('HORA') || d.includes('HORA')) hasHora = true;
          if (u.includes('FIJO') || d.includes('FIJO')) hasFijo = true;
          if (d.includes('RIGGER')) hasRigger = true;
          details.push({ desc: it.descripcion || it.nombre, unidad: it.unidad, total: it.subtotal || it.total });
        }

        if (hasHora && (hasFijo || hasRigger)) {
          matches.push({
            id: p.id_proyecto,
            codigo: p.codi_proyecto,
            nombre: p.nombre_proyecto,
            estado: p.id_proyecto_estado,
            details: details
          });
        }
      }

      console.log('PROYECTOS EN JSON_FIELD CON HORA + FIJO/RIGGER (' + matches.length + '):');
      for (const m of matches) {
        console.log('-------------------------------------------');
        console.log('ID:', m.id, 'COD:', m.codigo, 'NOM:', m.nombre, 'ESTADO:', m.estado);
        console.log('ITEMS:', JSON.stringify(m.details));
      }

      await pool.end();
    }
    checkJsonProjects().catch(console.error);
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_json_projects.js\n${remoteScript}\nEOF`);
  const r = await ssh.execCommand('node /tmp/check_json_projects.js');
  console.log(r.stdout);
  if (r.stderr) console.error('STDERR:', r.stderr);

  ssh.dispose();
}

run().catch(console.error);
