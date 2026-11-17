const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectDevGitBranch() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `cd /home/nodeadmin/proyectos/lean-services-gsp && git branch && git log -n 1 --oneline`;
  const res = await ssh.execCommand(cmd);
  console.log('GIT BRANCH DEV:\n', res.stdout);

  ssh.dispose();
}

inspectDevGitBranch().catch(console.error);
