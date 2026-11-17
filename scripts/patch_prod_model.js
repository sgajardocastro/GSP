const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let content = execSync('git show main:ejecucion/backend_remoto/src/models/proyectoModel.js', { maxBuffer: 10*1024*1024 }).toString('utf8');

const target = `      // REQ-1105 / SPEC-22: Sincronización relacional proactiva hacia tpry_rel_persona si existen operadores asignados en servicios
      const { rows: testPersCount } = await client.query('SELECT COUNT(*)::int as total FROM tpry_rel_persona WHERE id_proyecto = $1', [id_proyecto]);
      if (testPersCount[0]?.total === 0) {
        const poolSync = [];
        const serviciosList = crm.servicios || jsonField.servicios || [];
        serviciosList.forEach(s => {
          const esTrans = (s.linea_servicio || '').toUpperCase().includes('TRANSP') || (s.tipo || '').toUpperCase().includes('CAMION');
          const rol = esTrans ? 'Chofer Transporte' : 'Operador Grúa';
          if (s.operador_asignado_id && !poolSync.some(p => p.id_user === Number(s.operador_asignado_id))) {
            poolSync.push({ id_user: Number(s.operador_asignado_id), rol_asignado: rol });
          }
          if (Array.isArray(s.turnos_operadores)) {
            s.turnos_operadores.forEach(t => {
              if (t.operador_id && !poolSync.some(p => p.id_user === Number(t.operador_id))) {
                poolSync.push({ id_user: Number(t.operador_id), rol_asignado: rol, f_ini: t.fecha_ini, f_fin: t.fecha_fin });
              }
            });
          }
        });
        if (ejec.operador_id && !poolSync.some(p => p.id_user === Number(ejec.operador_id))) {
          poolSync.push({ id_user: Number(ejec.operador_id), rol_asignado: 'Operador Grúa' });
        }
        if (ejec.chofer_id && !poolSync.some(p => p.id_user === Number(ejec.chofer_id))) {
          poolSync.push({ id_user: Number(ejec.chofer_id), rol_asignado: 'Chofer Transporte' });
        }
        for (const ps of poolSync) {
          await client.query(\`
            INSERT INTO tpry_rel_persona (
              id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, estado_real, id_user_creacion
            ) VALUES ($1, $2, $3, COALESCE($4, NOW()), COALESCE($5, NOW()), 'PROGRAMADO', $6)
          \`, [id_proyecto, ps.id_user, ps.rol_asignado, ps.f_ini ? new Date(ps.f_ini) : null, ps.f_fin ? new Date(ps.f_fin) : null, p.id_user_creacion || 1]);
        }
      }`;

const replacement = `      // REQ-1184 / SPEC-135: Sincronización Atómica y Purgado de Huérfanos/Fantasmas en tpry_rel_persona
      const tripulacionOficial = Array.isArray(ejec.tripulacion_asignada) ? ejec.tripulacion_asignada : [];
      if (tripulacionOficial.length > 0) {
        const uidsValidos = tripulacionOficial.map(t => Number(t.id_user)).filter(Boolean);
        if (uidsValidos.length > 0) {
          // Marcar como REEMPLAZADO a cualquier persona en BD que ya no pertenezca a la tripulación oficial
          await client.query(\`
            UPDATE tpry_rel_persona 
            SET estado_real = 'REEMPLAZADO' 
            WHERE id_proyecto = $1 
              AND id_user != ALL($2::int[])
              AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO', 'FINALIZADO')
          \`, [id_proyecto, uidsValidos]);

          // Asegurar que cada miembro de la tripulación oficial exista en tpry_rel_persona
          for (const t of tripulacionOficial) {
            const uId = Number(t.id_user);
            if (!uId) continue;
            const rol = t.cargo || t.rol_asignado || 'Personal Asignado';
            const fIni = t.fecha_plan_ini ? new Date(t.fecha_plan_ini) : null;
            const fFin = t.fecha_plan_fin ? new Date(t.fecha_plan_fin) : null;
            const { rows: pExist } = await client.query(\`
              SELECT id_rel_persona FROM tpry_rel_persona 
              WHERE id_proyecto = $1 AND id_user = $2 AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
              LIMIT 1
            \`, [id_proyecto, uId]);
            if (pExist.length > 0) {
              await client.query(\`
                UPDATE tpry_rel_persona 
                SET rol_asignado = $1, estado_real = 'PROGRAMADO'
                WHERE id_rel_persona = $2
              \`, [rol, pExist[0].id_rel_persona]);
            } else {
              await client.query(\`
                INSERT INTO tpry_rel_persona (
                  id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, estado_real, id_user_creacion
                ) VALUES ($1, $2, $3, COALESCE($4, NOW()), COALESCE($5, NOW()), 'PROGRAMADO', $6)
              \`, [id_proyecto, uId, rol, fIni, fFin, p.id_user_creacion || 1]);
            }
          }
        }
      } else {
        // REQ-1105 / SPEC-22: Sincronización relacional proactiva hacia tpry_rel_persona si existen operadores asignados en servicios
        const { rows: testPersCount } = await client.query('SELECT COUNT(*)::int as total FROM tpry_rel_persona WHERE id_proyecto = $1', [id_proyecto]);
        if (testPersCount[0]?.total === 0) {
          const poolSync = [];
          const serviciosList = crm.servicios || jsonField.servicios || [];
          serviciosList.forEach(s => {
            const esTrans = (s.linea_servicio || '').toUpperCase().includes('TRANSP') || (s.tipo || '').toUpperCase().includes('CAMION');
            const rol = esTrans ? 'Chofer Transporte' : 'Operador Grúa';
            if (s.operador_asignado_id && !poolSync.some(p => p.id_user === Number(s.operador_asignado_id))) {
              poolSync.push({ id_user: Number(s.operador_asignado_id), rol_asignado: rol });
            }
            if (Array.isArray(s.turnos_operadores)) {
              s.turnos_operadores.forEach(t => {
                if (t.operador_id && !poolSync.some(p => p.id_user === Number(t.operador_id))) {
                  poolSync.push({ id_user: Number(t.operador_id), rol_asignado: rol, f_ini: t.fecha_ini, f_fin: t.fecha_fin });
                }
              });
            }
          });
          if (ejec.operador_id && !poolSync.some(p => p.id_user === Number(ejec.operador_id))) {
            poolSync.push({ id_user: Number(ejec.operador_id), rol_asignado: 'Operador Grúa' });
          }
          if (ejec.chofer_id && !poolSync.some(p => p.id_user === Number(ejec.chofer_id))) {
            poolSync.push({ id_user: Number(ejec.chofer_id), rol_asignado: 'Chofer Transporte' });
          }
          for (const ps of poolSync) {
            await client.query(\`
              INSERT INTO tpry_rel_persona (
                id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, estado_real, id_user_creacion
              ) VALUES ($1, $2, $3, COALESCE($4, NOW()), COALESCE($5, NOW()), 'PROGRAMADO', $6)
            \`, [id_proyecto, ps.id_user, ps.rol_asignado, ps.f_ini ? new Date(ps.f_ini) : null, ps.f_fin ? new Date(ps.f_fin) : null, p.id_user_creacion || 1]);
          }
        }
      }`;

if (!content.includes(target)) {
  console.error('Target not found in main proyectoModel!');
  process.exit(1);
}

const patched = content.replace(target, replacement);
const outputPath = path.resolve(__dirname, 'proyectoModel_prod_patched.js');
fs.writeFileSync(outputPath, patched, 'utf8');
console.log('Patched file written to:', outputPath);
