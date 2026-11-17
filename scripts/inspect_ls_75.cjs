const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const scriptNode = `
  const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');
  (async () => {
    const ls = await pool.query("SELECT * FROM tpry_linea_servicio WHERE id_proyecto = 75 AND activo = true ORDER BY orden ASC");
    console.log(JSON.stringify(ls.rows, null, 2));
    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/ls_75.js\n${scriptNode}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/ls_75.js"');
  console.log(out.stdout);
  ssh.dispose();
}

run().catch(console.error);
