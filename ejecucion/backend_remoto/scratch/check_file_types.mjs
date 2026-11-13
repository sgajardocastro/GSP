import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const fileTypes = await ssh.execCommand('ls -1 /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys | cut -d"-" -f1 | sort | uniq -c');
    console.log('File type counts in auth_info_baileys:\n', fileTypes.stdout);
    
    const preKeys = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/creds.json');
    console.log('creds.json:\n', preKeys.stdout);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
