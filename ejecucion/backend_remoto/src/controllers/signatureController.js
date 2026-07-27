const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const SignatureModel = require("../models/signatureModel");
const signature = new SignatureModel();
const Archivo = require("../models/archivoModel");
const { generarYGuardarPDF, generarYGuardarPDF2 } = require('../controllers/exportarController');
const archivo = new Archivo();
const { validarTsa } = require('../services/tsaValidateService');
const {
  TRANSMAC_DOCS_DIR,
  TRANSMAC_DOCS_FOLDER,
  normalizeDocsFilePath
} = require('../config/docsConfig');

// URL donde el usuario puede ir a validar el documento
const VALIDATION_URL = 'https://servidor.leanglobal.cl/validador-doc';

// Servicio TSA (FreeTSA)
const { obtenerSelloTiempo } = require('../services/tsaService');

/**
 * Dibuja un pie de página SOLO en la ÚLTIMA página del PDF
 * con texto de firma electrónica + URL de validación + código
 * y un QR pequeño a la derecha.
 */
function agregarPieDePagina(pdfDoc, font, codigoDisplay, qrImageSmall = null) {
  const pages = pdfDoc.getPages();
  if (!pages.length) return;

  const footerHeight = 32;

  // 👉 SOLO la última página
  const page = pages[pages.length - 1];

  const { width } = page.getSize();
  const marginX = 40;
  const baseY = 10; // pegado abajo, pero sin tocar el borde

  // Barra de color en el pie
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: footerHeight,
    color: rgb(0.16, 0.24, 0.40), // azul oscuro
  });

  // --- QR pequeño a la derecha (si viene) ---
  if (qrImageSmall) {
    const qrSize = 24;          // 24 px como tenías antes
    const paddingRight = 16;
    const qrX = width - qrSize - paddingRight;
    const qrY = (footerHeight - qrSize) / 2;

    page.drawImage(qrImageSmall, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
  }

  // Textos del pie
  let yText = baseY + 14;

  page.drawText(
    'El presente documento se firmó electrónicamente a través de la plataforma Transmac.',
    {
      x: marginX,
      y: yText,
      size: 8,
      font,
      color: rgb(1, 1, 1),
    }
  );
  yText -= 10;

  page.drawText(
    `Puedes verificar este documento en: ${VALIDATION_URL}`,
    {
      x: marginX,
      y: yText,
      size: 8,
      font,
      color: rgb(1, 1, 1),
    }
  );
  yText -= 10;

  page.drawText(
    `Código de verificación: ${codigoDisplay}`,
    {
      x: marginX,
      y: yText,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    }
  );
}

