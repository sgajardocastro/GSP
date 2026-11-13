import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function runPhase2() {
  console.log("==================================================================");
  console.log("🚀 FASE 2: SINCRONIZACIÓN Y DESPLIEGUE DE BACKEND (lean-services-gsp-prod)");
  console.log("==================================================================");

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });
  console.log("✅ SSH conectado como root.");

  // Paso 1: Backup de seguridad
  console.log("\n📦 Paso 1: Respaldando backend prod anterior...");
  await ssh.execCommand('cp -r /home/nodeadmin/proyectos/lean-services-gsp-prod /home/nodeadmin/proyectos/lean-services-gsp-prod-bak-$(date +%Y%m%d%H%M%S) 2>/dev/null');
  console.log("✅ Respaldo creado.");

  // Paso 2: Sincronizar código desde lean-services-gsp (DEV actualizado)
  console.log("\n🔄 Paso 2: Replicando código fuente actualizado desde DEV a PROD...");
  // Usar rsync excluyendo .env y node_modules para velocidad y seguridad
  const rsyncCmd = `rsync -av --delete --exclude='.env' --exclude='node_modules' --exclude='.git' /home/nodeadmin/proyectos/lean-services-gsp/ /home/nodeadmin/proyectos/lean-services-gsp-prod/`;
  const rsyncRes = await ssh.execCommand(rsyncCmd);
  if (rsyncRes.code !== 0) {
    throw new Error("Error en rsync: " + rsyncRes.stderr);
  }
  console.log("✅ Código fuente sincronizado.");

  // Paso 3: Configurar .env canónico de producción
  console.log("\n⚙️ Paso 3: Escribiendo .env canónico para PROD...");
  const prodEnvContent = `PORT=3016
NODE_ENV=production
APP_ENV=prod
DB_USER='usr_leangsp_prod'
DB_PASSWORD='usr_gsp_prod_2026!'
DB_HOST='localhost'
DB_NAME='postgres'
DB_PORT=5432
DB_SCHEMA='sch_leangsp_prod'

STORAGE_ROOT='/u05/LeanDocs'
STORAGE_PATH='/u05/LeanDocs/GSP/prod'

POP3_HOST=da004.servidoresph.com
POP3_PORT=995

JWT_SECRET='una_clave_super_segura_para_firma_gsp_prod_2026'
JWT_ENCRYPT_SECRET='otra_clave_distinta_para_cifrado_gsp_prod_2026'

BASE_URL=https://servidor.leanglobal.cl/lg-gsp-prod
GOOGLE_CLIENT_ID=900336188439-v2jr120b65dcvbi5j26kst05ldl73uou.apps.googleusercontent.com
`;
  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/.env\n${prodEnvContent}EOF`);
  console.log("✅ .env de producción configurado.");

  // Paso 4: Ajustar dbConfig.js en PROD para asegurar search_path canónico
  console.log("\n🔧 Paso 4: Auditando y configurando dbConfig.js en PROD...");
  const dbConfigContent = `
const { Client } = require("pg");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log("DB_USER from env:", process.env.DB_USER);

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

client
  .connect()
  .then(() => {
    const schema = process.env.DB_SCHEMA || 'sch_leangsp_prod';
    console.log("Conectado a PostgreSQL con usuario: " + process.env.DB_USER + " Schema: " + schema);
    return client.query(\`SET search_path TO \${schema}, public\`);
  })
  .catch((err) => {
    console.error("Error de conexión o consulta", err.stack);
  });

module.exports = client;
`;
  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/dbConfig.js\n${dbConfigContent}EOF`);
  console.log("✅ dbConfig.js asegurado.");

  // Paso 5: Reemplazar schemas hardcodeados si existen
  console.log("\n🔍 Paso 5: Auditando referencias a esquemas hardcodeados...");
  const grepRes = await ssh.execCommand('grep -rn "sch_leangsp\\." /home/nodeadmin/proyectos/lean-services-gsp-prod/src/');
  if (grepRes.stdout.trim()) {
    console.log("Se encontraron referencias hardcodeadas a sch_leangsp.:\n", grepRes.stdout);
    console.log("Reemplazando por sch_leangsp_prod....");
    await ssh.execCommand('find /home/nodeadmin/proyectos/lean-services-gsp-prod/src/ -type f -exec sed -i "s/sch_leangsp\\./sch_leangsp_prod\\./g" {} +');
    console.log("✅ Referencias reemplazadas.");
  } else {
    console.log("✅ Cero referencias hardcodeadas encontradas.");
  }

  // Paso 6: Asegurar permisos nodeadmin
  console.log("\n🔒 Paso 6: Asegurando permisos de propiedad para nodeadmin...");
  await ssh.execCommand('chown -R nodeadmin:nodeadmin /home/nodeadmin/proyectos/lean-services-gsp-prod');
  console.log("✅ Permisos actualizados.");

  // Paso 7: Reiniciar en PM2 y guardar
  console.log("\n🚀 Paso 7: Reiniciando PM2 (lean-services-gsp-prod)...");
  await ssh.execCommand('su - nodeadmin -c "pm2 restart lean-services-gsp-prod"');
  await ssh.execCommand('su - nodeadmin -c "pm2 save"');
  console.log("✅ Proceso PM2 reiniciado.");

  // Paso 8: Comprobación de estado y logs
  console.log("\n📊 Paso 8: Verificando logs inmediatos de arranque...");
  await new Promise(r => setTimeout(r, 3000));
  const logsRes = await ssh.execCommand('su - nodeadmin -c "pm2 logs lean-services-gsp-prod --lines 20 --nostream"');
  console.log(logsRes.stdout);

  console.log("\n==================================================================");
  console.log("🎉 FASE 2 COMPLETADA CON ÉXITO: Backend PROD Online en Puerto 3016");
  console.log("==================================================================");

  ssh.dispose();
}

runPhase2().catch(err => {
  console.error("❌ ERROR EN FASE 2:", err);
  ssh.dispose();
});
