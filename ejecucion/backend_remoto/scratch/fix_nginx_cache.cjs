const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function fixNginx() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: 'lgbl2025.'
  });

  console.log('🔧 Verificando y agregando no-cache headers en /etc/nginx/default.d/base.conf...');
  const addHeadersScript = `
    python3 -c "
with open('/etc/nginx/default.d/base.conf', 'r') as f:
    content = f.read()

# Asegurar no-cache para lg-gsp-prod
target = '''location /lg-gsp-prod/ {
    alias /var/www/html/lg-gsp-prod/;
    try_files \\$uri \\$uri/ /lg-gsp-prod/index.html;
    autoindex on;'''

replacement = '''location /lg-gsp-prod/ {
    alias /var/www/html/lg-gsp-prod/;
    try_files \\$uri \\$uri/ /lg-gsp-prod/index.html;
    autoindex on;
    add_header Cache-Control 'no-store, no-cache, must-revalidate, max-age=0' always;
    add_header Pragma 'no-cache' always;'''

if target in content:
    content = content.replace(target, replacement)
    with open('/etc/nginx/default.d/base.conf', 'w') as f:
        f.write(content)
    print('Modificado base.conf exitosamente')
else:
    print('Ya tiene headers o no coincide target')
"
  `;

  const res = await ssh.execCommand(addHeadersScript);
  console.log(res.stdout);

  console.log('🔍 Probando configuración de Nginx (nginx -t)...');
  const t = await ssh.execCommand('nginx -t');
  console.log(t.stdout, t.stderr);

  if (t.stdout.includes('syntax is ok') || t.stderr.includes('syntax is ok')) {
    console.log('🔄 Recargando Nginx...');
    await ssh.execCommand('systemctl reload nginx');
    console.log('✅ Nginx recargado.');
  }

  console.log('🌐 Probando curl con headers...');
  const curlH = await ssh.execCommand('curl -ILs https://servidor.leanglobal.cl/lg-gsp-prod/ | grep -E "HTTP|Cache-Control|Location"');
  console.log(curlH.stdout);

  ssh.dispose();
}

fixNginx().catch(console.error);
