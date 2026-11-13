const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== APLICANDO DDL Y SANEAMIENTO EN DEV (sch_leangsp) Y PROD (sch_leangsp_prod) ===');

  const sqlStatements = `
    -- 1. DEV: Actualizar constraint tits_jornada_detalle_tipo_servicio_check
    ALTER TABLE sch_leangsp.tits_jornada_detalle DROP CONSTRAINT IF EXISTS tits_jornada_detalle_tipo_servicio_check;
    ALTER TABLE sch_leangsp.tits_jornada_detalle ADD CONSTRAINT tits_jornada_detalle_tipo_servicio_check 
      CHECK (tipo_servicio IN ('Hora', 'Mensual', 'Fijo', 'Valor Fijo', 'Valor Fijo / Jornada', 'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 'Visita Terreno', 'Interno'));

    -- 2. PROD: Actualizar constraint tits_jornada_detalle_tipo_servicio_check
    ALTER TABLE sch_leangsp_prod.tits_jornada_detalle DROP CONSTRAINT IF EXISTS tits_jornada_detalle_tipo_servicio_check;
    ALTER TABLE sch_leangsp_prod.tits_jornada_detalle ADD CONSTRAINT tits_jornada_detalle_tipo_servicio_check 
      CHECK (tipo_servicio IN ('Hora', 'Mensual', 'Fijo', 'Valor Fijo', 'Valor Fijo / Jornada', 'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 'Visita Terreno', 'Interno'));
  `;

  const ddlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlStatements.replace(/\n/g, ' ')}\\""`);
  console.log('Resultado DDL:', ddlRes.stdout, ddlRes.stderr);

  // 3. Saneamiento de datos para OT 32 en PROD y DEV
  const sanitizeScript = `
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'usr_leangsp',
      password: 'usr_gsp_123',
      host: 'localhost',
      database: 'postgres',
      port: 5432
    });

    async function sanitize() {
      for (const schema of ['sch_leangsp', 'sch_leangsp_prod']) {
        console.log('Sanitizing schema:', schema);
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
          console.log('OT 32 sanitized in', schema);
        }

        // Sanear también tits_informe_termino si existe registro para OT 32
        const itsRes = await pool.query('SELECT id_its, horas_minimas_pactadas, valor_hora_pactado, valor_flete_pactado FROM ' + schema + '.tits_informe_termino WHERE id_proyecto = 32;');
        if (itsRes.rows.length > 0) {
          const itsRow = itsRes.rows[0];
          console.log('Sanitizing tits_informe_termino for OT 32 in', schema, itsRow);
          await pool.query('UPDATE ' + schema + '.tits_informe_termino SET horas_minimas_pactadas = 0, valor_hora_pactado = 0 WHERE id_proyecto = 32;');
          
          // Actualizar jornadas fijas
          await pool.query('UPDATE ' + schema + '.tits_jornada_detalle SET tipo_servicio = \\'Valor Fijo / Jornada\\', tarifa_hora = 0, subtotal = 1000000 WHERE id_its = $1 AND (tipo_servicio ILIKE \\'%fijo%\\' OR tipo_servicio = \\'Hora\\');', [itsRow.id_its]);
          console.log('tits_jornada_detalle sanitized for OT 32 in', schema);
        }
      }
      await pool.end();
    }
    sanitize().catch(console.error);
  `;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/sanitize_ot32.js\n${sanitizeScript}\nEOF`);
  const sanRes = await ssh.execCommand(`cd /home/nodeadmin/proyectos/lean-services-gsp && node sanitize_ot32.js`);
  console.log('Resultado Saneamiento OT 32:', sanRes.stdout, sanRes.stderr);
  await ssh.execCommand(`rm -f /home/nodeadmin/proyectos/lean-services-gsp/sanitize_ot32.js`);

  ssh.dispose();
}

main().catch(console.error);
