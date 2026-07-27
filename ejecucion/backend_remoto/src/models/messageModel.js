const pool = require("../config/postgresPool");
const nodemailer = require("nodemailer");

class MessageModel {
  constructor() {
    this.pool = pool;
    this.transporter = nodemailer.createTransport({
        host: 'powercp2.zglobalhost.com',
        port: 465,
        secure: true, 
        auth: {
            user: 'notificaciones.gsp@leanglobal.cl',
            pass: 'notificaciones.gsp'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
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
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 25px;
      margin-bottom: 30px;
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
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">⚡ GSP</div>
        <div class="header-title">PLATAFORMA GSP / GESTIÓN DE OPERACIONES</div>
      </div>
      
      <div class="body">
        <div class="welcome">${titulo}</div>
        <div class="subwelcome">${subtitulo}</div>
        
        ${contenido ? `<div class="content-box">${contenido}</div>` : ''}
        
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

  async enviarYRegistrarCorreo({ para, asunto, cuerpo, esHtml = false }) {
    console.log(`[MAILER] Enviando correo a ${para} con asunto: "${asunto}"...`);
    const mailOptions = {
        from: '"GSP Platform" <notificaciones.gsp@leanglobal.cl>',
        to: para,
        subject: asunto,
        html: cuerpo
    };
    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = MessageModel;
