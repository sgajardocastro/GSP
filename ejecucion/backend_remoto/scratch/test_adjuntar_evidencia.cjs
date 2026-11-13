const pool = require('../src/config/dbConfig');
const reportDiarioController = require('../src/controllers/reportDiarioController');

async function main() {
  console.log('Testing adjuntarRespaldoFisico for report 29:');
  const dummyBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Title (Reporte Fisico Firmado Faena OT 76)\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF');

  const req = {
    params: { id: 29 },
    body: {
      notas_evidencia: 'Hoja de reporte físico escaneada con timbre y firma conforme de Celulosa Arauco.',
      id_user: 55
    },
    files: {
      archivo: {
        name: 'Reporte_Fisico_OT76_Firmado.pdf',
        mimetype: 'application/pdf',
        data: dummyBuffer
      }
    },
    user: {
      id_user: 55,
      name_frst: 'Sergio',
      apellido_pat: 'Gajardo',
      email: 'sgajardoc@gmail.com'
    }
  };

  const res = {
    json(data) {
      console.log('Adjuntar Respaldo Result:', JSON.stringify(data, null, 2));
    },
    status(code) {
      console.error('Status error:', code);
      return this;
    }
  };

  await reportDiarioController.adjuntarRespaldoFisico(req, res);

  // Now verify database row
  const r = await pool.query('SELECT id_reporte_avance, estado_reporte, id_doc_pdf, ajustes_analista FROM sch_leangsp.tedp_reporte_avance WHERE id_reporte_avance = 29');
  console.log('\nVerified DB row 29:', r.rows[0]);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
