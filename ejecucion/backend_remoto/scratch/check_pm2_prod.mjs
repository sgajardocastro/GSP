import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function inspectGateD() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  const showRes = await ssh.execCommand('su - nodeadmin -c "pm2 show lean-services-gsp-prod"');
  console.log(showRes.stdout);

  ssh.dispose();
}

inspectGateD().catch(console.error);
