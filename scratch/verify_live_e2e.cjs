const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  console.log('--- TEST 1: Verificar datos de OT 35 en PROD DB ---');
  const res1 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_reporte_avance, fecha_reporte, id_user_operador, id_user_rigger, horas_colacion, horas_operadas, horas_facturables FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 35 ORDER BY id_reporte_avance;\\""`);
  console.log(res1.stdout);

  console.log('--- TEST 2: Verificar ajustes_analista liquidacion_personal_dia en OT 35 ---');
  const res2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_reporte_avance, ajustes_analista->'liquidacion_personal_dia'->'tiene_rigger' as tiene_rigger, ajustes_analista->'liquidacion_personal_dia'->'rigger_nombre' as rigger_nom, ajustes_analista->'liquidacion_personal_dia'->'monto_viatico_rigger' as viatico_rigger FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 35 AND ajustes_analista ? 'liquidacion_personal_dia';\\""`);
  console.log(res2.stdout);

  console.log('--- TEST 3: Consultar Endpoint ITS para OT 35 (Live Node.js) ---');
  const nodeTest = `
    const basePath = '/home/nodeadmin/proyectos/lean-services-gsp-prod';
    require(basePath + '/node_modules/dotenv').config({ path: basePath + '/.env' });
    const itsController = require(basePath + '/src/controllers/itsController');

    const req = { params: { id_proyecto: 35 }, query: {} };
    const res = {
      json: (data) => {
        console.log('STATUS: 200 OK');
        const d = data.data || {};
        console.log('FOLIO ITS:', (d.its && d.its.folio_its) || 'AUTO');
        console.log('COSTOS COMBUSTIBLE:', (d.costos && d.costos.combustible) ? d.costos.combustible.length : 0);
        console.log('COSTOS HORA OPERADOR:', (d.costos && d.costos.hora_operador) ? d.costos.hora_operador.length : 0);
        console.log('COSTOS ALIMENTACION:', (d.costos && d.costos.alimentacion) ? d.costos.alimentacion.length : 0);
        console.log('DETALLE ALIMENTACION:');
        const alim = (d.costos && d.costos.alimentacion) || [];
        alim.forEach(a => {
          console.log('  -', a.fecha, '|', a.rol_personal, '|', a.nombre_personal, '| $', a.monto_total);
        });
        const totalAlim = alim.reduce((acc, a) => acc + Number(a.monto_total || 0), 0);
        console.log('TOTAL VIATICOS ALIMENTACION: $', totalAlim);
        process.exit(0);
      },
      status: (code) => {
        return {
          json: (data) => {
            console.log('STATUS:', code);
            const d = data.data || {};
            console.log('FOLIO ITS:', (d.its && d.its.folio_its) || 'AUTO');
            console.log('DETALLE ALIMENTACION:');
            const alim = (d.costos && d.costos.alimentacion) || [];
            alim.forEach(a => {
              console.log('  -', a.fecha, '|', a.rol_personal, '|', a.nombre_personal, '| $', a.monto_total);
            });
            const totalAlim = alim.reduce((acc, a) => acc + Number(a.monto_total || 0), 0);
            console.log('TOTAL VIATICOS ALIMENTACION: $', totalAlim);
            process.exit(0);
          }
        };
      }
    };

    itsController.getITS(req, res);
  `;
  await ssh.execCommand('cat << \'EOF\' > /tmp/test_its_ot35.js\n' + nodeTest + '\nEOF');
  const res3 = await ssh.execCommand('su - nodeadmin -c "node /tmp/test_its_ot35.js"');
  console.log(res3.stdout);
  if (res3.stderr) console.error(res3.stderr);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
