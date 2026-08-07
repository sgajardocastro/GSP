import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkNginxAndLogs() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('🔌 Conectado a servidor...');
    const pm2Logs = await ssh.execCommand('pm2 logs lean-services-gsp --lines 30 --err --raw');
    console.log('--- PM2 ERR LOGS ---');
    console.log(pm2Logs.stdout || pm2Logs.stderr);

    const nginxConf = await ssh.execCommand('grep -A 10 -B 2 "lg-gsp" /etc/nginx/conf.d/*.conf /etc/nginx/nginx.conf');
    console.log('--- NGINX CONFIG ---');
    console.log(nginxConf.stdout || nginxConf.stderr);

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

checkNginxAndLogs();
