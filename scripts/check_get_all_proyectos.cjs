const https = require('https');

https.get('https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const list = Array.isArray(data) ? data : (data.proyectos || data.data || []);
      const p97 = list.find(p => p.id_proyecto === 97);
      if (p97) {
        console.log('p97 in list:');
        console.log('lineas_servicio[0].equipo_asignado_id:', p97.json_field?.crm_v1?.lineas_servicio?.[0]?.equipo_asignado_id);
        console.log('ejecucion_v1.equipo_id:', p97.json_field?.ejecucion_v1?.equipo_id);
      } else {
        console.log('p97 not found in list of length', list.length);
      }
    } catch (e) {
      console.error(e.message);
    }
  });
});
