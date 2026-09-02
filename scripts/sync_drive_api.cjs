/**
 * sync_drive_api.cjs
 * Sincronización directa vía Google Drive API hacia la carpeta compartida de QA:
 * Carpeta Raíz: Gruas San Pablo - LeanGlobal (1yHYhyIH6_FpQGxJdFBuvI54GEoRr1c3H)
 *  - 📁 Spec (1t7e58wGQDcf26nlTUvVaqgpo0RYQWkeS)
 *  - 📁 Proyecto (1NktL_3eESFPr3gU0YSMSKPnlG0_2r2OZ)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_SECRET_PATH = path.resolve('D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/client_secret_961053663096-s2a3uhics25fg1h0b20ocmqlqi3tvvdu.apps.googleusercontent.com.json');
const TOKEN_CACHE_PATH = path.join(ROOT_DIR, '.agents', '.gdrive_token.json');

const FOLDER_ROOT_ID = '1yHYhyIH6_FpQGxJdFBuvI54GEoRr1c3H';
const FOLDER_SPEC_ID = '1t7e58wGQDcf26nlTUvVaqgpo0RYQWkeS';
const FOLDER_PROYECTO_ID = '1NktL_3eESFPr3gU0YSMSKPnlG0_2r2OZ';

let clientConfig = {};
try {
  const raw = fs.readFileSync(CLIENT_SECRET_PATH, 'utf-8');
  clientConfig = JSON.parse(raw).web;
} catch (e) {
  console.error('Error leyendo client_secret:', e.message);
  process.exit(1);
}

const CLIENT_ID = clientConfig.client_id;
const CLIENT_SECRET = clientConfig.client_secret;
const REDIRECT_PORT = 5173;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
const SCOPES = ['https://www.googleapis.com/auth/drive'].join(' ');

// 1. Obtener Token OAuth2
async function getAccessToken() {
  if (fs.existsSync(TOKEN_CACHE_PATH)) {
    try {
      const tokenData = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
      if (tokenData.expires_at && tokenData.expires_at > Date.now() + 60000) {
        return tokenData.access_token;
      }
      if (tokenData.refresh_token) {
        return await refreshToken(tokenData.refresh_token);
      }
    } catch (e) {}
  }

  return await authenticateInteractive();
}

function refreshToken(refresh_token) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token'
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            parsed.expires_at = Date.now() + (parsed.expires_in * 1000);
            parsed.refresh_token = parsed.refresh_token || refresh_token;
            fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(parsed, null, 2));
            resolve(parsed.access_token);
          } else {
            reject(new Error(data));
          }
        } catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function authenticateInteractive() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
        const code = url.searchParams.get('code');
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1 style="font-family: sans-serif; color: #10b981; text-align: center; margin-top: 50px;">✅ Autenticación con Google Drive Exitosa</h1><p style="text-align: center;">Puedes cerrar esta ventana. La sincronización para Juanma continuará en la consola.</p>');
          server.close();

          // Canjear código por tokens
          const postData = new URLSearchParams({
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
          }).toString();

          const tokenReq = https.request('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (tokenRes) => {
            let data = '';
            tokenRes.on('data', c => data += c);
            tokenRes.on('end', () => {
              const parsed = JSON.parse(data);
              if (parsed.access_token) {
                parsed.expires_at = Date.now() + (parsed.expires_in * 1000);
                fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(parsed, null, 2));
                resolve(parsed.access_token);
              } else {
                reject(new Error('Fallo al obtener token: ' + data));
              }
            });
          });
          tokenReq.on('error', reject);
          tokenReq.write(postData);
          tokenReq.end();
        }
      } catch (err) {
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;
      console.log('\n🌐 ABRIENDO AUTORIZACIÓN EN EL NAVEGADOR...');
      console.log('👉 Si no se abre automáticamente, visita esta URL:\n', authUrl, '\n');
      exec(`start "" "${authUrl}"`);
    });
  });
}

// 2. Operaciones con la API de Google Drive
async function driveRequest(endpoint, method = 'GET', body = null, token, isUpload = false, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const host = isUpload ? 'www.googleapis.com' : 'www.googleapis.com';
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = contentType;
    }

    let payload = body;
    if (body && typeof body === 'object' && !Buffer.isBuffer(body) && contentType === 'application/json') {
      payload = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (Buffer.isBuffer(body)) {
      headers['Content-Length'] = body.length;
    }

    const req = https.request({
      hostname: host,
      path: endpoint,
      method: method,
      headers: headers
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Drive API ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(raw);
          else reject(new Error(`Drive API ${res.statusCode}: ${raw}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function createDriveFolder(name, parentId, token) {
  const res = await driveRequest('/drive/v3/files', 'POST', {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  }, token);
  return res.id;
}

async function uploadFileToDrive(localPath, driveName, parentId, token) {
  const content = fs.readFileSync(localPath);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = JSON.stringify({
    name: driveName,
    parents: [parentId]
  });

  const multipartRequestBody = Buffer.concat([
    Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + metadata + delimiter + 'Content-Type: application/octet-stream\r\n\r\n'),
    content,
    Buffer.from(closeDelimiter)
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: '/upload/drive/v3/files?uploadType=multipart',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': multipartRequestBody.length
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.id) resolve(parsed);
          else reject(new Error('Upload error: ' + data));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(multipartRequestBody);
    req.end();
  });
}

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', '.output', '.vscode', '.idea', 'coverage', '.cache']);
const EXCLUDED_EXTS = new Set(['.log', '.tmp', '.tsbuildinfo']);

async function uploadDirectoryRecursive(localDir, parentFolderId, token) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    const fullPath = path.join(localDir, name);

    if (EXCLUDED_DIRS.has(name) || (name.startsWith('.env') && name !== '.env.example')) continue;

    if (entry.isDirectory()) {
      console.log(`   📁 Creando carpeta en Drive: ${name}...`);
      const subFolderId = await createDriveFolder(name, parentFolderId, token);
      await uploadDirectoryRecursive(fullPath, subFolderId, token);
    } else if (entry.isFile()) {
      const ext = path.extname(name).toLowerCase();
      if (!EXCLUDED_EXTS.has(ext)) {
        process.stdout.write(`   📄 Subiendo ${name}... `);
        await uploadFileToDrive(fullPath, name, parentFolderId, token);
        console.log('✅');
      }
    }
  }
}

// 3. Ejecución Principal
async function main() {
  console.log('🚀 CONECTANDO CON GOOGLE DRIVE API...');
  const token = await getAccessToken();
  console.log('🔑 Token de Google Drive obtenido exitosamente.\n');

  console.log('📦 SINCRONIZANDO CON LA CARPETA COMPARTIDA DE JUANMA:');
  console.log(`   ID Raíz: ${FOLDER_ROOT_ID} (Gruas San Pablo - LeanGlobal)`);
  console.log(`   ID Spec: ${FOLDER_SPEC_ID}`);
  console.log(`   ID Proyecto: ${FOLDER_PROYECTO_ID}\n`);

  // 1. Subir Specs a carpeta 'Spec'
  console.log('📐 [1/2] SUBIENDO TODAS LAS ESPECIFICACIONES A LA CARPETA "Spec"...');
  const specsDir = path.join(ROOT_DIR, '.agents', 'specs');
  await uploadDirectoryRecursive(specsDir, FOLDER_SPEC_ID, token);
  console.log('✅ Especificaciones subidas exitosamente a "Spec"!\n');

  // 2. Subir Fuentes Limpios a carpeta 'Proyecto'
  console.log('💻 [2/2] SUBIENDO FUENTES LIMPIOS A LA CARPETA "Proyecto"...');
  
  // Frontend
  const frontendFolderId = await createDriveFolder('frontend', FOLDER_PROYECTO_ID, token);
  console.log('   ↳ Subiendo ejecucion/frontend...');
  await uploadDirectoryRecursive(path.join(ROOT_DIR, 'ejecucion', 'frontend'), frontendFolderId, token);

  // PWA
  const pwaFolderId = await createDriveFolder('pwa', FOLDER_PROYECTO_ID, token);
  console.log('   ↳ Subiendo ejecucion/pwa...');
  await uploadDirectoryRecursive(path.join(ROOT_DIR, 'ejecucion', 'pwa'), pwaFolderId, token);

  // Backend
  const backendFolderId = await createDriveFolder('backend', FOLDER_PROYECTO_ID, token);
  console.log('   ↳ Subiendo ejecucion/backend_remoto...');
  await uploadDirectoryRecursive(path.join(ROOT_DIR, 'ejecucion', 'backend_remoto'), backendFolderId, token);

  // Tareas, LEEME y ZIP completo
  console.log('   ↳ Subiendo GSP_Fuentes_y_Specs_QA.zip, tareas.md y LEEME_QA.md...');
  const zipFile = path.resolve('D:/SGajardo/Google Drive/Gruas San Pablo - LeanGlobal/GSP_Fuentes_y_Specs_QA.zip');
  if (fs.existsSync(zipFile)) {
    await uploadFileToDrive(zipFile, 'GSP_Fuentes_y_Specs_QA.zip', FOLDER_PROYECTO_ID, token);
    console.log('   ✅ GSP_Fuentes_y_Specs_QA.zip subido exitosamente a Drive!');
  }

  const tareasPath = path.join(ROOT_DIR, 'Gestión', 'tareas.md');
  if (fs.existsSync(tareasPath)) {
    await uploadFileToDrive(tareasPath, 'tareas.md', FOLDER_PROYECTO_ID, token);
  }

  const exportLeemePath = path.resolve('D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/QA_Fuentes_Web/LEEME_QA.md');
  if (fs.existsSync(exportLeemePath)) {
    await uploadFileToDrive(exportLeemePath, 'LEEME_QA.md', FOLDER_PROYECTO_ID, token);
  }

  console.log('\n🎉 ¡ENTREGA A GOOGLE DRIVE COMPLETADA AL 100%!');
  console.log('👉 Juanma ya puede ver todos los archivos en: https://drive.google.com/drive/folders/1yHYhyIH6_FpQGxJdFBuvI54GEoRr1c3H\n');
}

main().catch(err => {
  console.error('\n❌ ERROR EN SINCRONIZACIÓN GOOGLE DRIVE:', err);
});
