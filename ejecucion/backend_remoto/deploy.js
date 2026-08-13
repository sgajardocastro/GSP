const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 10000
    });
    console.log('Conectado exitosamente como root.');
    
    const command = 'su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && git pull origin refactor-maquina-estados-fsm && pm2 restart 10"';
    console.log('Ejecutando comando:', command);
    const result = await ssh.execCommand(command);
    
    console.log('STDOUT:', result.stdout);
    if (result.stderr) console.error('STDERR:', result.stderr);
    console.log('CODE:', result.code);
    
    ssh.dispose();
  } catch (err) {
    console.error('Error de conexión o ejecución:', err);
    process.exit(1);
  }
}
deploy();
