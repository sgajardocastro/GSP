const TfmgArchivoModel = require("../models/tfmgArchivoModel");
const tfmgArchivo = new TfmgArchivoModel();

module.exports = {
    getAll: async (req, res) => {
        try {
            const result = await tfmgArchivo.getAll();
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await tfmgArchivo.getById(id);
            if (!result) {
                return res.status(404).json({ message: "Archivo no encontrado" });
            }
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    create: async (req, res) => {
        try {
            const result = await tfmgArchivo.create(req.body);
            res.status(201).json({ message: "Archivo creado", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await tfmgArchivo.update(id, req.body);
            if (!result) {
                return res.status(404).json({ message: "Archivo no encontrado o sin cambios" });
            }
            res.status(200).json({ message: "Archivo actualizado", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const success = await tfmgArchivo.delete(id);
            if (!success) {
                return res.status(404).json({ message: "Archivo no encontrado" });
            }
            res.status(200).json({ message: "Archivo eliminado correctamente" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
