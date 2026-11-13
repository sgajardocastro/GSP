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

    console.log('--- BUSCANDO RUTAS EN BACKEND GSP ---');
    const routesRes = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/lean-services-gsp/src/routes/ || ls -la /home/nodeadmin/proyectos/lean-services-gsp/routes/');
    console.log(routesRes.stdout);

    const appJs = await ssh.execCommand('grep -rn "operaciones" /home/nodeadmin/proyectos/lean-services-gsp/src/ || true');
    console.log('Rutas de operaciones:\n', appJs.stdout);

  } catch (e) {
    console.error('Error SSH:', e);
  } finally {
    ssh.dispose();
  }
}

run();
