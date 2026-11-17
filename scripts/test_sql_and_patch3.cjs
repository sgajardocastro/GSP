const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testSqlAndController() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const testRunnerScript = `
  const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');
  const fs = require('fs');

  (async () => {
    const baseDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers';
    let src = fs.readFileSync(baseDir + '/itsController.js', 'utf8');

    // Declarar valorAdicionalesFijosPactados
    src = src.replace('let valorFijoPactado = 0;', 'let valorFijoPactado = 0;\\n      let valorAdicionalesFijosPactados = 0;');

    // Blindaje en Rigger/Adicional
    const oldFijoCheck = "const esFijo = unid.includes('FIJO') || unid.includes('SUMA ALZADA') || tipo.includes('FIJO') || desc.includes('VALOR FIJO');\\n          if (esFijo) {\\n            esValorFijoComercial = true;\\n            valorFijoPactado += (sub > 0 ? sub : precio);\\n          }";
    const newFijoCheck = \`const esFijo = unid.includes('FIJO') || unid.includes('SUMA ALZADA') || tipo.includes('FIJO') || desc.includes('VALOR FIJO');
          if (esFijo) {
            const rolUpper = String(l.rol_nodo || '').toUpperCase();
            const esSecundaria = Boolean(
              l.id_linea_servicio_padre ||
              ['OTROS', 'ACCESORIO', 'HIJO_COMERCIAL', 'PERSONAL'].includes(rolUpper) ||
              tipo.includes('PERSONAL') ||
              desc.includes('RIGGER') ||
              subcat.includes('RIGGER')
            );
            if (esSecundaria) {
              valorAdicionalesFijosPactados += (precio > 0 ? precio : sub);
            } else {
              esValorFijoComercial = true;
              valorFijoPactado += (precio > 0 ? precio : sub);
            }
          }\`;
    src = src.replace(oldFijoCheck, newFijoCheck);

    // Blindaje después del loop
    const oldLoopEnd = "const esSoloTraslado = tieneLineaTraslado && !tieneLineaPorHora && !esValorFijoComercial && valorFijoPactado === 0;";
    const newLoopEnd = \`
      if (tieneLineaPorHora) {
        esValorFijoComercial = false;
        if (valorFijoPactado > 0) {
          valorAdicionalesFijosPactados += valorFijoPactado;
          valorFijoPactado = 0;
        }
      } else if (esValorFijoComercial && valorAdicionalesFijosPactados > 0) {
        valorFijoPactado += valorAdicionalesFijosPactados;
        valorAdicionalesFijosPactados = 0;
      }

      const esSoloTraslado = tieneLineaTraslado && !tieneLineaPorHora && !esValorFijoComercial && valorFijoPactado === 0 && valorAdicionalesFijosPactados === 0;
    \`.trim();
    src = src.replace(oldLoopEnd, newLoopEnd);

    // Blindaje en reconciliacion de jornadas
    const oldJorFijo = "if (esValorFijoComercial || its.es_valor_fijo || valorFijoPactado > 0) {";
    const newJorFijo = "if (tieneLineaPorHora) { its.es_valor_fijo = false; } else if (esValorFijoComercial || its.es_valor_fijo || valorFijoPactado > 0) {";
    src = src.replace(oldJorFijo, newJorFijo);

    // Definir esJornadaTraslado y usarlo en los filtros de totales para erradicar la asimetría de fletes
    const funcEsJornadaTraslado = \`
    function esJornadaTraslado(j) {
      if (!j || typeof j !== 'object') return false;
      const ts = String(j.tipo_servicio || '').trim();
      if (ts === 'Registro de Viaje') return false;
      const tsLow = ts.toLowerCase();
      const nr = String(j.numero_report || '').trim().toUpperCase();
      return tsLow.includes('flete') || tsLow.includes('traslado') || nr === 'TRASLADO' || nr.startsWith('FLE-');
    }
    \`;

    // Reemplazar la sumatoria reactiva de totales
    const oldSumBloque = \`          const sumHrsGrua = jornadas
            .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')) && j.tipo_servicio !== 'Registro de Viaje')
            .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

          const sumIngresosHoras = its.es_valor_fijo
            ? (parseFloat(its.valor_fijo_pactado || valorFijoPactado || 0))
            : jornadas
                .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')))
                .reduce((acc, j) => acc + (parseFloat(j.subtotal) || ((parseFloat(j.horas_report) || 0) * (parseFloat(j.tarifa_hora) || parseFloat(its.valor_hora_pactado) || 0))), 0);

          const sumIngresosFletes = jornadas
            .filter(j => !j.es_oculta && j.tipo_servicio && j.tipo_servicio.toLowerCase().includes('flete'))
            .reduce((acc, j) => acc + (parseFloat(j.subtotal) || parseFloat(j.tarifa_hora) || 0), 0);\`;

    const newSumBloque = \`          \${funcEsJornadaTraslado}
          const sumHrsGrua = jornadas
            .filter(j => !j.es_oculta && !esJornadaTraslado(j) && j.tipo_servicio !== 'Registro de Viaje')
            .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

          const sumIngresosHoras = its.es_valor_fijo
            ? (parseFloat(its.valor_fijo_pactado || valorFijoPactado || 0))
            : jornadas
                .filter(j => !j.es_oculta && !esJornadaTraslado(j) && j.tipo_servicio !== 'Registro de Viaje')
                .reduce((acc, j) => acc + (parseFloat(j.subtotal) || ((parseFloat(j.horas_report) || 0) * (parseFloat(j.tarifa_hora) || parseFloat(its.valor_hora_pactado) || 0))), 0);

          const sumIngresosFletes = jornadas
            .filter(j => !j.es_oculta && esJornadaTraslado(j))
            .reduce((acc, j) => acc + (parseFloat(j.subtotal) || parseFloat(j.tarifa_hora) || 0), 0);\`;

    src = src.replace(oldSumBloque, newSumBloque);

    fs.writeFileSync(baseDir + '/itsController_test.js', src, 'utf8');

    const patchedCtrl = require(baseDir + '/itsController_test.js');
    const req = { params: { id_proyecto: 75 }, user: { id_user: 17, rol: 'ADMIN' } };
    const res = {
      json: (response) => {
        const d = response.data || {};
        console.log('=== TEST RESULTADO GET_ITS CON ES_JORNADA_TRASLADO ===');
        console.log('id_its:', d.its?.id_its);
        console.log('es_valor_fijo:', d.its?.es_valor_fijo);
        console.log('valor_hora_pactado:', d.its?.valor_hora_pactado);
        console.log('valor_flete_pactado:', d.its?.valor_flete_pactado);
        console.log('total_ingresos_horas:', d.its?.total_ingresos_horas);
        console.log('total_ingresos_fletes:', d.its?.total_ingresos_fletes);
        console.log('total_ingresos_facturables:', d.its?.total_ingresos_facturables);
        console.log('total_costos_operacionales:', d.its?.total_costos_operacionales);
        console.log('utilidad_bruta:', d.its?.utilidad_bruta);
        console.log('margen_porcentaje:', d.its?.margen_porcentaje);
        console.log('jornadas count:', (d.jornadas || []).length);
        (d.jornadas || []).forEach(j => {
          console.log(\`  Jornada: \${j.fecha} | \${j.patente} | \${j.tipo_servicio} | tarifa: \${j.tarifa_hora} | subtotal: \${j.subtotal}\`);
        });

        fs.unlinkSync(baseDir + '/itsController_test.js');
        process.exit(0);
      },
      status: (code) => {
        console.log('STATUS:', code);
        return res;
      }
    };

    await patchedCtrl.getITS(req, res);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/run_sql_and_patch3.js\n${testRunnerScript}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/run_sql_and_patch3.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);
  ssh.dispose();
}

testSqlAndController().catch(console.error);
