const pool = require("../config/postgresPool");
const nodemailer = require("nodemailer");
const { config } = require("../config/config");

function esAmbienteProduccion() {
  const schema = (config && config.dbSchema) || process.env.DB_SCHEMA || 'sch_leangsp';
  return process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production' || schema === 'sch_leangsp_prod';
}

class MessageModel {
  constructor() {
    this.pool = pool;
    this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
            user: 'sgajardoc@gmail.com',
            pass: 'fivzwxcrhhrxqhrc'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // DEV SANDBOX TRAP: Interceptor transversal inviolable para cualquier envío Nodemailer
    const rawSendMail = this.transporter.sendMail.bind(this.transporter);
    this.transporter.sendMail = async (mailOptions, callback) => {
      const isProd = esAmbienteProduccion();
      if (!isProd) {
        const originalTo = mailOptions.to;
        const originalCc = mailOptions.cc;
        const originalBcc = mailOptions.bcc;

        // Redirección estricta y forzosa a Sergio Gajardo en DEV
        mailOptions.to = 'sgajardoc@gmail.com';
        delete mailOptions.cc;
        delete mailOptions.bcc;

        const bannerHtml = `
<div style="background:#fef3c7;border:2px solid #f59e0b;padding:14px 18px;margin-bottom:20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#92400e;line-height:1.5;">
  <strong style="font-size:14px;color:#b45309;display:block;margin-bottom:6px;">🟡 [DEV SANDBOX TRAP — AMBIENTE DE DESARROLLO GSP]</strong>
  <span>Este correo fue interceptado automáticamente por el sandbox de seguridad de desarrollo y redirigido exclusivamente a la casilla de auditoría técnica. Ningún destinatario real fue notificado.</span><br/>
  <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #d97706;font-size:12px;">
    <strong>Destinatario Original (TO):</strong> <code style="background:#fde68a;padding:2px 5px;border-radius:4px;color:#78350f;">${JSON.stringify(originalTo)}</code><br/>
    ${originalCc ? `<strong>Copia Original (CC):</strong> <code style="background:#fde68a;padding:2px 5px;border-radius:4px;color:#78350f;">${JSON.stringify(originalCc)}</code><br/>` : ''}
    ${originalBcc ? `<strong>Copia Oculta Original (BCC):</strong> <code style="background:#fde68a;padding:2px 5px;border-radius:4px;color:#78350f;">${JSON.stringify(originalBcc)}</code><br/>` : ''}
  </div>
</div>
`;

        if (mailOptions.html) {
          mailOptions.html = bannerHtml + mailOptions.html;
        } else if (mailOptions.text) {
          mailOptions.text = `[DEV SANDBOX TRAP]\nDestinatario Original: ${JSON.stringify(originalTo)}\nCC Original: ${JSON.stringify(originalCc)}\n\n` + mailOptions.text;
        }

        if (mailOptions.subject && !mailOptions.subject.includes('[DEV')) {
          mailOptions.subject = `🟡 [DEV] ${mailOptions.subject}`;
        }

        console.log(`[DEV-SANDBOX-MAIL] Correo interceptado y redirigido. Original TO: ${JSON.stringify(originalTo)} -> Destino DEV: sgajardoc@gmail.com`);
      }
      return rawSendMail(mailOptions, callback);
    };
  }

  obtenerPlantillaHTML({ titulo, subtitulo, contenido, botonTexto, botonUrl }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      background-color: #08090c;
      color: #e2e8f0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #08090c;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0f1116;
      border: 1px solid rgba(2, 132, 199, 0.2);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 45px rgba(0,0,0,0.6);
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 35px 40px;
      text-align: center;
      border-bottom: 1px solid rgba(2, 132, 199, 0.2);
    }
    .header-logo {
      font-size: 26px;
      font-weight: 850;
      color: #ffffff;
      letter-spacing: 2px;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }
    .header-title {
      font-size: 13px;
      font-weight: 700;
      color: #bae6fd;
      letter-spacing: 1px;
      margin: 0;
      text-transform: uppercase;
    }
    .body {
      padding: 40px;
    }
    .welcome {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 15px 0;
      letter-spacing: -0.5px;
    }
    .subwelcome {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 30px 0;
    }
    .content-box {
      background: #14171f;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 25px;
      margin-bottom: 30px;
      color: #f8fafc;
    }
    .content-box p {
      color: #f1f5f9;
      margin: 0 0 10px 0;
      line-height: 1.5;
    }
    .content-box strong {
      color: #38bdf8;
    }
    .content-item {
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.5;
    }
    .content-item:last-child {
      margin-bottom: 0;
    }
    .label {
      font-weight: 700;
      color: #38bdf8;
      display: inline-block;
      width: 140px;
    }
    .value {
      color: #f1f5f9;
    }
    .button-container {
      text-align: center;
      margin: 35px 0 15px 0;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      padding: 15px 35px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
      transition: all 0.25s ease;
    }
    .footer {
      background: #0b0c10;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.03);
    }
    .footer-text {
      font-size: 11px;
      color: #4b5563;
      line-height: 1.5;
      margin: 0;
    }
    .footer-brand {
      font-size: 13px;
      font-weight: 700;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="wrapper" style="width: 100%; background-color: #08090c; padding: 40px 0;">
    <div class="container" style="max-width: 600px; margin: 0 auto; background: #0f1116; border: 1px solid rgba(2, 132, 199, 0.2); border-radius: 20px; overflow: hidden;">
      <div class="header" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 35px 40px; text-align: center;">
        <div class="header-logo" style="font-size: 26px; font-weight: 850; color: #ffffff; letter-spacing: 2px; margin: 0 0 8px 0; text-transform: uppercase;">⚡ GSP</div>
        <div class="header-title" style="font-size: 13px; font-weight: 700; color: #bae6fd; letter-spacing: 1px; margin: 0; text-transform: uppercase;">PLATAFORMA GSP / GESTIÓN DE OPERACIONES</div>
      </div>
      
      <div class="body" style="padding: 40px; color: #e2e8f0;">
        <div class="welcome" style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 15px 0;">${titulo}</div>
        <div class="subwelcome" style="font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 30px 0;">${subtitulo}</div>
        
        ${contenido ? `<div class="content-box" style="background: #14171f !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; border-radius: 14px; padding: 25px; margin-bottom: 30px; color: #f8fafc !important;">${contenido}</div>` : ''}
        
        ${botonTexto && botonUrl ? `
        <div class="button-container">
          <a href="${botonUrl}" class="btn" target="_blank">${botonTexto}</a>
        </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <div class="footer-brand">Grúas San Pablo</div>
        <p class="footer-text">Este es un correo automático enviado por la Plataforma de Operaciones de Grúas San Pablo.<br>Por favor no respondas a este mensaje.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
  }

  async enviarYRegistrarCorreo({ para, cc, asunto, cuerpo, esHtml = false }) {
    console.log(`[MAILER] Enviando correo a ${para}${cc ? ` (CC: ${cc})` : ''} con asunto: "${asunto}"...`);
    const mailOptions = {
        from: '"Grúas San Pablo - Plataforma" <sgajardoc@gmail.com>',
        replyTo: 'notificaciones.gsp@leanglobal.cl',
        to: para,
        cc: cc || undefined,
        subject: asunto,
        html: cuerpo
    };
    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = MessageModel;
