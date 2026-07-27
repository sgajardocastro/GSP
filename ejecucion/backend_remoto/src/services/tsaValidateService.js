// services/tsaValidateService.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

const CA_FILE = '/opt/certs/freetsa/cacert.pem';
const TSA_CRT = '/opt/certs/freetsa/tsa.crt';

function execCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        const msg = stderr || error.message;
        return reject(new Error(msg));
      }
      resolve(stdout);
    });
  });
}

/**
 * Valida un TSA contra un PDF usando OpenSSL.
 * @param {string} pdfPath Ruta absoluta al PDF.
 * @param {Buffer} tsaBuffer Contenido del tsa_token (TSR).
 * @returns {Promise<{valido: boolean, detalle: string}>}
 */
async function validarTsa(pdfPath, tsaBuffer) {
  const tempDir = os.tmpdir();
  const tsrPath = path.join(tempDir, `tsa_val_${Date.now()}.tsr`);

  // Guardar TSA en archivo temporal
  fs.writeFileSync(tsrPath, tsaBuffer);

  const cmd = `openssl ts -verify -data "${pdfPath}" -in "${tsrPath}" -CAfile "${CA_FILE}" -untrusted "${TSA_CRT}"`;

  try {
    const out = await execCommand(cmd);
    try { fs.unlinkSync(tsrPath); } catch (e) {}
    const valido = out.includes('Verification: OK');
    return { valido, detalle: out };
  } catch (e) {
    try { fs.unlinkSync(tsrPath); } catch (err) {}
    return { valido: false, detalle: e.message };
  }
}

module.exports = {
  validarTsa,
};
