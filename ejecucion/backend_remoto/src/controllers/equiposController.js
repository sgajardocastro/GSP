const equipoModel = require("../models/equipoModel");
const equipo = new equipoModel();

module.exports = {
  // PUT /updEquipos
  // Body esperado:
  // {
  //   id_equipo_proyecto: 1,
  //   nombre_equipo: "Equipo Seguridad",
  //   descripcion: "texto opcional",
  //   ids_usuarios: [10, 20, 30]   // integrantes del equipo
  // }
  putEquipos: async (req, res) => {
    try {
      const {
        id_equipo_proyecto,
        nombre_equipo,
        descripcion_equipo,
        ids_usuarios,
        id_usuario_modificacion
      } = req.body || {};

      // Validaciones básicas
      if (!id_equipo_proyecto) {
        return res.status(400).json({
          ok: false,
          message: "id_equipo_proyecto es obligatorio"
        });
      }

      if (!Array.isArray(ids_usuarios)) {
        return res.status(400).json({
          ok: false,
          message: "ids_usuarios debe ser un arreglo (aunque venga vacío)"
        });
      }

      // Armamos el payload para el modelo
      const payload = {
        id_equipo_proyecto: Number(id_equipo_proyecto),
        nombre_equipo: nombre_equipo ? String(nombre_equipo).trim() : null,
        descripcion_equipo: descripcion_equipo ? String(descripcion_equipo).trim() : null,
        ids_usuarios: ids_usuarios.map(Number), // normalizamos a Number
        id_usuario_modificacion: id_usuario_modificacion ? Number(id_usuario_modificacion) : null
      };

      // Delegamos la lógica al modelo
      // La idea es que este método:
      // 1) actualice datos del equipo
      // 2) borre los integrantes actuales
      // 3) inserte los nuevos integrantes (ids_usuarios)
      const resultado = await equipo.updEquipos(payload);

      return res.json({
        ok: true,
        message: "Equipo e integrantes actualizados correctamente",
        data: resultado || null
      });
    } catch (error) {
      console.error("❌ Error en putEquipos:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al actualizar equipo",
        error: error.message || error
      });
    }
  },
  delEquiposMiembro: async (req, res) => {
    try {
      const {
        id_equipo_proyecto,
        id_user,
        id_usuario_modificacion
      } = req.body || {};

      if (!id_equipo_proyecto || !id_user) {
        return res.status(400).json({
          ok: false,
          message: "id_equipo_proyecto e id_user son obligatorios"
        });
      }

      const result = await equipo.delEquiposMiembro({
        id_equipo_proyecto: Number(id_equipo_proyecto),
        id_user: Number(id_user),
        id_usuario_modificacion: id_usuario_modificacion
          ? Number(id_usuario_modificacion)
          : null
      });

      if (!result.rowCount) {
        return res.status(404).json({
          ok: false,
          message: "No se encontró un miembro activo para ese equipo/usuario"
        });
      }

      return res.json({
        ok: true,
        message: "Miembro eliminado (inactivado) correctamente del equipo",
        data: result.rows[0] || null
      });
    } catch (error) {
      console.error("❌ Error en delEquiposMiembro:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al eliminar miembro del equipo",
        error: error.message || error
      });
    }
  },
  getEquipos: async (req, res) => {
    try {
      const data = await equipo.getEquipos();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
};
