const pool = require('../config/postgresPool');

// GET /api/proyectos/:id/asignaciones/personas
const getAsignacionesPersona = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
                rp.id_rel_persona,
                rp.id_user,
                rp.id_linea_servicio,
                p.nombre_proyecto,
                u.name_frst || ' ' || u.apellido_pat AS nombre_completo,
                rp.rol_asignado,
                rp.fecha_plan_ini,
                rp.fecha_plan_fin,
                rp.estado_real
            FROM 
                tpry_rel_persona rp
            INNER JOIN tpry_proyecto p ON rp.id_proyecto = p.id_proyecto
            INNER JOIN tsec_users u ON rp.id_user = u.id_user
            WHERE 
                rp.id_proyecto = $1
                AND COALESCE(rp.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
            ORDER BY 
                rp.fecha_plan_ini ASC`,
            [id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener asignaciones de personas:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener asignaciones de personas.' });
    }
};

// POST /api/proyectos/:id/asignaciones/personas (Idempotente)
const crearAsignacionPersona = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_user, rol_asignado, id_linea_servicio, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones } = req.body;

        const userCheck = await pool.query(
            `SELECT activo, name_frst, apellido_pat FROM tsec_users WHERE id_user = $1`,
            [id_user]
        );
        if (userCheck.rowCount === 0 || userCheck.rows[0].activo === false) {
            return res.status(400).json({ error: 'No se puede asignar un usuario inactivo o inexistente.' });
        }

        const existente = await pool.query(
            `SELECT id_rel_persona FROM tpry_rel_persona 
             WHERE id_proyecto = $1 AND id_user = $2 AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')`,
            [id, id_user]
        );

        let result;
        if (existente.rows.length > 0) {
            result = await pool.query(
                `UPDATE tpry_rel_persona 
                 SET rol_asignado = $1, fecha_plan_ini = $2, fecha_plan_fin = $3, 
                     turnos_plan = $4, horas_plan = $5, observaciones = $6,
                     id_linea_servicio = COALESCE($7, id_linea_servicio)
                 WHERE id_rel_persona = $8
                 RETURNING *`,
                [rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, observaciones, id_linea_servicio || null, existente.rows[0].id_rel_persona]
            );
        } else {
            result = await pool.query(
                `INSERT INTO tpry_rel_persona 
                (id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones, id_linea_servicio)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *`,
                [id, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real || 'PROGRAMADO', id_user_creacion, observaciones, id_linea_servicio || null]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear asignación de persona:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear asignación de persona.' });
    }
};

// DELETE /api/proyectos/:id/asignaciones/personas/:id_rel_persona
const eliminarAsignacionPersona = async (req, res) => {
    try {
        const { id_rel_persona } = req.params;
        
        const result = await pool.query(
            `DELETE FROM tpry_rel_persona WHERE id_rel_persona = $1 RETURNING *`,
            [id_rel_persona]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada.' });
        }
        
        res.status(200).json({ message: 'Asignación eliminada exitosamente.', data: result.rows[0] });
    } catch (error) {
        console.error('Error al eliminar asignación de persona:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar asignación de persona.' });
    }
};

