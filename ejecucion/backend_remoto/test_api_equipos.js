const https = require('https');

https.get('https://servidor.leanglobal.cl/lg-gsp/api/tequ-equipos', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("STATUS:", res.statusCode);
    console.log("RESPONSE (first 300 chars):", data.substring(0, 300));
    try {
      const parsed = JSON.parse(data);
      console.log("Is Array?", Array.isArray(parsed));
      console.log("Keys if object:", Object.keys(parsed));
      const list = parsed.datos || parsed.data || parsed;
      if (Array.isArray(list)) {
        const tjvb = list.find(e => e.patente && e.patente.includes('TJVB'));
        console.log("\nTJVB.14-0:\n", JSON.stringify(tjvb, null, 2));
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  });
}).on('error', err => console.error(err));
