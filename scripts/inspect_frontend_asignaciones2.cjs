const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectOtherOffsets() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const offsets = [1090513, 1137337];
  for (const offset of offsets) {
    console.log(`=== OFFSET ${offset} ===`);
    const cmdRead = `python3 -c "
with open('/var/www/html/lg-gsp-prod/assets/index-B91sdtdb.js', 'rb') as f:
    f.seek(max(0, ${offset} - 250))
    print(f.read(800).decode('utf-8', 'ignore'))
"`;
    const resRead = await ssh.execCommand(cmdRead);
    console.log(resRead.stdout);
  }

  ssh.dispose();
}

inspectOtherOffsets().catch(console.error);
