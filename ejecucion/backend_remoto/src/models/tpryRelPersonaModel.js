const db = require('../database/connection'); // Asume que la conexión DB está aquí

const tpryRelPersonaModel = {
    async crearAsignacion(data) {
        const query = `
            INSERT INTO tpry_rel_persona (
                id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin,
                turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones, json_field
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *;
        `;
        const values = [
            data.id_proyecto, data.id_user, data.rol_asignado, data.fecha_plan_ini, data.fecha_plan_fin,
            data.turnos_plan, data.horas_plan, data.estado_real || 'PROGRAMADO', data.id_user_creacion,
            data.observaciones, data.json_field || {}
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    async obtenerPorProyecto(idProyecto) {
        const query = `
            SELECT 
                rp.id_rel_persona,
                p.nombre_proyecto,
                u.name_frst || ' ' || u.apellido_pat AS nombre_completo,
                rp.rol_asignado,
                rp.fecha_plan_ini,
                rp.fecha_plan_fin,
                rp.estado_real,
                rp.horas_plan,
                rp.fecha_real_ini,
                rp.fecha_real_fin,
                rp.horas_reales,
                rp.observaciones,
                rp.json_field
            FROM tpry_rel_persona rp
            INNER JOIN tpry_proyecto p ON rp.id_proyecto = p.id_proyecto
            INNER JOIN tsec_users u ON rp.id_user = u.id_user
            WHERE rp.id_proyecto = $1
            ORDER BY rp.fecha_plan_ini ASC;
        `;
        const result = await db.query(query, [idProyecto]);
        return result.rows;
    },

    async actualizarAsignacion(idRelPersona, data) {
        const query = `
            UPDATE tpry_rel_persona 
            SET 
                rol_asignado = COALESCE($1, rol_asignado),
                fecha_plan_ini = COALESCE($2, fecha_plan_ini),
                fecha_plan_fin = COALESCE($3, fecha_plan_fin),
                turnos_plan = COALESCE($4, turnos_plan),
                horas_plan = COALESCE($5, horas_plan),
                fecha_real_ini = COALESCE($6, fecha_real_ini),
                fecha_real_fin = COALESCE($7, fecha_real_fin),
                horas_reales = COALESCE($8, horas_reales),
                estado_real = COALESCE($9, estado_real),
                observaciones = COALESCE($10, observaciones),
                json_field = COALESCE($11, json_field),
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_rel_persona = $12
            RETURNING *;
        `;
        const values = [
            data.rol_asignado, data.fecha_plan_ini, data.fecha_plan_fin, data.turnos_plan,
            data.horas_plan, data.fecha_real_ini, data.fecha_real_fin, data.horas_reales,
            data.estado_real, data.observaciones, data.json_field, idRelPersona
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    async eliminarAsignacion(idRelPersona) {
        const query = `DELETE FROM tpry_rel_persona WHERE id_rel_persona = $1 RETURNING *;`;
        const result = await db.query(query, [idRelPersona]);
        return result.rows[0];
    }
};

module.exports = tpryRelPersonaModel;
