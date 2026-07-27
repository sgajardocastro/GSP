const personalizadoModel = require('../models/personalizadoModel');
const personalizadoM = new personalizadoModel();

/**
 * Crea un nuevo Personalizado y asocia sus usuarios.
 * Espera un cuerpo JSON con la estructura: 
 * { 
 * "personalizado": { ...datos de tsrv_personalizados... }, 
 * "userIds": [id1, id2, ...] 
 * }
 */
module.exports = {
createPersonalizado: async (req, res) => {
    const { personalizado, userIds } = req.body;
    console.log("Datos personalizados", req.body);
    // Validación de datos mínimos requeridos
    if (!personalizado || 
        !personalizado.id_empresa || 
        !personalizado.id_empresa_cliente || 
        !personalizado.id_user_creacion || 
        !personalizado.id_proyecto || 
        !personalizado.periodo || 
        !personalizado.id_rol || 
        !Array.isArray(userIds)) {
        
        return res.status(400).json({ error: 'Faltan datos obligatorios (id_empresa, id_empresa_cliente, id_user_creacion, id_proyecto, periodo, id_rol, userIds) para crear el Personalizado.' });
    }

    try {
        const result = await personalizadoM.createPersonalizado(personalizado, userIds);
        res.status(201).json(result);
    } catch (error) {
        // El error ya fue manejado por el ROLLBACK en el modelo
        console.error('Error en el controlador al crear Personalizado:', error.message);
        res.status(500).json({ error: 'No fue posible crear el Personalizado. Revise los datos e integridad de FKs.' });
    }
},

/**
 * Modificación de un Personalizado (Lógica diferida).
 */
updatePersonalizado: async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    try {
        const result = await personalizadoM.updatePersonalizado(id, data);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error en el controlador al modificar Personalizado:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al modificar el Personalizado.' });
    }
}

};