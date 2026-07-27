const messageModel = require("../models/messageModel");
const message = new messageModel();

module.exports = {
  postMessage: async (req, res) => {
    try {
      const { para, asunto, cuerpo } = req.body;

      if (!para || !asunto || !cuerpo) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      const resultado = await message.enviarYRegistrarCorreo({ para, asunto, cuerpo });
      res.status(200).json({ message: resultado });
    } catch (err) {
      console.error("❌ Error en postMessage:", err);
      res.status(500).json({ error: "Error al enviar el correo" });
    }
  }
};