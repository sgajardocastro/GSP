const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function inspectV10() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const resPdf = await ssh.execCommand(`python3 -c "
import pdfplumber
with pdfplumber.open('/u05/LeanDocs/GSP/prod/ot/2026/11/OT-GSP-2611-00047V11-253.pdf') as pdf:
    for i, page in enumerate(pdf.pages):
        print(f'=== PAGE {i} ===')
        text = page.extract_text()
        for l in text.split('\\n'):
            if any(k in l for k in ['VYRK', 'CPYW', '1250', '250', 'Saavedra', 'Opazo', 'Mercado', 'RWJL']):
                print(l)
"`);
  console.log(resPdf.stdout, resPdf.stderr);

  ssh.dispose();
}

inspectV10().catch(console.error);
