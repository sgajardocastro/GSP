const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function findPdfAnywhere() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const res = await ssh.execCommand('find / -name "*00047V11*" 2>/dev/null');
  console.log('FIND V11:\n', res.stdout);

  if (res.stdout.trim()) {
    const filePath = res.stdout.trim().split('\n')[0];
    const resText = await ssh.execCommand(`python3 -c "
import pypdf
reader = pypdf.PdfReader('${filePath}')
text = ''
for page in reader.pages:
    text += page.extract_text()
for line in text.split('\\n'):
    if any(k in line for k in ['VYRK', 'CPYW', '1250', '250', 'Jorge', 'Diego', 'Mercado', 'RWJL']):
        print(line)
"`);
    console.log('PDF TEXT MATCHES:\n', resText.stdout);
  }

  ssh.dispose();
}

findPdfAnywhere().catch(console.error);
