import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Conectando a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('SSH Conectado.');

    // 1. Subir server.js
    console.log('--- 1. SUBIENDO SERVER.JS ---');
    const localServerPath = 'D:\\SGajardo\\Google Drive\\Antigravity\\Grúas San Pablo\\Propuesta Gestión Operación Grúas\\ejecucion\\backend_remoto\\whatsapp_server.js';
    const remoteServerPath = '/home/nodeadmin/proyectos/gsp-whatsapp-service/server.js';
    await ssh.putFile(localServerPath, remoteServerPath);
    await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/gsp-whatsapp-service');
    console.log('server.js subido y permisos asignados a nodeadmin.');

    // 2. Configurar Nginx para exponer /lg-gsp-dev/whatsapp/
    console.log('\n--- 2. ACTUALIZANDO NGINX ---');
    const nginxCheck = await ssh.execCommand('grep -q "location /lg-gsp-dev/whatsapp/" /etc/nginx/default.d/base.conf && echo "EXISTE" || echo "NO_EXISTE"');
    if (nginxCheck.stdout.trim() === 'NO_EXISTE') {
      console.log('Inyectando bloque Nginx para /lg-gsp-dev/whatsapp/...');
      const nginxBlock = `
location /lg-gsp-dev/whatsapp/ {
    proxy_pass http://127.0.0.1:3085/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \\$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \\$host;
}
`;
      await ssh.execCommand(`cp /etc/nginx/default.d/base.conf /etc/nginx/default.d/base.conf.bak_whatsapp && sed -i '/location \\/lg-gsp-dev\\/api\\/ {/i \\${nginxBlock.replace(/\n/g, '\\n')}' /etc/nginx/default.d/base.conf`);
      const testNginx = await ssh.execCommand('nginx -t');
      console.log('Nginx test:', testNginx.stdout, testNginx.stderr);
      if (testNginx.stdout.includes('successful') || testNginx.stderr.includes('successful')) {
        await ssh.execCommand('nginx -s reload');
        console.log('Nginx recargado exitosamente.');
      } else {
        console.error('Fallo en Nginx, restaurando backup...');
        await ssh.execCommand('cp /etc/nginx/default.d/base.conf.bak_whatsapp /etc/nginx/default.d/base.conf && nginx -s reload');
      }
    } else {
      console.log('El bloque Nginx ya existe.');
    }

    // 3. Iniciar servicio en PM2 como nodeadmin
    console.log('\n--- 3. INICIANDO SERVICIO EN PM2 (NODEADMIN) ---');
    const pm2Cmd = 'su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 16 && cd /home/nodeadmin/proyectos/gsp-whatsapp-service && pm2 delete gsp-whatsapp 2>/dev/null || true && pm2 start server.js --name gsp-whatsapp && pm2 save"';
    const pm2Res = await ssh.execCommand(pm2Cmd);
    console.log(pm2Res.stdout);
    if (pm2Res.stderr) console.log('STDERR:', pm2Res.stderr);

    // 4. Verificar estado del servicio
    console.log('\n--- 4. VERIFICANDO SERVICIO ---');
    await new Promise(r => setTimeout(r, 4000));
    const statusCheck = await ssh.execCommand('curl -s http://127.0.0.1:3085/status');
    console.log('Respuesta /status:', statusCheck.stdout || statusCheck.stderr);

    const pm2Logs = await ssh.execCommand('su - nodeadmin -c "pm2 logs gsp-whatsapp --lines 15 --nostream"');
    console.log('Logs PM2:\n', pm2Logs.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
