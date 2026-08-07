import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function runRemoteCheck() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    console.log('✅ Conectado a servidor remotos via SSH...');
    
    // Subir el script de chequeo
    await ssh.putFile(
      'd:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/check_all_files.js',
      '/home/nodeadmin/proyectos/lean-services-gsp/check_all_files.js'
    );

    const res = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp && node check_all_files.js');
    console.log('--- REPORTE SERVIDOR ---');
    console.log(res.stdout || res.stderr);

    // Limpiar
    await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp/check_all_files.js');
  } catch (err) {
    console.error('Error SSH:', err);
  } finally {
    ssh.dispose();
  }
}

runRemoteCheck();
