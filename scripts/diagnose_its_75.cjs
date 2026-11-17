const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
  const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');
  const { normalizarUnidad, calcularSubtotalNodo } = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/motorValorizacionService');
  const { isLineaCobroUnico } = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/utils/lineaCobroUnico');

  (async () => {
    const pRes = await pool.query('SELECT id_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = 75');
    const lsRes = await pool.query('SELECT * FROM tpry_linea_servicio WHERE id_proyecto = 75 AND activo = true ORDER BY orden ASC');
    console.log('tpry_linea_servicio count:', lsRes.rows.length);

    let lineasRaw = [];
    if (lsRes.rows.length > 0) {
      lineasRaw = lsRes.rows.map(l => ({
        ...l,
        tipo: l.tipo_servicio || l.categoria || 'SERVICIO',
        subcategoria: l.subcategoria || l.descripcion || '',
        valorUnitario: Number(l.valor_unitario || 0),
        valor_unitario: Number(l.valor_unitario || 0),
        subtotal: Number(l.subtotal || 0),
        unidad: l.unidad || 'DIA',
        pisoMinimo: Number(l.piso_minimo_horas || l.horas_minimas || 8.0),
        horas_minimas: Number(l.piso_minimo_horas || l.horas_minimas || 8.0),
        es_cobro_unico: Boolean(l.es_apoyo_operativo || String(l.unidad || '').toUpperCase() === 'GL' || String(l.unidad || '').toUpperCase() === 'GLOBAL')
      }));
    } else {
      const crmV1 = pRes.rows[0].json_field?.crm_v1 || {};
      lineasRaw = crmV1.lineas_operativas_vigentes || crmV1.lineas_servicio || [];
    }

    const crmV1 = pRes.rows[0].json_field?.crm_v1 || {};
    console.log('crmV1.es_valor_fijo:', crmV1.es_valor_fijo);

    const lineas = lineasRaw;
    let valorHoraPactado = 0;
    let valorFijoPactado = 0;
    let valorAdicionalesFijosPactados = 0;
    let valorDiarioPactado = 0;
    let diasPactadosDiario = 0;
    let bolsaMensualHorasPactada = 0;
    let esValorFijoDiarioComercial = false;
    let valorFletePactado = 0;
    let unidadFletePactado = '';
    let horasMinimas = 8.0;
    let esValorFijoComercial = Boolean(crmV1.es_valor_fijo);
    let tieneLineaPorHora = false;
    let tieneLineaTraslado = false;
    let ventaNetaProyectadaComercial = 0;

    lineas.forEach((l, idx) => {
      const tipo = (l.tipo || l.categoria || '').toUpperCase().trim();
      const desc = (l.descripcion || l.concepto || '').toUpperCase();
      const unid = (l.unidad || l.unidad_cobro || '').toUpperCase().trim();
      const unidCanon = normalizarUnidad(l.unidad || l.unidad_cobro || '');
      const subcat = (l.subcategoria || '').toUpperCase();
      const precio = parseFloat(l.valorUnitario || l.precio_unitario || l.valor_unitario || l.tarifa || 0);
      const sub = parseFloat(l.subtotal || 0);

      const subMotor = calcularSubtotalNodo(l);
      const cobroUnico = isLineaCobroUnico(l);

      const esLineaTraslado = unidCanon !== 'Tarifa por Km' && (
        tipo === 'TRASLADOS' || tipo.includes('TRASLADO') || tipo.includes('FLETE') || unid.includes('FLETE') || unid.includes('TRASLADO') || (tipo === '' && (desc.includes('FLETE') || desc.includes('TRASLADO') || subcat.includes('FLETE') || subcat.includes('CAMA BAJA')))
      );

      console.log(\`[\${idx}] \${tipo} | \${desc} | unid: \${unid} | unidCanon: \${unidCanon} | precio: \${precio} | sub: \${sub} | cobroUnico: \${cobroUnico} | traslado: \${esLineaTraslado}\`);

      if (esLineaTraslado) {
        tieneLineaTraslado = true;
        valorFletePactado += precio > 0 ? precio : sub;
        if (!unidadFletePactado && unid) unidadFletePactado = unid;
      } else if (unidCanon === 'Tarifa por Km') {
        esValorFijoComercial = true;
        valorFijoPactado += (subMotor > 0 ? subMotor : (sub > 0 ? sub : precio));
        horasMinimas = 0;
      } else if (cobroUnico) {
        const rolUpper = String(l.rol_nodo || '').toUpperCase();
        const esSecundaria = Boolean(
          l.id_linea_servicio_padre ||
          l.parentId ||
          ['OTROS', 'ACCESORIO', 'HIJO_COMERCIAL', 'PERSONAL'].includes(rolUpper) ||
          tipo.includes('OTRO') ||
          tipo.includes('ACCESORIO')
        );
        if (esSecundaria) {
          valorAdicionalesFijosPactados += (precio > 0 ? precio : sub);
        } else {
          esValorFijoComercial = true;
          valorFijoPactado += (precio > 0 ? precio : sub);
        }
      } else if (unidCanon === 'Valor Fijo Diario') {
        tieneLineaPorHora = true;
        esValorFijoDiarioComercial = true;
        valorDiarioPactado += precio;
        diasPactadosDiario = Math.max(diasPactadosDiario, Number(l.cantidad_dias || l.cantidad || 1));
        horasMinimas = 0;
      } else if (unidCanon === 'Valor Fijo Mensual' || unidCanon === 'Valor Fijo Semanal') {
        esValorFijoComercial = true;
        valorFijoPactado += (subMotor > 0 ? subMotor : precio);
        horasMinimas = 0;
      } else if (precio > 0 && (unid.includes('HORA') || unidCanon === 'Horas Mes Minimas')) {
        tieneLineaPorHora = true;
        if (valorHoraPactado === 0) valorHoraPactado = precio;
      } else if (precio > 0 && valorHoraPactado === 0 && !esValorFijoComercial) {
        tieneLineaPorHora = true;
        valorHoraPactado = precio;
      }
    });

    console.log('--- RESULTADOS COMERCIALES ---');
    console.log('tieneLineaPorHora:', tieneLineaPorHora);
    console.log('esValorFijoComercial:', esValorFijoComercial);
    console.log('valorHoraPactado:', valorHoraPactado);
    console.log('valorFijoPactado:', valorFijoPactado);
    console.log('valorAdicionalesFijosPactados:', valorAdicionalesFijosPactados);
    console.log('valorFletePactado:', valorFletePactado);

    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/diag_75.js\n${nodeScript}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/diag_75.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);
  ssh.dispose();
}

run().catch(console.error);
