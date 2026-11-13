const { NodeSSH } = require('node-ssh');

const assetlinksContent = JSON.stringify([
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cl.leanglobal.pwa_lg_gsp_dev.twa",
      "sha256_cert_fingerprints": [
        "F1:05:88:93:AD:08:EA:EC:C3:E6:0B:6A:FE:4B:0C:60:89:2A:07:92:2A:89:FB:2A:E0:FC:A9:F3:E4:D4:16:F5"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cl.leanglobal.pwa_lg_gsp_prod.twa",
      "sha256_cert_fingerprints": [
        "F1:05:88:93:AD:08:EA:EC:C3:E6:0B:6A:FE:4B:0C:60:89:2A:07:92:2A:89:FB:2A:E0:FC:A9:F3:E4:D4:16:F5"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cl.leanglobal.pwa.gsp",
      "sha256_cert_fingerprints": [
        "F1:05:88:93:AD:08:EA:EC:C3:E6:0B:6A:FE:4B:0C:60:89:2A:07:92:2A:89:FB:2A:E0:FC:A9:F3:E4:D4:16:F5"
      ]
    }
  }
], null, 2);

async function run() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log("1. Creando directorios .well-known...");
  await ssh.execCommand('mkdir -p /var/www/html/.well-known /usr/share/nginx/html/.well-known');

  console.log("2. Escribiendo assetlinks.json...");
  const escaped = assetlinksContent.replace(/"/g, '\\"');
  await ssh.execCommand(`echo "${escaped}" > /var/www/html/.well-known/assetlinks.json`);
  await ssh.execCommand(`echo "${escaped}" > /usr/share/nginx/html/.well-known/assetlinks.json`);
  await ssh.execCommand('chmod 644 /var/www/html/.well-known/assetlinks.json /usr/share/nginx/html/.well-known/assetlinks.json');

  console.log("3. Verificando regla Nginx en /etc/nginx/default.d/base.conf...");
  const baseConf = await ssh.execCommand('cat /etc/nginx/default.d/base.conf');
  if (!baseConf.stdout.includes('assetlinks.json')) {
    const nginxBlock = `
# --- ASSETLINKS DIGITAL LINKS TWA ---
location /.well-known/assetlinks.json {
    alias /var/www/html/.well-known/assetlinks.json;
    default_type application/json;
    add_header Content-Type application/json always;
    add_header Access-Control-Allow-Origin * always;
}
`;
    await ssh.execCommand(`echo '${nginxBlock}' >> /etc/nginx/default.d/base.conf`);
    console.log("Bloque inyectado en /etc/nginx/default.d/base.conf");
  } else {
    console.log("Bloque ya existe en base.conf");
  }

  console.log("4. Probando sintaxis nginx...");
  const testRes = await ssh.execCommand('nginx -t');
  console.log(testRes.stdout, testRes.stderr);

  if (testRes.stderr.includes('successful') || testRes.stdout.includes('successful')) {
    console.log("5. Recargando nginx...");
    await ssh.execCommand('systemctl reload nginx');
  }

  console.log("6. Verificando con curl interno...");
  const curlRes = await ssh.execCommand('curl -s -k -i https://127.0.0.1/.well-known/assetlinks.json');
  console.log(curlRes.stdout.substring(0, 300));

  ssh.dispose();
}

run().catch(console.error);
