const http = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://servidor.leanglobal.cl/lg-gsp-dev/api/archivo/ver/1842';
const dest = path.resolve(__dirname, 'ot_1842.pdf');

console.log('Downloading PDF 1842...');
http.get(url, (res) => {
  const fileStream = fs.createWriteStream(dest);
  res.pipe(fileStream);
  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Downloaded OK to', dest, 'Size:', fs.statSync(dest).size, 'bytes');
  });
}).on('error', (err) => {
  console.error('Download error:', err);
});
