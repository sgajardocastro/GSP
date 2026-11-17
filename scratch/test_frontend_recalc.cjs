const fs = require('fs');

function esJornadaTrasladoFrontend(j) {
  if (!j || typeof j !== 'object') return false;
  const ts = String(j.tipo_servicio || '').trim();
  if (ts === 'Registro de Viaje') return false;
  const tsLow = ts.toLowerCase();
  const nr = String(j.numero_report || '').trim().toUpperCase();
  return tsLow.includes('flete') || tsLow.includes('traslado') || nr === 'TRASLADO' || nr.startsWith('FLE-');
}

async function simulateRefinedFrontend() {
  for (let id = 168; id <= 177; id++) {
    try {
      const r = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/' + id);
      const d = await r.json();
      const backendIts = d.data?.its || {};
      const its = { ...backendIts };
      const jornadas = (d.data?.jornadas || []).map(j => ({ ...j }));
      const ajEdp = d.data?.proyecto?.json_field?.edp_ajustes_v1 || backendIts.edp_ajustes_v1 || null;

      let totalHrs = 0;
      let totalIngHoras = 0;
      let totalIngFletes = 0;
      const vHoraDefault = parseFloat(its.valor_hora_pactado || 0);
      const esFijo = Boolean(its.es_valor_fijo || Number(its.valor_fijo_pactado || 0) > 0 || jornadas.some(j => String(j.tipo_servicio || '').toUpperCase().includes('FIJO')));
      const vFijo = Number(its.valor_fijo_pactado || its.valor_hora_pactado || 0);
      let fijoAsignado = false;

      jornadas.forEach(j => {
        const tipo = j.tipo_servicio || '';
        const esViajeOTraslado = tipo === 'Registro de Viaje' || String(tipo).toUpperCase().includes('REGISTRO DE VIAJE');
        if (esViajeOTraslado) {
          j.tarifa_hora = 0;
          j.subtotal = 0;
          const hrs = parseFloat(j.horas_report || j.horas_reales || 0);
          if (!j.es_oculta) totalHrs += hrs;
          return;
        }

        const esFlete = esJornadaTrasladoFrontend(j);
        const esJornadaFija = esFijo || String(tipo).toUpperCase().includes('FIJO');

        if (j.tarifa_hora === undefined || j.tarifa_hora === null || isNaN(j.tarifa_hora)) {
          if (esFlete) j.tarifa_hora = Math.round(parseFloat(its.valor_flete_pactado || 400000) / 2);
          else if (esJornadaFija && vFijo > 0) j.tarifa_hora = vFijo;
          else j.tarifa_hora = vHoraDefault;
        }
        const hrs = parseFloat(j.horas_report || 0);
        const tarifa = parseFloat(j.tarifa_hora || 0);

        if (esFlete) {
          j.subtotal = hrs > 0 ? (j.subtotal !== undefined && j.subtotal !== null && Number(j.subtotal) > 0 ? Number(j.subtotal) : hrs * tarifa) : (Number(j.subtotal) || tarifa);
        } else if (esJornadaFija) {
          if (!fijoAsignado && !j.es_oculta) {
            j.subtotal = vFijo > 0 ? vFijo : tarifa;
            fijoAsignado = true;
          } else {
            j.subtotal = 0;
          }
        } else {
          j.subtotal = hrs * tarifa;
        }

        if (!j.es_oculta) {
          if (esFlete) totalIngFletes += j.subtotal;
          else { totalHrs += hrs; totalIngHoras += j.subtotal; }
        }
      });

      const tieneAjusteEdp = Boolean(
        ajEdp && (
          (ajEdp.cantidades_editadas && Object.keys(ajEdp.cantidades_editadas).length > 0) ||
          (ajEdp.tarifas_editadas && Object.keys(ajEdp.tarifas_editadas).length > 0) ||
          (ajEdp.totales_editados && Object.keys(ajEdp.totales_editados).length > 0) ||
          (Array.isArray(ajEdp.otros_items) && ajEdp.otros_items.length > 0) ||
          Number(ajEdp.descuento_tesoreria ?? ajEdp.descuento_global ?? 0) > 0
        )
      );

      const esServicioEspecial = (
        tieneAjusteEdp ||
        jornadas.length === 0 ||
        Number(backendIts.total_ingresos_facturables || 0) > (totalIngHoras + totalIngFletes) ||
        String(d.data?.proyecto?.codi_proyecto || '').startsWith('RYL-')
      );

      if (esServicioEspecial && Number(backendIts.total_ingresos_facturables || 0) > 0) {
        its.total_ingresos_facturables = Number(backendIts.total_ingresos_facturables);
        its.total_ingresos_horas = Number(backendIts.total_ingresos_horas || 0);
        its.total_ingresos_fletes = Number(backendIts.total_ingresos_fletes || 0);
        its.total_horas_report = Number(backendIts.total_horas_report || totalHrs);
      } else {
        its.total_horas_report = totalHrs;
        if (esFijo && totalIngHoras === 0 && Number(its.valor_fijo_pactado || 0) > 0) {
          totalIngHoras = Number(its.valor_fijo_pactado);
        }
        its.total_ingresos_horas = totalIngHoras;
        if (totalIngFletes > 0) {
          its.total_ingresos_fletes = totalIngFletes;
        } else {
          its.total_ingresos_fletes = parseFloat(its.valor_flete_pactado || 0);
        }
        its.total_ingresos_facturables = its.total_ingresos_horas + its.total_ingresos_fletes;
      }

      const backendFact = backendIts.total_ingresos_facturables || 0;
      const diff = its.total_ingresos_facturables - backendFact;
      console.log(`Proyecto ${id} (${d.data?.proyecto?.codi_proyecto || 'N/A'}):`);
      console.log(`  Frontend Web recalculado: $${its.total_ingresos_facturables.toLocaleString('es-CL')} (Horas: $${its.total_ingresos_horas.toLocaleString('es-CL')}, Flete: $${its.total_ingresos_fletes.toLocaleString('es-CL')})`);
      console.log(`  Backend / PDF Oficial   : $${backendFact.toLocaleString('es-CL')} (Horas: $${backendIts.total_ingresos_horas?.toLocaleString('es-CL')}, Flete: $${backendIts.total_ingresos_fletes?.toLocaleString('es-CL')})`);
      console.log(`  Diferencia Web vs PDF   : $${diff.toLocaleString('es-CL')} ${diff !== 0 ? '❌ DISCREPANCIA' : '✅ COINCIDE PERFECTO ($0)'}`);
      console.log('');
    } catch(e) {
      console.error(`Error en Proyecto ${id}:`, e.message);
    }
  }
}

simulateRefinedFrontend();
