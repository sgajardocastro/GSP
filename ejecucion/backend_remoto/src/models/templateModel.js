const pool = require("../config/postgresPool");

class TemplateModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  async updateAttributes(id_template, attributes) {
    const { 
      name_template_srv, 
      codi_template_srv, 
      desc_template_srv, 
      id_tipo_srv 
    } = attributes;

    const query = `
      UPDATE tsrv_templates
      SET 
        name_template_srv = COALESCE($1, name_template_srv),
        codi_template_srv = COALESCE($2, codi_template_srv),
        desc_template_srv = COALESCE($3, desc_template_srv),
        id_tipo_srv = COALESCE($4, id_tipo_srv)
      WHERE id_template = $5
      RETURNING *;
    `;
    const values = [
      name_template_srv || null,
      codi_template_srv || null,
      desc_template_srv || null,
      id_tipo_srv || null,
      id_template
    ];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) return null;
      return rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar atributos del template: ${error.message}`);
    }
  }
}

module.exports = TemplateModel;
