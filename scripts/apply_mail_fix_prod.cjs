const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function applyFixProd() {
  console.log('--- Conectando a servidor de producción ---');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const remotePath = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/messageModel.js';
  
  // 1. Backup de seguridad
  console.log('1. Creando backup previo...');
  await ssh.execCommand(`cp ${remotePath} ${remotePath}.bak-$(date +%Y%m%d%H%M%S)`);

  // 2. Modificar con Python para exactitud
  const pythonPatcher = `
with open('${remotePath}', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazo de transporte
old_transport = """    this.transporter = nodemailer.createTransport({
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
    });"""

new_transport = """    this.transporter = nodemailer.createTransport({
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
    });"""

if old_transport in content:
    content = content.replace(old_transport, new_transport)
    print("Transporte reemplazado con éxito")
else:
    print("WARNING: old_transport no encontrado exactamente")

old_from = "from: '\"GSP Platform\" <notificaciones.gsp@leanglobal.cl>',"
new_from = """from: '\"Grúas San Pablo - Plataforma\" <sgajardoc@gmail.com>',
        replyTo: 'notificaciones.gsp@leanglobal.cl',"""

if old_from in content:
    content = content.replace(old_from, new_from)
    print("From/ReplyTo reemplazado con éxito")
else:
    print("WARNING: old_from no encontrado exactamente")

with open('${remotePath}', 'w', encoding='utf-8') as f:
    f.write(content)
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/patch_mail.py\n${pythonPatcher}\nEOF`);
  const patchRes = await ssh.execCommand('python3 /tmp/patch_mail.py');
  console.log('Resultado del parche:', patchRes.stdout);

  // 3. Reiniciar PM2 13
  console.log('2. Reiniciando PM2 ID 13...');
  const restartRes = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(restartRes.stdout);

  // 4. Prueba de envío real desde el backend
  console.log('3. Ejecutando prueba de envío real desde el backend de producción...');
  const testEmailScript = `
const MessageModel = require('${remotePath}');
const mm = new MessageModel();

async function testSend() {
  console.log('Enviando correo de prueba a sgajardoc@gmail.com...');
  const res = await mm.enviarYRegistrarCorreo({
    para: 'sgajardoc@gmail.com',
    asunto: '✅ [PRODUCCION GSP] Test de Verificación SMTP Google Workspace',
    cuerpo: '<p>Este es un correo de prueba certificando que la salida SMTP por Google Workspace en el servidor de Producción está 100% operativa y habilitada para cotizaciones y reportes.</p>'
  });
  console.log('RESPUESTA NODEMAILER:', JSON.stringify(res));
}

testSend().catch(err => {
  console.error('ERROR EN TEST SEND:', err);
  process.exit(1);
});
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_real_send.js\n${testEmailScript}\nEOF`);
  const sendRes = await ssh.execCommand('node /tmp/test_real_send.js');
  console.log(sendRes.stdout);
  if (sendRes.stderr) console.error(sendRes.stderr);

  ssh.dispose();
}

applyFixProd().catch(console.error);
