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

    console.log('--- 1. PREPARANDO PERMISOS Y DIRECTORIO ---');
    await ssh.execCommand('mkdir -p /home/nodeadmin/proyectos/gsp-whatsapp-service && chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/gsp-whatsapp-service');

    console.log('--- 2. CREANDO PACKAGE.JSON ---');
    const pkg = {
      name: 'gsp-whatsapp-service',
      version: '1.0.0',
      type: 'module',
      main: 'server.js',
      dependencies: {
        '@whiskeysockets/baileys': '^6.7.8',
        'qrcode': '^1.5.3',
        'express': '^4.19.2',
        'cors': '^2.8.5',
        'pino': '^8.20.0'
      }
    };
    await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/gsp-whatsapp-service/package.json\n${JSON.stringify(pkg, null, 2)}\nEOF`);
    await ssh.execCommand('chown nodeadmin:nodeadmin /home/nodeadmin/proyectos/gsp-whatsapp-service/package.json');

    console.log('--- 3. INSTALANDO DEPENDENCIAS CON USUARIO NODEADMIN Y NODE 18 ---');
    const npmInstall = await ssh.execCommand('su - nodeadmin -c "source \\$HOME/.nvm/nvm.sh && nvm use 18 && cd /home/nodeadmin/proyectos/gsp-whatsapp-service && npm install --save --legacy-peer-deps"');
    console.log(npmInstall.stdout);
    if (npmInstall.stderr) console.log('STDERR:\n', npmInstall.stderr);

    console.log('--- 4. VERIFICANDO INSTALACIÓN ---');
    const checkMod = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/gsp-whatsapp-service/node_modules/@whiskeysockets');
    console.log(checkMod.stdout || checkMod.stderr);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
