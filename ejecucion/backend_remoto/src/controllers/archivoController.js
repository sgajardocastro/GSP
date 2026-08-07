const fs = require('fs');
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const archivoModel = require("../models/archivoModel");
const archivoM = new archivoModel();
const LEAN_DOCS_BASE_DIR = process.env.STORAGE_ROOT || '/u05/LeanDocs';
const normalizeDocsDir = (dir) => {
  if (!dir) return LEAN_DOCS_BASE_DIR;
  return dir.startsWith('/') ? dir : path.join(LEAN_DOCS_BASE_DIR, dir);
};
const resolvePublicDocsFolder = (folder) => folder || '';
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
        // Fallback de compatibilidad legacy: si la ruta dura /archivo/transmac/UUID.pdf no existe físicamente, buscar en DB por id_doc
        const possibleId = nombreFull.replace(/\.[^/.]+$/, "");
        const archivoDb = await archivoM.getArchivoById(possibleId);
        if (archivoDb) {
          req.params.id = possibleId;
          return module.exports.verArchivoById(req, res);
        }
        return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
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
      if (!id) return res.status(400).send('ID de archivo no proporcionado');

      const cleanId = String(id).replace(/\.[^/.]+$/, '');
      
      // Si el ID corresponde a una encuesta (id_survey) en tsrv_survey, generar y servir el PDF de la inspección en caliente
      if (!isNaN(cleanId)) {
        try {
          const pool = require('../config/postgresPool');
          const survResult = await pool.query('SELECT id_survey FROM tsrv_survey WHERE id_survey = $1 LIMIT 1', [cleanId]);
          if (survResult.rows.length > 0) {
            const exportService = require('../services/exportService');
            const pdfPath = await exportService.generarPDF(cleanId);
            if (pdfPath && fs.existsSync(pdfPath)) {
              res.setHeader('Content-Type', 'application/pdf');
              return res.sendFile(pdfPath);
            }
          }
        } catch (errSurv) {
          console.warn(`⚠️ No se pudo generar PDF en caliente para id_survey ${cleanId}:`, errSurv.message);
        }
      }

      let archivo;
      if (!isNaN(cleanId)) {
        archivo = await archivoM.getArchivoById(cleanId);
      }
      if (!archivo) {
        const pool = require('../config/postgresPool');
        const sql = 'SELECT * FROM tfmg_file WHERE name_doc_interno = $1 OR name_doc_interno LIKE $2 OR id_doc::text = $3 LIMIT 1';
        const result = await pool.query(sql, [id, `%${cleanId}%`, cleanId]);
        archivo = result.rows[0];
      }

      if (!archivo) return res.status(404).send('Archivo no encontrado en la base de datos');
      
      const { resolveStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
      
      const possibleNames = [
        archivo.name_doc_interno,
        archivo.name_doc_interno ? archivo.name_doc_interno.replace(/\.pdf$/i, '.PDF') : null,
        archivo.name_doc_interno ? archivo.name_doc_interno.replace(/\.PDF$/, '.pdf') : null,
        archivo.name_doc_orig,
        archivo.name_doc_orig ? archivo.name_doc_orig.replace(/\s+/g, '_') : null
      ].filter(Boolean);

      let fullPath = '';
      for (const nameCandidate of possibleNames) {
        const candidatePath = resolveStoragePath(archivo.path_doc || '', nameCandidate);
        if (fs.existsSync(candidatePath)) {
          fullPath = candidatePath;
          break;
        }
        const cleanSubfolder = String(archivo.path_doc || '').replace(/^gsp\/?/i, '');
        const directSubfolderPath = path.join(STORAGE_ROOT, cleanSubfolder, nameCandidate);
        if (fs.existsSync(directSubfolderPath)) {
          fullPath = directSubfolderPath;
          break;
        }
        const publicPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', nameCandidate);
        if (fs.existsSync(publicPath)) {
          fullPath = publicPath;
          break;
        }
      }

      if (!fullPath || !fs.existsSync(fullPath)) {
        // Fallback: si el archivo original tiene un nombre de encuesta (ej: "205-20260804_214625.pdf"), regenerar el PDF en caliente con Puppeteer
        const origName = archivo.name_doc_orig || archivo.name_doc_interno || '';
        const surveyMatch = origName.match(/^(\d+)-/);
        if (surveyMatch && surveyMatch[1]) {
          try {
            const exportService = require('../services/exportService');
            const genPath = await exportService.generarPDF(surveyMatch[1]);
            if (genPath && fs.existsSync(genPath)) {
              res.setHeader('Content-Type', 'application/pdf');
              return res.sendFile(genPath);
            }
          } catch (errGen) {
            console.error(`⚠️ Error regenerando PDF para encuesta ${surveyMatch[1]}:`, errGen);
          }
        }
        console.error(`❌ Archivo físico no encontrado para ID ${id}. Probado en: ${fullPath}`);
        return res.status(404).send(`El archivo físico (${archivo.name_doc_orig || archivo.name_doc_interno}) no se encuentra en la ruta esperada del servidor`);
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
