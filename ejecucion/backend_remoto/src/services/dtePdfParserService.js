const zlib = require('zlib');

const EMPRESAS_POR_RUT = {
  '52004162-1': {
    id_empresa: 9,
    empresa_corto: 'Grúas San Pablo',
    razon_social: 'LUIS GHISELLINI J. ARREND. MAQ. Y VEH. MOTOR. EN GRAL. EIRL',
    rut: '52.004.162-1',
    formato_habitual: 'LAUDUS'
  },
  '76209534-3': {
    id_empresa: 7,
    empresa_corto: 'Bestmaq',
    razon_social: 'SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA',
    rut: '76.209.534-3',
    formato_habitual: 'SII_PORTAL'
  },
  '76218576-8': {
    id_empresa: 8,
    empresa_corto: 'Logística del Sur',
    razon_social: 'TRANSPORTES, ARRIENDOS Y VENTAS DE MAQUINARIAS, Y SERVICIOS LOGISTICOS I',
    rut: '76.218.576-8',
    formato_habitual: 'SII_PORTAL'
  },
  '78254535-3': {
    id_empresa: 11,
    empresa_corto: 'Royal Rental',
    razon_social: 'ARRIENDO ROYAL RENTAL LIMITADA',
    rut: '78.254.535-3',
    formato_habitual: 'SII_PORTAL'
  }
};

const MESES_ES = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12'
};

function decodificarStringPdf(rawStr) {
  if (!rawStr) return '';
  return rawStr
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, ' ')
    .replace(/\\([()\\])/g, '$1')
    .trim();
}

