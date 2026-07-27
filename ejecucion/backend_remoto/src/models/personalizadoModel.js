const pool = require("../config/postgresPool");

class personalizadoModel {
    constructor(){
        this.pool = pool;
        this.pool.on('error', (err) => console.error(err));
    }

    async createPersonalizado(personalizadoData, userIds) {
        try {
            await this.pool.query('BEGIN');

            // 1. Insertar en tsrv_personalizados
            const insertPersonalizadoQuery = `
                INSERT INTO tsrv_personalizados (
                    id_empresa, id_empresa_cliente, id_user_creacion, id_proyecto, periodo, id_rol, cantidad_usuarios, 
                    fecha_inicio_plan, fecha_fin_plan
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE), COALESCE($9, CURRENT_DATE))
                RETURNING id_personalizado;
            `;
            
            // Se utiliza userIds.length para el campo 'cantidad_usuarios'
            const result = await this.pool.query(insertPersonalizadoQuery, [
                personalizadoData.id_empresa,
                personalizadoData.id_empresa_cliente,
                personalizadoData.id_user_creacion,
                personalizadoData.id_proyecto,
                personalizadoData.periodo,
                personalizadoData.id_rol,
                userIds.length, 
                personalizadoData.fecha_inicio_plan || null, // Permite NULL
                personalizadoData.fecha_fin_plan || null    // Permite NULL
            ]);

            const id_personalizado = result.rows[0].id_personalizado;

            console.log("id_personalizado===========================>",id_personalizado);

            // 2. Insertar en tsrv_personalizados_usuarios (si hay usuarios)
            if (userIds && userIds.length > 0) {
                let userInsertQuery = `INSERT INTO tsrv_personalizados_usuarios (id_personalizado, id_usuario) VALUES `;
                const userValues = [];
                let valueIndex = 1;

                // Construcción dinámica de la consulta para inserción múltiple
                userIds.forEach(userId => {
                    console.log("userId.id_user", userId.id_user);
                    // Usamos $N para los valores: $1=id_personalizado, $2=userId, $3=id_personalizado, $4=userId, etc.
                    userInsertQuery += `($${valueIndex++}, $${valueIndex++}),`;
                    userValues.push(id_personalizado, userId.id_user);
                });

                // Remover la coma final y ejecutar la consulta
                userInsertQuery = userInsertQuery.slice(0, -1) + ';';
                await this.pool.query(userInsertQuery, userValues);
            }

            await this.pool.query('COMMIT');
            return { id_personalizado, message: 'Personalizado creado exitosamente.' };

        } catch (error) {
            // En caso de error, se revierte la transacción
            await this.pool.query('ROLLBACK');
            console.error('ROLLBACK: La transacción de Personalizado ha fallado.', error);
            throw error;
        }
    }

    async updatePersonalizado(id, data) {
        // Implementación diferida, solo se registra un mensaje.
        console.log(`Función de actualización para Personalizado ID ${id} diferida. Datos:`, data);
        return { id_personalizado: id, message: 'Modificación de Personalizado diferida.' };
    }
}

module.exports = personalizadoModel;