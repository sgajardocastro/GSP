const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function applyRelationalShieldReportDiario() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const filePath = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js';
  const getFile = await ssh.execCommand(`cat ${filePath}`);
  let code = getFile.stdout;

  // 1. In regularizarReporteManual:
  // Before inserting, check if (id_proyecto, dia_correlativo, finalEqId) already exists
  // Also resolve finalEqId by fecha_reporte from tpry_rel_equipo if not supplied!
  
  console.log('Inspecting target for regularizarReporteManual...');
  const targetRegex = /let finalEqId = parseInt\(id_equipo, 10\) \|\| null;\s+if \(!finalEqId\) \{\s+const eqRes = await db\.query\('SELECT id_equipo FROM tpry_rel_equipo WHERE id_proyecto = \$1 LIMIT 1', \[id_proyecto\]\);\s+finalEqId = eqRes\.rows\[0\]\?\.id_equipo \|\| null;\s+\}/;

  if (targetRegex.test(code)) {
    console.log('Target found! Replacing with relational date-aware equipment resolution...');
    code = code.replace(targetRegex, `let finalEqId = parseInt(id_equipo, 10) || null;
      if (!finalEqId) {
        // SPEC-136: Resolver equipo programado estrictamente por la fecha de la jornada
        const eqFechaRes = await db.query(
          \`SELECT re.id_equipo FROM tpry_rel_equipo re
           WHERE re.id_proyecto = $1 
             AND re.estado_real = 'PROGRAMADO'
             AND (
               ($2::date BETWEEN re.fecha_plan_ini::date AND re.fecha_plan_fin::date)
               OR re.fecha_plan_ini IS NULL
             )
           ORDER BY re.fecha_plan_ini DESC LIMIT 1\`,
          [id_proyecto, fecha_reporte]
        );
        finalEqId = eqFechaRes.rows[0]?.id_equipo || null;
        if (!finalEqId) {
          const eqFallback = await db.query(
            "SELECT id_equipo FROM tpry_rel_equipo WHERE id_proyecto = $1 AND estado_real = 'PROGRAMADO' ORDER BY fecha_plan_ini ASC LIMIT 1",
            [id_proyecto]
          );
          finalEqId = eqFallback.rows[0]?.id_equipo || null;
        }
      }`);
  } else {
    console.warn('Could not match targetRegex in code!');
  }

  // 2. Add Duplicity Check in regularizarReporteManual:
  // Check if a report for (id_proyecto, dia_correlativo, finalEqId) already exists!
  const targetInsert = /const insSql = `\s+INSERT INTO tedp_reporte_avance \(/;
  if (targetInsert.test(code)) {
    console.log('Target insert found! Adding duplicity check and idempotency...');
    code = code.replace(targetInsert, `// SPEC-136: Candado de Unicidad Anti-Duplicados en Regularización
      const preexistente = await db.query(
        "SELECT id_reporte_avance, id_equipo, dia_correlativo, estado_reporte FROM tedp_reporte_avance WHERE id_proyecto = $1 AND dia_correlativo = $2 AND estado_reporte != 'ANULADO' LIMIT 1",
        [id_proyecto, diaCorr]
      );
      if (preexistente.rows.length > 0) {
        const pRow = preexistente.rows[0];
        // Si ya existe reporte para ese dia, actualizar en lugar de clonar
        const upSql = \`
          UPDATE tedp_reporte_avance SET
            id_equipo = COALESCE($2, id_equipo),
            id_user_operador = COALESCE($3, id_user_operador),
            id_user_rigger = COALESCE($4, id_user_rigger),
            fecha_reporte = $5,
            fecha_inicio_servicio = $6,
            fecha_termino_servicio = $7,
            horas_operadas = $8,
            horas_facturables = $9,
            horas_sobretiempo = $10,
            horas_colacion = $11,
            horas_minimas = $12,
            horometro_inicio = COALESCE($13, horometro_inicio),
            horometro_termino = COALESCE($14, horometro_termino),
            odometro_inicio = COALESCE($15, odometro_inicio),
            odometro_termino = COALESCE($16, odometro_termino),
            cliente_nombre = COALESCE($17, cliente_nombre),
            cliente_cargo = COALESCE($18, cliente_cargo),
            observacion_trabajo = COALESCE($19, observacion_trabajo),
            estado_reporte = $20,
            estado_jornada = $21,
            id_doc_pdf = COALESCE($22, id_doc_pdf),
            ajustes_analista = $23,
            fecha_validacion = COALESCE($24, fecha_validacion)
          WHERE id_reporte_avance = $1
          RETURNING *;
        \`;
        const resUpdate = await db.query(upSql, [
          pRow.id_reporte_avance,
          finalEqId,
          finalOpId,
          finalRiggerId,
          fecha_reporte,
          tsIni,
          tsFin,
          operadas,
          facturables,
          sobretiempo,
          colac,
          minimas,
          horometro_inicio || null,
          tieneTerminoReal ? (horometro_termino || null) : null,
          odometro_inicio || null,
          tieneTerminoReal ? (odometro_termino || null) : null,
          cliente_nombre || 'Cliente Mandante',
          cliente_cargo || 'Supervisor Faena',
          observacion_trabajo || 'Reporte regularizado físicamente',
          estadoReporte,
          estadoJornada,
          idDocFinal,
          JSON.stringify(ajustesAnalista),
          tieneDoc ? new Date().toISOString() : null
        ]);
        return res.json({
          success: true,
          message: 'Jornada ya existente actualizada exitosamente (Anti-Duplicidad SPEC-136)',
          reporte: resUpdate.rows[0],
          actualizado: true
        });
      }

      const insSql = \`
        INSERT INTO tedp_reporte_avance (`
    );
  }

  // Backup and save
  await ssh.execCommand(`cp ${filePath} ${filePath}.bak_spec136`);
  await ssh.execCommand(`cat << 'EOF' > ${filePath}\n` + code + `\nEOF`);
  console.log('reportDiarioController updated successfully.');

  // Restart PM2 ID 13
  const restart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 RESTART:\n', restart.stdout);

  ssh.dispose();
}

applyRelationalShieldReportDiario().catch(console.error);