function normalizarRutKey(rutStr) {
  if (!rutStr) return '';
  const clean = String(rutStr).replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return '';
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

function formatearRutChileno(rutKey) {
  if (!rutKey || !rutKey.includes('-')) return rutKey || '';
  const [cuerpo, dv] = rutKey.split('-');
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoConPuntos}-${dv}`;
}

function parseMontoChileno(str) {
  if (str === undefined || str === null) return 0;
  const clean = String(str).replace(/\./g, '').replace(/[^0-9-]/g, '');
  const n = parseInt(clean, 10);
  return Number.isNaN(n) ? 0 : n;
}

function extraerTokensDeBufferPdf(pdfBuffer) {
  const buf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  let pos = 0;
  const tokens = [];

  while ((pos = buf.indexOf('stream', pos)) !== -1) {
    let start = pos + 6;
    if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
    else if (buf[start] === 10 || buf[start] === 13) start += 1;

    const end = buf.indexOf('endstream', start);
    if (end === -1) break;

    let slice = buf.slice(start, end);
    while (slice.length > 0 && (slice[slice.length - 1] === 10 || slice[slice.length - 1] === 13)) {
      slice = slice.slice(0, -1);
    }

    try {
      const inf = zlib.inflateSync(slice).toString('latin1');
      if (!inf.startsWith('%!PS-AdobeFont') && (inf.includes('Tj') || inf.includes('TJ'))) {
        const matches = [...inf.matchAll(/\((?:\\.|[^\\)])*\)/g)];
        for (const m of matches) {
          const decoded = decodificarStringPdf(m[0].slice(1, -1));
          if (decoded) tokens.push(decoded);
        }
        // Si ya tenemos todos los tokens de la página 1 (original), podemos cortar antes de la copia CEDIBLE para no duplicar
        if (tokens.some(t => /Timbre Electr/i.test(t)) && tokens.some(t => /TOTAL/i.test(t))) {
          break;
        }
      }
    } catch (e) {
      // Ignorar streams de imágenes o fuentes no FlateDecode
    }
    pos = end + 9;
  }

  return tokens;
}

function parsearFacturaDtePdf(pdfBuffer) {
  const tokens = extraerTokensDeBufferPdf(pdfBuffer);
  const fullText = tokens.join(' | ');

  // 1. Detectar Formato (Laudus vs SII Portal)
  const esLaudus = /laudus\.cl/i.test(fullText) || tokens.some(t => /SUBTOTAL/i.test(t) && tokens.some(x => /^Vto$/i.test(x)));
  const formato = esLaudus ? 'LAUDUS' : 'SII_PORTAL';

  // 2. Identificar RUT Emisor y Empresa Facturadora del Holding GSP
  const todosLosRuts = [];
  for (const t of tokens) {
    const m = t.match(/(\d{1,2}\.\d{3}\.\d{3}-\s*[\dkK])/g);
    if (m) {
      for (const r of m) {
        todosLosRuts.push(normalizarRutKey(r));
      }
    }
  }

  let empresaEmisora = null;
  let rutEmisorKey = '';
  let rutClienteKey = '';

  for (const rKey of todosLosRuts) {
    if (EMPRESAS_POR_RUT[rKey] && !empresaEmisora) {
      empresaEmisora = EMPRESAS_POR_RUT[rKey];
      rutEmisorKey = rKey;
    } else if (!rutClienteKey && rKey !== rutEmisorKey) {
      rutClienteKey = rKey;
    }
  }

  // Fallback por nombre de empresa si algún RUT viniera sin puntos
  if (!empresaEmisora) {
    if (/LUIS GHISELLINI/i.test(fullText)) {
      rutEmisorKey = '52004162-1';
      empresaEmisora = EMPRESAS_POR_RUT[rutEmisorKey];
    } else if (/BESTMAQ/i.test(fullText)) {
      rutEmisorKey = '76209534-3';
      empresaEmisora = EMPRESAS_POR_RUT[rutEmisorKey];
    } else if (/SERVICIOS LOGISTICOS/i.test(fullText)) {
      rutEmisorKey = '76218576-8';
      empresaEmisora = EMPRESAS_POR_RUT[rutEmisorKey];
    } else if (/ROYAL RENTAL/i.test(fullText)) {
      rutEmisorKey = '78254535-3';
      empresaEmisora = EMPRESAS_POR_RUT[rutEmisorKey];
    }
  }

  // Si no pertenece al holding, el primer RUT del DTE es el emisor externo y el segundo es el cliente receptor
  if (!empresaEmisora && todosLosRuts.length > 0) {
    rutEmisorKey = todosLosRuts[0];
    if (todosLosRuts.length > 1) {
      rutClienteKey = todosLosRuts[1];
    }
  }

  // 3. Extraer Folio Factura (N° Factura)
  let folioDte = '';
  for (const t of tokens) {
    // Ej: "Nº  14.664" o "Nº2907" o "Nº3669" o "Nº83"
    const mFolio = t.match(/^N[º°o]\s*([\d.]+)$/i);
    if (mFolio) {
      folioDte = mFolio[1].replace(/\./g, '').trim();
      break;
    }
  }
  if (!folioDte) {
    const mGlobal = fullText.match(/FACTURA ELECTR[ÓO]NICA\s*\|\s*N[º°o]\s*([\d.]+)/i) ||
                    fullText.match(/N[º°o]\s*([\d.]+)\s*\|\s*FACTURA ELECTR[ÓO]NICA/i);
    if (mGlobal) {
      folioDte = mGlobal[1].replace(/\./g, '').trim();
    }
  }

  // 4. Extraer Fecha de Emisión y Vencimiento
  let fechaEmision = '';
  let fechaVencimiento = '';

  // Caso B (SII): "09 de Octubre del 2026" o "20 de Octubre del 2026"
  for (const t of tokens) {
    const mLarga = t.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóú]+)\s+del?\s+(\d{4})/i);
    if (mLarga) {
      const dia = String(mLarga[1]).padStart(2, '0');
      const mesNom = mLarga[2].toLowerCase();
      const mes = MESES_ES[mesNom] || '01';
      const anio = mLarga[3];
      fechaEmision = `${anio}-${mes}-${dia}`;
      break;
    }
  }

  // Caso A (Laudus): "20/10/2026" y "19/11/2026"
  const fechasCortas = [];
  for (const t of tokens) {
    const mCorta = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (mCorta) {
      fechasCortas.push(`${mCorta[3]}-${mCorta[2]}-${mCorta[1]}`);
    }
  }
  if (!fechaEmision && fechasCortas.length > 0) {
    fechaEmision = fechasCortas[0];
  }
  if (fechasCortas.length > 1) {
    fechaVencimiento = fechasCortas[1];
  }

  // 5. Extraer Cliente Receptor (Razón Social)
  let clienteReceptorNombre = '';
  if (esLaudus) {
    const idxCred = tokens.findIndex(t => /^CREDITO$/i.test(t) || /^CONTADO$/i.test(t));
    if (idxCred >= 0 && tokens[idxCred + 1]) {
      clienteReceptorNombre = tokens[idxCred + 1];
    }
  } else {
    const idxSenores = tokens.findIndex(t => /^SE[ÑN]OR/i.test(t));
    if (idxSenores >= 0 && tokens[idxSenores + 1]) {
      clienteReceptorNombre = tokens[idxSenores + 1];
    }
  }

  // 6. Extraer Montos: Exento, Neto, IVA 19%, Total
  let montoExento = 0;
  let montoNeto = 0;
  let montoIva = 0;
  let montoTotal = 0;

  if (!esLaudus) {
    // En formato SII vienen etiquetados secuencialmente:
    // MONTO NETO | $ | 16.750.000 | I.V.A. 19% | $ | 3.182.500 | IMPUESTO ADICIONAL | $ | 0 | TOTAL | $ | 19.932.500
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i].toUpperCase();
      if (tk.includes('MONTO NETO')) {
        montoNeto = parseMontoChileno(tokens[i + 2] || tokens[i + 1]);
      } else if (tk.includes('MONTO EXENTO') || tk === 'EXENTO') {
        montoExento = parseMontoChileno(tokens[i + 2] || tokens[i + 1]);
      } else if (tk.includes('I.V.A.') || tk.includes('IVA 19%')) {
        montoIva = parseMontoChileno(tokens[i + 2] || tokens[i + 1]);
      } else if (tk === 'TOTAL') {
        montoTotal = parseMontoChileno(tokens[i + 2] || tokens[i + 1]);
      }
    }
  } else {
    // En formato Laudus, antes de "Son ... pesos | NETO | TOTAL | EXENTO" vienen los 5 números:
    // [EXENTO, NETO, IVA, TOTAL, SUBTOTAL] -> ej: 0 | 1.820.000 | 345.800 | 2.165.800 | 1.820.000
    const idxSon = tokens.findIndex(t => /^Son\s+/i.test(t));
    const ventanaFin = idxSon > 0 ? idxSon : tokens.length;
    const candidatos = [];
    for (let i = Math.max(0, ventanaFin - 8); i < ventanaFin; i++) {
      if (/^[\d.]+$/.test(tokens[i])) {
        candidatos.push(parseMontoChileno(tokens[i]));
      }
    }
    // En Laudus el patrón exacto de 5 montos finales antes de "Son..." es [exento, neto, iva, total, subtotal]
    if (candidatos.length >= 4) {
      // Buscar triplete donde neto + iva == total
      for (let i = 0; i <= candidatos.length - 3; i++) {
        const a = candidatos[i];
        const b = candidatos[i + 1];
        const c = candidatos[i + 2];
        if (a > 0 && c > 0 && Math.abs((a + b) - c) <= 5) {
          montoNeto = a;
          montoIva = b;
          montoTotal = c;
          if (i > 0) montoExento = candidatos[i - 1];
          break;
        }
      }
    }
  }

  // 7. Extraer Referencias: Órdenes de Compra, Reports y OTs citadas en la factura
  const ocsReferenciadas = [];
  const reportsReferenciados = new Set();
  const otsReferenciadas = new Set();

  for (const t of tokens) {
    // Ej Laudus: "Orden de Compra nº 12990, del 30/09/2026"
    // Ej SII: "- Orden Compra N° 7158 del 2026-10-06"
    const mOc = t.match(/Orden\s+(?:de\s+)?Compra\s+N[º°o]?\s*([A-Za-z0-9-]+)(?:,?\s+del\s+([\d/-]+))?/i);
    if (mOc) {
      let fOc = mOc[2] || '';
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fOc)) {
        const [d, m, y] = fOc.split('/');
        fOc = `${y}-${m}-${d}`;
      }
      ocsReferenciadas.push({
        numero_oc: mOc[1].trim(),
        fecha_oc: fOc
      });
    }

    // Extraer REPORT N° XXXXX
    const mReps = [...t.matchAll(/REPORT\s*N[º°o]?\s*(\d+)/gi)];
    for (const mr of mReps) {
      reportsReferenciados.add(mr[1]);
    }

    // Extraer OT N° XXXXX (y listas separadas por coma si vienen después de OT N°)
    const mOtLinea = t.match(/OT\s*N[º°o]?\s*([\d,\s]+)/i);
    if (mOtLinea) {
      const nums = mOtLinea[1].split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s));
      nums.forEach(n => otsReferenciadas.add(n));
    } else if (/^\d{4,6}(?:,\s*\d{4,6})+$/.test(t.trim())) {
      // Línea de continuación de OTs como "64826, 64827, 64828, 64872..."
      t.split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s)).forEach(n => otsReferenciadas.add(n));
    }
  }

  const periodoContable = fechaEmision ? fechaEmision.slice(0, 7) : new Date().toISOString().slice(0, 7);

  return {
    reconocido: Boolean(folioDte && montoNeto > 0),
    formato_detectado: formato,
    id_empresa_emisora: empresaEmisora ? empresaEmisora.id_empresa : null,
    empresa_facturadora: empresaEmisora ? empresaEmisora.empresa_corto : (rutEmisorKey ? 'Empresa Externa / No Autorizada' : 'No identificada'),
    razon_social_emisora: empresaEmisora ? empresaEmisora.razon_social : '',
    rut_emisor: empresaEmisora ? empresaEmisora.rut : formatearRutChileno(rutEmisorKey),
    folio_dte: folioDte,
    fecha_emision: fechaEmision,
    fecha_vencimiento: fechaVencimiento || null,
    periodo_contable: periodoContable,
    cliente_receptor_nombre: clienteReceptorNombre,
    cliente_receptor_rut: formatearRutChileno(rutClienteKey),
    monto_exento: montoExento,
    monto_neto: montoNeto,
    monto_iva: montoIva,
    monto_total: montoTotal,
    ocs_referenciadas: ocsReferenciadas,
    numero_oc_principal: ocsReferenciadas[0]?.numero_oc || null,
    reports_referenciados: Array.from(reportsReferenciados),
    ots_referenciadas: Array.from(otsReferenciadas)
  };
}

module.exports = {
  parsearFacturaDtePdf,
  EMPRESAS_POR_RUT
};
