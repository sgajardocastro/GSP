const notfqueueModel = require("../models/notfqueueModel");
const notfqueue = new notfqueueModel();

module.exports = {
  createNotfqueue: async (req, res) => {
    try {
      const {
        id_user_target,
        id_template,
        json_data,
        channels,
        estado } = req.body;

      const out = await notfqueue.insertNotfqueue({
        id_user_target,
        id_template,
        json_data,
        channels,
        estado
      });

      res.status(201).json({ ok: true, id_notification: out.id_notification, created_at: out.created_at });
    } catch (e) {
      const status = e.status || 500;
      res.status(status).json({ ok: false, error: String(e.message || e) });
    }
  }
  
  ,

  putNotfqueueEstado: async (req, res) => {
    try {
      const { id_notifcation, estado} = req.body;

      const updated = await notfqueue.updNotfqueueEstado({ id_notifcation, estado } );

      res.status(200).json({ message: "Estado Notificacion actualizado correctamente", updated });
    } catch (err) {
      console.error("Error en putNotfqueueEstado:", err);
      res.status(500).json({ error: err.message });
    }
  }

}