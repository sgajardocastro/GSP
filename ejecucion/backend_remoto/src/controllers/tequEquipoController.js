const TequEquipoModel = require("../models/tequEquipoModel");
const tequEquipo = new TequEquipoModel();

module.exports = {
    getEquipos: async (req, res) => {
        try {
            const result = await tequEquipo.getEquipos();
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getEquipoById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await tequEquipo.getEquipoById(id);
            if (!result) {
                return res.status(404).json({ message: "Equipo no encontrado" });
            }
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    createEquipo: async (req, res) => {
        try {
            const data = req.body;

            if (!data.marca || !data.modelo || !data.numero_serie || !data.tipo_equipo) {
                return res.status(400).json({ message: "Faltan campos obligatorios: marca, modelo, numero_serie, tipo_equipo" });
            }

            data.id_usuario_creacion = data.id_usuario_creacion || req.user?.id_user || 1;

            const result = await tequEquipo.createEquipo(data);
            res.status(201).json({ message: "Equipo creado", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateEquipo: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            // Prevent updating id or audit fields if not allowed
            delete data.id_equipo;
            delete data.fecha_registro;
            delete data.id_usuario_creacion;

            const result = await tequEquipo.updateEquipo(id, data);

            if (!result) {
                return res.status(404).json({ message: "Equipo no encontrado o sin cambios" });
            }

            res.status(200).json({ message: "Equipo actualizado", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteEquipo: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await tequEquipo.deleteEquipo(id);
            if (!deleted) {
                return res.status(404).json({ message: "Equipo no encontrado" });
            }
            res.status(200).json({ message: "Equipo eliminado" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getCategorias: async (req, res) => {
        try {
            const idEmpresa = req.query.id_empresa ? parseInt(req.query.id_empresa) : 0;
            const rows = await tequEquipo.getCategorias(idEmpresa);
            
            // Agrupar subcategorías por categoría
            const categoriesMap = {};
            rows.forEach(r => {
                if (!categoriesMap[r.id_categoria]) {
                    categoriesMap[r.id_categoria] = {
                        id_categoria: r.id_categoria,
                        nombre_categoria: r.nombre_categoria,
                        subcategories: []
                    };
                }
                if (r.id_subcategoria) {
                    categoriesMap[r.id_categoria].subcategories.push({
                        id_subcategoria: r.id_subcategoria,
                        nombre_subcategoria: r.nombre_subcategoria
                    });
                }
            });
            
            res.status(200).json({ data: Object.values(categoriesMap) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getCertificadosByEquipo: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await tequEquipo.getCertificadosByEquipo(id);
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    createCertificado: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                id_tipo_certificado,
                fecha_emision,
                fecha_vencimiento,
                entidad_emisora,
                id_doc,
                estado_validacion,
                observaciones
            } = req.body;

            if (!id_tipo_certificado || !fecha_vencimiento) {
                return res.status(400).json({ message: "Tipo de certificado y fecha de vencimiento son obligatorios" });
            }

            const result = await tequEquipo.createCertificado({
                id_equipo: parseInt(id),
                id_tipo_certificado,
                fecha_emision,
                fecha_vencimiento,
                entidad_emisora,
                id_doc,
                estado_validacion,
                observaciones
            });

            res.status(201).json({ message: "Certificado creado", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateCertificado: async (req, res) => {
        try {
            const { certId } = req.params;
            const data = req.body;

            delete data.id_certificado;
            delete data.id_equipo;
            delete data.created_at;

            const result = await tequEquipo.updateCertificado(certId, data);
            if (!result) {
                return res.status(404).json({ message: "Certificado no encontrado o sin cambios" });
            }

            res.status(200).json({ message: "Certificado actualizado", data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteCertificado: async (req, res) => {
        try {
            const { certId } = req.params;
            const deleted = await tequEquipo.deleteCertificado(certId);
            if (!deleted) {
                return res.status(404).json({ message: "Certificado no encontrado" });
            }
            res.status(200).json({ message: "Certificado eliminado" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getTiposCertificado: async (req, res) => {
        try {
            const result = await tequEquipo.getTiposCertificado();
            res.status(200).json({ data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
