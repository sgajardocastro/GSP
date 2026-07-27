const pool = require("../config/postgresPool");

class TfmgArchivoModel {
    constructor() {
        this.pool = pool;
        this.pool.on("error", (err) => console.error(err));
    }

    async getAll() {
        try {
            const sql = `
                SELECT a.*, f.name_doc_orig, f.name_doc_interno, f.mimetype
                FROM tfmg_archivo a
                LEFT JOIN tfmg_file f ON a.id_doc = f.id_doc
                ORDER BY a.id_archivo DESC
            `;
            const respuesta = await this.pool.query(sql);
            return respuesta.rows;
        } catch (err) {
            console.error("Error en getAll:", err);
            throw new Error("Error al obtener archivos");
        }
    }

    async getById(id) {
        try {
            const sql = "SELECT * FROM tfmg_archivo WHERE id_archivo = $1";
            const respuesta = await this.pool.query(sql, [id]);
            return respuesta.rows[0] || null;
        } catch (err) {
            console.error("Error en getById:", err);
            throw new Error("Error al obtener archivo");
        }
    }

    async create(data) {
        const {
            id_empresa,
            id_empresa_cliente,
            id_proyecto,
            tipo_documento,
            id_survey,
            id_doc,
            observacion,
            version,
            id_usuario_creacion,
            json_data
        } = data;

        const sql = `
      INSERT INTO tfmg_archivo (
        id_empresa,
        id_empresa_cliente,
        id_proyecto,
        tipo_documento,
        id_survey,
        id_doc,
        observacion,
        version,
        id_usuario_creacion,
        json_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

        try {
            const { rows } = await this.pool.query(sql, [
                id_empresa,
                id_empresa_cliente,
                id_proyecto,
                tipo_documento,
                id_survey,
                id_doc,
                observacion,
                version,
                id_usuario_creacion,
                json_data || {}
            ]);
            return rows[0];
        } catch (err) {
            console.error("Error en create:", err);
            throw new Error("Error al crear archivo");
        }
    }

    async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const mappings = {
            id_empresa: 'id_empresa',
            id_empresa_cliente: 'id_empresa_cliente',
            id_proyecto: 'id_proyecto',
            tipo_documento: 'tipo_documento',
            id_survey: 'id_survey',
            id_doc: 'id_doc',
            observacion: 'observacion',
            version: 'version',
            json_data: 'json_data'
        };

        for (const key in data) {
            if (mappings[key] !== undefined) {
                fields.push(`${mappings[key]} = $${idx}`);
                values.push(data[key]);
                idx++;
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const sql = `
      UPDATE tfmg_archivo
      SET ${fields.join(', ')}
      WHERE id_archivo = $${idx}
      RETURNING *
    `;

        try {
            const { rows } = await this.pool.query(sql, values);
            return rows[0];
        } catch (err) {
            console.error("Error en update:", err);
            throw new Error("Error al actualizar archivo");
        }
    }

    async delete(id) {
        try {
            const sql = "DELETE FROM tfmg_archivo WHERE id_archivo = $1 RETURNING id_archivo";
            const { rows } = await this.pool.query(sql, [id]);
            return rows.length > 0;
        } catch (err) {
            console.error("Error en delete:", err);
            throw new Error("Error al eliminar archivo");
        }
    }
}

module.exports = TfmgArchivoModel;
