const path = require('path');
const exportService = require('../services/exportService');
//const archivoController = require('./archivoController');
const archivoModel = require('../models/archivoModel');
const flujoModel = require('../models/flujoModel');
const archivoM = new archivoModel();
const flujoM = new flujoModel();
const { v4: uuidv4 } = require("uuid");
const fs = require('fs').promises;
const { generarPDF } = require('../services/exportService');
// const { TRANSMAC_DOCS_DIR } = require('../config/docsConfig');

async function generarYGuardarPDF(req, res) {
  try {
    const {
      idInspeccion,
      tipo_doc,
      mimetype,
      name_doc_interno,
      path_doc,
      id_user,
      estado
    } = req.body;

    if (!idInspeccion) {
      return res.status(400).json({ error: 'Falta idInspeccion' });
    }

    // 1. Generar PDF en el servidor
    const pdfPath = await exportService.generarPDF(idInspeccion);
    const generatedFileName = path.basename(pdfPath);
    const filename = `${uuidv4()}.pdf`;

    // 3️⃣ Calcular ruta en el Storage Engine
    const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
    const fsSync = require('fs');
    const path_relativo = buildStoragePath('GSP', 'surveys');
    const targetDir = path.join(STORAGE_ROOT, path_relativo);
    
    if (!fsSync.existsSync(targetDir)) {
      fsSync.mkdirSync(targetDir, { recursive: true });
    }

    const newPath = path.join(targetDir, filename);

    // 4️⃣ Renombrar (mover)
    await fs.rename(pdfPath, newPath);
    console.log('✅ Archivo movido a:', newPath);

    // 2. Guardar PDF en tfmg_file con Storage Engine

    const archivoData = {
      filePath: newPath,
      tipo_doc,
      mimetype,
      name_doc_orig: generatedFileName,
      name_doc_interno: filename,
      path_doc: path_relativo,
      id_user,
      estado
    };
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXArchivoData:', archivoData);
    // Guardar archivo y obtener id_doc
    
    const idDocIn = await archivoM.guardarArchivoDesdeRutaTransaccional(archivoData);
    console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXidDocIn:', idDocIn);

    
    // 3. Instanciar flujo de aprobación
     console.log('Va a iniciar flujoModel');
    const resultFlujo = await flujoM.instanciarFlujo({ idSurvey: idInspeccion, idDocIn }); 

    if (!resultFlujo.success) {
      throw new Error(resultFlujo.error);
    }

    res.json({
      status: true,
      message: 'PDF generado, guardado e instanciado el flujo correctamente.',
      path: newPath,
      idFlow: resultFlujo.idFlow
    });

  } catch (error) {
    console.error('❌ Error en generarYGuardarPDF:', error);
    res.status(500).json({ error: error.message });
  } finally {
    console.log('generarYGuardarPDF Terminado');
  }
}
async function generarYGuardarPDF2({ body }) {
  try {
    const {
      idInspeccion,
      tipo_doc,
      mimetype,
      name_doc_interno,
      path_doc,
      id_user,
      estado,
      filename
    } = body;

    if (!idInspeccion) {
      throw new Error('Falta idInspeccion');
    }

    // 1. Generar PDF en el servidor
    const pdfPath = await exportService.generarPDF(idInspeccion);
    const generatedFileName = path.basename(pdfPath);

    // 2. Calcular ruta en Storage Engine
    const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
    const path_relativo = buildStoragePath('global', 'reportes');
    const targetDir = path.join(STORAGE_ROOT, path_relativo);
    
    if (!require('fs').existsSync(targetDir)) {
      require('fs').mkdirSync(targetDir, { recursive: true });
    }

    const newPath = path.join(targetDir, filename);
    await fs.rename(pdfPath, newPath);
    console.log('✅ Archivo movido a:', newPath);

    // 3. Guardar en base de datos
    const archivoData = {
      filePath: newPath,
      tipo_doc,
      mimetype,
      name_doc_orig: generatedFileName,
      name_doc_interno: filename,
      path_doc: path_relativo,
      id_user,
      estado
    };
    console.log('📄 Datos archivo:', archivoData);

    const idDocIn = await archivoM.guardarArchivoDesdeRutaTransaccional(archivoData);
    console.log('📦 ID doc insertado:', idDocIn);

    // 4. Instanciar flujo
    //const resultFlujo = await flujoM.instanciarFlujo({ idSurvey: idInspeccion, idDocIn });

    /*if (!resultFlujo.success) {
      throw new Error(resultFlujo.error);
    }*/

    return {
      status: true,
      path: newPath,
      idDoc: idDocIn
    };

  } catch (error) {
    console.error('❌ Error en generarYGuardarPDF2:', error);
    return { status: false, error: error.message };
  }
}
/**
 * 🔹 FUNCIÓN CORE REUTILIZABLE
 * NO usa req/res → se puede llamar desde servicios (como enrolamientoService)
 *
 * Puede recibir:
 *  - generarYGuardarPDFCore(960)
 *  - generarYGuardarPDFCore({ idInspeccion: 960, tipo_doc: 'X', mimetype: 'Y', id_user: 1, estado: 'A' })
 */
