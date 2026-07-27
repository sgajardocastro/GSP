const pool = require("../config/postgresPool");

class TequEquipoModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  async getEquipos() {
    try {
      const sql = `
        SELECT 
          e.*,
          s.nombre_subcategoria,
          c.id_categoria,
          c.nombre_categoria,
          m.nombre_modelo,
          b.id_marca,
          b.nombre_marca,
          emp.name_empresa,
          emp.razon_social,
          CASE 
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP')) = 0 THEN 'empty'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento < CURRENT_DATE) > 0 THEN 'error'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days') > 0 THEN 'warning'
            ELSE 'ok'
          END AS estado_doc_legal,
          CASE 
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP')) = 0 THEN 'empty'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento < CURRENT_DATE) > 0 THEN 'error'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days') > 0 THEN 'warning'
            ELSE 'ok'
          END AS estado_doc_gral
        FROM tequ_equipo e
        LEFT JOIN tequ_subcategoria s ON e.id_subcategoria = s.id_subcategoria
        LEFT JOIN tequ_categoria c ON s.id_categoria = c.id_categoria
        LEFT JOIN tequ_modelo m ON e.id_modelo = m.id_modelo
        LEFT JOIN tequ_marca b ON m.id_marca = b.id_marca
        LEFT JOIN tpar_empresas emp ON e.id_empresa = emp.id_empresa
        LEFT JOIN tequ_certificados_equipo ce ON e.id_equipo = ce.id_equipo
        LEFT JOIN tequ_tipos_certificado tc ON ce.id_tipo_certificado = tc.id_tipo_certificado
        GROUP BY e.id_equipo, s.id_subcategoria, c.id_categoria, m.id_modelo, b.id_marca, emp.id_empresa
        ORDER BY e.id_equipo DESC
      `;
      const respuesta = await this.pool.query(sql);
      return respuesta.rows;
    } catch (err) {
      console.error("Error en getEquipos:", err);
      throw new Error("Error al obtener equipos: " + err.message);
    }
  }

  async getEquipoById(id) {
    try {
      const sql = `
        SELECT 
          e.*,
          s.nombre_subcategoria,
          c.id_categoria,
          c.nombre_categoria,
          m.nombre_modelo,
          b.id_marca,
          b.nombre_marca,
          emp.name_empresa,
          emp.razon_social
        FROM tequ_equipo e
        LEFT JOIN tequ_subcategoria s ON e.id_subcategoria = s.id_subcategoria
        LEFT JOIN tequ_categoria c ON s.id_categoria = c.id_categoria
        LEFT JOIN tequ_modelo m ON e.id_modelo = m.id_modelo
        LEFT JOIN tequ_marca b ON m.id_marca = b.id_marca
        LEFT JOIN tpar_empresas emp ON e.id_empresa = emp.id_empresa
        WHERE e.id_equipo = $1
      `;
      const respuesta = await this.pool.query(sql, [id]);
      return respuesta.rows[0] || null;
    } catch (err) {
      console.error("Error en getEquipoById:", err);
      throw new Error("Error al obtener equipo");
    }
  }

  async createEquipo(data) {
    const {
      marca,
      modelo,
      numero_serie,
      tipo_equipo,
      json_data,
      id_usuario_creacion,
      fotos_ids,
      observaciones,
      estado,
      id_empresa,
      patente,
      codigo_interno,
      capacidad_maxima,
      unidad_capacidad,
      ano_fabricacion,
      id_subcategoria,
      id_modelo
    } = data;

    const sql = `
      INSERT INTO TEQU_EQUIPO (
        marca,
        modelo,
        numero_serie,
        tipo_equipo,
        json_data,
        id_usuario_creacion,
        fotos_ids,
        observaciones,
        estado,
        id_empresa,
        patente,
        codigo_interno,
        capacidad_maxima,
        unidad_capacidad,
        ano_fabricacion,
        id_subcategoria,
        id_modelo,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    try {
      const { rows } = await this.pool.query(sql, [
        marca,
        modelo,
        numero_serie,
        tipo_equipo,
        json_data || {},
        id_usuario_creacion,
        JSON.stringify(fotos_ids || []),
        observaciones,
        estado || 'OPERATIVO',
        id_empresa || null,
        patente || null,
        codigo_interno || null,
        capacidad_maxima || null,
        unidad_capacidad || null,
        ano_fabricacion || null,
        id_subcategoria || null,
        id_modelo || null
      ]);
      return rows[0];
    } catch (err) {
      console.error("Error en createEquipo:", err);
      if (err.code === '23505') { // Unique violation for numero_serie
         throw new Error("El número de serie ya existe");
      }
      throw new Error("Error al crear equipo: " + err.message);
    }
  }

  async updateEquipo(id, data) {
    // Dynamic update query
    const fields = [];
    const values = [];
    let idx = 1;

    // Mapping requested fields to columns
    const mappings = {
        marca: 'marca',
        modelo: 'modelo',
        numero_serie: 'numero_serie',
        tipo_equipo: 'tipo_equipo',
        json_data: 'json_data',
        fotos_ids: 'fotos_ids',
        observaciones: 'observaciones',
        estado: 'estado',
        id_empresa: 'id_empresa',
        patente: 'patente',
        codigo_interno: 'codigo_interno',
        capacidad_maxima: 'capacidad_maxima',
        unidad_capacidad: 'unidad_capacidad',
        ano_fabricacion: 'ano_fabricacion',
        id_subcategoria: 'id_subcategoria',
        id_modelo: 'id_modelo'
    };

    for (const key in data) {
        if (mappings[key] !== undefined) {
            if (key === 'fotos_ids') {
                fields.push(`${mappings[key]} = $${idx}::jsonb`);
                values.push(JSON.stringify(data[key]));
            } else {
                fields.push(`${mappings[key]} = $${idx}`);
                values.push(data[key]);
            }
            idx++;
        }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const sql = `
      UPDATE TEQU_EQUIPO
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id_equipo = $${idx}
      RETURNING *
    `;

    try {
      const { rows } = await this.pool.query(sql, values);
      return rows[0];
    } catch (err) {
      console.error("Error en updateEquipo:", err);
        if (err.code === '23505') {
            throw new Error("El número de serie ya existe");
        }
      throw new Error("Error al actualizar equipo");
    }
  }

    async deleteEquipo(id) {
    // Logical delete usually? But specification says 'Cerrado' state is managed by logic.
    // Assuming hard delete or logical delete is not strictly requested but good to have
    // For now, let's implement a hard delete but typically we shouldn't.
    // User requested "mantenedores" (CRUD), so I will provide delete.
    try {
        const sql = "DELETE FROM TEQU_EQUIPO WHERE id_equipo = $1 RETURNING id_equipo";
        const { rows } = await this.pool.query(sql, [id]);
        return rows.length > 0;
    } catch (err) {
        console.error("Error en deleteEquipo:", err);
        throw new Error("Error al eliminar equipo");
    }
  }

  // Helper to update status
    async updateEstado(id, nuevoEstado) {
        try {
            const sql = "UPDATE TEQU_EQUIPO SET estado = $1 WHERE id_equipo = $2 RETURNING *";
            const {rows} = await this.pool.query(sql, [nuevoEstado, id]);
            return rows[0];
        } catch (err) {
            console.error("Error en updateEstado:", err);
            throw err;
        }
    }

    async getCategorias(idEmpresa = 0) {
        try {
            const sql = `
                SELECT c.id_categoria, c.nombre_categoria, s.id_subcategoria, s.nombre_subcategoria
                FROM tequ_categoria c
                LEFT JOIN tequ_subcategoria s ON c.id_categoria = s.id_categoria
                WHERE c.id_empresa = $1 OR c.id_empresa = 0
                ORDER BY c.nombre_categoria, s.nombre_subcategoria
            `;
            const { rows } = await this.pool.query(sql, [idEmpresa]);
            return rows;
        } catch (err) {
            console.error("Error en getCategorias:", err);
            throw new Error("Error al obtener categorías: " + err.message);
        }
    }

    async getCertificadosByEquipo(idEquipo) {
      try {
        const sql = `
          SELECT 
            ce.*,
            tc.nombre_tipo,
            tc.obligatorio,
            tc.dias_alerta_vencimiento,
            f.name_doc_orig,
            f.name_doc_interno,
            f.path_doc,
            f.mimetype
          FROM tequ_certificados_equipo ce
          JOIN tequ_tipos_certificado tc ON ce.id_tipo_certificado = tc.id_tipo_certificado
          LEFT JOIN tfmg_file f ON ce.id_doc = f.id_doc
          WHERE ce.id_equipo = $1
          ORDER BY ce.fecha_vencimiento ASC
        `;
        const { rows } = await this.pool.query(sql, [idEquipo]);
        return rows;
      } catch (err) {
        console.error("Error en getCertificadosByEquipo:", err);
        throw new Error("Error al obtener certificados del equipo: " + err.message);
      }
    }

    async createCertificado(data) {
      const {
        id_equipo,
        id_tipo_certificado,
        fecha_emision,
        fecha_vencimiento,
        entidad_emisora,
        id_doc,
        estado_validacion,
        observaciones
      } = data;

      const sql = `
        INSERT INTO tequ_certificados_equipo (
          id_equipo,
          id_tipo_certificado,
          fecha_emision,
          fecha_vencimiento,
          entidad_emisora,
          id_doc,
          estado_validacion,
          observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      try {
        const { rows } = await this.pool.query(sql, [
          id_equipo,
          id_tipo_certificado,
          fecha_emision || null,
          fecha_vencimiento,
          entidad_emisora || 'MANUAL',
          id_doc || null,
          estado_validacion || 'Aprobado',
          observaciones || null
        ]);
        return rows[0];
      } catch (err) {
        console.error("Error en createCertificado:", err);
        throw new Error("Error al crear certificado: " + err.message);
      }
    }

    async updateCertificado(idCert, data) {
      const fields = [];
      const values = [];
      let idx = 1;

      const mappings = {
        id_tipo_certificado: 'id_tipo_certificado',
        fecha_emision: 'fecha_emision',
        fecha_vencimiento: 'fecha_vencimiento',
        entidad_emisora: 'entidad_emisora',
        id_doc: 'id_doc',
        estado_validacion: 'estado_validacion',
        observaciones: 'observaciones'
      };

      for (const key in data) {
        if (mappings[key] !== undefined) {
          fields.push(`${mappings[key]} = $${idx++}`);
          values.push(data[key]);
        }
      }

      if (fields.length === 0) return null;

      values.push(idCert);
      const sql = `
        UPDATE tequ_certificados_equipo 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE id_certificado = $${idx}
        RETURNING *
      `;

      try {
        const { rows } = await this.pool.query(sql, values);
        return rows[0] || null;
      } catch (err) {
        console.error("Error en updateCertificado:", err);
        throw new Error("Error al actualizar certificado: " + err.message);
      }
    }

    async deleteCertificado(idCert) {
      try {
        const sql = "DELETE FROM tequ_certificados_equipo WHERE id_certificado = $1 RETURNING id_certificado";
        const { rows } = await this.pool.query(sql, [idCert]);
        return rows.length > 0;
      } catch (err) {
        console.error("Error en deleteCertificado:", err);
        throw new Error("Error al eliminar certificado: " + err.message);
      }
    }

    async getTiposCertificado() {
      try {
        const sql = "SELECT * FROM tequ_tipos_certificado ORDER BY id_tipo_certificado ASC";
        const { rows } = await this.pool.query(sql);
        return rows;
      } catch (err) {
        console.error("Error en getTiposCertificado:", err);
        throw new Error("Error al obtener tipos de certificado: " + err.message);
      }
    }
}

module.exports = TequEquipoModel;