// GET /api/proyectos/:id/asignaciones/equipos
const getAsignacionesEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
                re.id_rel_equipo,
                re.id_equipo,
                re.id_linea_servicio,
                p.nombre_proyecto,
                e.codigo_interno AS codigo_equipo,
                e.patente,
                e.marca,
                e.modelo,
                re.rol_equipo,
                re.fecha_plan_ini,
                re.fecha_plan_fin,
                re.estado_real
            FROM 
                tpry_rel_equipo re
            INNER JOIN tpry_proyecto p ON re.id_proyecto = p.id_proyecto
            INNER JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
            WHERE 
                re.id_proyecto = $1
                AND COALESCE(re.estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
            ORDER BY 
                re.fecha_plan_ini ASC`,
            [id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener asignaciones de equipos:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener asignaciones de equipos.' });
    }
};

// POST /api/proyectos/:id/asignaciones/equipos (Idempotente)
const crearAsignacionEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_equipo, rol_equipo, id_linea_servicio, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, json_field, observaciones } = req.body;
        
        const existente = await pool.query(
            `SELECT id_rel_equipo FROM tpry_rel_equipo 
             WHERE id_proyecto = $1 AND id_equipo = $2 AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')`,
            [id, id_equipo]
        );

        let result;
        if (existente.rows.length > 0) {
            result = await pool.query(
                `UPDATE tpry_rel_equipo 
                 SET rol_equipo = $1, fecha_plan_ini = $2, fecha_plan_fin = $3, 
                     turnos_plan = $4, horas_plan = $5, json_field = $6, observaciones = $7,
                     id_linea_servicio = COALESCE($8, id_linea_servicio)
                 WHERE id_rel_equipo = $9
                 RETURNING *`,
                [rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, json_field || {}, observaciones, id_linea_servicio || null, existente.rows[0].id_rel_equipo]
            );
        } else {
            result = await pool.query(
                `INSERT INTO tpry_rel_equipo 
                (id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, json_field, observaciones, id_linea_servicio)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [id, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real || 'PROGRAMADO', id_user_creacion, json_field || {}, observaciones, id_linea_servicio || null]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear asignación de equipo:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear asignación de equipo.' });
    }
};

// DELETE /api/proyectos/:id/asignaciones/equipos/:id_rel_equipo
const eliminarAsignacionEquipo = async (req, res) => {
    try {
        const { id_rel_equipo } = req.params;
        
        const result = await pool.query(
            `DELETE FROM tpry_rel_equipo WHERE id_rel_equipo = $1 RETURNING *`,
            [id_rel_equipo]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada.' });
        }
        
        res.status(200).json({ message: 'Asignación eliminada exitosamente.', data: result.rows[0] });
    } catch (error) {
        console.error('Error al eliminar asignación de equipo:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar asignación de equipo.' });
    }
};

// GET /api/proyectos/:id/asignaciones/resumen
const getResumenAsignacionesProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        
        const pRes = await pool.query(
            `SELECT COUNT(*) as total_personas 
             FROM tpry_rel_persona 
             WHERE id_proyecto = $1 
               AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')`,
            [id]
        );
        
        const eRes = await pool.query(
            `SELECT COUNT(*) as total_equipos 
             FROM tpry_rel_equipo 
             WHERE id_proyecto = $1 
               AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')`,
            [id]
        );
        
        res.status(200).json({
            id_proyecto: id,
            total_personas: parseInt(pRes.rows[0].total_personas, 10),
            total_equipos: parseInt(eRes.rows[0].total_equipos, 10)
        });
    } catch (error) {
        console.error('Error al obtener resumen de asignaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener resumen.' });
    }
};

