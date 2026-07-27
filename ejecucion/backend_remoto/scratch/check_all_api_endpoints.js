const https = require('https');

const endpoints = [
  '/servicio/leanglobal/obtenerUsuarios?_id_empresa=9',
  '/servicio/leanglobal/obtenerEmpresas?_id_empresa=9',
  '/servicio/leanglobal/obtenerAreas?_id_empresa=9',
  '/servicio/leanglobal/obtenerProyectos?_id_empresa=9',
  '/servicio/leanglobal/obtenerTipoTemplate?_id_empresa=9',
  '/servicio/leanglobal/obtenerTemplates?_id_empresa=9',
  '/acreditacion/personal'
];

function fetchEndpoint(urlPath) {
  return new Promise((resolve) => {
    const url = `https://servidor.leanglobal.cl/lg-gsp/api${urlPath}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\nPath: ${urlPath}`);
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              console.log(`Result is Array. Length: ${parsed.length}`);
              if (parsed.length > 0) {
                console.log(`Sample row:`, JSON.stringify(parsed[0]).substring(0, 150));
              }
            } else if (typeof parsed === 'object') {
              console.log(`Result is Object. Keys:`, Object.keys(parsed));
            } else {
              console.log(`Result is:`, typeof parsed, String(parsed).substring(0, 100));
            }
          } catch (e) {
            console.log(`Raw (not JSON):`, data.substring(0, 200));
          }
        } else {
          console.log(`Error Response:`, data.substring(0, 300));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`Path: ${urlPath} -> FAIL:`, err.message);
      resolve();
    });
  });
}

async function run() {
  for (const path of endpoints) {
    await fetchEndpoint(path);
  }
}

run();
