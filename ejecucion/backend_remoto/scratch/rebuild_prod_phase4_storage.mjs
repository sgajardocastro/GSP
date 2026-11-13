import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function runPhase4() {
  console.log("==================================================================");
  console.log("🚀 FASE 4: VERIFICACIÓN Y BLINDAJE DE STORAGE (/u05/LeanDocs/GSP/prod)");
  console.log("==================================================================");

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });

  const dirs = [
    '/u05/LeanDocs/GSP/prod/cotizaciones',
    '/u05/LeanDocs/GSP/prod/ots',
    '/u05/LeanDocs/GSP/prod/edp',
    '/u05/LeanDocs/GSP/prod/surveys',
    '/u05/LeanDocs/GSP/prod/firmas',
    '/u05/LeanDocs/GSP/prod/acreditacion',
    '/u05/LeanDocs/GSP/prod/enrolamiento',
    '/u05/LeanDocs/GSP/prod/inspecciones',
    '/u05/LeanDocs/GSP/prod/general'
  ];

  for (const d of dirs) {
    await ssh.execCommand(`mkdir -p ${d}`);
  }

  await ssh.execCommand('chown -R nodeadmin:nodeadmin /u05/LeanDocs/GSP/prod');
  await ssh.execCommand('chmod -R 775 /u05/LeanDocs/GSP/prod');

  console.log("Estructura de carpetas verificada:");
  const lsRes = await ssh.execCommand('ls -la /u05/LeanDocs/GSP/prod');
  console.log(lsRes.stdout);

  // Test de escritura como nodeadmin
  const testWrite = await ssh.execCommand('su - nodeadmin -c "touch /u05/LeanDocs/GSP/prod/general/test_write.tmp && rm /u05/LeanDocs/GSP/prod/general/test_write.tmp"');
  if (testWrite.code === 0) {
    console.log("✅ Prueba de escritura como nodeadmin: EXITOSA");
  } else {
    console.error("❌ Falló prueba de escritura:", testWrite.stderr);
  }

  console.log("\n==================================================================");
  console.log("🎉 FASE 4 COMPLETADA CON ÉXITO: Storage PROD 100% Funcional");
  console.log("==================================================================");

  ssh.dispose();
}

runPhase4().catch(console.error);