// POST /api/proyectos/:id/asignaciones/sincronizar
const sincronizarAsignacionesProyecto = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { id_user_creacion, personas = [], equipos = [] } = req.body;

        await client.query('BEGIN');

        // a) Validar líneas de servicio válidas en este proyecto
        let lineasValidas = new Set();
        try {
            await client.query('SAVEPOINT sp_lineas');
            const lineasRes = await client.query(
                `SELECT id_linea_servicio FROM tpry_linea_servicio WHERE id_proyecto = $1`,
                [id]
            );
            lineasRes.rows.forEach(r => {
                if (r.id_linea_servicio !== null && r.id_linea_servicio !== undefined) {
                    lineasValidas.add(Number(r.id_linea_servicio));
                }
            });
            await client.query('RELEASE SAVEPOINT sp_lineas');
        } catch (errLineas) {
            await client.query('ROLLBACK TO SAVEPOINT sp_lineas');
            lineasValidas = new Set();
        }

        // b) Upsert sobre tpry_rel_equipo
        // Deduplicar equipos por (id_equipo, COALESCE(id_linea_servicio, 0)) para prevenir colisión uq_tpry_rel_equipo_linea_activo
        const equiposMap = new Map();
        for (const rawEq of equipos) {
            if (!rawEq || !rawEq.id_equipo) continue;
            const lineaEq = (rawEq.id_linea_servicio && lineasValidas.has(Number(rawEq.id_linea_servicio)))
                ? Number(rawEq.id_linea_servicio)
                : null;
            const k = `${rawEq.id_equipo}_${lineaEq || 0}`;
            equiposMap.set(k, { ...rawEq, _lineaEq: lineaEq });
        }
        const equiposDeduplicados = Array.from(equiposMap.values());

        const equiposVigentesIds = [];
        for (const eq of equiposDeduplicados) {
            const lineaEq = eq._lineaEq;

            const eqExistente = await client.query(
                `SELECT id_rel_equipo FROM tpry_rel_equipo 
                 WHERE id_proyecto = $1 AND id_equipo = $2 
                   AND COALESCE(id_linea_servicio, 0) = COALESCE($3, 0)
                   AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
                   AND NOT (id_rel_equipo = ANY($4::int[]))
                 ORDER BY id_rel_equipo ASC LIMIT 1`,
                [id, eq.id_equipo, lineaEq, equiposVigentesIds]
            );

            let idRelEq;
            if (eqExistente.rows.length > 0) {
                idRelEq = eqExistente.rows[0].id_rel_equipo;
                await client.query(
                    `UPDATE tpry_rel_equipo 
                     SET rol_equipo = $1, fecha_plan_ini = $2, fecha_plan_fin = $3, 
                         turnos_plan = $4, horas_plan = $5, json_field = $6, observaciones = $7,
                         id_linea_servicio = $8,
                         estado_real = CASE WHEN estado_real IN ('CANCELADO', 'REEMPLAZADO') THEN 'PROGRAMADO' ELSE COALESCE(estado_real, 'PROGRAMADO') END
                     WHERE id_rel_equipo = $9`,
                    [
                        eq.rol_equipo || 'PRINCIPAL',
                        eq.fecha_plan_ini || null,
                        eq.fecha_plan_fin || null,
                        eq.turnos_plan || 1,
                        eq.horas_plan || null,
                        eq.json_field || {},
                        eq.observaciones || null,
                        lineaEq,
                        idRelEq
                    ]
                );
            } else {
                const insEq = await client.query(
                    `INSERT INTO tpry_rel_equipo 
                    (id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, json_field, observaciones, id_linea_servicio)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'PROGRAMADO', $8, $9, $10, $11)
                    RETURNING id_rel_equipo`,
                    [
                        id,
                        eq.id_equipo,
                        eq.rol_equipo || 'PRINCIPAL',
                        eq.fecha_plan_ini || null,
                        eq.fecha_plan_fin || null,
                        eq.turnos_plan || 1,
                        eq.horas_plan || null,
                        id_user_creacion || null,
                        eq.json_field || {},
                        eq.observaciones || null,
                        lineaEq
                    ]
                );
                idRelEq = insEq.rows[0].id_rel_equipo;
            }
            equiposVigentesIds.push(idRelEq);
        }

        // c) Marcar con estado_real = 'REEMPLAZADO' cualquier otra fila activa de tpry_rel_equipo
        let reemplazadosEqRes;
        if (equiposVigentesIds.length > 0) {
            reemplazadosEqRes = await client.query(
                `UPDATE tpry_rel_equipo 
                 SET estado_real = 'REEMPLAZADO' 
                 WHERE id_proyecto = $1 
                   AND id_rel_equipo != ALL($2::int[])
                   AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO', 'FINALIZADO')
                 RETURNING id_rel_equipo, id_equipo`,
                [id, equiposVigentesIds]
            );
        } else {
            reemplazadosEqRes = await client.query(
                `UPDATE tpry_rel_equipo 
                 SET estado_real = 'REEMPLAZADO' 
                 WHERE id_proyecto = $1 
                   AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO', 'FINALIZADO')
                 RETURNING id_rel_equipo, id_equipo`,
                [id]
            );
        }
        const equiposReemplazados = reemplazadosEqRes.rows;

        // d) Cancelar viajes huérfanos no iniciados para equipos reemplazados que no sigan activos
        const activosEquiposRes = await client.query(
            `SELECT DISTINCT id_equipo FROM tpry_rel_equipo 
             WHERE id_proyecto = $1 AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')`,
            [id]
        );
        const idsEquiposActivos = activosEquiposRes.rows.map(r => Number(r.id_equipo));
        const idsEquiposHuerfanos = [...new Set(equiposReemplazados.map(r => Number(r.id_equipo)))]
            .filter(eqId => !idsEquiposActivos.includes(eqId));

        if (idsEquiposHuerfanos.length > 0) {
            try {
                await client.query('SAVEPOINT sp_viajes');
                await client.query(
                    `UPDATE tequ_log_desplazamiento 
                     SET estado_viaje = 'CANCELADO' 
                     WHERE id_proyecto = $1 
                       AND id_equipo = ANY($2::int[]) 
                       AND hora_salida_patio IS NULL 
                       AND COALESCE(estado_viaje, 'PENDIENTE') IN ('PENDIENTE', 'PROGRAMADO')`,
                    [id, idsEquiposHuerfanos]
                );
                await client.query('RELEASE SAVEPOINT sp_viajes');
            } catch (errViajes) {
                await client.query('ROLLBACK TO SAVEPOINT sp_viajes');
            }
        }

        // e) Upsert de personas soportando ventanas de relevo (turnos_operadores)
        const personasVigentesIds = [];
        for (const p of personas) {
            if (!p || !p.id_user) continue;
            const lineaP = (p.id_linea_servicio && lineasValidas.has(Number(p.id_linea_servicio)))
                ? Number(p.id_linea_servicio)
                : null;

            const conteoUserEnPayload = personas.filter(x => Number(x.id_user) === Number(p.id_user)).length;
            let personaExistente;

            if (conteoUserEnPayload > 1) {
                personaExistente = await client.query(
                    `SELECT id_rel_persona FROM tpry_rel_persona 
                     WHERE id_proyecto = $1 
                       AND id_user = $2 
                       AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
                       AND (fecha_plan_ini IS NOT DISTINCT FROM $3)
                     LIMIT 1`,
                    [id, p.id_user, p.fecha_plan_ini || null]
                );
            } else {
                personaExistente = await client.query(
                    `SELECT id_rel_persona FROM tpry_rel_persona 
                     WHERE id_proyecto = $1 
                       AND id_user = $2 
                       AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO')
                     ORDER BY (fecha_plan_ini IS NOT DISTINCT FROM $3) DESC, id_rel_persona ASC 
                     LIMIT 1`,
                    [id, p.id_user, p.fecha_plan_ini || null]
                );
            }

            let idRelPersona;
            if (personaExistente.rows.length > 0) {
                idRelPersona = personaExistente.rows[0].id_rel_persona;
                await client.query(
                    `UPDATE tpry_rel_persona 
                     SET rol_asignado = $1, fecha_plan_ini = $2, fecha_plan_fin = $3, 
                         turnos_plan = $4, horas_plan = $5, observaciones = $6,
                         id_linea_servicio = $7,
                         estado_real = CASE WHEN estado_real IN ('CANCELADO', 'REEMPLAZADO') THEN 'PROGRAMADO' ELSE COALESCE(estado_real, 'PROGRAMADO') END
                     WHERE id_rel_persona = $8`,
                    [
                        p.rol_asignado || 'OPERADOR',
                        p.fecha_plan_ini || null,
                        p.fecha_plan_fin || null,
                        p.turnos_plan || 1,
                        p.horas_plan || null,
                        p.observaciones || null,
                        lineaP,
                        idRelPersona
                    ]
                );
            } else {
                const insP = await client.query(
                    `INSERT INTO tpry_rel_persona 
                    (id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones, id_linea_servicio)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'PROGRAMADO', $8, $9, $10)
                    RETURNING id_rel_persona`,
                    [
                        id,
                        p.id_user,
                        p.rol_asignado || 'OPERADOR',
                        p.fecha_plan_ini || null,
                        p.fecha_plan_fin || null,
                        p.turnos_plan || 1,
                        p.horas_plan || null,
                        id_user_creacion || null,
                        p.observaciones || null,
                        lineaP
                    ]
                );
                idRelPersona = insP.rows[0].id_rel_persona;
            }
            personasVigentesIds.push(idRelPersona);
        }

        // f) Marcar con estado_real = 'REEMPLAZADO' cualquier otra fila activa de tpry_rel_persona
        let reemplazadosPerRes;
        if (personasVigentesIds.length > 0) {
            reemplazadosPerRes = await client.query(
                `UPDATE tpry_rel_persona 
                 SET estado_real = 'REEMPLAZADO' 
                 WHERE id_proyecto = $1 
                   AND id_rel_persona != ALL($2::int[])
                   AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO', 'FINALIZADO')
                 RETURNING id_rel_persona, id_user`,
                [id, personasVigentesIds]
            );
        } else {
            reemplazadosPerRes = await client.query(
                `UPDATE tpry_rel_persona 
                 SET estado_real = 'REEMPLAZADO' 
                 WHERE id_proyecto = $1 
                   AND COALESCE(estado_real, 'PROGRAMADO') NOT IN ('CANCELADO', 'REEMPLAZADO', 'FINALIZADO')
                 RETURNING id_rel_persona, id_user`,
                [id]
            );
        }
        const personasReemplazadas = reemplazadosPerRes.rows;

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            equipos_vigentes: equiposVigentesIds,
            personas_vigentes: personasVigentesIds,
            equipos_reemplazados: equiposReemplazados,
            personas_reemplazadas: personasReemplazadas
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al sincronizar asignaciones del proyecto:', error);
        return res.status(500).json({ error: 'Error interno del servidor al sincronizar asignaciones.' });
    } finally {
        client.release();
    }
};

module.exports = {
    getAsignacionesPersona,
    crearAsignacionPersona,
    eliminarAsignacionPersona,
    getAsignacionesEquipo,
    crearAsignacionEquipo,
    eliminarAsignacionEquipo,
    getResumenAsignacionesProyecto,
    sincronizarAsignacionesProyecto
};
