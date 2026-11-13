const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== CONCEDIENDO PERMISOS DE TABLA Y SECUENCIA tits_geraldsoft_planillas ===\n');

  const grantsDev = `
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp.tits_geraldsoft_planillas TO usr_leangsp;
    GRANT USAGE, SELECT, UPDATE ON SEQUENCE sch_leangsp.tits_geraldsoft_planillas_id_planilla_seq TO usr_leangsp;
  `;
  const resDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${grantsDev.replace(/\n/g, ' ')}\\""`);
  console.log('GRANTs DEV:', resDev.stdout.trim() || resDev.stderr.trim());

  const grantsProd = `
    GRANT ALL PRIVILEGES ON TABLE sch_leangsp_prod.tits_geraldsoft_planillas TO usr_leangsp_prod;
    GRANT USAGE, SELECT, UPDATE ON SEQUENCE sch_leangsp_prod.tits_geraldsoft_planillas_id_planilla_seq TO usr_leangsp_prod;
  `;
  const resProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${grantsProd.replace(/\n/g, ' ')}\\""`);
  console.log('GRANTs PROD:', resProd.stdout.trim() || resProd.stderr.trim());

  // Probar curl en DEV y PROD
  const testDev = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/transicion/planillas/activas');
  console.log('\nRespuesta DEV:', testDev.stdout);

  const testProd = await ssh.execCommand('curl -s https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/its/transicion/planillas/activas');
  console.log('Respuesta PROD:', testProd.stdout);

  ssh.dispose();
}

run().catch(console.error);
