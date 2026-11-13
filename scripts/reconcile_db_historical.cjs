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

    async function reconcileSchema(schemaName, user, pass) {
      console.log('=== NORMALIZANDO BD ESQUEMA ' + schemaName + ' ===');
      const pool = new Pool({
        user: user,
        password: pass,
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      // 1. En tequ_log_desplazamiento: rellenar patente faltante desde tequ_equipo
      const r1 = await pool.query(\`
        UPDATE \${schemaName}.tequ_log_desplazamiento ld
        SET patente = e.patente
        FROM \${schemaName}.tequ_equipo e
        WHERE ld.id_equipo = e.id_equipo
          AND (ld.patente IS NULL OR ld.patente = '' OR ld.patente = 'S/P')
          AND e.patente IS NOT NULL AND e.patente != '';
      \`);
      console.log('1. Patentes actualizadas en tequ_log_desplazamiento:', r1.rowCount);

      // 2. En tequ_log_desplazamiento: para OT 32 log 49 específicamente
      const r2 = await pool.query(\`
        UPDATE \${schemaName}.tequ_log_desplazamiento
        SET id_user_chofer = 40, patente = 'RWJL.23-K'
        WHERE id_proyecto = 32 AND id_equipo = 79 AND id_user_chofer IS NULL;
      \`);
      console.log('2. Log 49 OT 32 chofer asignado:', r2.rowCount);

      // 3. En tequ_log_desplazamiento: rellenar chofer cuando sea único en tpry_rel_persona para esa OT
      const r3 = await pool.query(\`
        WITH chofer_unico AS (
          SELECT id_proyecto, MIN(id_user) as id_user_chofer
          FROM \${schemaName}.tpry_rel_persona
          WHERE LOWER(rol_asignado) LIKE '%chofer%' 
             OR LOWER(rol_asignado) LIKE '%conductor%' 
             OR LOWER(rol_asignado) LIKE '%cama baja%' 
             OR LOWER(rol_asignado) LIKE '%operador%'
          GROUP BY id_proyecto
          HAVING COUNT(DISTINCT id_user) = 1
        )
        UPDATE \${schemaName}.tequ_log_desplazamiento ld
        SET id_user_chofer = cu.id_user_chofer
        FROM chofer_unico cu
        WHERE ld.id_proyecto = cu.id_proyecto
          AND ld.id_user_chofer IS NULL;
      \`);
      console.log('3. Choferes asignados unívocamente en tequ_log_desplazamiento:', r3.rowCount);

      // 4. En tedp_reporte_avance: rellenar operador cuando sea único en tpry_rel_persona
      const r4 = await pool.query(\`
        WITH operador_unico AS (
          SELECT id_proyecto, MIN(id_user) as id_user_operador
          FROM \${schemaName}.tpry_rel_persona
          WHERE LOWER(rol_asignado) LIKE '%operador%'
          GROUP BY id_proyecto
          HAVING COUNT(DISTINCT id_user) = 1
        )
        UPDATE \${schemaName}.tedp_reporte_avance ra
        SET id_user_operador = ou.id_user_operador
        FROM operador_unico ou
        WHERE ra.id_proyecto = ou.id_proyecto
          AND ra.id_user_operador IS NULL;
      \`);
      console.log('4. Operadores asignados unívocamente en tedp_reporte_avance:', r4.rowCount);

      // 5. En tedp_reporte_avance: rellenar rigger cuando sea único en tpry_rel_persona
      const r5 = await pool.query(\`
        WITH rigger_unico AS (
          SELECT id_proyecto, MIN(id_user) as id_user_rigger
          FROM \${schemaName}.tpry_rel_persona
          WHERE LOWER(rol_asignado) LIKE '%rigger%'
          GROUP BY id_proyecto
          HAVING COUNT(DISTINCT id_user) = 1
        )
        UPDATE \${schemaName}.tedp_reporte_avance ra
        SET id_user_rigger = ru.id_user_rigger
        FROM rigger_unico ru
        WHERE ra.id_proyecto = ru.id_proyecto
          AND ra.id_user_rigger IS NULL;
      \`);
      console.log('5. Riggers asignados unívocamente en tedp_reporte_avance:', r5.rowCount);

      // 6. Normalizar roles de Riggers en tpry_rel_persona a 'Rigger'
      const r6 = await pool.query(\`
        UPDATE \${schemaName}.tpry_rel_persona
        SET rol_asignado = 'Rigger'
        WHERE LOWER(rol_asignado) LIKE '%rigger%' AND rol_asignado != 'Rigger';
      \`);
      console.log('6. Roles de Riggers normalizados a "Rigger":', r6.rowCount);

      // 7. Asegurar que id_user = 13 (Matias Barrales) tenga rol 'Rigger' si aparece con otro rol
      const r7 = await pool.query(\`
        UPDATE \${schemaName}.tpry_rel_persona
        SET rol_asignado = 'Rigger'
        WHERE id_user = 13 AND rol_asignado != 'Rigger';
      \`);
      console.log('7. id_user 13 normalizado a "Rigger":', r7.rowCount);

      await pool.end();
    }

    async function main() {
      await reconcileSchema('sch_leangsp_prod', 'usr_leangsp_prod', 'usr_gsp_prod_2026!');
      await reconcileSchema('sch_leangsp', 'usr_leangsp', 'usr_gsp_123');
    }
    main().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  ssh.dispose();
}

run().catch(console.error);
