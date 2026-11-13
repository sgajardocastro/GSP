const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('--- NGINX GSP PROD API ---');
  const ngx = await ssh.execCommand('grep -A 10 "location /lg-gsp-prod/api/" /etc/nginx/default.d/base.conf');
  console.log(ngx.stdout);

  console.log('--- NGINX GSP DEV API ---');
  const ngxDev = await ssh.execCommand('grep -A 10 "location /lg-gsp-dev/api/" /etc/nginx/default.d/base.conf');
  console.log(ngxDev.stdout);

  console.log('--- PM2 SHOW 10 (DEV) ---');
  const p10 = await ssh.execCommand('su - nodeadmin -c "pm2 show 10"');
  console.log(p10.stdout.split('\n').filter(l => l.includes('script path') || l.includes('exec mode') || l.includes('script args') || l.includes('exec cwd')).join('\n'));

  console.log('--- PM2 SHOW 13 (PROD) ---');
  const p13 = await ssh.execCommand('su - nodeadmin -c "pm2 show 13"');
  console.log(p13.stdout.split('\n').filter(l => l.includes('script path') || l.includes('exec mode') || l.includes('script args') || l.includes('exec cwd')).join('\n'));

  ssh.dispose();
}

main().catch(console.error);
