const acreditacionModel = require('../models/acreditacionModel');

exports.getAcreditacionesKanban = async (req, res) => {
  try {
    const data = await acreditacionModel.getAcreditacionesKanban();
    res.status(200).json(data);
  } catch (error) {
    console.error("[ACREDITACION] Error obteniendo kanban:", error.message);
    res.status(500).json({ message: "Error al obtener acreditaciones", error: error.message });
  }
};

exports.getPersonalAcreditacion = async (req, res) => {
  try {
    const q = req.query.q || req.query.query || '';
    const data = await acreditacionModel.getPersonalAcreditacion(q);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    console.error("[ACREDITACION] Error obteniendo personal:", error.message);
    res.status(500).json({ message: "Error al obtener personal de acreditación", error: error.message });
  }
};

exports.getPersonalDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await acreditacionModel.getPersonalDetail(id);
    if (!data) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }
    res.status(200).json({ status: "success", data });
  } catch (error) {
    console.error("[ACREDITACION] Error obteniendo detalle de personal:", error.message);
    res.status(500).json({ message: "Error al obtener detalle de personal", error: error.message });
  }
};

exports.getPersonalByRut = async (req, res) => {
  try {
    const { rut } = req.params;
    const data = await acreditacionModel.getPersonalByRut(rut);
    if (!data) {
      return res.status(404).json({ message: "Trabajador no encontrado" });
    }
    res.status(200).json({ status: "success", data });
  } catch (error) {
    console.error("[ACREDITACION] Error obteniendo personal por RUT:", error.message);
    res.status(500).json({ message: "Error al obtener personal por RUT", error: error.message });
  }
};

exports.updatePersonalDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await acreditacionModel.updatePersonalDetail(id, req.body);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    console.error("[ACREDITACION] Error actualizando personal:", error.message);
    res.status(500).json({ message: "Error al actualizar personal", error: error.message });
  }
};

exports.addPersonalCertificado = async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await acreditacionModel.addPersonalCertificado(id, req.body);
    res.status(201).json({ status: "success", data: cert });
  } catch (error) {
    console.error("[ACREDITACION] Error vinculando certificado:", error.message);
    res.status(500).json({ message: "Error al vincular certificado", error: error.message });
  }
};

exports.getDetalleAcreditacion = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await acreditacionModel.getDetalleAcreditacion(id);
    if (!data) {
      return res.status(404).json({ message: "Acreditación no encontrada" });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("[ACREDITACION] Error obteniendo detalle:", error.message);
    res.status(500).json({ message: "Error al obtener detalle de acreditación", error: error.message });
  }
};

exports.subirDocumento = async (req, res) => {
  try {
    const { id_acreditacion_doc, id_doc } = req.body;
    if (!id_acreditacion_doc || !id_doc) {
      return res.status(400).json({ message: "id_acreditacion_doc e id_doc son requeridos" });
    }
    const doc = await acreditacionModel.subirDocumento(id_acreditacion_doc, id_doc);
    res.status(200).json({ message: "Documento subido correctamente", documento: doc });
  } catch (error) {
    console.error("[ACREDITACION] Error al subir documento:", error.message);
    res.status(500).json({ message: "Error al subir documento", error: error.message });
  }
};

exports.auditarDocumento = async (req, res) => {
  try {
    const { id_acreditacion_doc } = req.params;
    const { estado_doc, observacion_analista, id_user_analista } = req.body;

    if (!['APROBADO', 'RECHAZADO'].includes(estado_doc)) {
      return res.status(400).json({ message: "estado_doc debe ser APROBADO o RECHAZADO" });
    }

    const doc = await acreditacionModel.auditarDocumento(
      id_acreditacion_doc,
      estado_doc,
      observacion_analista,
      id_user_analista || req.user?.id_user
    );

    res.status(200).json({ message: `Documento ${estado_doc.toLowerCase()} por Analista de Gestión`, documento: doc });
  } catch (error) {
    console.error("[ACREDITACION] Error auditando documento:", error.message);
    res.status(500).json({ message: "Error al auditar documento", error: error.message });
  }
};
