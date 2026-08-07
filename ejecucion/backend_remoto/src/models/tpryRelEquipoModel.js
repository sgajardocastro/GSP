const db = require('../database/connection'); // Asume que la conexión DB está aquí

const tpryRelEquipoModel = {
    async crearAsignacion(data) {
        const query = `
            INSERT INTO tpry_rel_equipo (
                id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin,
                turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones, json_field
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *;
        `;
        const values = [
            data.id_proyecto, data.id_equipo, data.rol_equipo, data.fecha_plan_ini, data.fecha_plan_fin,
            data.turnos_plan, data.horas_plan, data.estado_real || 'PROGRAMADO', data.id_user_creacion,
            data.observaciones, data.json_field || {}
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    async obtenerPorProyecto(idProyecto) {
        const query = `
            SELECT 
                re.id_rel_equipo,
                p.nombre_proyecto,
                e.codigo_equipo,
                e.patente,
                re.rol_equipo,
                re.fecha_plan_ini,
                re.fecha_plan_fin,
                re.estado_real,
                re.horas_plan,
                re.fecha_real_ini,
                re.fecha_real_fin,
                re.horas_reales,
                re.observaciones,
                re.json_field
            FROM tpry_rel_equipo re
            INNER JOIN tpry_proyecto p ON re.id_proyecto = p.id_proyecto
            INNER JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
            WHERE re.id_proyecto = $1
            ORDER BY re.fecha_plan_ini ASC;
        `;
        const result = await db.query(query, [idProyecto]);
        return result.rows;
    },

    async actualizarAsignacion(idRelEquipo, data) {
        const query = `
            UPDATE tpry_rel_equipo 
            SET 
                rol_equipo = COALESCE($1, rol_equipo),
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
            WHERE id_rel_equipo = $12
            RETURNING *;
        `;
        const values = [
            data.rol_equipo, data.fecha_plan_ini, data.fecha_plan_fin, data.turnos_plan,
            data.horas_plan, data.fecha_real_ini, data.fecha_real_fin, data.horas_reales,
            data.estado_real, data.observaciones, data.json_field, idRelEquipo
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    async eliminarAsignacion(idRelEquipo) {
        const query = `DELETE FROM tpry_rel_equipo WHERE id_rel_equipo = $1 RETURNING *;`;
        const result = await db.query(query, [idRelEquipo]);
        return result.rows[0];
    }
};

module.exports = tpryRelEquipoModel;
