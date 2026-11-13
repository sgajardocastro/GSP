const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function main() {
  console.log('Conectando a servidor por SSH...');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });
  console.log('Conexión establecida.');

  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js');
  const prodDest = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const devDest = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/itsController.js';

  // Backup en prod
  await ssh.execCommand(`cp ${prodDest} ${prodDest}.bak_20261110_traslado`);
  console.log('Backup de itsController.js realizado.');

  // Subir a PROD y DEV
  console.log('Subiendo itsController.js a PROD...');
  await ssh.putFile(localFile, prodDest);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodDest}`);

  console.log('Subiendo itsController.js a DEV...');
  await ssh.putFile(localFile, devDest);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devDest}`);

  // Reiniciar PM2
  console.log('Reiniciando procesos PM2 13 (PROD) y 10 (DEV)...');
  const rProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 13 output:', rProd.stdout.split('\n').slice(-3).join('\n'));
  const rDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log('PM2 10 output:', rDev.stdout.split('\n').slice(-3).join('\n'));

  // Esperar 2 segundos para estabilización
  await new Promise(r => setTimeout(r, 2000));

  // Verificar con curl en PROD (puerto 3016)
  console.log('\nVerificando API en PROD (http://127.0.0.1:3016/api/its/49)...');
  const checkRes = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/its/49"');
  try {
    const json = JSON.parse(checkRes.stdout);
    if (!json.success) {
      console.error('Error en respuesta API:', json);
    } else {
      const data = json.data;
      console.log('=== CABECERA ITS VERIFICADA ===');
      console.log({
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
      console.log('\n=== JORNADAS ITS VERIFICADAS (Total: ' + (data.jornadas || []).length + ') ===');
      (data.jornadas || []).forEach((j, i) => {
        console.log(`[${i}]`, {
          fecha: j.fecha,
          tipo_servicio: j.tipo_servicio,
          patente: j.patente,
          horas_reales: j.horas_reales,
          horas_report: j.horas_report,
          tarifa_hora: j.tarifa_hora,
          subtotal: j.subtotal,
          numero_report: j.numero_report,
          tipo_respaldo: j.tipo_respaldo
        });
      });
    }
  } catch (e) {
    console.error('Error parseando respuesta curl:', e.message, checkRes.stdout.substring(0, 300));
  }

  ssh.dispose();
}

main().catch(err => {
  console.error('Error en ejecución:', err);
  process.exit(1);
});
