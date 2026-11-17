const nodemailer = require('../ejecucion/backend_remoto/node_modules/nodemailer');

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

console.log('Probando verificación de credenciales desde máquina local...');
transporter.verify((err, success) => {
  if (err) {
    console.error('ERROR DE VERIFICACION:', err.message);
  } else {
    console.log('VERIFICACION EXITOSA:', success);
  }
});
