const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/its/49');
  console.log('=== RESPUESTA ITS /api/its/49 ===');
  try {
    const json = JSON.parse(res.stdout);
    if (!json.success) {
      console.log('Error o sin éxito:', json);
    } else {
      const data = json.data;
      console.log('Cabecera ITS:', {
        id_its: data.its?.id_its,
        folio_its: data.its?.folio_its,
        horas_minimas_pactadas: data.its?.horas_minimas_pactadas,
        valor_hora_pactado: data.its?.valor_hora_pactado,
        valor_flete_pactado: data.its?.valor_flete_pactado,
        unidad_flete_pactado: data.its?.unidad_flete_pactado,
        es_valor_fijo: data.its?.es_valor_fijo,
        total_horas_report: data.its?.total_horas_report,
        total_ingresos_horas: data.its?.total_ingresos_horas,
        total_ingresos_fletes: data.its?.total_ingresos_fletes,
        total_ingresos_facturables: data.its?.total_ingresos_facturables
      });
      console.log('\nJornadas (Total: ' + (data.jornadas || []).length + '):');
      (data.jornadas || []).forEach((j, i) => {
        console.log(`[${i}]`, {
          fecha: j.fecha,
          tipo_servicio: j.tipo_servicio,
          patente: j.patente,
          horas_reales: j.horas_reales,
          horas_report: j.horas_report,
          tarifa_hora: j.tarifa_hora,
          subtotal: j.subtotal,
          numero_report: j.numero_report
        });
      });
    }
  } catch (e) {
    console.error('Error parseando JSON:', e.message, res.stdout.substring(0, 300));
  }

  ssh.dispose();
}

main().catch(console.error);
