const TequDocumentacionModel = require("../models/tequDocumentacionModel");
const tequDoc = new TequDocumentacionModel();

module.exports = {
    getDocumentacionByEquipoId: async (req, res) => {
        try {
            const { id_equipo } = req.params;
            const result = await tequDoc.getDocumentacionByEquipoId(id_equipo);
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    createDocumentacion: async (req, res) => {
        try {
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
            } = req.body;

            if (!id_equipo || !registro_acreditacion || !fecha_ult_calibracion || !fecha_prox_calibracion || !id_usuario_registro) {
                return res.status(400).json({ message: "Faltan campos obligatorios" });
            }

            const result = await tequDoc.createDocumentacion({
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
            });

            res.status(201).json({ message: "Documentación registrada", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateDocumentacion: async (req, res) => {
        try {
            const { id_doc } = req.params;
            const {
                fecha_ult_calibracion,
                fecha_prox_calibracion,
                observacion_registro,
                id_usuario_responsable,
                documentos_adjuntos,
                fotografias,
                json_data
            } = req.body;

            if (!id_doc) {
                return res.status(400).json({ message: "Falta el ID del documento" });
            }

            const result = await tequDoc.updateDocumentacion(id_doc, {
                fecha_ult_calibracion,
                fecha_prox_calibracion,
                observacion_registro,
                id_usuario_responsable,
                documentos_adjuntos,
                fotografias,
                json_data
            });

            res.status(200).json({ message: "Documentación actualizada", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteDocumentacion: async (req, res) => {
        try {
            const { id_doc } = req.params;
            const result = await tequDoc.deleteDocumentacion(id_doc);
            if (!result) {
                return res.status(404).json({ message: "Documento no encontrado" });
            }
            res.status(200).json({ message: "Documento eliminado" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
