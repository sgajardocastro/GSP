const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const cmd = `
    echo "=== 1. SECCIÓN 1: EQUIPO Y PERSONAL ASIGNADO ==="
    grep -A 25 "EQUIPO Y SUBCATEGORÍA" /tmp/test_ot32_fleet.txt

    echo -e "\n=== 2. SECCIÓN 2: CONTROL DE FLOTA Y JORNADAS ==="
    grep -A 35 "2. CONTROL DE FLOTA" /tmp/test_ot32_fleet.txt || grep -A 35 "DETALLE DE JORNADAS" /tmp/test_ot32_fleet.txt
  `;

  const res = await ssh.execCommand(cmd);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
