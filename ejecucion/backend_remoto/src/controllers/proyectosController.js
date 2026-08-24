const ProyectoModel = require("../models/proyectoModel.js");
const EquipoProyectoModel = require("../models/equipoProyectoModel.js"); // ✅ nuevo

const proyecto = new ProyectoModel();
const equipoProyecto = new EquipoProyectoModel();

function tryParseJson(val) {
  if (val == null || val === "") return null;
  if (typeof val === "object") return val; // ya es json
  if (typeof val !== "string") return null;

  try {
    return JSON.parse(val);
  } catch {
    return "__INVALID__";
  }
}

function mapPgError(err) {
  const code = err?.code;              // ej: 23505, 23503, etc.
  const constraint = err?.constraint;  // ej: uq_equipo_por_proyecto
  const detail = err?.detail || "";
  const message = err?.message || "";

  // UNIQUE
  if (code === "23505") {
    if (constraint === "uq_equipo_por_proyecto") {
      return {
        status: 409,
        error: "Ya existe un equipo con ese nombre en este proyecto.",
        meta: { constraint }
      };
    }
    return {
      status: 409,
      error: "Conflicto por dato duplicado.",
      meta: { constraint, detail }
    };
  }

  // FK
  if (code === "23503") {
    return {
      status: 409,
      error: "No se pudo guardar: referencia inválida (FK). Revisa proyecto/líder/usuario_creación.",
      meta: { constraint, detail }
    };
  }

  // NOT NULL
  if (code === "23502") {
    return {
      status: 400,
      error: "Faltan campos obligatorios.",
      meta: { constraint, detail }
    };
  }

  return {
    status: 500,
    error: message || "Error interno.",
    meta: { code, constraint, detail }
  };
}

