const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  console.log('=== ACTUALIZANDO TPAR_EMPRESAS EN POSTGRESQL (BD: postgres) ===');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sqlCommands = `
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-sanpablo.png' WHERE id_empresa IN (9, 11);
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-bestmaq.png' WHERE id_empresa = 7;
    UPDATE sch_leangsp.tpar_empresas SET logo_empresa = 'logo-logisticadelsur.png' WHERE id_empresa = 8;
    
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-sanpablo.png' WHERE id_empresa IN (9, 11);
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-bestmaq.png' WHERE id_empresa = 7;
    UPDATE sch_leangsp_prod.tpar_empresas SET logo_empresa = 'logo-logisticadelsur.png' WHERE id_empresa = 8;
  `;

  console.log('1. Ejecutando sentencias SQL en bd postgres...');
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlCommands}\\""`);
  console.log('Salida psql:\n', res.stdout || res.stderr);

  console.log('\n2. Verificando estado en DEV (sch_leangsp.tpar_empresas):');
  const devCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_empresa, name_empresa, logo_empresa FROM sch_leangsp.tpar_empresas WHERE id_empresa IN (7, 8, 9, 11);\\""`);
  console.log(devCheck.stdout);

  console.log('\n3. Verificando estado en PROD (sch_leangsp_prod.tpar_empresas):');
  const prodCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_empresa, name_empresa, logo_empresa FROM sch_leangsp_prod.tpar_empresas WHERE id_empresa IN (7, 8, 9, 11);\\""`);
  console.log(prodCheck.stdout);

  ssh.dispose();
  console.log('\n=== ACTUALIZACIÓN DE BD FINALIZADA CON ÉXITO ===');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
