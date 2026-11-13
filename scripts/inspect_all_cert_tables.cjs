const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO TABLAS DE CERTIFICADOS Y ARCHIVOS EN DEV Y PROD ===');
  
  const tables = [
    'tequ_tipos_certificado',
    'tequ_certificados_equipo',
    'tfmg_file',
    'tsec_certificados',
    'tequ_subcategoria',
    'tequ_categoria',
    'tequ_modelo',
    'tequ_marca'
  ];

  for (const t of tables) {
    const devC = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp.${t};'"` );
    const prodC = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c 'SELECT count(*) FROM sch_leangsp_prod.${t};'"` );
    console.log(`Tabla ${t.padEnd(26)} -> DEV: ${devC.stdout.trim().padStart(5)} | PROD: ${prodC.stdout.trim().padStart(5)}`);
  }

  ssh.dispose();
}

check().catch(console.error);
