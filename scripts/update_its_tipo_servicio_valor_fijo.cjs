const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. ACTUALIZAR BASE DE DATOS: tipo_servicio = "Valor Fijo" ===\n');

  const updateSql = `
    -- Actualizar DEV
    UPDATE sch_leangsp.tits_jornada_detalle 
    SET tipo_servicio = 'Valor Fijo' 
    WHERE tipo_servicio = 'Valor Fijo / Jornada' OR (tipo_servicio ILIKE '%fijo%' AND tipo_servicio NOT ILIKE '%flete%');

    -- Actualizar PROD
    UPDATE sch_leangsp_prod.tits_jornada_detalle 
    SET tipo_servicio = 'Valor Fijo' 
    WHERE tipo_servicio = 'Valor Fijo / Jornada' OR (tipo_servicio ILIKE '%fijo%' AND tipo_servicio NOT ILIKE '%flete%');

    -- Verificar para OT 32 en PROD
    SELECT j.id_jornada, j.id_its, j.fecha, j.patente, j.tipo_servicio, j.horas_report, j.tarifa_hora, j.subtotal, j.numero_report
    FROM sch_leangsp_prod.tits_jornada_detalle j
    JOIN sch_leangsp_prod.tits_informe_termino i ON i.id_its = j.id_its
    WHERE i.id_proyecto = 32;
  `;

  const sqlRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${updateSql.replace(/\n/g, ' ')}\\""`);
  console.log('Salida SQL:');
  console.log(sqlRes.stdout);
  if (sqlRes.stderr) console.error('Error SQL:', sqlRes.stderr);

  console.log('\n=== 2. DESPLEGANDO ARCHIVOS ACTUALIZADOS A DEV Y PROD ===\n');

  const files = [
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/models/proyectoModel.js'),
      subpath: 'src/models/proyectoModel.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/itsController.js'),
      subpath: 'src/controllers/itsController.js'
    },
    {
      local: path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js'),
      subpath: 'src/services/itsPdfService.js'
    }
  ];

  // Despliegue DEV
  console.log('--- Subiendo a DEV ---');
  for (const f of files) {
    const dest = `/home/nodeadmin/proyectos/lean-services-gsp/${f.subpath}`;
    await ssh.putFile(f.local, dest);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${dest}`);
    console.log(`✓ ${f.subpath} -> DEV`);
  }

  console.log('Reiniciando DEV (PM2 ID 10)...');
  const rDev = await ssh.execCommand('su - nodeadmin -c "pm2 restart 10"');
  console.log(rDev.stdout.split('\n').slice(0, 10).join('\n'));

  // Despliegue PROD
  console.log('\n--- Subiendo a PROD ---');
  for (const f of files) {
    const dest = `/home/nodeadmin/proyectos/lean-services-gsp-prod/${f.subpath}`;
    await ssh.putFile(f.local, dest);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${dest}`);
    console.log(`✓ ${f.subpath} -> PROD`);
  }

  console.log('Reiniciando PROD (PM2 ID 13)...');
  const rProd = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log(rProd.stdout.split('\n').slice(0, 10).join('\n'));

  // Esperar 3 segundos para que los servicios levanten
  console.log('\nEsperando 3s a que reinicien los procesos...');
  await new Promise(r => setTimeout(r, 3000));

  // 3. Verificación empírica con pdftotext
  console.log('\n=== 3. VERIFICACIÓN EMPÍRICA CON PDFTOTEXT (PROD OT 32) ===\n');

  const testPdfCmd = `
    curl -s http://127.0.0.1:3016/api/operaciones/its/preview-pdf/32 -o /tmp/test_ot32.pdf
    pdftotext /tmp/test_ot32.pdf /tmp/test_ot32.txt
    cat /tmp/test_ot32.txt | grep -E "TIPO DE SERVICIO|Valor Fijo|PJYY|TOTAL HORAS|REP-32"
  `;

  const pdfRes = await ssh.execCommand(testPdfCmd);
  console.log('Líneas extraídas del PDF:');
  console.log(pdfRes.stdout);
  if (pdfRes.stderr) console.error('Error verificación PDF:', pdfRes.stderr);

  ssh.dispose();
  console.log('\n=== FINALIZADO ===');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
