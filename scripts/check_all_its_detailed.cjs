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

    async function check() {
      const itsRes = await pool.query("SELECT * FROM sch_leangsp_prod.tits_informe_termino ORDER BY id_its ASC;");
      for (const its of itsRes.rows) {
        console.log('--------------------------------------------------');
        console.log('ITS ID: ' + its.id_its + ' | PROYECTO: ' + its.id_proyecto + ' | FOLIO: ' + its.folio_its + ' | ESTADO: ' + its.estado_its);
        console.log('  VALOR HORA PACTADO: ' + its.valor_hora_pactado + ' | VALOR FLETE: ' + its.valor_flete_pactado);
        console.log('  TOTAL HORAS: ' + its.total_horas_report + ' | ING HORAS: ' + its.total_ingresos_horas + ' | ING FLETES: ' + its.total_ingresos_fletes + ' | TOTAL FACTURABLE: ' + its.total_ingresos_facturables);
        
        const jdRes = await pool.query("SELECT id_jornada, patente, tipo_servicio, horas_report, tarifa_hora, subtotal FROM sch_leangsp_prod.tits_jornada_detalle WHERE id_its = $1 ORDER BY id_jornada ASC;", [its.id_its]);
        console.log('  JORNADAS (' + jdRes.rows.length + '):');
        for (const jd of jdRes.rows) {
          console.log('    jd ' + jd.id_jornada + ': ' + jd.patente + ' | ' + jd.tipo_servicio + ' | hrs: ' + jd.horas_report + ' | tarifa: ' + jd.tarifa_hora + ' | subtotal: ' + jd.subtotal);
        }

        const pRes = await pool.query("SELECT codi_proyecto, nombre_proyecto, json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = $1;", [its.id_proyecto]);
        const p = pRes.rows[0];
        console.log('  PROYECTO: ' + (p ? p.codi_proyecto + ' (' + p.nombre_proyecto + ')' : 'DESCONOCIDO'));
        
        const lsRes = await pool.query("SELECT * FROM sch_leangsp_prod.tpry_linea_servicio WHERE id_proyecto = $1 AND activo IS NOT FALSE;", [its.id_proyecto]);
        if (lsRes.rows.length > 0) {
          const cotTotal = lsRes.rows.reduce((acc, it) => acc + Number(it.subtotal || 0), 0);
          console.log('  COTIZACION (tpry_linea_servicio) TOTAL: ' + cotTotal + ' (' + lsRes.rows.length + ' lineas):');
          for (const l of lsRes.rows) {
            console.log('    ls ' + l.id_linea_servicio + ': ' + l.descripcion + ' | unidad: ' + l.unidad + ' | cant: ' + l.cantidad + ' | unitario: ' + l.valor_unitario + ' | subtotal: ' + l.subtotal);
          }
        } else if (p && p.json_field) {
          const items = (p.json_field.cotizacion && p.json_field.cotizacion.items) || (p.json_field.ejecucion_v1 && p.json_field.ejecucion_v1.items) || [];
          const cotTotal = items.reduce((acc, it) => acc + Number(it.subtotal || it.total || 0), 0);
          console.log('  COTIZACION (json_field) TOTAL: ' + cotTotal + ' (' + items.length + ' items):');
          for (const it of items) {
            console.log('    item: ' + (it.descripcion || it.nombre) + ' | cant: ' + it.cantidad + ' | valor: ' + (it.valor_unitario || it.precio) + ' | total: ' + (it.subtotal || it.total));
          }
        }
      }
      await pool.end();
    }
    check().catch(console.error);
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/check_its.js\n${remoteScript}\nEOF`);
  const r = await ssh.execCommand('node /tmp/check_its.js');
  console.log(r.stdout);
  if (r.stderr) console.error('STDERR:', r.stderr);

  ssh.dispose();
}

run().catch(console.error);
