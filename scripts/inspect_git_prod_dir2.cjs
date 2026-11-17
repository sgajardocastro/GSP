const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectGitStatusProdDir2() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const cmd = `cd /home/nodeadmin/proyectos/lean-services-gsp-prod && git --version && git rev-parse --is-inside-work-tree 2>&1`;
  const res = await ssh.execCommand(cmd);
  console.log('GIT TEST:\n', res.stdout);

  ssh.dispose();
}

inspectGitStatusProdDir2().catch(console.error);
