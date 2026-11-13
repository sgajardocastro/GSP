const axios = require('axios');

async function testProcesosSurvey() {
  try {
    const res = await axios.get('https://servidor.leanglobal.cl/lg-gsp-prod/api/servicio/leanglobal/procesosSurveyV3?_id_empresa=9');
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
  }
}

testProcesosSurvey();
