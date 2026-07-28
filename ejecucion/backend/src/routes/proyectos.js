import { Router } from 'express';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configuración de transporte SMTP para correos corporativos HTML
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'powercp2.zglobalhost.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'notificaciones.gsp@leanglobal.cl',
    pass: process.env.SMTP_PASS || 'Gsp2026#Global'
  },
  tls: { rejectUnauthorized: false }
});

// Función de resolución paramétrica del logo de la empresa emisora desde tpar_empresas a Base64 Data URI
const resolverLogoBase64Empresa = (logoEmpresaNombre) => {
  try {
    const filename = logoEmpresaNombre || 'logo_gsp.png';
    const posiblesRutas = [
      path.join(__dirname, '../../public', filename),
      path.join(__dirname, '../../public', 'logo-sanpablo.png'),
      path.join(__dirname, '../../public', 'logo_gsp.png'),
      path.join(__dirname, '../public', filename),
      path.join(__dirname, '../../../frontend/public', filename),
      path.join(__dirname, '../../../frontend/public', 'logo_gsp.png'),
      path.join(__dirname, '../../../frontend/public', 'logo-sanpablo.png')
    ];

    for (const p of posiblesRutas) {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        return `data:image/png;base64,${buf.toString('base64')}`;
      }
    }
  } catch (err) {
    console.error('Error al codificar logo a Base64:', err);
  }
  return null;
};

// POST /api/proyectos/:id/generar-cotizacion
router.post('/:id/generar-cotizacion', async (req, res) => {
  const { id } = req.params;
  const { monto } = req.body;

  try {
    // 1. Consultar proyecto y datos de la empresa emisora en tpar_empresas
    const proyRes = await pool.query('SELECT * FROM tpry_proyecto WHERE id_proyecto = $1', [id]);
    const proyecto = proyRes.rows[0] || {};
    const idEmpresaEmisora = proyecto.id_empresa || 9;

    const empRes = await pool.query('SELECT id_empresa, name_empresa, razon_social, rut_empresa, giro, logo_empresa FROM tpar_empresas WHERE id_empresa = $1', [idEmpresaEmisora]);
    const empresaInfo = empRes.rows[0] || { name_empresa: 'SAN PABLO', logo_empresa: 'logo-sanpablo.png' };

    // 2. Resolver logo paramétrico Base64 in situ para 0ms de carga sin error [?]
    const logoBase64 = resolverLogoBase64Empresa(empresaInfo.logo_empresa);

    const jsonField = proyecto.json_field || {};
    const crmV1 = jsonField.crm_v1 || {};
    const cotizaciones = Array.isArray(crmV1.cotizaciones_historicas) ? crmV1.cotizaciones_historicas : [];
    const nuevaVersionNum = cotizaciones.length + 1;

    const cotizacionInfo = {
      id_cotizacion: Math.floor(Math.random() * 1000) + 100,
      version: nuevaVersionNum,
      nombre_archivo: `GSP-2607-557-${String(id).padStart(3, '0')}V${nuevaVersionNum}.pdf`,
      monto: monto || 700000,
      fecha: new Date().toISOString(),
      url: `/lg-gsp/api/archivo/cotizaciones/GSP-2607-557-${String(id).padStart(3, '0')}V${nuevaVersionNum}.pdf`,
      logo_base64: logoBase64
    };

    cotizaciones.push(cotizacionInfo);
    crmV1.cotizaciones_historicas = cotizaciones;
    jsonField.crm_v1 = crmV1;

    await pool.query('UPDATE tpry_proyecto SET json_field = $1, fecha_modificacion = NOW() WHERE id_proyecto = $2', [JSON.stringify(jsonField), id]);

    return res.status(200).json({
      message: 'Versión de cotización generada exitosamente',
      cotizacion: cotizacionInfo,
      proyecto: {
        ...proyecto,
        json_field: jsonField
      }
    });
  } catch (err) {
    console.error('Error al generar versión de cotización:', err);
    return res.status(500).json({
      error: 'GEN_PDF_ERROR',
      message: err.message || 'Error al procesar la generación del PDF'
    });
  }
});

// POST /api/proyectos/:id/enviar-cotizacion
router.post('/:id/enviar-cotizacion', async (req, res) => {
  const { id } = req.params;
  const { version_codigo, destinatarios, copia_interna, asunto, html_content, cuerpo_texto } = req.body;

  if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
    return res.status(422).json({
      error: 'DESTINATARIO_REQUERIDO',
      message: 'Debe proporcionar al menos un correo del cliente como destinatario.'
    });
  }

  try {
    const mailOptions = {
      from: '"Grúas San Pablo S.A." <notificaciones.gsp@leanglobal.cl>',
      to: destinatarios.join(', '),
      cc: Array.isArray(copia_interna) && copia_interna.length > 0 ? copia_interna.join(', ') : undefined,
      subject: asunto,
      text: cuerpo_texto || '',
      html: html_content || cuerpo_texto
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SERVICE GSP HTML] Cotización #${id} enviada exitosamente. MessageId: ${info.messageId}`);

    const evento_envio = {
      fecha_envio: new Date().toISOString(),
      usuario_envio: 'Sergio Gajardo',
      destinatarios_cliente: destinatarios,
      destinatarios_cc: copia_interna || []
    };

    return res.status(200).json({
      status: 'OK',
      message: `Cotización ${version_codigo || 'v1.0'} enviada exitosamente por email`,
      id_proyecto: id,
      messageId: info.messageId,
      evento_envio
    });
  } catch (err) {
    console.error('Error enviando correo HTML:', err);
    return res.status(500).json({
      error: 'SMTP_ERROR',
      message: err.message || 'Error al despachar el correo HTML'
    });
  }
});

export default router;
