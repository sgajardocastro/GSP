const nodemailer = require('../ejecucion/backend_remoto/node_modules/nodemailer');

async function testAuth(email, pass) {
  const cleanPass = pass.replace(/\s+/g, '');
  console.log(`Probando autenticación con ${email}...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: email,
      pass: cleanPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log(`✅ AUTENTICACION EXITOSA para ${email}`);
    return true;
  } catch (err) {
    console.log(`❌ Falló para ${email}: ${err.message}`);
    return false;
  }
}

async function run() {
  const pass = 'fivz wxcr hhrx qhrc';
  if (await testAuth('sgajardoc@gmail.com', pass)) return;
  if (await testAuth('sgajardo@leanglobal.cl', pass)) return;
  if (await testAuth('admin@leanglobal.cl', pass)) return;
}

run();
