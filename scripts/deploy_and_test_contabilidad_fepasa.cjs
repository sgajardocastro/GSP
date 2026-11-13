const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/estadoPagoController.js');
  const devDest = '/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/estadoPagoController.js';
  const prodDest = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/estadoPagoController.js';

  console.log('Subiendo estadoPagoController.js a DEV y PROD...');
  await ssh.putFile(localFile, devDest);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${devDest}`);

  await ssh.putFile(localFile, prodDest);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodDest}`);
  console.log('Archivos subidos.');

  console.log('Reiniciando PM2 DEV (10) y PROD (13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 reiniciado.');

  console.log('Consultando endpoint perspectiva-contabilidad en PROD...');
  const res = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/operaciones/edp/perspectiva-contabilidad"');
  try {
    const json = JSON.parse(res.stdout);
    const fepasa = (json.data?.procesos || []).find(p => p.id_proyecto === 30 || (p.codi_proyecto || '').includes('2611-00001'));
    console.log('\n=== RESULTADO PROD FEPASA ===');
    console.log('id_proyecto:', fepasa?.id_proyecto);
    console.log('codi_proyecto:', fepasa?.codi_proyecto);
    console.log('cliente_nombre:', fepasa?.cliente_nombre);
    console.log('monto_comprometido:', fepasa?.monto_comprometido);
    console.log('monto_devengado_reports:', fepasa?.monto_devengado_reports);
    console.log('monto_its_neto:', fepasa?.monto_its_neto);
    console.log('monto_edp_neto:', fepasa?.monto_edp_neto);
    console.log('saldo_pendiente_facturar:', fepasa?.saldo_pendiente_facturar);
    console.log('habilitado_facturar:', fepasa?.habilitado_facturar);
  } catch (e) {
    console.error('Error parseando JSON:', e.message, res.stdout.substring(0, 300));
  }

  ssh.dispose();
}

main().catch(console.error);
