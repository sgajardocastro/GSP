const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res1 = await ssh.execCommand('grep -rn "Equipos con Movimiento" /var/www/html/lg-gsp-prod/assets/ | wc -l');
  const res2 = await ssh.execCommand('grep -rn "Bandeja de Entrada de Reports Diarios" /var/www/html/lg-gsp-prod/assets/ | wc -l');
  const res3 = await ssh.execCommand('grep -rn "Equipos con Movimiento" /var/www/html/lg-gsp-dev/assets/ | wc -l');
  const res4 = await ssh.execCommand('grep -rn "Bandeja de Entrada de Reports Diarios" /var/www/html/lg-gsp-dev/assets/ | wc -l');

  console.log('PROD has "Equipos con Movimiento" (Gantt KPIs):', res1.stdout.trim());
  console.log('PROD has "Bandeja de Entrada de Reports Diarios" (Reports OT):', res2.stdout.trim());
  console.log('DEV has "Equipos con Movimiento" (Gantt KPIs):', res3.stdout.trim());
  console.log('DEV has "Bandeja de Entrada de Reports Diarios" (Reports OT):', res4.stdout.trim());

  ssh.dispose();
}

main().catch(console.error);
