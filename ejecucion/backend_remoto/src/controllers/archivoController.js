const fs = require('fs');
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const archivoModel = require("../models/archivoModel");
const archivoM = new archivoModel();
const {
  LEAN_DOCS_BASE_DIR,
  normalizeDocsDir,
  resolvePublicDocsFolder
} = require("../config/docsConfig");

const baseDir = `${LEAN_DOCS_BASE_DIR}/`;

module.exports = {
  postArchivo: async (req, res) => {
    try {
      if (req.filePath) {
        const {
          tipo_doc,
          mimetype = 'application/pdf',
          name_doc_orig = path.basename(req.filePath),
          name_doc_interno = '',
          path_doc,
          id_user,
          estado
        } = req.body;

        const filename = path.basename(req.filePath);
        const targetDir = normalizeDocsDir(path_doc || path.dirname(req.filePath));

        const archivoCreado = await archivoM.insertarTfmgFile(
          tipo_doc,
          mimetype,
          name_doc_orig,
          name_doc_interno || filename,
          targetDir,
          id_user,
          estado
        );

        return res.status(201).json({ message: "Archivo creado correctamente (filePath)", archivo: archivoCreado });
      }

      if (!req.files || !req.files.archivo) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
      }

      const {
        tipo_doc,
        mimetype,
        name_doc_orig,
        path_doc,
        id_user,
        estado
      } = req.body;

      const archivo = req.files.archivo;
      const extension = path.extname(archivo.name);
      const filename = `${uuidv4()}${extension}`;
      const targetDir = normalizeDocsDir(path_doc);
      const filepath = path.join(targetDir, filename);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      await archivo.mv(filepath);

      const archivoCreado = await archivoM.insertarTfmgFile(
        tipo_doc,
        mimetype,
        name_doc_orig,
        filename,
        targetDir,
        id_user,
        estado
      );

      res.status(201).json({ message: "Archivo creado correctamente", server_uploaded_at: new Date().toISOString(), archivo: archivoCreado});
    } catch (err) {
      console.error("Error en postArchivo:", err);
      res.status(500).json({ error: err.message });
    }
  },

    postArchivoImagen: async (req, res) => {
    try {
      if (!req.files || !req.files.archivo) {
        return res.status(400).send({
          status: false,
          message: 'No se recibió ningún archivo.'
        });
      }

      const {
        tipo_doc,
        mimetype,
        name_doc_orig,
        path_doc,
        id_user,
        estado
      } = req.body;

      const baseDir = "/u05/LeanDocs/";
      const archivo = req.files.archivo;
      const path = require('path');
      const fs = require('fs');
      const { v4: uuidv4 } = require('uuid');
      const extension = path.extname(archivo.name);
      const filename = uuidv4() + extension;

      // Determinar directorio de destino absoluto
      let targetDir = baseDir;
      if (path_doc) {
        targetDir = path_doc.startsWith(baseDir) ? path_doc : path.join(baseDir, path_doc);
      }

      // Asegurar que el directorio existe
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filepath = path.join(targetDir, filename);
      await archivo.mv(filepath);
      
      const archivoCreado = await archivoM.insertarTfmgFile(
        tipo_doc,
        mimetype || archivo.mimetype,
        name_doc_orig || archivo.name,
        filename,
        targetDir,
        id_user,
        estado || 'ACTIVO'
      );

      res.status(201).json({ 
        message: "Archivo creado correctamente", 
        server_uploaded_at: new Date().toISOString(), 
        archivo: archivoCreado
      });
    } catch (err) {
      console.error("Error en postArchivoImagen:", err);
      res.status(500).json({ error: err.message });
    }
  },

  guardarArchivoDesdeRuta: async (data) => {
    try {
      const {
        filePath,
        tipo_doc,
        mimetype,
        name_doc_orig,
        path_doc,
        id_user,
        estado
      } = data;

      if (!filePath) {
        throw new Error('No se recibió ningún archivo.');
      }

      const extension = path.extname(filePath) || '.pdf';
      const filename = `${uuidv4()}${extension}`;
      const targetDir = normalizeDocsDir(path_doc);
      const destino = path.join(targetDir, filename);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.copyFileSync(filePath, destino);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const archivoCreado = await archivoM.insertarTfmgFile(
        tipo_doc,
        mimetype,
        path.basename(filePath),
        filename,        
        targetDir,
        id_user,
        estado
      );

      return archivoCreado;
    } catch (error) {
      console.error('❌ Error en guardarArchivoDesdeRuta:', error);
      throw error;
    }
  },

  getArchivo: async (req, res) => {
    try {
      const { subcarpeta } = req.params;
      const nombreFull = req.params[0] || req.params.nombre;

      if (!nombreFull) {
        return res.status(400).json({ error: 'Nombre de archivo no especificado' });
      }

      const publicFolder = resolvePublicDocsFolder(subcarpeta);
      const filePath = path.join(baseDir, publicFolder, nombreFull);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      res.sendFile(filePath);
    } catch (err) {
      console.error("Error al obtener archivo:", err);
      res.status(500).json({ error: err.message });
    }
  },

  postCnxLoad: async (req, res) => {
    try {
      const {
        id_doc,
        id_user,
        fecha_proyectada_ejecucion,
        cant_total_excel,
        cant_cargados = 0,
        cant_rechazados = 0,
        flag_recarga = false,
        geoloc_lat = null,
        geoloc_lng = null,
        estado_carga = null,
        observaciones = null
      } = req.body;

      if (!id_doc || !id_user || !fecha_proyectada_ejecucion || cant_total_excel === undefined) {
        return res.status(400).json({ status: false, message: "Faltan campos obligatorios" });
      }

      const loadCreado = await archivoM.insertarTfmgCnxLoad({
        id_doc,
        id_user,
        fecha_proyectada_ejecucion: String(fecha_proyectada_ejecucion).slice(0, 10),
        cant_total_excel,
        cant_cargados,
        cant_rechazados,
        flag_recarga: !!flag_recarga,
        geoloc_lat,
        geoloc_lng,
        estado_carga,
        observaciones
      });

      return res.status(201).json({ status: true, message: "Carga registrada", load: loadCreado });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  getArchivoById: async (req, res) => {
    try {
      const { id } = req.params;
      const archivo = await archivoM.getArchivoById(id);
      if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado' });
      res.status(200).json({ data: archivo });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  verArchivoById: async (req, res) => {
    try {
      const { id } = req.params;
      const archivo = await archivoM.getArchivoById(id);
      if (!archivo) return res.status(404).send('Archivo no encontrado');
      
      const fullPath = path.join(archivo.path_doc, archivo.name_doc_interno);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('El archivo físico no se encuentra en el servidor');
      }

      if (archivo.mimetype) {
        res.setHeader('Content-Type', archivo.mimetype);
      }
      res.sendFile(fullPath);
    } catch (err) {
      console.error("Error en verArchivoById:", err);
      res.status(500).send("Error al abrir archivo: " + err.message);
    }
  }
};
