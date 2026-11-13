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

  const localFile = path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js');
  const prodDest = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/proyectoModel.js';
  const devDest = '/home/nodeadmin/proyectos/lean-services-gsp/src/models/proyectoModel.js';

  // Backup en prod
  await ssh.execCommand(`cp ${prodDest} ${prodDest}.bak_20261110_ryl`);
  console.log('Backup de proyectoModel.js realizado.');

  // Subir a PROD y DEV
  console.log('Subiendo proyectoModel.js a PROD...');
  await ssh.putFile(localFile, prodDest);
  await ssh.execCommand(`chown nodeadmin:nodeadmin ${prodDest}`);

  console.log('Subiendo proyectoModel.js a DEV...');
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
  console.log('\nVerificando API en PROD (http://127.0.0.1:3016/api/proyectos)...');
  const checkRes = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/proyectos"');
  try {
    const list = JSON.parse(checkRes.stdout);
    const pry48 = (Array.isArray(list) ? list : list.data || []).find(p => p.id_proyecto === 48 || (p.codigo || p.codi_proyecto || '').includes('2611-00001'));
    if (pry48) {
      console.log('=== ESTADO DE PROYECTO ID 48 (RYL-2611-00001) EN API PROD ===');
      console.log('id_proyecto:', pry48.id_proyecto);
      console.log('codigo:', pry48.codigo || pry48.codi_proyecto);
      console.log('id_proyecto_estado DEVUELTO:', pry48.id_proyecto_estado);
      console.log('nombre_estado:', pry48.nombre_estado);
      console.log('fecha_plan_fin:', pry48.fecha_plan_fin);
      console.log('duracion_plan:', pry48.duracion_plan);
    } else {
      console.warn('No se encontró el proyecto 48 en la respuesta.');
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
