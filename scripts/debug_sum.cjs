const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function debugSum() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const scriptNode = `
  const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');

  function esJornadaTraslado(j) {
    if (!j || typeof j !== 'object') return false;
    const ts = String(j.tipo_servicio || '').trim();
    if (ts === 'Registro de Viaje') return false;
    const tsLow = ts.toLowerCase();
    const nr = String(j.numero_report || '').trim().toUpperCase();
    return tsLow.includes('flete') || tsLow.includes('traslado') || nr === 'TRASLADO' || nr.startsWith('FLE-');
  }

  (async () => {
    const jd = await pool.query("SELECT * FROM tits_jornada_detalle WHERE id_its = 14 ORDER BY id_jornada ASC");
    console.log('FILAS EN BD:', jd.rows.length);
    jd.rows.forEach(j => {
      const esFlete = esJornadaTraslado(j);
      const esViaje = j.tipo_servicio === 'Registro de Viaje';
      console.log(\`id: \${j.id_jornada} | patente: \${j.patente} | tipo: \${j.tipo_servicio} | hrs: \${j.horas_report} | tarifa: \${j.tarifa_hora} | sub: \${j.subtotal} | esFlete: \${esFlete} | esViaje: \${esViaje}\`);
    });

    const sumHrsGrua = jd.rows
      .filter(j => !j.es_oculta && !esJornadaTraslado(j) && j.tipo_servicio !== 'Registro de Viaje')
      .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

    const sumIngresosHoras = jd.rows
      .filter(j => !j.es_oculta && !esJornadaTraslado(j) && j.tipo_servicio !== 'Registro de Viaje')
      .reduce((acc, j) => acc + (parseFloat(j.subtotal) || 0), 0);

    const sumIngresosFletes = jd.rows
      .filter(j => !j.es_oculta && esJornadaTraslado(j))
      .reduce((acc, j) => acc + (parseFloat(j.subtotal) || 0), 0);

    console.log('CALCULADO DE BD:');
    console.log('sumHrsGrua:', sumHrsGrua);
    console.log('sumIngresosHoras:', sumIngresosHoras);
    console.log('sumIngresosFletes:', sumIngresosFletes);
    console.log('TOTAL:', sumIngresosHoras + sumIngresosFletes);

    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/debug_sum.js\n${scriptNode}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/debug_sum.js"');
  console.log(out.stdout);
  ssh.dispose();
}

debugSum().catch(console.error);
