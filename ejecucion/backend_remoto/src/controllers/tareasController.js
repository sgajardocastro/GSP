const tareaModel = require("../models/tareaModel");
const tarea = new tareaModel();

const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);

const parseItems = (body) => {
  const tareas = Array.isArray(body) ? body : (body?.tareas ?? body);
  return toArray(tareas);
};

const validateItems = (items) => {
  if (!items.length) return "Payload vacío o mal formado";
  for (const [i, it] of items.entries()) {
    if (!it || typeof it !== "object") return `Item ${i} inválido`;
    if (it.id_tarea == null) return `Item ${i} sin id_tarea`;
    if (!Array.isArray(it.json_data)) return `Item ${i} sin json_data (debe ser array)`;
  }
  return "";
};

module.exports = {
  putTareas: async (req, res) => {
    try {
      const items = parseItems(req.body);
      const validationError = validateItems(items);
      if (validationError) return res.status(400).json({ error: validationError });

      // Actualiza en paralelo (ajusta según tu modelo)
      // Si tu modelo espera { tarea: [element] }, lo mantenemos:
      await Promise.all(
        items.map((element) =>
          tarea.putTarea({ tarea: [element] })
        )
      );

      const updatedIds = items.map(x => x.id_tarea);
      return res.status(200).json({
        message: "Tareas actualizadas correctamente",
        updated: updatedIds
      });
    } catch (err) {
      console.error("Error en putTareas:", err);
      return res.status(500).json({ error: err?.message || "Server error" });
    }
  },

  putTareasV3: async (req, res) => {
    try {
      const items = parseItems(req.body);
      const validationError = validateItems(items);
      if (validationError) return res.status(400).json({ error: validationError });

      await Promise.all(
        items.map((element) =>
          tarea.putTareaV3({ tarea: [element] })
        )
      );

      const updatedIds = items.map((x) => x.id_tarea);
      return res.status(200).json({
        message: "Tareas V3 actualizadas correctamente",
        updated: updatedIds
      });
    } catch (err) {
      console.error("Error en putTareasV3:", err);
      return res.status(500).json({ error: err?.message || "Server error" });
    }
  },
};

