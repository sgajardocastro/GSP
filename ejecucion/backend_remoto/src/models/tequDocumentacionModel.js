const pool = require("../config/postgresPool");

class TequDocumentacionModel {
    constructor() {
        this.pool = pool;
        this.pool.on("error", (err) => console.error(err));
    }

    async getDocumentacionByEquipoId(id_equipo) {
        try {
            const sql = `
        SELECT * 
        FROM TEQU_DOCUMENTACION_EQUIPO 
        WHERE id_equipo = $1
        ORDER BY fecha_prox_calibracion ASC
      `;
            const respuesta = await this.pool.query(sql, [id_equipo]);
            return respuesta.rows;
        } catch (err) {
            console.error("Error en getDocumentacionByEquipoId:", err);
            throw new Error("Error al obtener documentación");
        }
    }

    async createDocumentacion(data) {
        const {
            id_equipo,
            registro_acreditacion,
            fecha_ult_calibracion,
            fecha_prox_calibracion,
            documentos_adjuntos,
            fotografias,
            observacion_registro,
            id_usuario_registro,
            id_usuario_responsable,
            json_data
        } = data;

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Insert documentation
            const sqlInsert = `
          INSERT INTO TEQU_DOCUMENTACION_EQUIPO (
            id_equipo,
            registro_acreditacion,
            fecha_ult_calibracion,
            fecha_prox_calibracion,
            documentos_adjuntos,
            fotografias,
            observacion_registro,
            id_usuario_registro,
            id_usuario_responsable,
            json_data
          ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10::jsonb)
          RETURNING *
        `;

            const { rows } = await client.query(sqlInsert, [
                id_equipo,
                registro_acreditacion,
                fecha_ult_calibracion,
                fecha_prox_calibracion,
                JSON.stringify(documentos_adjuntos || []),
                JSON.stringify(fotografias || []),
                observacion_registro,
                id_usuario_registro,
                id_usuario_responsable,
                JSON.stringify(json_data || {})
            ]);

            const newDoc = rows[0];

            // 2. Business Rule: Check locking logic
            // If fecha_prox_calibracion < CURRENT_DATE, update equipment state to 'Cerrado'
            // Logic: if ANY documentation is expired, block equipment? 
            // Or strictly: "Si para un id_equipo existe al menos un registro... donde CURRENT_DATE > fecha_prox_calibracion"

            // Let's check if the *newly inserted* documentation causes a lock, or if we should re-eval all docs for this equipment.
            // The safest is to check if THIS specific document is expired OR if any other is expired.
            // But specifically, if we insert an expired document, we must close the equipment.

            // Check if ANY active documentation is expired for this equipment
            const sqlCheckExpired = `
            SELECT 1 
            FROM TEQU_DOCUMENTACION_EQUIPO
            WHERE id_equipo = $1 
            AND CURRENT_DATE > fecha_prox_calibracion
            LIMIT 1
        `;

            const checkResult = await client.query(sqlCheckExpired, [id_equipo]);

            if (checkResult.rowCount > 0) {
                // Expired documentation found, close the equipment
                await client.query(
                    "UPDATE TEQU_EQUIPO SET estado = 'Cerrado' WHERE id_equipo = $1",
                    [id_equipo]
                );
            }

            await client.query('COMMIT');
            return newDoc;

        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Error en createDocumentacion:", err);
            throw new Error("Error al crear documentación");
        } finally {
            client.release();
        }
    }

    async updateDocumentacion(id_doc, data) {
        const {
            fecha_ult_calibracion,
            fecha_prox_calibracion,
            observacion_registro,
            id_usuario_responsable,
            documentos_adjuntos,
            fotografias,
            json_data
        } = data;

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const sqlUpdate = `
          UPDATE TEQU_DOCUMENTACION_EQUIPO
          SET
            fecha_ult_calibracion = $1,
            fecha_prox_calibracion = $2,
            observacion_registro = $3,
            id_usuario_responsable = $4,
            documentos_adjuntos = $5::jsonb,
            fotografias = $6::jsonb,
            json_data = $7::jsonb
          WHERE id_acreditacion = $8
          RETURNING *
        `;

            const { rows } = await client.query(sqlUpdate, [
                fecha_ult_calibracion,
                fecha_prox_calibracion,
                observacion_registro,
                id_usuario_responsable,
                JSON.stringify(documentos_adjuntos || []),
                JSON.stringify(fotografias || []),
                JSON.stringify(json_data || {}),
                id_doc
            ]);

            if (rows.length === 0) {
                throw new Error("Documentación no encontrada");
            }

            const updatedDoc = rows[0];

            // Re-evaluate equipment status (if expired, auto-close)
            // Ideally check this doc or all docs for the equipment.
            await this.updateEstadoEquipoIfExpired(updatedDoc.id_equipo);

            await client.query('COMMIT');
            return updatedDoc;

        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Error en updateDocumentacion:", err);
            throw err;
        } finally {
            client.release();
        }
    }

    async updateEstadoEquipoIfExpired(id_equipo) {
        // Helper function to re-evaluate equipment status
        const client = await this.pool.connect();
        try {
            const sqlCheckExpired = `
            SELECT 1 
            FROM TEQU_DOCUMENTACION_EQUIPO
            WHERE id_equipo = $1 
            AND CURRENT_DATE > fecha_prox_calibracion
            LIMIT 1
        `;
            const checkResult = await client.query(sqlCheckExpired, [id_equipo]);

            if (checkResult.rowCount > 0) {
                await client.query(
                    "UPDATE TEQU_EQUIPO SET estado = 'Cerrado' WHERE id_equipo = $1",
                    [id_equipo]
                );
                return true; // Closed
            }
            return false; // Not closed by expiration (doesn't mean it's open, but expiration didn't close it)
        } finally {
            client.release();
        }
    }
    async deleteDocumentacion(id_acreditacion) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const sql = 'DELETE FROM TEQU_DOCUMENTACION_EQUIPO WHERE id_acreditacion = $1 RETURNING id_equipo';
            const { rowCount } = await client.query(sql, [id_acreditacion]);
            
            await client.query('COMMIT');
            return rowCount > 0;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Error en deleteDocumentacion:", err);
            throw new Error("Error al eliminar documentación");
        } finally {
            client.release();
        }
    }
}

module.exports = TequDocumentacionModel;
