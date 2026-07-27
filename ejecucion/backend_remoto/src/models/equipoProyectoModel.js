const pool = require("../config/postgresPool");

class EquipoProyectoModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  // Crear equipo dentro de un proyecto
  async crearEquipoProyecto(data) {
    const {
      id_proyecto,
      nombre_equipo,
      descripcion_equipo = null,
      id_usuario_lider = null,
      estado_equipo = "ACTIVO",
      id_usuario_creacion = null,
      json_field = null,
    } = data;

    const query = `
      INSERT INTO tpry_equipo_proyecto (
        id_proyecto,
        nombre_equipo,
        descripcion_equipo,
        id_usuario_lider,
        estado_equipo,
        id_usuario_creacion,
        json_field
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      id_proyecto,
      nombre_equipo,
      descripcion_equipo,
      id_usuario_lider,
      estado_equipo,
      id_usuario_creacion,
      json_field,
    ];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) throw new Error("No se pudo crear el equipo del proyecto");
      return rows[0];
    } catch (error) {
      // ✅ Deja que el controller traduzca code/constraint (23505 uq_equipo_por_proyecto, etc.)
      throw error;
      // Si prefieres mismo estilo que ProyectoModel:
      // throw new Error(`Error al crear equipo proyecto: ${error.message}`);
    }
  }

  // (Opcional) Obtener equipos por proyecto
  async getEquiposByProyecto(id_proyecto) {
    const query = `
      SELECT *
      FROM tpry_equipo_proyecto
      WHERE id_proyecto = $1
      ORDER BY id_equipo_proyecto DESC;
    `;

    try {
      const { rows } = await this.pool.query(query, [id_proyecto]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener equipos por proyecto: ${error.message}`);
    }
  }

  // (Opcional) Obtener un equipo por id
  async getEquipoById(id_equipo_proyecto) {
    const query = `
      SELECT *
      FROM tpry_equipo_proyecto
      WHERE id_equipo_proyecto = $1
      LIMIT 1;
    `;

    try {
      const { rows } = await this.pool.query(query, [id_equipo_proyecto]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener equipo: ${error.message}`);
    }
  }
}

module.exports = EquipoProyectoModel;