module.exports = {
  // =========================================================
  // postSignature: firma PDF existente + cuadro + QR + FES + TSA
  // =========================================================
  postSignature: async (req, res) => {
    try {
      console.log('🔵 [postSignature] Inicio de la petición');
      console.log('📥 Body recibido:', req.body);

      const {
        origenPath,
        destinoFolder,
        id_flow_stp,
        id_flow,
        id_user,
        observaciones,
        aprueba_rechaza,
        id_motivo_rechazo,
        text_motivo_rechazo,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion,
        rol,
        rol_nombre,
        rut,
        nombre
      } = req.body;

      const origenPathNormalizado = normalizeDocsFilePath(origenPath);
      const destinoFolderNormalizado = TRANSMAC_DOCS_DIR;

      if (!origenPathNormalizado || !id_user) {
        console.error('❌ Validación fallida: faltan campos requeridos');
        return res.status(400).json({
          error: 'Faltan campos obligatorios: origenPath, destinoFolder o id_user.'
        });
      }
      console.log('✅ Validación inicial pasada');

      try {
        const stats = fs.statSync(origenPathNormalizado);
        if (!stats.isFile()) {
          console.error('❌ El origenPath no es un archivo válido');
          return res.status(400).json({ error: 'El origenPath no es un archivo válido (es un directorio o no existe).' });
        }
      } catch (err) {
        console.error('❌ Error al verificar origenPath:', err);
        return res.status(400).json({ error: 'El origenPath no existe o no es accesible.' });
      }
      console.log('✅ origenPath verificado:', origenPathNormalizado);

      if (!fs.existsSync(destinoFolderNormalizado)) {
        console.log('⚠️ destinoFolder no existe. Creando:', destinoFolderNormalizado);
        fs.mkdirSync(destinoFolderNormalizado, { recursive: true });
      } else {
        console.log('✅ destinoFolder existe:', destinoFolderNormalizado);
      }

      const nuevoUuid = uuidv4();
      const nuevoNombre = `${nuevoUuid}.pdf`;
      const destinoPath = path.join(destinoFolderNormalizado, nuevoNombre);

      // Código corto para mostrar en el footer
      const codigoDisplay = nuevoUuid.replace(/-/g, '').slice(0, 10).toUpperCase();

      console.log('🟣 UUID generado:', nuevoUuid);
      console.log('🟣 destinoPath:', destinoPath);

      const ip_firma = req.ip || 'DESCONOCIDA';
      const user_agent = req.headers['user-agent'] || 'DESCONOCIDO';
      console.log('📌 IP del firmante:', ip_firma);
      console.log('📌 User-Agent:', user_agent);

      const existingPdfBytes = fs.readFileSync(origenPathNormalizado);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { height } = lastPage.getSize();

      const fechaFirma = new Date().toLocaleString();
      const textoObservacion = observaciones || 'Sin observaciones';

      let datosIzquierda = [
        `Nombre Firmante: ${nombre}`,
        `RUT Firmante: ${rut}`,
        `Rol: ${rol_nombre || 'Desconocido'}`,
        `Fecha Firma: ${fechaFirma}`,
        `Autenticación: ${metodo_autenticacion || 'Desconocida'}`,
        `Código: ${nuevoUuid}`
      ];

      console.log('⚙️ Generando QR...');
      const qrDataUrl = await QRCode.toDataURL(
        `https://servidor.leanglobal.cl/lean-services/api/archivo/${TRANSMAC_DOCS_FOLDER}/${nuevoNombre}`
      );
      const qrImageBytes = qrDataUrl.split(',')[1];
      const qrImageBuffer = Buffer.from(qrImageBytes, 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBuffer);

      // 👉 Pie de página en todas las páginas (con QR pequeño reutilizando qrImage)
      agregarPieDePagina(pdfDoc, font, codigoDisplay, qrImage);

      const espacioNecesario = 120;
      const margenInferiorSeguro = 50;

      const drawFirma = (page) => { return;
        const firmaX = 40;
        const firmaY = 50;
        const firmaWidth = 515;
        const firmaHeight = 120;
        const fontSize = 9;
        const lineSpacing = 12;

        page.drawRectangle({
          x: firmaX,
          y: firmaY,
          width: firmaWidth,
          height: firmaHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1),
        });

        // 📌 QR grande deshabilitado (solo pie de página)
        const qrSize = 100;
        const qrX = firmaX + 10;
        const qrY = firmaY + firmaHeight - qrSize - 10;

        // page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

        // 📌 Texto (movido a la izquierda por remoción de QR)
        const leftColX = firmaX + 15;
        const rightColX = leftColX + 245;
        let yPos = qrY + qrSize - 15;

        for (let i = 0; i < datosIzquierda.length; i++) {
          page.drawText(datosIzquierda[i], {
            x: leftColX,
            y: yPos,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });

          if (i === 0) {
            let yObs = yPos;

            // Estado formateado con soporte para CON OBSERVACIONES
            let estadoDisplay = 'RECHAZA [X]';
            if (aprueba_rechaza === 'APRUEBA') {
              estadoDisplay = 'APRUEBA [OK]';
            } else if (aprueba_rechaza === 'CON_OBSERVACIONES') {
              estadoDisplay = 'CON OBSERVACIONES';
            }

            page.drawText(`Estado: ${estadoDisplay}`, {
              x: rightColX,
              y: yObs,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
              maxWidth: 200,
            });
            yObs -= lineSpacing;

            // Motivo si RECHAZA
            if (aprueba_rechaza === 'RECHAZA') {
              page.drawText(`Motivo: ${text_motivo_rechazo || 'Sin motivo especificado'}`, {
                x: rightColX,
                y: yObs,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
                maxWidth: 200,
              });
              yObs -= lineSpacing;
            }

            // Observación
            page.drawText(`Observación: ${textoObservacion}`, {
              x: rightColX,
              y: yObs,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
              maxWidth: 200,
            });
          }

          yPos -= lineSpacing;
        }
      };

      if (height > espacioNecesario + margenInferiorSeguro) {
        console.log('✅ Hay suficiente espacio en la última página → escribiendo firma allí');
        drawFirma(lastPage);
      } else {
        console.log('⚠️ NO hay espacio suficiente → agregando página nueva');
        const firmaPage = pdfDoc.addPage([595, 842]);
        drawFirma(firmaPage);
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(destinoPath, pdfBytes);
      console.log('✅ PDF firmado y guardado en:', destinoPath);

      // 🔢 Hash del PDF final
      const hash_pdf = await new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(destinoPath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });

      // ⏱ TSA: sello de tiempo para el PDF final
      let tsa_token = null;
      try {
        console.log('⏱ [postSignature] Solicitando sello de tiempo TSA...');
        tsa_token = await obtenerSelloTiempo(destinoPath);
      } catch (e) {
        console.error('⚠️ [postSignature] No se pudo obtener TSA. Continuando sin TSA:', e.message);
      }

      const idDocNuevo = await archivo.guardarArchivoDesdeRutaTransaccional({
        tipo_doc: 'PDF',
        mimetype: 'application/pdf',
        name_doc_orig: path.basename(origenPathNormalizado),
        name_doc_interno: nuevoNombre,
        path_doc: destinoFolderNormalizado,
        id_user: id_user,
        estado: 'CREADO'
      });

      const inserted = await signature.insertarFirma2({
        id_flow_stp,
        id_flow,
        id_user,
        id_doc: idDocNuevo,
        hash_pdf,
        codigo_validacion: nuevoUuid,
        observaciones,
        aprueba_rechaza,
        id_motivo_rechazo,
        ip_firma,
        user_agent,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion,
        pass_fes: null,
        tsa_token
      });

      res.status(201).json({
        message: "✅ Firma electrónica simple creada correctamente",
        id_fes: inserted.id_fes,
        id_doc: idDocNuevo,
        origenPathFirmado: destinoPath,
        nuevoArchivo: nuevoNombre,
        hash_pdf,
        codigo_validacion: nuevoUuid
      });

    } catch (err) {
      console.error("❌ Error en postSignature:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // =========================================================
  // postSignature2 (legacy): se deja con TSA sobre el origen
  // =========================================================
  postSignature2: async (req, res) => {
    try {
      console.log('🔵 [postSignature2] Inicio de la petición');
      console.log('📥 Body recibido:', req.body);

      const {
        origenPath,
        destinoFolder,
        id_flow_stp,
        id_flow,
        id_user,
        observaciones,
        aprueba_rechaza,
        id_motivo_rechazo,
        text_motivo_rechazo,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion,
        rol,
        rol_nombre,
        rut,
        nombre,
        pass_fes
      } = req.body;

      // ✅ 1) Validación temprana de clave FES
      if (!id_user || !pass_fes || !String(pass_fes).trim()) {
        return res.status(400).json({ error: 'Falta id_user o pass_fes.' });
      }

      const ok = await signature.verificarPassFes({ id_user, pass_fes });
      if (!ok) {
        return res.status(401).json({ error: 'Clave FES incorrecta.' });
      }

      const origenPathNormalizado = normalizeDocsFilePath(origenPath);
      const destinoFolderNormalizado = TRANSMAC_DOCS_DIR;

      if (!origenPathNormalizado || !id_user) {
        console.error('❌ Validación fallida: faltan campos requeridos');
        return res.status(400).json({
          error: 'Faltan campos obligatorios: origenPath, destinoFolder o id_user.'
        });
      }
      console.log('✅ Validación inicial pasada');

      try {
        const stats = fs.statSync(origenPathNormalizado);
        if (!stats.isFile()) {
          console.error('❌ El origenPath no es un archivo válido');
          return res.status(400).json({ error: 'El origenPath no es un archivo válido (es un directorio o no existe).' });
        }
      } catch (err) {
        console.error('❌ Error al verificar origenPath:', err);
        return res.status(400).json({ error: 'El origenPath no existe o no es accesible.' });
      }
      console.log('✅ origenPath verificado:', origenPathNormalizado);

      if (!fs.existsSync(destinoFolderNormalizado)) {
        console.log('⚠️ destinoFolder no existe. Creando:', destinoFolderNormalizado);
        fs.mkdirSync(destinoFolderNormalizado, { recursive: true });
      } else {
        console.log('✅ destinoFolder existe:', destinoFolderNormalizado);
      }

      const nuevoUuid = uuidv4();
      const nuevoNombre = `${nuevoUuid}.pdf`;
      const destinoPath = path.join(destinoFolderNormalizado, nuevoNombre);

      // Código corto para mostrar en el footer
      const codigoDisplay = nuevoUuid.replace(/-/g, '').slice(0, 10).toUpperCase();

      console.log('🟣 UUID generado:', nuevoUuid);
      console.log('🟣 destinoPath:', destinoPath);

      const ip_firma = req.ip || 'DESCONOCIDA';
      const user_agent = req.headers['user-agent'] || 'DESCONOCIDO';
      console.log('📌 IP del firmante:', ip_firma);
      console.log('📌 User-Agent:', user_agent);

      // Modificación del PDF con pdf-lib (Estampas Visuales)
      const existingPdfBytes = fs.readFileSync(origenPathNormalizado);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { height } = lastPage.getSize();

      const fechaFirma = new Date().toLocaleString();
      const textoObservacion = observaciones || 'Sin observaciones';

      let datosIzquierda = [
        `Nombre Firmante: ${nombre}`,
        `RUT Firmante: ${rut}`,
        `Rol: ${rol_nombre || 'Desconocido'}`,
        `Fecha Firma: ${fechaFirma}`,
        `Autenticación: ${metodo_autenticacion || 'Desconocida'}`,
        `Código: ${nuevoUuid}`
      ];

      console.log('⚙️ Generando QR...');
      const qrDataUrl = await QRCode.toDataURL(
        `https://servidor.leanglobal.cl/lean-services/api/archivo/${TRANSMAC_DOCS_FOLDER}/${nuevoNombre}`
      );
      const qrImageBytes = qrDataUrl.split(',')[1];
      const qrImageBuffer = Buffer.from(qrImageBytes, 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBuffer);

      // Pie de página en todas las páginas
      agregarPieDePagina(pdfDoc, font, codigoDisplay, qrImage);

      const espacioNecesario = 120;
      const margenInferiorSeguro = 50;

      const drawFirma = (page) => { return;
        const firmaX = 40;
        const firmaY = 50;
        const firmaWidth = 515;
        const firmaHeight = 120;
        const fontSize = 9;
        const lineSpacing = 12;

        page.drawRectangle({
          x: firmaX,
          y: firmaY,
          width: firmaWidth,
          height: firmaHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: rgb(1, 1, 1),
        });

        const qrSize = 100;
        const qrX = firmaX + 10;
        const qrY = firmaY + firmaHeight - qrSize - 10;

        // page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

        const leftColX = firmaX + 15;
        const rightColX = leftColX + 245;
        let yPos = qrY + qrSize - 15;

        for (let i = 0; i < datosIzquierda.length; i++) {
          page.drawText(datosIzquierda[i], {
            x: leftColX,
            y: yPos,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });

          if (i === 0) {
            let yObs = yPos;

            // Estado formateado con soporte para CON OBSERVACIONES
            let estadoDisplay = 'RECHAZA [X]';
            if (aprueba_rechaza === 'APRUEBA') {
              estadoDisplay = 'APRUEBA [OK]';
            } else if (aprueba_rechaza === 'CON_OBSERVACIONES') {
              estadoDisplay = 'CON OBSERVACIONES';
            }

            page.drawText(`Estado: ${estadoDisplay}`, {
              x: rightColX,
              y: yObs,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
              maxWidth: 200,
            });
            yObs -= lineSpacing;

            if (aprueba_rechaza === 'RECHAZA') {
              page.drawText(`Motivo: ${text_motivo_rechazo || 'Sin motivo especificado'}`, {
                x: rightColX,
                y: yObs,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
                maxWidth: 200,
              });
              yObs -= lineSpacing;
            }

            page.drawText(`Observación: ${textoObservacion}`, {
              x: rightColX,
              y: yObs,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
              maxWidth: 200,
            });
          }

          yPos -= lineSpacing;
        }
      };

      if (height > espacioNecesario + margenInferiorSeguro) {
        drawFirma(lastPage);
      } else {
        const firmaPage = pdfDoc.addPage([595, 842]);
        drawFirma(firmaPage);
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(destinoPath, pdfBytes);
      console.log('✅ PDF firmado y guardado en:', destinoPath);

      // Hash del PDF final firmado
      const hash_pdf = await new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(destinoPath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });

      let tsa_token = null;
      try {
        console.log('⏱ [postSignature2] Solicitando sello de tiempo TSA...');
        tsa_token = await obtenerSelloTiempo(destinoPath);
      } catch (e) {
        console.error('⚠️ [postSignature2] No se pudo obtener TSA. Continuando sin TSA:', e.message);
      }

      const idDocNuevo = await archivo.guardarArchivoDesdeRutaTransaccional({
        tipo_doc: 'PDF',
        mimetype: 'application/pdf',
        name_doc_orig: path.basename(origenPathNormalizado),
        name_doc_interno: nuevoNombre,
        path_doc: destinoFolderNormalizado,
        id_user: id_user,
        estado: 'CREADO'
      });

      const inserted = await signature.insertarFirma2({
        id_flow_stp,
        id_flow,
        id_user,
        id_doc: idDocNuevo,
        hash_pdf,
        codigo_validacion: nuevoUuid,
        observaciones,
        aprueba_rechaza,
        id_motivo_rechazo,
        ip_firma,
        user_agent,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion,
        pass_fes: null,
        tsa_token
      });

      res.status(201).json({
        message: "✅ Firma electrónica simple creada correctamente",
        id_fes: inserted.id_fes,
        id_doc: idDocNuevo,
        origenPathFirmado: destinoPath,
        nuevoArchivo: nuevoNombre,
        hash_pdf,
        codigo_validacion: nuevoUuid
      });

    } catch (err) {
      console.error("❌ Error en postSignature2:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // =========================================================
  // postSignature3: genera PDF desde survey + FES + footer + TSA
  // =========================================================
  postSignature3: async (req, res) => {
    try {
      console.log('🔵 [postSignature3] Inicio de la petición');
      console.log('📥 Body recibido:', req.body);

      const {
        origenPath,
        destinoFolder,
        id_flow_stp,
        id_flow,
        id_user,
        observaciones,
        aprueba_rechaza,
        id_motivo_rechazo,
        text_motivo_rechazo,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion,
        rol,
        rol_nombre,
        rut,
        nombre,
        id_survey,
        tipo_doc,
        mimetype,
        path_doc,
        estado,
        pass_fes,
        filenameQr,
        is_autonomo
      } = req.body;

      // ✅ 1) Validación temprana de clave FES
      if (!id_user || !pass_fes || !String(pass_fes).trim()) {
        return res.status(400).json({ error: 'Falta id_user o pass_fes.' });
      }

      const ok = await signature.verificarPassFes({ id_user, pass_fes });
      if (!ok) {
        return res.status(401).json({ error: 'Clave FES incorrecta.' });
      }

      if (!id_user) {
        console.error('❌ Validación fallida: faltan campos requeridos');
        return res.status(400).json({
          error: 'Falta id_user.'
        });
      }
      console.log('✅ Validación inicial pasada');

      // UUID como código de validación
      const nuevoUuid = uuidv4();
      const codigoDisplay = nuevoUuid.replace(/-/g, '').slice(0, 10).toUpperCase();

      // 1) IP / User-Agent
      const ip_firma = req.ip || 'DESCONOCIDA';
      const user_agent = req.headers['user-agent'] || 'DESCONOCIDO';

      // 1. Registrar la firma en la base de datos de forma inmediata y confirmar la transacción
      console.log('💾 Registrando firma previa en la base de datos...');
      const inserted = await signature.insertarFirma2({
        id_flow_stp,
        id_flow,
        id_user,
        id_doc: null, // Aún no generado, evitamos la race condition y el deadlock
        hash_pdf: null,
        codigo_validacion: nuevoUuid,
        observaciones,
        aprueba_rechaza: aprueba_rechaza, // Confianza en la decision enviada transparentemente por la PWA
        id_motivo_rechazo,
        ip_firma,
        user_agent,
        geo_latitude,
        geo_longitude,
        metodo_autenticacion,
        pass_fes,
        tsa_token: null,
        is_autonomo
      });

      const filename = `${uuidv4()}.pdf`;

      // 2. Datos para generar el PDF desde la inspección
      const pdfData = {
        idInspeccion: id_survey,
        tipo_doc: tipo_doc || "PDF",
        mimetype: mimetype || "application/pdf",
        name_doc_interno: '',
        path_doc: TRANSMAC_DOCS_DIR,
        id_user: id_user,
        estado: 'CREADO',
        filename: filenameQr || filename
      };

      // 3. Generar PDF desde la inspección (Puppeteer leerá los datos ya commiteados y el approval_exec listo!)
      console.log('🤖 Generando PDF limpio con Puppeteer...');
      const pdfResponse = await generarYGuardarPDF2({ body: pdfData }, res);

      if (!pdfResponse.status) {
        return res.status(500).json({ error: 'Error al generar el PDF.' });
      }

      const { path: pdfPath, idDoc: idDocNuevo } = pdfResponse;

      console.log('✅ PDF generado y guardado:', pdfPath);
      console.log('✅ PDF generado y guardado idDocNuevo:', idDocNuevo);

      // 👉 Cargar el PDF generado y agregar pie de página
      const existingPdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // QR pequeño para el footer: usamos el nombre interno del archivo
      const internalName = path.basename(pdfPath);
      const qrFooterDataUrl = await QRCode.toDataURL(
        `https://servidor.leanglobal.cl/lean-services/api/archivo/${TRANSMAC_DOCS_FOLDER}/${internalName}`
      );
      const qrFooterBytes = qrFooterDataUrl.split(',')[1];
      const qrFooterBuffer = Buffer.from(qrFooterBytes, 'base64');
      const qrFooterImage = await pdfDoc.embedPng(qrFooterBuffer);

      agregarPieDePagina(pdfDoc, font, codigoDisplay, qrFooterImage);

      const pdfBytesConFooter = await pdfDoc.save();
      fs.writeFileSync(pdfPath, pdfBytesConFooter);
      console.log('✅ Pie de página agregado al PDF:', pdfPath);

      // 4) Calcular hash del PDF final (con footer)
      const hash_pdf = await new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(pdfPath);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });

      // 5) TSA para el PDF final
      let tsa_token = null;
      try {
        console.log('⏱ [postSignature3] Solicitando sello de tiempo TSA...');
        tsa_token = await obtenerSelloTiempo(pdfPath);
      } catch (e) {
        console.error('⚠️ [postSignature3] No se pudo obtener TSA. Continuando sin TSA:', e.message);
      }

      // 6) Actualizar la base de datos con los datos finales del PDF
      console.log('💾 Guardando datos de PDF y TSA en la firma...');
      await signature.actualizarFirmaYDocPostFirma({
        id_flow_stp,
        id_fes: inserted.id_fes,
        id_doc: idDocNuevo,
        hash_pdf,
        tsa_token
      });

      // 4) Devolver resultado
      return res.status(201).json({
        message: "✅ Firma electrónica simple creada correctamente",
        id_fes: inserted.id_fes,
        id_doc: idDocNuevo,
        pdfPath,
        hash_pdf,
        codigo_validacion: nuevoUuid
      });
    } catch (err) {
      console.error("❌ Error en postSignature3:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: err.message });
      }
    }
  },

  // =========================================================
  // postApprovalExec (igual que lo tenías)
  // =========================================================
  postApprovalExec: async (req, res) => {
    const { id_survey, nuevaFirma } = req.body;

    console.log('🔵 [postApprovalExec] Inicio de la petición', id_survey, nuevaFirma);

    nuevaFirma.firma.fecha = new Date().toLocaleString();
    nuevaFirma.firma.ip_firma = req.ip || 'DESCONOCIDA';
    nuevaFirma.firma.user_agent = req.headers['user-agent'] || 'DESCONOCIDO';

    if (!id_survey || !nuevaFirma) {
      return res.status(400).json({ error: 'Faltan id_survey o nuevaFirma en el cuerpo de la solicitud.' });
    }

    try {
      const result = await signature.actualizarApprovalExec({
        id_survey,
        nuevaFirma
      });

      console.log('✅ approval_exec actualizado con la nueva firma:', result.approval_exec);

      return res.status(200).json({
        message: '✅ approval_exec actualizado correctamente.',
        approval_exec: result.approval_exec
      });
    } catch (err) {
      console.error("❌ Error en postApprovalExec:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: err.message });
      }
    }
  },

  // =========================================================
  // GET /api/signature/:id_fes/validar-tsa
  // Valida el sello TSA contra el PDF original
  // =========================================================
  validateTsa: async (req, res) => {
    try {
      const { id_fes } = req.params;

      console.log('🔵 [validateTsa] Validando TSA para id_fes:', id_fes);

      if (!id_fes) {
        return res.status(400).json({
          valido: false,
          mensaje: 'Falta id_fes en la URL.'
        });
      }

      // 1) Obtener tsa_token + path del PDF desde la BD
      const data = await signature.obtenerTsaYPdfPorFes(id_fes);

      if (!data) {
        return res.status(404).json({
          valido: false,
          mensaje: 'No se encontró información de TSA para este id_fes.'
        });
      }

      const { tsa_token, full_path } = data;

      if (!tsa_token) {
        return res.status(404).json({
          valido: false,
          mensaje: 'Esta firma no tiene sello TSA almacenado.'
        });
      }

      if (!full_path || !fs.existsSync(full_path)) {
        return res.status(404).json({
          valido: false,
          mensaje: 'No se encontró el PDF asociado en el servidor.'
        });
      }

      // 2) Validar TSA usando OpenSSL
      const result = await validarTsa(full_path, tsa_token);

      if (result.valido) {
        return res.status(200).json({
          valido: true,
          mensaje: 'Documento íntegro y sello TSA válido.',
          detalle: result.detalle
        });
      } else {
        return res.status(200).json({
          valido: false,
          mensaje: 'El sello TSA NO es válido o el PDF fue modificado.',
          detalle: result.detalle
        });
      }

    } catch (err) {
      console.error('❌ Error en validateTsa:', err);
      return res.status(500).json({
        valido: false,
        mensaje: 'Error interno al validar el TSA.',
        error: err.message
      });
    }
  },

  // =========================================================
  // GET /api/signature/validar-codigo/:codigo
  // A partir del código del PDF → busca la firma, valida TSA
  // y devuelve info para el front.
  // =========================================================
  validarCodigo: async (req, res) => {
    try {
      const { codigo } = req.params;
      console.log('🔵 [validarCodigo] Código recibido:', codigo);

      if (!codigo) {
        return res.status(400).json({
          valido: false,
          mensaje: 'Falta el código de documento en la URL.'
        });
      }

      // 1) Buscar firma por código
      const firma = await signature.obtenerFirmaPorCodigo(codigo);

      if (!firma) {
        return res.status(404).json({
          valido: false,
          mensaje: 'No se encontró ningún documento con ese código.'
        });
      }

      const { id_fes, id_flow, id_doc, id_user, codigo_validacion } = firma;
      console.log('✅ Firma encontrada:', firma);

      // 2) Obtener TSA + PDF físico
      const tsaData = await signature.obtenerTsaYPdfPorFes(id_fes);
      // tsaData debería tener: tsa_token, full_path, name_doc_interno (según lo que ya ajustamos)
      if (!tsaData) {
        return res.status(200).json({
          valido: false,
          mensaje: 'Documento encontrado, pero no tiene sello TSA asociado.',
          codigo_validacion
        });
      }

      const { tsa_token, full_path, name_doc_interno } = tsaData;

      // 3) Info del protocolo (cliente, proyecto, etc.)
      const resumen = await signature.obtenerResumenProtocoloPorFlow(id_flow);

      // 4) Validar TSA (si existe token)
      let tsaResult = null;
      if (tsa_token) {
        console.log('⏱ [validarCodigo] Validando TSA para id_fes:', id_fes);
        tsaResult = await validarTsa(full_path, tsa_token);
      }

      const validoTsa = tsaResult?.valido === true;

      const mensaje =
        tsaResult == null
          ? 'Documento encontrado. No se encontró sello TSA para validar.'
          : validoTsa
          ? 'Documento íntegro y sello TSA válido.'
          : 'El sello TSA NO es válido o el PDF fue modificado.';

      // 5) Link HTTP al PDF (mismo patrón que usas en el QR)
      const link_pdf = name_doc_interno
        ? `https://servidor.leanglobal.cl/lean-services-dev/api/archivo/${TRANSMAC_DOCS_FOLDER}/${name_doc_interno}`
        : null;

      return res.status(200).json({
        // Para el componente Vue
        valido: validoTsa,
        mensaje,
        detalle: tsaResult?.detalle || null,

        // Identificación
        codigo_validacion,
        id_fes,

        // Info de negocio (puedes ir ampliando)
        id_protocolo: resumen?.id_protocolo ?? null,
        cliente: resumen?.cliente ?? null,
        proyecto: resumen?.proyecto ?? null,
        protocolo: resumen?.protocolo ?? null,
        familia: resumen?.familia ?? null,
        area: resumen?.area ?? null,

        // Opcional: quién firmó (si quieres, puedes hacer otra query con id_user)
        firmado_por: null,
        fecha_firma: null,

        // Link para abrir o descargar el PDF
        link_pdf
      });
    } catch (err) {
      console.error('❌ Error en validarCodigo:', err);
      return res.status(500).json({
        valido: false,
        mensaje: 'Error interno al validar el documento.',
        error: err.message
      });
    }
  },
};