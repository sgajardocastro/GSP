const AcreditacionModel = require("../models/acreditacionModel");
const model = new AcreditacionModel();

module.exports = {
  getAcreditacionPersonal: async (req, res) => {
    try {
      const { q, from, to } = req.query;
      const data = await model.getAcreditacionPersonal({ q, from, to });
      res.status(200).json({ data });
    } catch (err) {
      console.error("Error en getAcreditacionPersonal controller:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getAcreditacionPersonalDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await model.getAcreditacionPersonalDetail(Number(id));
      if (!data) {
        return res.status(404).json({ error: "Usuario de personal no encontrado." });
      }
      res.status(200).json({ data });
    } catch (err) {
      console.error("Error en getAcreditacionPersonalDetail controller:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateAcreditacionPersonal: async (req, res) => {
    try {
      const { id } = req.params;
      const success = await model.updateAcreditacionPersonal(Number(id), req.body);
      if (!success) {
        return res.status(404).json({ error: "Usuario no encontrado o no actualizado." });
      }
      res.status(200).json({ message: "Perfil de personal actualizado exitosamente." });
    } catch (err) {
      console.error("Error en updateAcreditacionPersonal controller:", err);
      res.status(500).json({ error: err.message });
    }
  },

  addCertificado: async (req, res) => {
    try {
      const { id } = req.params;
      const id_certificado = await model.addCertificado(Number(id), req.body);
      res.status(201).json({ id_certificado_persona: id_certificado, message: "Certificado agregado con éxito." });
    } catch (err) {
      console.error("Error en addCertificado controller:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteCertificado: async (req, res) => {
    try {
      const { id, id_cert } = req.params;
      const success = await model.deleteCertificado(Number(id_cert), Number(id));
      if (!success) {
        return res.status(404).json({ error: "Certificado no encontrado o no pertenece al usuario." });
      }
      res.status(200).json({ message: "Certificado eliminado con éxito." });
    } catch (err) {
      console.error("Error en deleteCertificado controller:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getTiposCertificadoPersona: async (req, res) => {
    try {
      const data = await model.getTiposCertificadoPersona();
      res.status(200).json({ data });
    } catch (err) {
      console.error("Error en getTiposCertificadoPersona controller:", err);
      res.status(500).json({ error: err.message });
    }
  }
};
