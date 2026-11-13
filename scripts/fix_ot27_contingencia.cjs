const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'usr_leangsp_prod',
      password: 'usr_gsp_prod_2026!',
      host: 'localhost',
      database: 'postgres',
      port: 5432
    });

    async function executeFix() {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        console.log('--- INICIANDO REGULARIZACIÓN OT 27 (PROYECTO 73) ---');

        // 1. Regularizar tpry_rel_equipo:
        // Asegurar que exista id_equipo = 39 (TLXF.37-9) y remover id_equipo = 40 (SKYJ.61-8)
        const checkRel39 = await client.query('SELECT * FROM sch_leangsp_prod.tpry_rel_equipo WHERE id_proyecto = 73 AND id_equipo = 39;');
        if (checkRel39.rows.length === 0) {
          console.log('Actualizando asignación en tpry_rel_equipo de id_equipo 40 a 39...');
          const updRel = await client.query(\`
            UPDATE sch_leangsp_prod.tpry_rel_equipo
            SET id_equipo = 39,
                fecha_plan_ini = '2026-11-12 06:30:00',
                fecha_plan_fin = '2026-11-12 18:00:00',
                fecha_actualizacion = NOW()
            WHERE id_proyecto = 73 AND id_equipo = 40;
          \`);
          console.log('Filas actualizadas en tpry_rel_equipo:', updRel.rowCount);
        } else {
          console.log('Ya existe id_equipo 39 en tpry_rel_equipo. Eliminando id_equipo 40 si existe...');
          await client.query('DELETE FROM sch_leangsp_prod.tpry_rel_equipo WHERE id_proyecto = 73 AND id_equipo = 40;');
          await client.query(\`
            UPDATE sch_leangsp_prod.tpry_rel_equipo
            SET fecha_plan_ini = '2026-11-12 06:30:00',
                fecha_plan_fin = '2026-11-12 18:00:00',
                fecha_actualizacion = NOW()
            WHERE id_proyecto = 73 AND id_equipo = 39;
          \`);
        }

        // 2. Regularizar tequ_log_desplazamiento:
        // Todos los viajes de proyecto 73 que apuntaban a 40 deben apuntar a 39
        const updDesp = await client.query(\`
          UPDATE sch_leangsp_prod.tequ_log_desplazamiento
          SET id_equipo = 39,
              patente = 'TLXF.37-9'
          WHERE id_proyecto = 73 AND (id_equipo = 40 OR id_equipo IS NULL);
        \`);
        console.log('Viajes actualizados a TLXF.37-9 en tequ_log_desplazamiento:', updDesp.rowCount);

        // 3. Regularizar json_field en tpry_proyecto
        const projRes = await client.query('SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 73 FOR UPDATE;');
        const jsonField = projRes.rows[0].json_field || {};

        if (jsonField.crm_v1 && Array.isArray(jsonField.crm_v1.lineas_servicio)) {
          jsonField.crm_v1.lineas_servicio.forEach(l => {
            if (l.tipo === 'GRUAS TELESCOPICAS' || l.subcategoria === 'GRUA 70 TON') {
              l.equipo_asignado_id = 39;
              l.fecha_plan_ini = '2026-11-12';
              l.fecha_plan_fin = '2026-11-12';
            }
          });
        }

        if (jsonField.ejecucion_v1) {
          jsonField.ejecucion_v1.equipo_id = 39;
          jsonField.ejecucion_v1.fecha_salida_plan = '2026-11-12';
          jsonField.ejecucion_v1.hora_salida_plan = '06:30';
          jsonField.ejecucion_v1.hora_llegada_plan = '08:00';
          jsonField.ejecucion_v1.fecha_fin_plan = '2026-11-12';
          jsonField.ejecucion_v1.hora_fin_plan = '18:00';

          if (Array.isArray(jsonField.ejecucion_v1.tripulacion_asignada)) {
            jsonField.ejecucion_v1.tripulacion_asignada.forEach(t => {
              t.equipo_asignado_id = 39;
              t.fecha_plan_ini = '2026-11-12';
              t.fecha_plan_fin = '2026-11-12';
            });
          }
        }

        const updProj = await client.query(\`
          UPDATE sch_leangsp_prod.tpry_proyecto
          SET json_field = $1,
              fecha_modificacion = NOW()
          WHERE id_proyecto = 73;
        \`, [jsonField]);
        console.log('Proyecto 73 json_field actualizado:', updProj.rowCount);

        // 4. Asegurar que equipo 39 (TLXF.37-9) figure como OPERATIVO en tequ_equipo
        const updEq = await client.query(\`
          UPDATE sch_leangsp_prod.tequ_equipo
          SET estado = 'OPERATIVO'
          WHERE id_equipo = 39 AND estado != 'OPERATIVO';
        \`);
        console.log('Equipo 39 puesto en OPERATIVO:', updEq.rowCount);

        await client.query('COMMIT');
        console.log('--- REGULARIZACIÓN EXITOSA (COMMIT) ---');

      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en regularización, ROLLBACK ejecutado:', err);
        throw err;
      } finally {
        client.release();
        await pool.end();
      }
    }

    executeFix().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

run().catch(console.error);
