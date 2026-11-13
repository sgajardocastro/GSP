const pool = require('../src/config/dbConfig');
const itsController = require('../src/controllers/itsController');
const reportDiarioController = require('../src/controllers/reportDiarioController');

async function main() {
  console.log('Testing getReportsPorProyecto for OT 76:');
  const reqRep = { params: { id_proyecto: 76 } };
  const resRep = {
    json(data) {
      console.log('Reports count:', data.data?.length);
      console.log('First report token:', data.data?.[0]?.token_report);
      console.log('First report estado:', data.data?.[0]?.estado_reporte);
      console.log('First report horas_facturables:', data.data?.[0]?.horas_facturables);
      console.log('First report ajustes_analista:', data.data?.[0]?.ajustes_analista);
    },
    status(code) {
      console.error('Status:', code);
      return this;
    }
  };
  await reportDiarioController.getReportsPorProyecto(reqRep, resRep);

  console.log('\nTesting itsController.getITS for OT 76:');
  const reqIts = { params: { id_proyecto: 76 } };
  const resIts = {
    json(data) {
      console.log('ITS folio:', data.data?.its?.folio_its);
      console.log('Jornadas count in ITS:', data.data?.jornadas?.length);
      data.data?.jornadas?.forEach((j, idx) => {
        console.log(`Jornada ${idx + 1}: tipo=${j.tipo_servicio}, horas=${j.horas_report}, tarifa=${j.tarifa_hora}, subtotal=${j.subtotal}, respaldo=${j.tipo_respaldo}, num=${j.numero_report}`);
      });
      console.log('Total horas ITS:', data.data?.its?.total_horas_report);
      console.log('Total ingresos horas:', data.data?.its?.total_ingresos_horas);
      console.log('Total ingresos fletes:', data.data?.its?.total_ingresos_fletes);
      console.log('Total ingresos facturables:', data.data?.its?.total_ingresos_facturables);
    },
    status(code) {
      console.error('Status:', code);
      return this;
    }
  };
  await itsController.getITS(reqIts, resIts);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
