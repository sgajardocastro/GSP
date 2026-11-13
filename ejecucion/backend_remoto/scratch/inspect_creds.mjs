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

    const credsStr = await ssh.execCommand('cat /home/nodeadmin/proyectos/gsp-whatsapp-service/auth_info_baileys/creds.json');
    const creds = JSON.parse(credsStr.stdout);
    console.log('Creds keys:', Object.keys(creds));
    console.log('me:', creds.me);
    console.log('platform:', creds.platform);
    console.log('lastAccountSyncTimestamp:', creds.lastAccountSyncTimestamp);
    console.log('processedHistoryMessages:', creds.processedHistoryMessages ? creds.processedHistoryMessages.length : 0);
  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
main();
