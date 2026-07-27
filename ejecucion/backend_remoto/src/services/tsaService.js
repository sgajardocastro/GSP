// services/tsaService.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

const TSA_URL = 'https://freetsa.org/tsr';

/**
 * Ejecuta un comando de shell (para usar openssl).
 */
function execCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error ejecutando comando OpenSSL:', stderr || error.message);
        return reject(error);
      }
      resolve(stdout);
    });
  });
}

/**
 * Obtiene un sello de tiempo RFC 3161 desde FreeTSA para un archivo (PDF).
 * Devuelve un Buffer con el TSR (para guardar en BYTEA).
 *
 * @param {string} filePath Ruta del archivo en disco.
 * @returns {Promise<Buffer>}
 */
async function obtenerSelloTiempo(filePath) {
  const tempDir = os.tmpdir();
  const tsqPath = path.join(tempDir, `tsa_${Date.now()}.tsq`);

  console.log('⏱ [TSA] Generando TSQ con OpenSSL para:', filePath);

  // 1) Generar TSQ con OpenSSL
  const opensslCmd = `openssl ts -query -data "${filePath}" -no_nonce -sha256 -cert -out "${tsqPath}"`;
  await execCommand(opensslCmd);

  // 2) Leer TSQ
  const tsqBuffer = fs.readFileSync(tsqPath);

  // 3) Enviar a FreeTSA
  console.log('⏱ [TSA] Enviando TSQ a FreeTSA...');
  const response = await axios({
    method: 'post',
    url: TSA_URL,
    data: tsqBuffer,
    headers: {
      'Content-Type': 'application/timestamp-query',
    },
    responseType: 'arraybuffer',
  });

  // 4) Limpiar TSQ
  try {
    fs.unlinkSync(tsqPath);
  } catch (e) {
    console.warn('⚠️ [TSA] No se pudo borrar TSQ temporal:', e.message);
  }

  const tsaBuffer = Buffer.from(response.data);
  console.log('✅ [TSA] Sello TSA recibido. Bytes:', tsaBuffer.length);

  return tsaBuffer;
}

module.exports = {
  obtenerSelloTiempo,
};
