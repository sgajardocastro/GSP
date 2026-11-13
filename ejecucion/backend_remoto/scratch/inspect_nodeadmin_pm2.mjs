import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  console.log("=== PM2 AS NODEADMIN ===");
  const pm2Nodeadmin = await ssh.execCommand('su - nodeadmin -c "pm2 list"');
  console.log(pm2Nodeadmin.stdout);

  console.log("\n=== PROCESS 3877 (Port 3006 - GSP DEV API) ===");
  const p3006 = await ssh.execCommand('ls -l /proc/3877/cwd /proc/3877/exe');
  console.log(p3006.stdout);
  const cmd3006 = await ssh.execCommand('cat /proc/3877/cmdline | tr "\\0" " "');
  console.log("Cmdline 3006:", cmd3006.stdout);

  console.log("\n=== PROCESS 28976 (Port 3016) ===");
  const p3016 = await ssh.execCommand('ls -l /proc/28976/cwd /proc/28976/exe');
  console.log(p3016.stdout);
  const cmd3016 = await ssh.execCommand('cat /proc/28976/cmdline | tr "\\0" " "');
  console.log("Cmdline 3016:", cmd3016.stdout);

  console.log("\n=== ALL NODE PROCESSES DETAILS (ports 3000 to 3020) ===");
  const allProcs = await ssh.execCommand('ps aux | grep node');
  console.log(allProcs.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
