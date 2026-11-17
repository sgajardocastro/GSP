const https = require('https');

https.get('https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos/97', (res) => {
  console.log('HEADERS:', res.headers);
});
