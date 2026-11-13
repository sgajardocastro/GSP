import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function runPhase3() {
  console.log("==================================================================");
  console.log("🚀 FASE 3: CONFIGURACIÓN DE RUTEO NGINX PARA GSP PROD");
  console.log("==================================================================");

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });
  console.log("✅ SSH conectado como root.");

  // Paso 1: Respaldar configs actuales
  console.log("\n📦 Paso 1: Creando respaldos de configuración NGINX...");
  await ssh.execCommand('cp /etc/nginx/default.d/base.conf /etc/nginx/default.d/base.conf.bak_$(date +%Y%m%d%H%M%S)');
  await ssh.execCommand('cp /etc/nginx/sites-enabled/https_le.conf /etc/nginx/sites-enabled/https_le.conf.bak_$(date +%Y%m%d%H%M%S)');
  console.log("✅ Respaldos creados.");

  // Paso 2: Inyectar bloques en base.conf
  console.log("\n🌐 Paso 2: Inyectando bloques de producción en /etc/nginx/default.d/base.conf...");
  const baseConfAdd = `

# --- GRUAS SAN PABLO (GSP) - PRODUCCION ---
location = /lg-gsp-prod {
    return 301 $scheme://$http_host/lg-gsp-prod/;
}

location /lg-gsp-prod/whatsapp/ {
    proxy_pass http://127.0.0.1:3085/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection upgrade;
    proxy_set_header Host $host;
}

location /lg-gsp-prod/api/ {
    proxy_hide_header X-Frame-Options;
    add_header X-Frame-Options "ALLOWALL" always;
    proxy_pass http://127.0.0.1:3016/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /lg-gsp-prod/ {
    alias /var/www/html/lg-gsp-prod/;
    try_files $uri $uri/ /lg-gsp-prod/index.html;
    autoindex on;
}

location = /pwa-gsp-prod {
    return 301 $scheme://$http_host/pwa-gsp-prod/;
}

location /pwa-gsp-prod/ {
    alias /var/www/html/pwa-gsp-prod/;
    try_files $uri $uri/ /pwa-gsp-prod/index.html;
    autoindex on;
}
`;

  // Verificar si ya existe lg-gsp-prod en base.conf
  const checkExisting = await ssh.execCommand('grep -q "lg-gsp-prod" /etc/nginx/default.d/base.conf');
  if (checkExisting.code === 0) {
    console.log("Ya existían referencias previas a lg-gsp-prod en base.conf. Limpiando...");
    // Remover bloque anterior si existiera
    await ssh.execCommand("sed -i '/# --- GRUAS SAN PABLO (GSP) - PRODUCCION ---/,/location \\/pwa-gsp-prod\\/ {[^}]*}/d' /etc/nginx/default.d/base.conf");
  }

  // Insertar después de la sección dev de GSP
  const appendCmd = `cat << 'EOF' >> /etc/nginx/default.d/base.conf\n${baseConfAdd}\nEOF`;
  await ssh.execCommand(appendCmd);
  console.log("✅ Bloques inyectados en base.conf.");

  // Paso 3: Inyectar bloque en https_le.conf si no existe
  console.log("\n🌐 Paso 3: Inyectando microservicio en /etc/nginx/sites-enabled/https_le.conf...");
  const checkHttpsLe = await ssh.execCommand('grep -q "lean-services-gsp-prod" /etc/nginx/sites-enabled/https_le.conf');
  if (checkHttpsLe.code !== 0) {
    const httpsLeBlock = `
    location /lean-services-gsp-prod/ {
        proxy_hide_header X-Frame-Options;
        add_header X-Frame-Options "ALLOWALL" always;
        proxy_pass http://127.0.0.1:3016/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
    // Insertar justo antes del último '}'
    await ssh.execCommand(`sed -i '$i\\' /etc/nginx/sites-enabled/https_le.conf`);
    await ssh.execCommand(`sed -i '$i\\    location /lean-services-gsp-prod/ {\\n        proxy_hide_header X-Frame-Options;\\n        add_header X-Frame-Options "ALLOWALL" always;\\n        proxy_pass http://127.0.0.1:3016/;\\n        proxy_http_version 1.1;\\n        proxy_set_header Upgrade $http_upgrade;\\n        proxy_set_header Connection "upgrade";\\n        proxy_set_header Host $host;\\n        proxy_cache_bypass $http_upgrade;\\n    }\\n' /etc/nginx/sites-enabled/https_le.conf`);
    console.log("✅ Bloque inyectado en https_le.conf.");
  } else {
    console.log("✅ Bloque ya presente en https_le.conf.");
  }

  // Paso 4: Validar sintaxis NGINX
  console.log("\n🧪 Paso 4: Validando sintaxis NGINX (nginx -t)...");
  const testRes = await ssh.execCommand('nginx -t');
  console.log(testRes.stdout);
  console.log(testRes.stderr);
  if (testRes.code !== 0) {
    console.error("❌ ERROR EN SINTAXIS NGINX. Restaurando respaldos...");
    await ssh.execCommand('cp /etc/nginx/default.d/base.conf.bak_* /etc/nginx/default.d/base.conf 2>/dev/null');
    await ssh.execCommand('cp /etc/nginx/sites-enabled/https_le.conf.bak_* /etc/nginx/sites-enabled/https_le.conf 2>/dev/null');
    throw new Error("Sintaxis NGINX inválida.");
  }

  // Paso 5: Recargar NGINX
  console.log("\n🔄 Paso 5: Recargando servicio NGINX...");
  await ssh.execCommand('systemctl reload nginx');
  console.log("✅ NGINX recargado exitosamente.");

  // Paso 6: Smoke test API vía NGINX
  console.log("\n🧪 Paso 6: Smoke test HTTP a la API de Producción vía Nginx...");
  const curlRes = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/api/usuarios');
  console.log("Respuesta HTTP local:", curlRes.stdout);

  console.log("\n==================================================================");
  console.log("🎉 FASE 3 COMPLETADA CON ÉXITO: NGINX Ruteando a GSP PROD");
  console.log("==================================================================");

  ssh.dispose();
}

runPhase3().catch(err => {
  console.error("❌ ERROR EN FASE 3:", err);
  ssh.dispose();
});
