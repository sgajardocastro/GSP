const nodemailer = require('../node_modules/nodemailer');

async function testSmtp() {
  const transporter = nodemailer.createTransport({
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

  console.log('Verificando conexión SMTP...');
  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada exitosamente.');
  } catch (vErr) {
    console.error('❌ Error al verificar SMTP:', vErr);
    return;
  }

  console.log('\nEnviando correo de prueba a lguser@arriendosanpablo.cl ...');
  try {
    const info = await transporter.sendMail({
      from: '"GSP Platform" <notificaciones.gsp@leanglobal.cl>',
      to: 'lguser@arriendosanpablo.cl',
      subject: 'Prueba Diagnóstico Entrega Correo - GSP',
      text: 'Este es un correo de prueba para diagnosticar la entrega a lguser@arriendosanpablo.cl.',
      html: '<p>Este es un correo de prueba para diagnosticar la entrega a <b>lguser@arriendosanpablo.cl</b>.</p>'
    });
    console.log('Resultado del envío a lguser@arriendosanpablo.cl:');
    console.log('- Accepted:', info.accepted);
    console.log('- Rejected:', info.rejected);
    console.log('- Response SMTP:', info.response);
    console.log('- MessageId:', info.messageId);
  } catch (err) {
    console.error('❌ Error al enviar correo:', err);
  }
}

testSmtp();
