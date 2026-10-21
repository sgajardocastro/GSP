const path = require('path');
const fs = require('fs');
const pool = require('../config/postgresPool');
const actaPlataformaModel = require('../models/actaPlataformaModel');
const archivoModel = require('../models/archivoModel');
const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
const { generarPdfActaPlataforma } = require('../services/actaPlataformaPdfService');

const archivoM = new archivoModel();

function saveBase64Image(dataUri, targetDir, fileNamePrefix) {
  if (!dataUri || !dataUri.includes('base64,')) return null;
  const matches = dataUri.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  
  const ext = matches[1].includes('png') ? 'png' : 'jpg';
  const buffer = Buffer.from(matches[2], 'base64');
  const fileName = `${fileNamePrefix}_${Date.now()}.${ext}`;
  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return { fileName, filePath, mimeType: matches[1] };
}

async function obtenerDataUriDesdeDoc(idDoc) {
  if (!idDoc) return null;
  try {
    const { rows } = await pool.query('SELECT * FROM tfmg_file WHERE id_doc = $1', [idDoc]);
    const doc = rows[0];
    if (!doc) return null;
    const { resolveStoragePath } = require('../config/storageConfig');
    const fullPath = resolveStoragePath(doc.path_doc, doc.name_doc_interno || doc.name_doc_orig);
    if (fs.existsSync(fullPath)) {
      const buf = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const mime = ext.includes('png') ? 'image/png' : (ext.includes('svg') ? 'image/svg+xml' : 'image/jpeg');
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  } catch (e) {
    console.warn(`No se pudo leer id_doc ${idDoc} para Data URI:`, e.message);
  }
  return null;
}

const actaPlataformaController = {
  async getActaPorProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) return res.status(400).json({ error: 'id_proyecto es requerido' });

      const acta = await actaPlataformaModel.getActaByProyecto(id_proyecto);
      return res.status(200).json({
        success: true,
        acta: acta || null,
        url_pdf_entrega: acta?.id_file_pdf_entrega ? `/api/archivo/ver/${acta.id_file_pdf_entrega}` : null,
        url_pdf_final: acta?.id_file_pdf_final ? `/api/archivo/ver/${acta.id_file_pdf_final}` : null
      });
    } catch (err) {
      console.error('Error en getActaPorProyecto:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async guardarEntrega(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        id_camion,
        id_desplazamiento_ida,
        numero_contrato,
        horometro_in,
        combustible_in,
        checklist_entrega,
        fotos_entrega = [],
        obs_entrega,
        receptor_entrega_nombre,
        receptor_entrega_rut,
        receptor_entrega_cargo,
        firma_entrega_base64
      } = req.body;

      if (!id_proyecto || !id_equipo) {
        return res.status(400).json({ error: 'id_proyecto e id_equipo son obligatorios' });
      }

      // 1. Obtener datos del proyecto y cliente
      const pryRes = await pool.query(`
        SELECT p.*, e.razon_social AS cliente_nombre, COALESCE(e.rut_empresa, '') AS cliente_rut
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
        WHERE p.id_proyecto = $1
      `, [id_proyecto]);
      const pry = pryRes.rows[0];
      if (!pry) return res.status(404).json({ error: 'Proyecto no encontrado' });

      const jf = pry.json_field || {};
      const crm = jf.crm_v1 || {};

      // 2. Resolver empresa emisora y logo
      const idEmisora = Number(pry.id_empresa || pry.id_empresa_emisora || 7);
      const EMISORES = {
        7: { nombre: 'SOCIEDAD BESTMAQ LIMITADA', rut: '76.209.534-3', logoPath: 'logo-bestmaq.png' },
        11: { nombre: 'ARRIENDO ROYAL RENTAL LIMITADA', rut: '78.254.535-3', logoPath: 'logo-royalrental.png' },
        9: { nombre: 'LUIS OMAR GHISELLINI JARA E.I.R.L. (GRÚAS SAN PABLO)', rut: '52.004.162-1', logoPath: 'logo-sanpablo.png' },
        8: { nombre: 'LOGÍSTICA DEL SUR LTDA.', rut: '76.218.576-8', logoPath: 'logo-logisticadelsur.png' }
      };
      const emisor = EMISORES[idEmisora] || EMISORES[7];
      let logoBase64 = '';
      try {
        const logoDisk = path.join(process.cwd(), 'public', emisor.logoPath);
        if (fs.existsSync(logoDisk)) {
          logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoDisk).toString('base64');
        }
      } catch (_) {}

      // 3. Obtener datos de la plataforma y camión
      const eqRes = await pool.query(`SELECT * FROM tequ_equipo WHERE id_equipo = $1`, [id_equipo]);
      const equipoObj = eqRes.rows[0] || {};

      // 4. Preparar directorio de almacenamiento en disco
      const relDir = buildStoragePath('GSP', 'actas', process.env.APP_ENV || 'dev');
      const targetDir = path.join(STORAGE_ROOT, relDir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      // 5. Guardar fotos de entrega en disco y en tfmg_file
      const fotosProcesadas = [];
      for (let i = 0; i < fotos_entrega.length; i++) {
        const f = fotos_entrega[i];
        const dataUri = f.url_data || f.data || (typeof f === 'string' ? f : null);
        if (dataUri) {
          const imgSaved = saveBase64Image(dataUri, targetDir, `foto_ent_${i + 1}`);
          if (imgSaved) {
            const docFile = await archivoM.insertarTfmgFile(
              'EVIDENCIA_FOTOGRAFICA',
              imgSaved.mimeType,
              imgSaved.fileName,
              imgSaved.fileName,
              relDir,
              req.user?.id_user || null,
              'A'
            );
            fotosProcesadas.push({
              id_doc: docFile.id_doc,
              label: f.label || `Foto ${i + 1}`,
              url_path: `/api/archivo/ver/${docFile.id_doc}`,
              url_data: dataUri // para inyectar directo en el PDF sin lag
            });
          }
        }
      }

      // 6. Guardar firma en disco y tfmg_file
      let idDocFirma = null;
      if (firma_entrega_base64) {
        const firmaSaved = saveBase64Image(firma_entrega_base64, targetDir, 'firma_entrega_cliente');
        if (firmaSaved) {
          const docFirma = await archivoM.insertarTfmgFile(
            'FIRMA',
            firmaSaved.mimeType,
            firmaSaved.fileName,
            firmaSaved.fileName,
            relDir,
            req.user?.id_user || null,
            'A'
          );
          idDocFirma = docFirma.id_doc;
        }
      }

      // 7. Generar folio correlativo
      const folio = await actaPlataformaModel.generarFolioActa(id_proyecto);

      // 8. Compilar PDF oficial de Entrega
      const pdfPayload = {
        folio_acta: folio,
        numero_contrato: numero_contrato || 'S/N',
        fecha_emision: new Date().toLocaleDateString('es-CL'),
        empresa: { ...emisor, logoBase64 },
        cliente: {
          razon_social: pry.cliente_nombre || crm.razon_social || pry.nombre_proyecto,
          rut: pry.cliente_rut || crm.rut_cliente || '',
          obra: crm.obra_nombre || pry.nombre_proyecto || 'Faena Operacional',
          direccion: crm.obra_direccion || '',
          contacto: receptor_entrega_nombre || 'Supervisor Faena'
        },
        equipo: equipoObj,
        horometro_in,
        combustible_in: combustible_in || '4/4 (Lleno)',
        checklist_entrega,
        checklist_retiro: [],
        fotos_entrega: fotosProcesadas,
        fotos_retiro: [],
        obs_entrega,
        obs_retiro: '',
        receptor_entrega: {
          nombre: receptor_entrega_nombre,
          rut: receptor_entrega_rut,
          cargo: receptor_entrega_cargo,
          firma_base64: firma_entrega_base64
        },
        receptor_retiro: {},
        chofer_entrega: {
          nombre: req.user?.nombre_user || 'Chofer Asignado',
          rut: req.user?.rut_user || ''
        },
        chofer_retiro: {},
        es_retiro: false
      };

      const pdfBuffer = await generarPdfActaPlataforma(pdfPayload);
      const pdfFileName = `${folio}_ENTREGA.pdf`;
      const pdfPath = path.join(targetDir, pdfFileName);
      fs.writeFileSync(pdfPath, pdfBuffer);

      const docPdf = await archivoM.insertarTfmgFile(
        'ACTA_ENTREGA',
        'application/pdf',
        pdfFileName,
        pdfFileName,
        relDir,
        req.user?.id_user || null,
        'A'
      );

      // 9. Guardar en tope_acta_plataforma
      const actaGuardada = await actaPlataformaModel.guardarEntrega({
        id_proyecto,
        id_equipo_plataforma: id_equipo,
        id_camion_traslado: id_camion,
        id_desplazamiento_ida,
        folio_acta: folio,
        numero_contrato,
        id_chofer_entrega: req.user?.id_user || null,
        horometro_in,
        combustible_in,
        checklist_entrega,
        fotos_entrega: fotosProcesadas.map(f => ({ label: f.label, url_path: f.url_path, id_doc: f.id_doc })),
        obs_entrega,
        receptor_entrega_nombre,
        receptor_entrega_rut,
        receptor_entrega_cargo,
        id_file_firma_entrega: idDocFirma,
        id_file_pdf_entrega: docPdf.id_doc
      });

      // 10. Actualizar flag en tpry_proyecto.json_field para retrocompatibilidad
      if (!jf.ejecucion_v1) jf.ejecucion_v1 = {};
      jf.ejecucion_v1.acta_plataforma_360 = {
        id_acta: actaGuardada.id_acta,
        folio: folio,
        estado: 'ENTREGADA',
        url_pdf: `/api/archivo/ver/${docPdf.id_doc}`,
        id_doc_pdf: docPdf.id_doc,
        fecha_entrega: new Date().toISOString()
      };
      await pool.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jf, id_proyecto]);

      return res.status(200).json({
        success: true,
        message: `Acta de Entrega ${folio} emitida y almacenada con éxito.`,
        acta: actaGuardada,
        url_pdf: `/api/archivo/ver/${docPdf.id_doc}`
      });
    } catch (err) {
      console.error('Error en guardarEntrega:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async guardarRetiro(req, res) {
    try {
      const {
        id_proyecto,
        id_desplazamiento_retorno,
        horometro_out,
        combustible_out,
        checklist_retiro,
        fotos_retiro = [],
        obs_retiro,
        receptor_retiro_nombre,
        receptor_retiro_rut,
        receptor_retiro_cargo,
        firma_retiro_base64
      } = req.body;

      if (!id_proyecto) return res.status(400).json({ error: 'id_proyecto es obligatorio' });

      // 1. Obtener acta previa
      const actaPrevia = await actaPlataformaModel.getActaByProyecto(id_proyecto);
      if (!actaPrevia) return res.status(404).json({ error: 'No existe Acta de Entrega previa para este proyecto' });

      // 2. Directorio
      const relDir = buildStoragePath('GSP', 'actas', process.env.APP_ENV || 'dev');
      const targetDir = path.join(STORAGE_ROOT, relDir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      // 3. Procesar fotos de retiro
      const fotosProcesadas = [];
      for (let i = 0; i < fotos_retiro.length; i++) {
        const f = fotos_retiro[i];
        const dataUri = f.url_data || f.data || (typeof f === 'string' ? f : null);
        if (dataUri) {
          const imgSaved = saveBase64Image(dataUri, targetDir, `foto_ret_${i + 1}`);
          if (imgSaved) {
            const docFile = await archivoM.insertarTfmgFile(
              'EVIDENCIA_FOTOGRAFICA',
              imgSaved.mimeType,
              imgSaved.fileName,
              imgSaved.fileName,
              relDir,
              req.user?.id_user || null,
              'A'
            );
            fotosProcesadas.push({
              id_doc: docFile.id_doc,
              label: f.label || `Foto Retiro ${i + 1}`,
              url_path: `/api/archivo/ver/${docFile.id_doc}`,
              url_data: dataUri
            });
          }
        }
      }

      // 4. Guardar firma retiro
      let idDocFirmaRetiro = null;
      if (firma_retiro_base64) {
        const firmaSaved = saveBase64Image(firma_retiro_base64, targetDir, 'firma_retiro_cliente');
        if (firmaSaved) {
          const docFirma = await archivoM.insertarTfmgFile(
            'FIRMA',
            firmaSaved.mimeType,
            firmaSaved.fileName,
            firmaSaved.fileName,
            relDir,
            req.user?.id_user || null,
            'A'
          );
          idDocFirmaRetiro = docFirma.id_doc;
        }
      }

      // 5. Compilar PDF Oficial Final (2 Columnas)
      const pryRes = await pool.query(`
        SELECT p.*, e.razon_social AS cliente_nombre, COALESCE(e.rut_empresa, '') AS cliente_rut
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
        WHERE p.id_proyecto = $1
      `, [id_proyecto]);
      const pry = pryRes.rows[0] || {};
      const crm = pry.json_field?.crm_v1 || {};

      // Resolver emisor y logo
      const idEmisora = Number(pry.id_empresa || pry.id_empresa_emisora || 7);
      const EMISORES = {
        7: { nombre: 'SOCIEDAD BESTMAQ LIMITADA', rut: '76.209.534-3', logoPath: 'logo-bestmaq.png' },
        11: { nombre: 'ARRIENDO ROYAL RENTAL LIMITADA', rut: '78.254.535-3', logoPath: 'logo-royalrental.png' },
        9: { nombre: 'LUIS OMAR GHISELLINI JARA E.I.R.L. (GRÚAS SAN PABLO)', rut: '52.004.162-1', logoPath: 'logo-sanpablo.png' },
        8: { nombre: 'LOGÍSTICA DEL SUR LTDA.', rut: '76.218.576-8', logoPath: 'logo-logisticadelsur.png' }
      };
      const emisor = EMISORES[idEmisora] || EMISORES[7];
      let logoBase64 = '';
      try {
        const logoDisk = path.join(process.cwd(), 'public', emisor.logoPath);
        if (fs.existsSync(logoDisk)) {
          logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoDisk).toString('base64');
        }
      } catch (_) {}

      // Hidratar fotos de entrega desde disco para que Puppeteer las renderice
      const fotosEntregaHidratadas = [];
      const fotosPrevias = Array.isArray(actaPrevia.fotos_entrega) ? actaPrevia.fotos_entrega : [];
      for (const f of fotosPrevias) {
        const dataUri = f.url_data || (f.id_doc ? await obtenerDataUriDesdeDoc(f.id_doc) : null);
        fotosEntregaHidratadas.push({
          ...f,
          url_data: dataUri || f.url_path
        });
      }

      // Hidratar firma de entrega desde disco
      const firmaEntregaDataUri = actaPrevia.id_file_firma_entrega
        ? await obtenerDataUriDesdeDoc(actaPrevia.id_file_firma_entrega)
        : null;

      const pdfPayload = {
        folio_acta: actaPrevia.folio_acta,
        numero_contrato: actaPrevia.numero_contrato || 'S/N',
        fecha_emision: new Date().toLocaleDateString('es-CL'),
        empresa: { ...emisor, logoBase64 },
        cliente: {
          razon_social: pry.cliente_nombre || crm.razon_social || pry.nombre_proyecto,
          rut: pry.cliente_rut || crm.rut_cliente || '',
          obra: crm.obra_nombre || pry.nombre_proyecto,
          direccion: crm.obra_direccion || '',
          contacto: receptor_retiro_nombre || actaPrevia.receptor_entrega_nombre
        },
        equipo: {
          marca: actaPrevia.equipo_marca,
          modelo: actaPrevia.equipo_modelo,
          patente: actaPrevia.equipo_patente,
          tipo_equipo: actaPrevia.equipo_tipo
        },
        horometro_in: actaPrevia.horometro_in,
        combustible_in: actaPrevia.combustible_in,
        horometro_out,
        combustible_out: combustible_out || '4/4 (Lleno)',
        checklist_entrega: actaPrevia.checklist_entrega || [],
        checklist_retiro,
        fotos_entrega: fotosEntregaHidratadas,
        fotos_retiro: fotosProcesadas,
        obs_entrega: actaPrevia.obs_entrega,
        obs_retiro,
        receptor_entrega: {
          nombre: actaPrevia.receptor_entrega_nombre,
          rut: actaPrevia.receptor_entrega_rut,
          cargo: actaPrevia.receptor_entrega_cargo,
          firma_base64: firmaEntregaDataUri
        },
        receptor_retiro: {
          nombre: receptor_retiro_nombre,
          rut: receptor_retiro_rut,
          cargo: receptor_retiro_cargo,
          firma_base64: firma_retiro_base64
        },
        chofer_entrega: {
          nombre: actaPrevia.chofer_entrega_nombre || 'Chofer Asignado',
          rut: actaPrevia.chofer_entrega_rut || ''
        },
        chofer_retiro: {
          nombre: req.user?.nombre_user || 'Chofer Retiro',
          rut: req.user?.rut_user || ''
        },
        es_retiro: true
      };

      const pdfBuffer = await generarPdfActaPlataforma(pdfPayload);
      const pdfFileName = `${actaPrevia.folio_acta}_FINAL.pdf`;
      const pdfPath = path.join(targetDir, pdfFileName);
      fs.writeFileSync(pdfPath, pdfBuffer);

      const docPdfFinal = await archivoM.insertarTfmgFile(
        'ACTA_FINAL',
        'application/pdf',
        pdfFileName,
        pdfFileName,
        relDir,
        req.user?.id_user || null,
        'A'
      );

      // 6. Actualizar tope_acta_plataforma
      const actaActualizada = await actaPlataformaModel.guardarRetiro({
        id_proyecto,
        id_desplazamiento_retorno,
        id_chofer_retiro: req.user?.id_user || null,
        horometro_out,
        combustible_out,
        checklist_retiro,
        fotos_retiro: fotosProcesadas.map(f => ({ label: f.label, url_path: f.url_path, id_doc: f.id_doc })),
        obs_retiro,
        receptor_retiro_nombre,
        receptor_retiro_rut,
        receptor_retiro_cargo,
        id_file_firma_retiro: idDocFirmaRetiro,
        id_file_pdf_final: docPdfFinal.id_doc
      });

      // 7. Actualizar json_field
      const jf = pry.json_field || {};
      if (!jf.ejecucion_v1) jf.ejecucion_v1 = {};
      jf.ejecucion_v1.acta_plataforma_360 = {
        ...(jf.ejecucion_v1.acta_plataforma_360 || {}),
        estado: 'RECIBIDA_CONFORME',
        url_pdf_final: `/api/archivo/ver/${docPdfFinal.id_doc}`,
        id_doc_pdf_final: docPdfFinal.id_doc,
        fecha_retiro: new Date().toISOString()
      };
      await pool.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jf, id_proyecto]);

      return res.status(200).json({
        success: true,
        message: `Acta de Recuperación ${actaPrevia.folio_acta} emitida. Arriendo finalizado y retorno habilitado.`,
        acta: actaActualizada,
        url_pdf: `/api/archivo/ver/${docPdfFinal.id_doc}`
      });
    } catch (err) {
      console.error('Error en guardarRetiro:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async getActasPorEquipo(req, res) {
    try {
      const { id_equipo } = req.params;
      if (!id_equipo) return res.status(400).json({ error: 'id_equipo es requerido' });
      const actas = await actaPlataformaModel.getActasByEquipo(id_equipo);
      return res.status(200).json({ success: true, actas });
    } catch (err) {
      console.error('Error en getActasPorEquipo:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async getTodasLasActas(req, res) {
    try {
      const actas = await actaPlataformaModel.getTodasLasActas();
      return res.status(200).json({ success: true, actas });
    } catch (err) {
      console.error('Error en getTodasLasActas:', err);
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = actaPlataformaController;
