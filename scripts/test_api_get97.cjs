const https = require('https');

https.get('https://servidor.leanglobal.cl/lg-gsp-prod/api/proyectos/97', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const p = json.data || json.proyecto || json;
      console.log('Status:', res.statusCode);
      console.log('id_proyecto:', p.id_proyecto);
      console.log('lineas_servicio[0]:', JSON.stringify(p.json_field?.crm_v1?.lineas_servicio?.[0]));
      console.log('ejecucion_v1.equipo_id:', p.json_field?.ejecucion_v1?.equipo_id);
      console.log('tripulacion:', JSON.stringify(p.json_field?.ejecucion_v1?.tripulacion_asignada));
    } catch (e) {
      console.log('Raw output:', data.slice(0, 300));
    }
  });
}).on('error', err => console.error(err));
