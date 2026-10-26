const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICACIÓN EN VIVO TENSACON ID 4 (PROD) ===\n');

  // 1. Generar token de admin en PROD
  const genTokenCmd = `cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node -e '
    require("dotenv").config();
    const jwt = require("jsonwebtoken");
    const crypto = require("crypto");
    const jwtSecret = process.env.JWT_SECRET || "secret";
    const jwtEncryptSecret = process.env.JWT_ENCRYPT_SECRET || "encrypt-secret";
    function encryptToken(token, secret) {
      const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(secret, "salt", 32), Buffer.alloc(16, 0));
      let encrypted = cipher.update(token, "utf8", "hex");
      encrypted += cipher.final("hex");
      return encrypted;
    }
    const payload = {
      rut: "1-9",
      email: "mseguel@arriendosanpablo.cl",
      nombre: "Maritza Seguel",
      id_user: 2,
      id_empresa: 9,
      roles: ["ADMIN", "CONTABILIDAD", "OPERACIONES"]
    };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1d" });
    console.log("TOKEN_ENC:" + encryptToken(token, jwtEncryptSecret));
  '`;
  
  const tokenRes = await ssh.execCommand(genTokenCmd);
  const match = tokenRes.stdout.match(/TOKEN_ENC:([a-f0-9]+)/);
  const token = match ? match[1] : null;

  console.log('Token cifrado PROD:', token ? 'OK (' + token.substring(0, 20) + '...)' : 'FALLÓ');

  if (token) {
    // 2. Consultar perspectiva contabilidad en PROD
    const contaCmd = `curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/edp/perspectiva-contabilidad -k -H "Authorization: Bearer ${token}"`;
    const contaRes = await ssh.execCommand(contaCmd);
    try {
      const cJson = JSON.parse(contaRes.stdout);
      const tensacon = cJson.data?.procesos?.find(p => p.id_proyecto === 4);
      console.log('\n--- AUDITORÍA PROCESO TENSACON ID 4 ---');
      if (tensacon) {
        console.log('OT:', tensacon.codi_proyecto);
        console.log('Cliente:', tensacon.cliente_nombre);
        console.log('Vendedor:', tensacon.vendedor_nombre);
        console.log('Monto Comprometido:', '$' + Number(tensacon.monto_comprometido).toLocaleString('es-CL'));
        console.log('Monto Devengado Reports:', '$' + Number(tensacon.monto_devengado_reports).toLocaleString('es-CL'));
        console.log('Monto ITS Neto:', '$' + Number(tensacon.monto_its_neto).toLocaleString('es-CL'));
        console.log('Monto EDP Referencia:', '$' + Number(tensacon.monto_edp_referencia).toLocaleString('es-CL'));
        const descalce = (tensacon.monto_edp_referencia || tensacon.monto_devengado_reports) - tensacon.monto_its_neto;
        console.log('DESCALCE EDP vs ITS: $' + descalce.toLocaleString('es-CL'), descalce === 0 ? '✓ CUADRE PERFECTO ($0)' : '⚠️ DESCALCE');
        console.log('Habilitado Facturar:', tensacon.habilitado_facturar);
        console.log('Semáforo Label:', tensacon.semaforo_label);
      } else {
        console.log('Tensacon no encontrado en listado');
      }
    } catch(e) {
      console.error('Error parseando perspectiva contabilidad:', contaRes.stdout.substring(0, 200));
    }

    // 3. Probar endpoint de PDF de Tensacon
    console.log('\n--- AUDITORÍA GENERACIÓN PDF EDP TENSACON ID 4 ---');
    const pdfCmd = `curl -s -w "%{http_code} %{size_download} %{content_type}\n" -o /tmp/edp_tensacon_prod.pdf https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/edp/proyecto/4/pdf -k -H "Authorization: Bearer ${token}"`;
    const pdfRes = await ssh.execCommand(pdfCmd);
    console.log('Resultado PDF Tensacon PROD (HTTP Code, Bytes, Content-Type):', pdfRes.stdout.trim());

    // Verificar si el PDF se generó
    const pdfCheck = await ssh.execCommand('ls -lh /tmp/edp_tensacon_prod.pdf');
    console.log('Archivo PDF generado en servidor:', pdfCheck.stdout.trim());
  }

  ssh.dispose();
}

run().catch(err => {
  console.error('Error:', err);
  if (ssh) ssh.dispose();
});
