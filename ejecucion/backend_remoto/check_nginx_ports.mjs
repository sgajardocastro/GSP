import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('--- REVISANDO NGINX Y PUERTOS ---');
    const nginxConf = await ssh.execCommand('ls -la /etc/nginx/sites-enabled/ || ls -la /etc/nginx/conf.d/');
    console.log('Nginx configs:\n', nginxConf.stdout);

    const ufw = await ssh.execCommand('ufw status || iptables -L -n | grep -i dpt:308');
    console.log('Firewall:\n', ufw.stdout || ufw.stderr);

    // Ver configuración de servidor.leanglobal.cl
    const vhost = await ssh.execCommand('grep -rn "lg-gsp" /etc/nginx/ 2>/dev/null');
    console.log('Configuraciones lg-gsp en Nginx:\n', vhost.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
