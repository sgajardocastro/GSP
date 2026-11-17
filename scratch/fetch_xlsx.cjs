const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/145kRl83KSYiAQI4cToZf4uLh2nhiucQw/export?format=xlsx';

function fetchUrl(targetUrl, redirects = 0) {
  if (redirects > 5) {
    console.error('Too many redirects');
    return;
  }
  https.get(targetUrl, (res) => {
    console.log('STATUS:', res.statusCode);
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      fetchUrl(res.headers.location, redirects + 1);
      return;
    }
    if (res.statusCode === 200) {
      const file = fs.createWriteStream('scratch/matriz_casos.xlsx');
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('SUCCESS! XLSX written, size:', fs.statSync('scratch/matriz_casos.xlsx').size);
      });
    } else {
      console.log('Error status:', res.statusCode);
    }
  }).on('error', err => {
    console.error('ERROR:', err);
  });
}

fetchUrl(url);
