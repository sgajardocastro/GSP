const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function verify() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const checkDev = await ssh.execCommand('grep -o "1.0.132" /var/www/html/lg-gsp-dev/assets/index-*.js | head -n 1');
  console.log('Versión en bundle físico DEV:', checkDev.stdout.trim() || 'NO ENCONTRADA');

  const checkProd = await ssh.execCommand('grep -o "1.0.132" /var/www/html/lg-gsp-prod/assets/index-*.js | head -n 1');
  console.log('Versión en bundle físico PROD:', checkProd.stdout.trim() || 'NO ENCONTRADA');

  const checkButtonDev = await ssh.execCommand('grep -o "ENVIAR CONTRATO PARA FIRMA" /var/www/html/lg-gsp-dev/assets/index-*.js | head -n 1');
  console.log('Botón "ENVIAR CONTRATO PARA FIRMA" en DEV:', checkButtonDev.stdout.trim() || 'NO ENCONTRADO');

  const checkButtonProd = await ssh.execCommand('grep -o "ENVIAR CONTRATO PARA FIRMA" /var/www/html/lg-gsp-prod/assets/index-*.js | head -n 1');
  console.log('Botón "ENVIAR CONTRATO PARA FIRMA" en PROD:', checkButtonProd.stdout.trim() || 'NO ENCONTRADO');

  const checkPry109 = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -A -c \\"SELECT json_field->'crm_v1'->'contrato' FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 109;\\""`);
  console.log('Estado contrato oportunidad 109 en DEV DB:', checkPry109.stdout.trim() || 'LIMPIO / NULL (Borrador)');

  ssh.dispose();
}

verify();
