const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const remoteScript = `
    const dotenv = require('dotenv');
    const { Pool } = require('pg');
    const path = require('path');
    const fs = require('fs');

    async function runForEnv(dirPath) {
      console.log('=== Running for dir:', dirPath);
      const envConfig = dotenv.parse(fs.readFileSync(path.join(dirPath, '.env')));
      const pool = new Pool({
        user: envConfig.DB_USER,
        password: envConfig.DB_PASSWORD,
        host: envConfig.DB_HOST || 'localhost',
        database: envConfig.DB_NAME || 'postgres',
        port: parseInt(envConfig.DB_PORT || '5432'),
      });
      const schema = envConfig.DB_SCHEMA;
      console.log('Connected to schema:', schema);

      // 1. Obtener y limpiar OT 32
      const res = await pool.query('SELECT id_proyecto, codi_proyecto, json_field FROM ' + schema + '.tpry_proyecto WHERE id_proyecto = 32;');
      if (res.rows.length > 0) {
        const p = res.rows[0];
        let jf = typeof p.json_field === 'string' ? JSON.parse(p.json_field) : (p.json_field || {});
        let crm = jf.crm_v1 || {};
        
        function cleanLines(lines) {
          if (!Array.isArray(lines)) return lines;
          return lines.filter(l => {
            const tipo = String(l.tipo || l.categoria || '').toUpperCase();
            const subcat = String(l.subcategoria || '').toUpperCase();
            const desc = String(l.descripcion || '').toUpperCase();
            const esRigger = tipo.includes('PERSONAL') || subcat.includes('RIGGER') || desc.includes('RIGGER');
            const val = Number(l.valorUnitario || l.valor_unitario || l.precio_unitario || l.subtotal || 0);
            return !(esRigger && val <= 0);
          });
        }

        if (crm.lineas_servicio) crm.lineas_servicio = cleanLines(crm.lineas_servicio);
        if (crm.lineas_operativas_vigentes) crm.lineas_operativas_vigentes = cleanLines(crm.lineas_operativas_vigentes);
        if (crm.lineas_borrador_comercial) crm.lineas_borrador_comercial = cleanLines(crm.lineas_borrador_comercial);
        if (crm.lineas_snapshot) crm.lineas_snapshot = cleanLines(crm.lineas_snapshot);

        crm.pisoMinimo = 0;
        crm.es_valor_fijo = true;
        crm.valor_fijo = 1000000;
        if (crm.lineas_servicio && crm.lineas_servicio[0]) {
          crm.lineas_servicio[0].pisoMinimo = 0;
        }
        if (crm.lineas_operativas_vigentes && crm.lineas_operativas_vigentes[0]) {
          crm.lineas_operativas_vigentes[0].pisoMinimo = 0;
        }

        jf.crm_v1 = crm;
        await pool.query('UPDATE ' + schema + '.tpry_proyecto SET json_field = $1 WHERE id_proyecto = 32', [JSON.stringify(jf)]);
        console.log('OT 32 tpry_proyecto updated successfully in', schema);
      }

      // 2. Sanear tits_informe_termino y jornadas si existe para OT 32
      const itsRes = await pool.query('SELECT id_its, horas_minimas_pactadas, valor_hora_pactado, valor_flete_pactado FROM ' + schema + '.tits_informe_termino WHERE id_proyecto = 32;');
      if (itsRes.rows.length > 0) {
        const itsRow = itsRes.rows[0];
        console.log('Sanitizing tits_informe_termino for OT 32 in', schema, itsRow);
        await pool.query('UPDATE ' + schema + '.tits_informe_termino SET horas_minimas_pactadas = 0, valor_hora_pactado = 0 WHERE id_proyecto = 32;');
        await pool.query('UPDATE ' + schema + '.tits_jornada_detalle SET tipo_servicio = \\'Valor Fijo / Jornada\\', tarifa_hora = 0, subtotal = 1000000 WHERE id_its = $1 AND (tipo_servicio ILIKE \\'%fijo%\\' OR tipo_servicio = \\'Hora\\');', [itsRow.id_its]);
        console.log('tits_jornada_detalle updated successfully for OT 32 in', schema);
      }

      await pool.end();
    }

    async function main() {
      await runForEnv('/home/nodeadmin/proyectos/lean-services-gsp');
      await runForEnv('/home/nodeadmin/proyectos/lean-services-gsp-prod');
    }
    main().catch(err => { console.error(err); process.exit(1); });
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/run_sanitize.js\n${remoteScript}\nEOF`);
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp/node_modules node /tmp/run_sanitize.js`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);
  await ssh.execCommand(`rm -f /tmp/run_sanitize.js`);

  ssh.dispose();
}

main().catch(console.error);
