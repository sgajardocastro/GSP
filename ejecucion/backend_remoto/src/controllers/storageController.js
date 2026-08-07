const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const archivoModel = require('../models/archivoModel');
const archivoM = new archivoModel();
const pool = require('../config/postgresPool');
const { buildStoragePath, resolveStoragePath, STORAGE_ROOT } = require('../config/storageConfig');

module.exports = {
  upload: async (req, res) => {
    try {
      if (!req.files || (!req.files.archivo && !req.files.file)) {
        return res.status(400).json({ status: false, message: 'No se recibió ningún archivo.' });
      }

      const archivo = req.files.archivo || req.files.file;
      const {
        tenant_code = 'global',
        modulo = 'general',
        app_env = 'dev',
        tipo_doc,
        mimetype,
        name_doc_orig,
        id_user,
        estado = 'A'
      } = req.body;

      const extension = path.extname(archivo.name);
      const filename = `${uuidv4()}${extension}`;
      const path_relativo = buildStoragePath(tenant_code, modulo, app_env);
      
      const targetDir = path.join(STORAGE_ROOT, path_relativo);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filepath = path.join(targetDir, filename);
      await archivo.mv(filepath);

      // We need to use tfmg_file but we must supply path_relativo.
      // Wait, let's adapt it to the existing insert function or create a new one.
      // For now, I'll use the existing `insertarTfmgFile` and pass path_relativo as path_doc
      const archivoCreado = await archivoM.insertarTfmgFile(
        tipo_doc || 'GENERICO',
        mimetype || archivo.mimetype,
        name_doc_orig || archivo.name,
        filename,
        path_relativo,
        id_user || null,
        estado
      );

      res.status(201).json({
        status: true,
        message: 'Archivo almacenado exitosamente',
        data: {
          id_doc: archivoCreado.id_doc,
          name_doc_orig: archivoCreado.name_doc_orig,
          name_doc_interno: archivoCreado.name_doc_interno,
          mimetype: archivoCreado.mimetype,
          path_relativo: archivoCreado.path_doc,
          url_view: `/api/v1/storage/view/${archivoCreado.id_doc}`,
          url_download: `/api/v1/storage/download/${archivoCreado.id_doc}`
        }
      });
    } catch (err) {
      console.error('Error en upload:', err);
      res.status(500).json({ status: false, error: err.message });
    }
  },

  view: async (req, res) => {
    const archivoController = require('./archivoController');
    return archivoController.verArchivoById(req, res);
  },

  download: async (req, res) => {
    try {
      const { id } = req.params;
      const archivo = await archivoM.getArchivoById(id);
      if (!archivo) return res.status(404).send('Archivo no encontrado');

      let fullPath = resolveStoragePath(archivo.path_doc || '', archivo.name_doc_interno);

      if (!fs.existsSync(fullPath)) {
        const legacyPath = path.join('/u05/LeanDocs', archivo.path_doc || '', archivo.name_doc_interno);
        if (fs.existsSync(legacyPath)) {
            fullPath = legacyPath;
        }
      }

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('El archivo físico no se encuentra en el servidor');
      }

      res.setHeader('Content-Disposition', `attachment; filename="${archivo.name_doc_orig}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.sendFile(fullPath);
    } catch (err) {
      console.error("Error en download:", err);
      res.status(500).send("Error al descargar archivo: " + err.message);
    }
  }
};
