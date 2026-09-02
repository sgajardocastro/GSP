import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkPwaDeployment() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const nginxRes = await ssh.execCommand('grep -rn "pwa-gsp-dev" /etc/nginx/ /etc/httpd/ 2>/dev/null');
    console.log('--- NGINX/HTTPD CONFIG FOR pwa-gsp-dev ---');
    console.log(nginxRes.stdout);

    const findDir = await ssh.execCommand('find /var/www /home /u05 -maxdepth 3 -name "pwa-gsp-dev" 2>/dev/null');
    console.log('--- DIRECTORIOS pwa-gsp-dev EN SERVIDOR ---');
    console.log(findDir.stdout);

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
checkPwaDeployment();