async function generarYGuardarPDFCore(input) {
  let idInspeccion, tipo_doc, mimetype, id_user, estado;

  // Soporte antiguo: solo idInspeccion (número/string)
  if (typeof input === 'number' || typeof input === 'string') {
    idInspeccion = input;
    tipo_doc = 'PDF_GENERADO';
    mimetype = 'application/pdf';
    id_user = null;
    estado = 'A';
  } else if (input && typeof input === 'object') {
    ({
      idInspeccion,
      tipo_doc = 'PDF_GENERADO',
      mimetype = 'application/pdf',
      id_user = null,
      estado = 'A'
    } = input);
  }

  if (!idInspeccion) {
    throw new Error('Falta idInspeccion en generarYGuardarPDFCore');
  }

  console.log('📄 [generarYGuardarPDFCore] Generando PDF para', idInspeccion);

  // 1) Generar PDF físico (nombre tipo idInspeccion-YYYYMMDD_HHMMSS.pdf)
  const pdfPath = await exportService.generarPDF(idInspeccion);
  const generatedFileName = path.basename(pdfPath); // nombre original generado

  // 2) Renombrar a UUID en Storage Engine
  const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
  const moduloName = (typeof input === 'object' && input.modulo) ? input.modulo : 'enrolamiento';
  const path_relativo = buildStoragePath(process.env.TENANT_CODE || 'GSP', moduloName, process.env.APP_ENV || 'dev');
  const targetDir = path.join(STORAGE_ROOT, path_relativo);
  
  if (!require('fs').existsSync(targetDir)) {
    require('fs').mkdirSync(targetDir, { recursive: true });
  }

  const filename = `${uuidv4()}.pdf`;
  const newPath = path.join(targetDir, filename);

  await fs.rename(pdfPath, newPath);
  console.log('✅ [generarYGuardarPDFCore] Archivo movido a:', newPath);

  // 3) Registrar en tfmg_file
  const archivoData = {
    filePath: newPath,
    tipo_doc,
    mimetype,
    name_doc_orig: generatedFileName, // nombre original generado por puppeteer
    name_doc_interno: filename,       // 🔴 ESTE es el UUID
    path_doc: path_relativo,
    id_user,
    estado
  };

  const idDocIn = await archivoM.guardarArchivoDesdeRutaTransaccional(archivoData);

  return {
    id_doc: idDocIn,
    path_doc: path_relativo,
    name_doc_interno: filename,       // UUID
    name_doc_orig: generatedFileName  // original
  };
}

module.exports = { generarYGuardarPDF, generarYGuardarPDF2, generarYGuardarPDFCore };