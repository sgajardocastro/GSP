const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectFrontendLogic() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `grep -b -o "asignaciones/equipos" /var/www/html/lg-gsp-prod/assets/index-B91sdtdb.js`;
  const res = await ssh.execCommand(cmd);
  console.log('OFFSETS:\n', res.stdout);

  // Read 400 bytes around the offset
  if (res.stdout.trim()) {
    const offset = parseInt(res.stdout.trim().split(':')[0], 10);
    const cmdRead = `python3 -c "
with open('/var/www/html/lg-gsp-prod/assets/index-B91sdtdb.js', 'rb') as f:
    f.seek(max(0, ${offset} - 200))
    print(f.read(800).decode('utf-8', 'ignore'))
"`;
    const resRead = await ssh.execCommand(cmdRead);
    console.log('CODE AROUND ASIGNACIONES:\n', resRead.stdout);
  }

  ssh.dispose();
}

inspectFrontendLogic().catch(console.error);
