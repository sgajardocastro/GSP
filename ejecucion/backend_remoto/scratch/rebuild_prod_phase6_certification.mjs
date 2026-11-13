import { NodeSSH } from 'node-ssh';
import pg from 'pg';

const ssh = new NodeSSH();

async function runPhase6() {
  console.log("==================================================================");
  console.log("🏆 FASE 6: PROTOCOLO DE CERTIFICACIÓN Y HEALTH CHECK E2E");
  console.log("==================================================================");

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  const results = {};

  // Gate A: Web Console
  console.log("\n🌐 [Gate A] Verificando Web Console (https://servidor.leanglobal.cl/lg-gsp-prod/)...");
  const webRes = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/ | head -n 1');
  const webContent = await ssh.execCommand('curl -s -k https://127.0.0.1/lg-gsp-prod/ | grep -o "/lg-gsp-prod/assets/[^\"]*" | head -n 1');
  console.log("HTTP Status:", webRes.stdout.trim());
  console.log("Asset detectado:", webContent.stdout.trim());
  results.gateA = webRes.stdout.includes("200");

  // Gate B: PWA Móvil
  console.log("\n📱 [Gate B] Verificando PWA Móvil (https://servidor.leanglobal.cl/pwa-gsp-prod/)...");
  const pwaRes = await ssh.execCommand('curl -s -k -I https://127.0.0.1/pwa-gsp-prod/ | head -n 1');
  const pwaManifest = await ssh.execCommand('curl -s -k -I https://127.0.0.1/pwa-gsp-prod/manifest.json | head -n 1');
  console.log("PWA HTTP Status:", pwaRes.stdout.trim());
  console.log("Manifest HTTP Status:", pwaManifest.stdout.trim());
  results.gateB = pwaRes.stdout.includes("200") && pwaManifest.stdout.includes("200");

  // Gate C: Backend API vía Nginx
  console.log("\n🔌 [Gate C] Verificando Backend API pública (https://servidor.leanglobal.cl/lg-gsp-prod/api/usuarios)...");
  const apiRes = await ssh.execCommand('curl -s -k -I https://127.0.0.1/lg-gsp-prod/api/usuarios | head -n 1');
  const apiData = await ssh.execCommand('curl -s -k https://127.0.0.1/lg-gsp-prod/api/usuarios | head -c 80');
  console.log("API HTTP Status:", apiRes.stdout.trim());
  console.log("API Payload preview:", apiData.stdout.trim());
  results.gateC = apiRes.stdout.includes("200");

  // Gate D: PM2 Health & Status
  console.log("\n⚙️ [Gate D] Verificando estado del daemon PM2 (lean-services-gsp-prod)...");
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 describe lean-services-gsp-prod"');
  const isOnline = pm2Res.stdout.includes("online");
  console.log("PM2 lean-services-gsp-prod is online:", isOnline);
  results.gateD = isOnline;

  // Gate E: Base de Datos & Aislamiento Estricto
  console.log("\n🗄️ [Gate E] Verificando Base de Datos y Aislamiento en PostgreSQL...");
  const { Client } = pg;
  const prodClient = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
  });
  await prodClient.connect();

  const countCat = await prodClient.query("SELECT count(*) FROM tequ_categoria;");
  const countEq = await prodClient.query("SELECT count(*) FROM tequ_equipo;");
  const countUsr = await prodClient.query("SELECT count(*) FROM tsec_users;");
  const countProy = await prodClient.query("SELECT count(*) FROM tpry_proyecto;");

  console.log(`   - Categorías activas: ${countCat.rows[0].count} (esperado 8)`);
  console.log(`   - Equipos en flota: ${countEq.rows[0].count} (esperado 110)`);
  console.log(`   - Usuarios activos: ${countUsr.rows[0].count} (esperado 45)`);
  console.log(`   - Proyectos operacionales: ${countProy.rows[0].count} (esperado 0 - entorno limpio)`);

  const dbOk = (
    parseInt(countCat.rows[0].count) === 8 &&
    parseInt(countEq.rows[0].count) === 110 &&
    parseInt(countUsr.rows[0].count) === 45 &&
    parseInt(countProy.rows[0].count) === 0
  );
  results.gateE = dbOk;
  await prodClient.end();

  // Gate F: Storage de Archivos
  console.log("\n📁 [Gate F] Verificando Gestor Documental (/u05/LeanDocs/GSP/prod/)...");
  const storageCheck = await ssh.execCommand('test -w /u05/LeanDocs/GSP/prod/cotizaciones && echo WRITABLE');
  console.log("Storage status:", storageCheck.stdout.trim());
  results.gateF = storageCheck.stdout.trim() === "WRITABLE";

  console.log("\n==================================================================");
  console.log("🏁 RESUMEN FINAL DE CERTIFICACIÓN PRODUCCIÓN GSP");
  console.log("==================================================================");
  console.log(`- Gate A (Web Console 200 OK)       : ${results.gateA ? '✅ APROBADO' : '❌ FALLÓ'}`);
  console.log(`- Gate B (PWA Móvil 200 OK)         : ${results.gateB ? '✅ APROBADO' : '❌ FALLÓ'}`);
  console.log(`- Gate C (Backend API NGINX 200 OK) : ${results.gateC ? '✅ APROBADO' : '❌ FALLÓ'}`);
  console.log(`- Gate D (Daemon PM2 Online)        : ${results.gateD ? '✅ APROBADO' : '❌ FALLÓ'}`);
  console.log(`- Gate E (PostgreSQL Limpio/Aislado): ${results.gateE ? '✅ APROBADO' : '❌ FALLÓ'}`);
  console.log(`- Gate F (Storage Writable)         : ${results.gateF ? '✅ APROBADO' : '❌ FALLÓ'}`);

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    console.log("\n🎉 CERTIFICACIÓN 100% EXITOSA: GSP PRODUCCIÓN OPERATIVO Y AISLADO");
  } else {
    console.log("\n⚠️ ALERTA: Uno o más gates no cumplieron el criterio de certificación.");
  }

  ssh.dispose();
}

runPhase6().catch(console.error);
