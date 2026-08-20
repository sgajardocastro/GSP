const pool = require('../config/postgresPool');

// GET /api/proyectos/:id/asignaciones/personas
const getAsignacionesPersona = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
                rp.id_rel_persona,
                rp.id_user,
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

// POST /api/proyectos/:id/asignaciones/personas
const crearAsignacionPersona = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones } = req.body;
        
        const result = await pool.query(
            `INSERT INTO tpry_rel_persona 
            (id_proyecto, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, observaciones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [id, id_user, rol_asignado, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real || 'PROGRAMADO', id_user_creacion, observaciones]
        );
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
                p.nombre_proyecto,
                e.codigo_equipo,
                e.patente,
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

// POST /api/proyectos/:id/asignaciones/equipos
const crearAsignacionEquipo = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, json_field, observaciones } = req.body;
        
        const result = await pool.query(
            `INSERT INTO tpry_rel_equipo 
            (id_proyecto, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real, id_user_creacion, json_field, observaciones)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [id, id_equipo, rol_equipo, fecha_plan_ini, fecha_plan_fin, turnos_plan, horas_plan, estado_real || 'PROGRAMADO', id_user_creacion, json_field || {}, observaciones]
        );
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
            `SELECT COUNT(*) as total_personas FROM tpry_rel_persona WHERE id_proyecto = $1`, [id]
        );
        
        const eRes = await pool.query(
            `SELECT COUNT(*) as total_equipos FROM tpry_rel_equipo WHERE id_proyecto = $1`, [id]
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

module.exports = {
    getAsignacionesPersona,
    crearAsignacionPersona,
    eliminarAsignacionPersona,
    getAsignacionesEquipo,
    crearAsignacionEquipo,
    eliminarAsignacionEquipo,
    getResumenAsignacionesProyecto
};
