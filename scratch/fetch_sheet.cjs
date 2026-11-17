const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/145kRl83KSYiAQI4cToZf4uLh2nhiucQw/export?format=csv&gid=1120658235';

function fetchUrl(targetUrl, redirects = 0) {
  if (redirects > 5) {
    console.error('Too many redirects');
    return;
  }
  https.get(targetUrl, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers.location || res.headers['content-type']);
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      fetchUrl(res.headers.location, redirects + 1);
      return;
    }
    if (res.statusCode === 200) {
      const file = fs.createWriteStream('scratch/matriz_downloaded.csv');
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('SUCCESS! File written, size:', fs.statSync('scratch/matriz_downloaded.csv').size);
      });
    } else {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('RESPONSE BODY PREVIEW:', body.slice(0, 300));
      });
    }
  }).on('error', err => {
    console.error('ERROR:', err);
  });
}

fetchUrl(url);