module.exports = {
  getProyectos: async (req, res) => {
    try {
      // Priorizar el parámetro de consulta explicitamente enviado desde el cliente
      let id_empresa = req.query?._id_empresa !== undefined ? req.query._id_empresa : (req.user?.id_empresa || null);
      if (id_empresa === 'all' || id_empresa === '0' || id_empresa === 0 || id_empresa === 'null') {
        id_empresa = null;
      }
      const proyectos = await proyecto.getProyectos(id_empresa);
      return res.status(200).json({ message: "Proyectos obtenidos correctamente", proyectos });
    } catch (err) {
      console.error("Error en getProyectos:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  getProyectoById: async (req, res) => {
    try {
      const { id } = req.params;
      const prj = await proyecto.getProyectoById(id);

      if (!prj) return res.status(404).json({ error: "Proyecto no existe" });

      return res.status(200).json({ message: "Proyecto obtenido correctamente", proyecto: prj });
    } catch (err) {
      console.error("Error en getProyectoById:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  createProyecto: async (req, res) => {
    try {
      let codi_proyecto = req.body.codi_proyecto;
      const isFormalCode = codi_proyecto && /^(GSP|BMQ|LDS|RYL|PRY)-\d{4}(-\d+)?-\d{3}$/.test(codi_proyecto);
      if (!isFormalCode) {
        const id_empresa = req.body.id_empresa || req.user?.id_empresa;
        const id_cliente = req.body.id_empresa_cliente || null;
        if (id_empresa) {
          codi_proyecto = await proyecto.generarCodigoTransaccional(id_empresa, id_cliente);
        }
      }

      const payload = {
        ...req.body,
        codi_proyecto,
        id_user_creacion: req.body.id_user_creacion ?? req.user?.id_user ?? null,
      };

      const nuevo = await proyecto.createProyecto(payload);

      return res.status(201).json({ message: "Proyecto creado correctamente", proyecto: nuevo });
    } catch (err) {
      console.error("Error en createProyecto:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ POST: Crear oportunidad comercial en preventa (RF-4.3)
  createProyectoPreventa: async (req, res) => {
    try {
      // Usa el id_empresa enviado desde la UI (si existe rol global) o fuerza el del usuario actual
      const id_empresa = req.body.id_empresa || req.user?.id_empresa;
      
      if (!id_empresa) {
        return res.status(400).json({ error: "Falta id_empresa para generar la cotización." });
      }

      let codi_proyecto = req.body.codi_proyecto;
      const isFormalCode = codi_proyecto && /^(GSP|BMQ|LDS|RYL|PRY)-\d{4}(-\d+)?-\d{3}$/.test(codi_proyecto);
      if (!isFormalCode) {
        const id_cliente = req.body.id_empresa_cliente || null;
        codi_proyecto = await proyecto.generarCodigoTransaccional(id_empresa, id_cliente);
      }

      const payload = {
        ...req.body,
        id_empresa,
        codi_proyecto,
        id_user_creacion: req.user?.id_user ?? req.body.id_user_creacion ?? null,
        id_proyecto_estado: 1, // 1 = "Oportunidad Registrada"
      };

      const nuevo = await proyecto.createProyecto(payload);

      return res.status(201).json({ message: "Oportunidad registrada exitosamente", proyecto: nuevo });
    } catch (err) {
      console.error("Error en createProyectoPreventa:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  updateProyecto: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await proyecto.getProyectoById(id);
      if (!existing) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      let codi_proyecto = req.body.codi_proyecto || existing.codi_proyecto;
      const isFormalCode = codi_proyecto && /^(GSP|BMQ|LDS|RYL|PRY)-\d{4}(-\d+)?-\d{3}$/.test(codi_proyecto);
      if (!isFormalCode) {
        const id_empresa = req.body.id_empresa || existing.id_empresa || req.user?.id_empresa;
        const id_cliente = req.body.id_empresa_cliente || existing.id_empresa_cliente || null;
        if (id_empresa) {
          codi_proyecto = await proyecto.generarCodigoTransaccional(id_empresa, id_cliente);
        }
      }

      const payload = {
        ...req.body,
        codi_proyecto,
        id_user_modificacion: req.body.id_user_modificacion ?? null,
      };

      const updated = await proyecto.updateProyecto(id, payload);

      if (!updated) return res.status(404).json({ error: "No se pudo actualizar. Proyecto no encontrado" });

      return res.status(200).json({ message: "Proyecto actualizado correctamente", proyecto: updated });
    } catch (err) {
      console.error("Error en updateProyecto:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  deleteProyecto: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await proyecto.deleteProyecto(id);

      if (!deleted) return res.status(404).json({ error: "Proyecto no encontrado" });

      return res.status(200).json({ message: "Proyecto eliminado correctamente", deleted });
    } catch (err) {
      console.error("Error en deleteProyecto:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  // ✅ POST: crear equipo dentro de proyecto
  crearEquipoProyecto: async (req, res) => {
    try {
      const {
        id_proyecto,
        nombre_equipo,
        descripcion_equipo,
        id_usuario_lider,
        estado_equipo,
        id_usuario_creacion,
        json_field
      } = req.body;

      // ✅ validaciones mínimas
      if (!id_proyecto || Number(id_proyecto) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }
      if (!nombre_equipo || !String(nombre_equipo).trim()) {
        return res.status(400).json({ error: "nombre_equipo es requerido" });
      }

      const parsedJson = tryParseJson(json_field);
      if (parsedJson === "__INVALID__") {
        return res.status(400).json({ error: "json_field debe ser un JSON válido (o venir como objeto)" });
      }

      const payload = {
        id_proyecto: Number(id_proyecto),
        nombre_equipo: String(nombre_equipo).trim(),
        descripcion_equipo: (descripcion_equipo ?? "").toString().trim() || null,
        id_usuario_lider: id_usuario_lider ? Number(id_usuario_lider) : null,
        estado_equipo: (estado_equipo ?? "ACTIVO").toString().trim() || "ACTIVO",
        id_usuario_creacion: id_usuario_creacion ?? null,
        json_field: parsedJson, // null u objeto
      };

      const nuevo = await equipoProyecto.crearEquipoProyecto(payload);

      return res.status(201).json({
        message: "Equipo creado correctamente",
        equipo: nuevo
      });
    } catch (err) {
      console.error("Error en crearEquipoProyecto:", err);

      const mapped = mapPgError(err);
      return res.status(mapped.status).json({
        error: mapped.error,
        ...(mapped.meta ? { meta: mapped.meta } : {})
      });
    }
  },

  generarCotizacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { monto } = req.body;

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      const result = await proyecto.generarCotizacionVersion(id, monto);

      return res.status(200).json({
        message: "Versión de cotización generada exitosamente",
        cotizacion: result.cotizacion,
        proyecto: result.proyecto
      });
    } catch (err) {
      console.error("Error en generarCotizacion:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  generarOT: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      const result = await proyecto.generarOTVersion(id);

      return res.status(200).json({
        message: "Versión de Orden de Trabajo generada exitosamente",
        ot: result.ot,
        proyecto: result.proyecto
      });
    } catch (err) {
      console.error("Error en generarOT:", err);
      return res.status(500).json({ error: err.message });
    }
  },

  enviarOT: async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body || {};

      if (!id || Number(id) <= 0) {
        return res.status(400).json({ error: "id_proyecto es requerido y debe ser válido" });
      }

      const result = await proyecto.enviarOT(id, payload);

      return res.status(200).json({
        message: result.message,
        despacho: result.despacho
      });
    } catch (err) {
      console.error("Error en enviarOT:", err);
      return res.status(500).json({ error: err.message });
    }
  }
};
