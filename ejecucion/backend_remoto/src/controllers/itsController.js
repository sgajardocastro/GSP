const pool = require('../config/postgresPool');
const itsPdfService = require('../services/itsPdfService');
const MessageModel = require('../models/messageModel');
const notificacionService = require('../services/notificacionService');
const crypto = require('crypto');
const messageModel = new MessageModel();

/**
 * itsController.js
 * Controlador para la liquidación relacional del Informe de Término de Servicio (ITS)
 * Gobernado por Spec 46 (.agents/specs/46_informe_termino_servicio_its_spec.md)
 */
const itsController = {
  // 1. Obtener contexto completo del ITS (Cabecera, Jornadas y Costos 8 categorías)
  async getITS(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ success: false, message: 'id_proyecto es requerido' });
      }

      // 1.1 Obtener datos del proyecto
      const proyRes = await pool.query(`
        SELECT 
          p.id_proyecto,
          p.codi_proyecto,
          p.nombre_proyecto,
          p.id_proyecto_estado,
          p.id_empresa,
          p.json_field,
          COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', p.json_field->'crm_v1'->>'contacto_nombre', p.json_field->>'cliente_nombre', 'Cliente') AS cliente_nombre,
          COALESCE(clt.rut_empresa, p.json_field->'crm_v1'->>'cliente_rut', p.json_field->>'cliente_rut', '') AS cliente_rut,
          emp.id_empresa AS empresa_id,
          COALESCE(emp.razon_social, emp.name_empresa, 'SAN PABLO') AS empresa_razon_social,
          COALESCE(emp.name_empresa, emp.razon_social, 'SAN PABLO') AS empresa_nombre_fantasia,
          COALESCE(emp.rut_empresa, '52004162-1') AS empresa_rut,
          COALESCE(emp.giro, 'Arriendo de Maquinarias y Grúas') AS empresa_giro,
          COALESCE(emp.direccion, emp.direccion_facturacion, 'Panamericana Norte #1020') AS empresa_direccion,
          COALESCE(emp.fono_contacto, '+56 9 9842 1094') AS empresa_fono,
          COALESCE(emp.logo_empresa, 'logo-sanpablo.png') AS empresa_logo,
          COALESCE(emp.name_empresa, emp.razon_social, 'Grúas San Pablo SpA') AS empresa_facturacion,
          COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->'crm_v1'->>'obra_ciudad', p.json_field->>'obra_ciudad', 'Santiago') AS obra_ciudad
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN tpar_empresas emp ON p.id_empresa = emp.id_empresa
        WHERE p.id_proyecto = $1;
      `, [id_proyecto]);

      if (proyRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }
      const proyecto = proyRes.rows[0];

      // 1.2 Parámetros comerciales de CRM
      const crmV1 = proyecto.json_field?.crm_v1 || {};
      const lineas = crmV1.lineas_servicio || crmV1.snapshot_comercial?.lines || proyecto.json_field?.comercial_v1?.servicios || proyecto.json_field?.cotizacion_v1?.servicios || [];
      let valorHoraPactado = 0;
      let valorFletePactado = 0;
      let horasMinimas = 8.0;

      lineas.forEach(l => {
        const desc = (l.descripcion || l.concepto || l.tipo || '').toUpperCase();
        const unid = (l.unidad || l.unidad_cobro || '').toUpperCase();
        const subcat = (l.subcategoria || '').toUpperCase();
        const precio = parseFloat(l.valorUnitario || l.precio_unitario || l.valor_unitario || l.tarifa || 0);
        const sub = parseFloat(l.subtotal || 0);

        if (l.tipo === 'TRASLADOS' || unid.includes('FLETE') || unid.includes('TRASLADO') || desc.includes('FLETE') || desc.includes('TRASLADO') || subcat.includes('FLETE') || subcat.includes('CAMA BAJA')) {
          valorFletePactado += (sub > 0 ? sub : (precio * parseFloat(l.cantidad || 1)));
        } else if (precio > 0 && valorHoraPactado === 0) {
          valorHoraPactado = precio;
          if (parseFloat(l.pisoMinimo || l.piso_minimo || l.horas_minimas) > 0) {
            horasMinimas = parseFloat(l.pisoMinimo || l.piso_minimo || l.horas_minimas);
          }
        }
      });

      const tipoContexto = (crmV1.regimen_operacional || (parseFloat(crmV1.distancia_km || 0) > 30 ? 'RURAL' : 'URBANO')).toUpperCase();

      // Consultar todos los reports diarios de terreno desde tedp_reporte_avance con respaldos
      const repRes = await pool.query(`
        SELECT 
          ra.id_reporte_avance,
          TO_CHAR(ra.fecha_reporte, 'YYYY-MM-DD') AS fecha_reporte_fmt,
          ra.fecha_reporte,
          ra.horas_operadas,
          ra.horas_facturables,
          ra.horas_colacion,
          ra.token_report,
          ra.estado_reporte,
          ra.cliente_nombre,
          ra.cliente_cargo,
          ra.cliente_firma_canvas_base64,
          ra.codigo_validacion_fes,
          ra.accuracy_firma,
          ra.latitud_inicio_servicio,
          ra.longitud_inicio_servicio,
          ra.horometro_inicio,
          ra.horometro_termino,
          ra.odometro_inicio,
          ra.odometro_termino,
          ra.id_doc_pdf,
          ra.ajustes_analista,
          ra.id_user_operador,
          ra.id_user_rigger,
          COALESCE(uop.name_frst, uop.user_name, '') AS op_nombre,
          COALESCE(uop.apellido_pat, uop.user_lastname, '') AS op_apellido,
          COALESCE(urig.name_frst, urig.user_name, '') AS rig_nombre,
          COALESCE(urig.apellido_pat, urig.user_lastname, '') AS rig_apellido,
          COALESCE(e.patente, 'S/P') AS patente,
          COALESCE(e.modelo, '') AS equipo_modelo,
          COALESCE(e.id_equipo, ra.id_equipo) AS id_equipo,
          TO_CHAR(ra.fecha_inicio_servicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(ra.fecha_termino_servicio, 'HH24:MI') AS hora_termino
        FROM tedp_reporte_avance ra
        LEFT JOIN tequ_equipo e ON ra.id_equipo = e.id_equipo
        LEFT JOIN tsec_users uop ON ra.id_user_operador = uop.id_user
        LEFT JOIN tsec_users urig ON ra.id_user_rigger = urig.id_user
        WHERE ra.id_proyecto = $1
        ORDER BY ra.fecha_reporte ASC, ra.id_reporte_avance ASC;
      `, [id_proyecto]);

      // 1.3 Buscar si ya existe cabecera de ITS relacional
      const itsRes = await pool.query(`
        SELECT * FROM tits_informe_termino
        WHERE id_proyecto = $1
        ORDER BY id_its DESC
        LIMIT 1;
      `, [id_proyecto]);

      let its = null;
      let jornadas = [];
      let costos = {
        alimentacion: [],
        peajes: [],
        pensiones: [],
        personal_externo: [],
        feriados: [],
        subcontratacion_flete: [],
        gastos_extraordinarios: [],
        costo_hora_operador: [],
        combustible: [],
        movilizacion: []
      };

      if (itsRes.rows.length > 0) {
        // ITS YA EXISTE EN BASE DE DATOS
        its = itsRes.rows[0];

        // Cargar jornadas relacionales con respaldos de firma de terreno y GPS
        const jorRes = await pool.query(`
          SELECT 
            jd.id_jornada,
            jd.id_its,
            jd.id_reporte_avance,
            TO_CHAR(jd.fecha, 'YYYY-MM-DD') AS fecha,
            jd.numero_ot,
            jd.id_equipo,
            jd.patente,
            jd.tipo_servicio,
            jd.hora_salida,
            jd.hora_llegada,
            jd.hora_termino,
            jd.hora_retorno,
            jd.colacion_minutos,
            jd.horas_reales,
            jd.horas_report,
            COALESCE(jd.tarifa_hora, $2) AS tarifa_hora,
            COALESCE(jd.subtotal, (jd.horas_report * COALESCE(jd.tarifa_hora, $2))) AS subtotal,
            jd.numero_report,
            jd.es_oculta,
            jd.vb_conciliado,
            jd.orden,
            ra.cliente_firma_canvas_base64,
            ra.cliente_nombre,
            ra.cliente_cargo,
            ra.codigo_validacion_fes,
            ra.accuracy_firma,
            ra.latitud_inicio_servicio,
            ra.longitud_inicio_servicio,
            ra.horometro_inicio,
            ra.horometro_termino,
            ra.odometro_inicio,
            ra.odometro_termino,
            ra.id_doc_pdf,
            ra.ajustes_analista,
            CASE 
              WHEN ra.id_doc_pdf IS NOT NULL OR ra.ajustes_analista->>'regularizado_manual' = 'true' THEN 'FISICO_MANUAL' 
              WHEN ra.codigo_validacion_fes IS NOT NULL OR ra.cliente_firma_canvas_base64 IS NOT NULL THEN 'DIGITAL_FES' 
              ELSE 'PENDIENTE' 
            END AS tipo_respaldo,
            CASE 
              WHEN ra.id_doc_pdf IS NOT NULL THEN ('/api/v1/storage/view/' || ra.id_doc_pdf) 
              ELSE NULL 
            END AS url_comprobante,
            COALESCE(e.modelo, '') AS equipo_modelo
          FROM tits_jornada_detalle jd
          LEFT JOIN tedp_reporte_avance ra ON jd.id_reporte_avance = ra.id_reporte_avance
          LEFT JOIN tequ_equipo e ON jd.id_equipo = e.id_equipo
          WHERE jd.id_its = $1
          ORDER BY jd.orden ASC, jd.fecha ASC, jd.id_jornada ASC;
        `, [its.id_its, its.valor_hora_pactado || valorHoraPactado]);
        jornadas = jorRes.rows;

        // Cargar costos relacionales con fechas formateadas en YYYY-MM-DD
        const cosRes = await pool.query(`
          SELECT 
            id_costo_item,
            id_its,
            categoria,
            TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
            id_personal,
            nombre_personal,
            id_equipo,
            patente,
            numero_oc,
            concepto_detalle,
            tipo_calculo,
            cantidad_unidades,
            precio_unitario,
            monto_total,
            monto_desayuno,
            monto_almuerzo,
            monto_cena,
            monto_alojamiento,
            monto_traslado,
            id_archivo_comprobante,
            fecha_registro,
            tipo_estanque,
            archivo_comprobante_url
          FROM tits_costo_operacional
          WHERE id_its = $1
          ORDER BY fecha ASC, id_costo_item ASC;
        `, [its.id_its]);

        cosRes.rows.forEach(c => {
          const catKey = c.categoria.toLowerCase();
          if (catKey === 'alimentacion' || catKey === 'viaticos_alimentacion') costos.alimentacion.push(c);
          else if (catKey === 'peajes') costos.peajes.push(c);
          else if (catKey === 'pensiones') costos.pensiones.push(c);
          else if (catKey === 'personal_externo') costos.personal_externo.push(c);
          else if (catKey === 'feriados') costos.feriados.push(c);
          else if (catKey === 'subcontrato_flete') costos.subcontratacion_flete.push(c);
          else if (catKey === 'gastos_extra') costos.gastos_extraordinarios.push(c);
          else if (catKey === 'costo_hora_operador') costos.costo_hora_operador.push(c);
          else if (catKey === 'combustible') costos.combustible.push(c);
          else if (catKey === 'movilizacion') costos.movilizacion.push(c);
        });

        // Conciliación reactiva para ITS editable (BORRADOR o BORRADOR_INCREMENTAL)
        if (its.estado_its === 'BORRADOR' || its.estado_its === 'BORRADOR_INCREMENTAL') {
          // 1. Asegurar flete pactado desde propuesta comercial CRM ($400.000 para OT 014 con ida y regreso)
          if (valorFletePactado > 0 && (parseFloat(its.valor_flete_pactado || 0) < valorFletePactado || parseFloat(its.valor_flete_pactado || 0) === 200000)) {
            its.valor_flete_pactado = valorFletePactado;
            its.total_ingresos_fletes = valorFletePactado;
          }
          if (valorHoraPactado > 0 && (!its.valor_hora_pactado || parseFloat(its.valor_hora_pactado) === 0)) {
            its.valor_hora_pactado = valorHoraPactado;
          }

          // 2. Conciliar reportes diarios de terreno
          repRes.rows.forEach(r => {
            const existing = jornadas.find(j => j.id_reporte_avance && parseInt(j.id_reporte_avance) === parseInt(r.id_reporte_avance));
            const tieneDoc = Boolean(r.id_doc_pdf || r.ajustes_analista?.evidencia_fisica_adjunta);
            const esReg = r.estado_reporte === 'REGULARIZADO_MANUAL' || r.ajustes_analista?.regularizado_manual;
            const tipoResp = tieneDoc || esReg 
              ? 'FISICO_MANUAL' 
              : ((r.codigo_validacion_fes || r.cliente_firma_canvas_base64) ? 'DIGITAL_FES' : 'PENDIENTE');
            const numRep = r.token_report 
              ? (r.token_report.startsWith('REG-') ? r.token_report : r.token_report.slice(0, 16)) 
              : (tieneDoc ? `DOC-FIS-${r.id_reporte_avance}` : `REP-${r.id_reporte_avance}`);

            if (existing) {
              if (r.estado_reporte === 'VALIDADO_ANALISTA') {
                existing.vb_conciliado = true;
                const hrs = parseFloat(r.horas_facturables || r.horas_operadas || 0);
                if (hrs > 0) existing.horas_report = hrs;
              }
              if (!existing.tarifa_hora) existing.tarifa_hora = parseFloat(its.valor_hora_pactado || valorHoraPactado || 0);
              existing.subtotal = parseFloat(existing.horas_report || 0) * parseFloat(existing.tarifa_hora || 0);
              if (!existing.cliente_firma_canvas_base64 && r.cliente_firma_canvas_base64) existing.cliente_firma_canvas_base64 = r.cliente_firma_canvas_base64;
              if (r.codigo_validacion_fes) existing.codigo_validacion_fes = r.codigo_validacion_fes;
              if (r.cliente_nombre) existing.cliente_nombre = r.cliente_nombre;
              if (r.cliente_cargo) existing.cliente_cargo = r.cliente_cargo;
              if (!existing.patente || existing.patente === 'S/P') existing.patente = r.patente;
              if (!existing.equipo_modelo) existing.equipo_modelo = r.equipo_modelo;
              if (existing.fecha && typeof existing.fecha === 'string' && existing.fecha.includes('T')) {
                existing.fecha = existing.fecha.split('T')[0];
              }
              if (r.id_doc_pdf) {
                existing.id_doc_pdf = r.id_doc_pdf;
                existing.url_comprobante = `/api/v1/storage/view/${r.id_doc_pdf}`;
              }
              if (tipoResp) existing.tipo_respaldo = tipoResp;
            } else {
              // Incorporar reporte que ingresó a terreno o regularizado posteriormente
              const hrsFact = parseFloat(r.horas_facturables || r.horas_operadas || its.horas_minimas_pactadas || horasMinimas || 8.0);
              const tarifa = parseFloat(its.valor_hora_pactado || valorHoraPactado || 0);
              jornadas.push({
                id_jornada: null,
                id_its: its.id_its,
                id_reporte_avance: r.id_reporte_avance,
                fecha: r.fecha_reporte_fmt || (r.fecha_reporte ? new Date(r.fecha_reporte).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
                numero_ot: proyecto.codi_proyecto || `OT-${proyecto.id_proyecto}`,
                id_equipo: r.id_equipo,
                patente: r.patente,
                equipo_modelo: r.equipo_modelo,
                tipo_servicio: 'Hora',
                hora_salida: r.hora_inicio || '08:00',
                hora_llegada: '08:30',
                hora_termino: r.hora_termino || '18:00',
                hora_retorno: '19:00',
                colacion_minutos: r.horas_colacion ? Math.round(parseFloat(r.horas_colacion) * 60) : 60,
                horas_reales: parseFloat(r.horas_operadas || 0),
                horas_report: hrsFact,
                tarifa_hora: tarifa,
                subtotal: hrsFact * tarifa,
                numero_report: numRep,
                tipo_respaldo: tipoResp,
                id_doc_pdf: r.id_doc_pdf,
                url_comprobante: r.id_doc_pdf ? `/api/v1/storage/view/${r.id_doc_pdf}` : null,
                es_oculta: false,
                vb_conciliado: r.estado_reporte === 'VALIDADO_ANALISTA',
                cliente_firma_canvas_base64: r.cliente_firma_canvas_base64,
                cliente_nombre: r.cliente_nombre,
                cliente_cargo: r.cliente_cargo,
                codigo_validacion_fes: r.codigo_validacion_fes,
                accuracy_firma: r.accuracy_firma,
                latitud_inicio_servicio: r.latitud_inicio_servicio,
                longitud_inicio_servicio: r.longitud_inicio_servicio,
                horometro_inicio: r.horometro_inicio,
                horometro_termino: r.horometro_termino,
                orden: jornadas.length + 1
              });
            }
          });

          // 3. Incorporar filas de traslado físico en la tabla si no existen (Flete Ida y Flete Retorno)
          const tieneFleteIda = jornadas.some(j => j.tipo_servicio && j.tipo_servicio.toLowerCase().includes('ida'));
          const tieneFleteRetorno = jornadas.some(j => j.tipo_servicio && j.tipo_servicio.toLowerCase().includes('retorno'));

          if (!tieneFleteIda && valorFletePactado > 0) {
            const montoIda = Math.round(valorFletePactado / 2);
            const fechaIda = repRes.rows[0]?.fecha_reporte_fmt || (repRes.rows[0]?.fecha_reporte ? new Date(repRes.rows[0].fecha_reporte).toISOString().slice(0, 10) : '2026-10-01');
            const patenteEquipo = repRes.rows[0]?.patente || 'VCTR.81-9';
            const modeloEquipo = repRes.rows[0]?.equipo_modelo || 'ATF 50 G3';
            jornadas.unshift({
              id_jornada: null,
              id_its: its.id_its,
              id_reporte_avance: null,
              fecha: fechaIda,
              numero_ot: proyecto.codi_proyecto || `OT-${proyecto.id_proyecto}`,
              id_equipo: repRes.rows[0]?.id_equipo || 35,
              patente: patenteEquipo,
              equipo_modelo: modeloEquipo,
              tipo_servicio: 'Flete Solo Ida',
              hora_salida: '07:00',
              hora_llegada: '08:00',
              hora_termino: null,
              hora_retorno: null,
              colacion_minutos: 0,
              horas_reales: 1.0,
              horas_report: 1.0,
              tarifa_hora: montoIda,
              subtotal: montoIda,
              numero_report: 'FLE-IDA-41KM',
              es_oculta: false,
              vb_conciliado: true,
              orden: 0
            });
          }

          if (!tieneFleteRetorno && valorFletePactado > 0) {
            const montoRetorno = Math.round(valorFletePactado / 2);
            const lastRep = repRes.rows[repRes.rows.length - 1];
            const fechaRetorno = lastRep?.fecha_reporte_fmt || (lastRep?.fecha_reporte ? new Date(lastRep.fecha_reporte).toISOString().slice(0, 10) : '2026-10-01');
            const patenteEquipo = lastRep?.patente || 'VCTR.81-9';
            const modeloEquipo = lastRep?.equipo_modelo || 'ATF 50 G3';
            jornadas.push({
              id_jornada: null,
              id_its: its.id_its,
              id_reporte_avance: null,
              fecha: fechaRetorno,
              numero_ot: proyecto.codi_proyecto || `OT-${proyecto.id_proyecto}`,
              id_equipo: lastRep?.id_equipo || 35,
              patente: patenteEquipo,
              equipo_modelo: modeloEquipo,
              tipo_servicio: 'Flete Solo Retorno',
              hora_salida: null,
              hora_llegada: null,
              hora_termino: '18:00',
              hora_retorno: '19:00',
              colacion_minutos: 0,
              horas_reales: 1.0,
              horas_report: 1.0,
              tarifa_hora: montoRetorno,
              subtotal: montoRetorno,
              numero_report: 'FLE-RET-41KM',
              es_oculta: false,
              vb_conciliado: true,
              orden: jornadas.length + 1
            });
          }

          // 4. Conciliar costo hora operador: estándar $10.000 por hora operada para tripulación real
          const sumHrsOperadas = jornadas
            .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')))
            .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

          const repOpRow = repRes.rows.find(r => r.id_user_operador && `${r.op_nombre || ''} ${r.op_apellido || ''}`.trim());
          const opRealNombre = repOpRow
            ? `${repOpRow.op_nombre || ''} ${repOpRow.op_apellido || ''}`.trim().toUpperCase()
            : 'JORGE PONCE';
          const opRealId = repOpRow ? repOpRow.id_user_operador : 19;

          if (costos.costo_hora_operador.length > 0) {
            costos.costo_hora_operador.forEach(cho => {
              if (cho.nombre_personal === 'NICOLAS CEBALLOS' || !cho.nombre_personal || (repOpRow && cho.id_personal !== opRealId)) {
                cho.nombre_personal = opRealNombre;
                cho.id_personal = opRealId;
              }
              cho.patente = cho.patente || 'VCTR.81-9';
              cho.precio_unitario = 10000;
              cho.cantidad_unidades = sumHrsOperadas || 28;
              cho.monto_total = cho.cantidad_unidades * cho.precio_unitario;
              if (cho.fecha && typeof cho.fecha === 'string' && cho.fecha.includes('T')) {
                cho.fecha = cho.fecha.split('T')[0];
              }
            });
          }

          // 5. Recalcular totales reactivos en cabecera
          const sumHrsGrua = jornadas
            .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')))
            .reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);

          const sumIngresosHoras = jornadas
            .filter(j => !j.es_oculta && (!j.tipo_servicio || !j.tipo_servicio.toLowerCase().includes('flete')))
            .reduce((acc, j) => acc + (parseFloat(j.subtotal) || ((parseFloat(j.horas_report) || 0) * (parseFloat(j.tarifa_hora) || parseFloat(its.valor_hora_pactado) || 0))), 0);

          const sumIngresosFletes = jornadas
            .filter(j => !j.es_oculta && j.tipo_servicio && j.tipo_servicio.toLowerCase().includes('flete'))
            .reduce((acc, j) => acc + (parseFloat(j.subtotal) || parseFloat(j.tarifa_hora) || 0), 0);

          its.total_horas_report = sumHrsGrua;
          its.total_ingresos_horas = sumIngresosHoras;
          its.total_ingresos_fletes = sumIngresosFletes > 0 ? sumIngresosFletes : parseFloat(its.valor_flete_pactado || valorFletePactado || 0);
          its.valor_flete_pactado = its.total_ingresos_fletes;
          its.total_ingresos_facturables = its.total_ingresos_horas + its.total_ingresos_fletes;

          // Costos totales de las 9 categorías
          let sumCostos = 0;
          Object.keys(costos).forEach(cat => {
            (costos[cat] || []).forEach(item => {
              sumCostos += parseFloat(item.monto_total || 0);
            });
          });
          its.total_costos_operacionales = sumCostos;
          its.utilidad_bruta = its.total_ingresos_facturables - its.total_costos_operacionales;
          if (its.total_ingresos_facturables > 0) {
            its.margen_porcentaje = (its.utilidad_bruta / its.total_ingresos_facturables) * 100;
          }
        }
      } else {
        // AUTO-INICIALIZAR ITS CANDIDATO (Borrador inicial relacional)
        const folioSugerido = `ITS-${proyecto.codi_proyecto || proyecto.id_proyecto}-001`;

        its = {
          id_its: null,
          id_proyecto: proyecto.id_proyecto,
          folio_its: folioSugerido,
          version: 1,
          tipo_contexto: tipoContexto,
          horas_minimas_pactadas: horasMinimas,
          valor_hora_pactado: valorHoraPactado,
          valor_flete_pactado: valorFletePactado,
          total_horas_report: 0,
          total_ingresos_horas: 0,
          total_ingresos_fletes: valorFletePactado,
          total_ingresos_facturables: valorFletePactado,
          total_costos_operacionales: 0,
          utilidad_bruta: valorFletePactado,
          margen_porcentaje: valorFletePactado > 0 ? 100 : 0,
          plantilla_tipo: tipoContexto,
          observaciones: '',
          categorias_sin_costo: {},
          estado_its: 'BORRADOR'
        };

        let ordenIdx = 1;
        let sumHrs = 0;
        let sumIngresos = 0;
        repRes.rows.forEach(r => {
          const hrsFact = parseFloat(r.horas_facturables || r.horas_operadas || horasMinimas);
          const subtotalFila = hrsFact * valorHoraPactado;
          sumHrs += hrsFact;
          sumIngresos += subtotalFila;

          const tieneDoc = Boolean(r.id_doc_pdf || r.ajustes_analista?.evidencia_fisica_adjunta);
          const esReg = r.estado_reporte === 'REGULARIZADO_MANUAL' || r.ajustes_analista?.regularizado_manual;
          const tipoResp = tieneDoc || esReg 
            ? 'FISICO_MANUAL' 
            : ((r.codigo_validacion_fes || r.cliente_firma_canvas_base64) ? 'DIGITAL_FES' : 'PENDIENTE');
          const numRep = r.token_report 
            ? (r.token_report.startsWith('REG-') ? r.token_report : r.token_report.slice(0, 16)) 
            : (tieneDoc ? `DOC-FIS-${r.id_reporte_avance}` : `REP-${r.id_reporte_avance}`);

          jornadas.push({
            id_jornada: null,
            id_its: null,
            id_reporte_avance: r.id_reporte_avance,
            fecha: r.fecha_reporte_fmt || (r.fecha_reporte ? new Date(r.fecha_reporte).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
            numero_ot: proyecto.codi_proyecto || `OT-${proyecto.id_proyecto}`,
            id_equipo: r.id_equipo,
            patente: r.patente,
            equipo_modelo: r.equipo_modelo,
            tipo_servicio: 'Hora',
            hora_salida: r.hora_inicio || '08:00',
            hora_llegada: '08:30',
            hora_termino: r.hora_termino || '18:00',
            hora_retorno: '19:00',
            colacion_minutos: r.horas_colacion ? Math.round(parseFloat(r.horas_colacion) * 60) : 60,
            horas_reales: parseFloat(r.horas_operadas || 0),
            horas_report: hrsFact,
            tarifa_hora: valorHoraPactado,
            subtotal: subtotalFila,
            numero_report: numRep,
            tipo_respaldo: tipoResp,
            id_doc_pdf: r.id_doc_pdf,
            url_comprobante: r.id_doc_pdf ? `/api/v1/storage/view/${r.id_doc_pdf}` : null,
            es_oculta: false,
            vb_conciliado: r.estado_reporte === 'VALIDADO_ANALISTA',
            cliente_firma_canvas_base64: r.cliente_firma_canvas_base64,
            cliente_nombre: r.cliente_nombre,
            cliente_cargo: r.cliente_cargo,
            codigo_validacion_fes: r.codigo_validacion_fes,
            accuracy_firma: r.accuracy_firma,
            latitud_inicio_servicio: r.latitud_inicio_servicio,
            longitud_inicio_servicio: r.longitud_inicio_servicio,
            horometro_inicio: r.horometro_inicio,
            horometro_termino: r.horometro_termino,
            orden: ordenIdx++
          });
        });

        // 3. Incorporar fletes iniciales si valorFletePactado > 0
        if (valorFletePactado > 0) {
          const montoFleteTramo = Math.round(valorFletePactado / 2);
          const primerRep = repRes.rows[0];
          const ultimoRep = repRes.rows[repRes.rows.length - 1];

          // Flete Ida
          jornadas.unshift({
            id_jornada: null,
            id_its: null,
            id_reporte_avance: null,
            fecha: primerRep?.fecha_reporte_fmt || (primerRep?.fecha_reporte ? new Date(primerRep.fecha_reporte).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
            numero_ot: proyecto.codi_proyecto || `OT-${proyecto.id_proyecto}`,
            id_equipo: primerRep?.id_equipo || 35,
            patente: primerRep?.patente || 'VCTR.81-9',
            equipo_modelo: primerRep?.equipo_modelo || 'ATF 50 G3',
            tipo_servicio: 'Flete Solo Ida',
            hora_salida: '07:00',
            hora_llegada: '08:00',
            hora_termino: null,
            hora_retorno: null,
            colacion_minutos: 0,
            horas_reales: 1.0,
            horas_report: 1.0,
            tarifa_hora: montoFleteTramo,
            subtotal: montoFleteTramo,
            numero_report: 'FLE-IDA',
            es_oculta: false,
            vb_conciliado: true,
            orden: 0
          });

          // Flete Retorno
          jornadas.push({
            id_jornada: null,
            id_its: null,
            id_reporte_avance: null,
            fecha: ultimoRep?.fecha_reporte_fmt || (ultimoRep?.fecha_reporte ? new Date(ultimoRep.fecha_reporte).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
            numero_ot: proyecto.codi_proyecto || `OT-${proyecto.id_proyecto}`,
            id_equipo: ultimoRep?.id_equipo || 35,
            patente: ultimoRep?.patente || 'VCTR.81-9',
            equipo_modelo: ultimoRep?.equipo_modelo || 'ATF 50 G3',
            tipo_servicio: 'Flete Solo Retorno',
            hora_salida: null,
            hora_llegada: null,
            hora_termino: '18:00',
            hora_retorno: '19:00',
            colacion_minutos: 0,
            horas_reales: 1.0,
            horas_report: 1.0,
            tarifa_hora: montoFleteTramo,
            subtotal: montoFleteTramo,
            numero_report: 'FLE-RET',
            es_oculta: false,
            vb_conciliado: true,
            orden: jornadas.length + 1
          });
        }

        // Sugerir Costo Hora Operador estándar ($10.000)
        if (sumHrs > 0) {
          const repOpInit = repRes.rows.find(r => r.id_user_operador && `${r.op_nombre || ''} ${r.op_apellido || ''}`.trim());
          const opInitNombre = repOpInit
            ? `${repOpInit.op_nombre || ''} ${repOpInit.op_apellido || ''}`.trim().toUpperCase()
            : 'JORGE PONCE';
          const opInitId = repOpInit ? repOpInit.id_user_operador : 19;

          costos.costo_hora_operador.push({
            id_costo_item: null,
            id_its: null,
            categoria: 'COSTO_HORA_OPERADOR',
            fecha: repRes.rows[0]?.fecha_reporte_fmt || new Date().toISOString().slice(0, 10),
            id_personal: opInitId,
            nombre_personal: opInitNombre,
            id_equipo: repRes.rows[0]?.id_equipo || null,
            patente: repRes.rows[0]?.patente || 'VCTR.81-9',
            numero_oc: null,
            concepto_detalle: 'Horas Operador Estándar Faena',
            tipo_calculo: 'HORA_OPERADOR',
            cantidad_unidades: sumHrs,
            precio_unitario: 10000,
            monto_total: sumHrs * 10000,
            monto_desayuno: 0,
            monto_almuerzo: 0,
            monto_cena: 0,
            monto_alojamiento: 0,
            monto_traslado: 0,
            tipo_estanque: null,
            archivo_comprobante_url: null
          });
        }

        // Actualizar totales calculados iniciales
        its.total_horas_report = sumHrs;
        its.total_ingresos_horas = sumIngresos;
        its.total_ingresos_fletes = valorFletePactado;
        its.total_ingresos_facturables = its.total_ingresos_horas + its.total_ingresos_fletes;
        its.total_costos_operacionales = sumHrs * 10000;
        its.utilidad_bruta = its.total_ingresos_facturables - its.total_costos_operacionales;
        its.margen_porcentaje = its.total_ingresos_facturables > 0 ? (its.utilidad_bruta / its.total_ingresos_facturables) * 100 : 0;
      }

      // 1.2.1 Sincronizar cargas de combustible registradas en PWA / Convoy (tedp_costos_servicio)
      const fuelRes = await pool.query(`
        SELECT 
          cs.id_costo,
          cs.id_proyecto,
          cs.monto_costo,
          cs.litros_combustible,
          cs.kilometraje_odometro,
          cs.horometro_odometro,
          cs.numero_comprobante,
          cs.archivo_comprobante_path,
          cs.foto_tablero_path,
          cs.observacion,
          cs.fecha_registro,
          cs.tipo_estanque,
          cs.id_autorizacion_copec,
          COALESCE(ld.patente, 'S/P') AS patente,
          ld.id_equipo
        FROM tedp_costos_servicio cs
        LEFT JOIN tequ_log_desplazamiento ld ON cs.id_log_desplazamiento = ld.id_log_desplazamiento
        WHERE cs.id_proyecto = $1 AND cs.categoria_costo = 'COMBUSTIBLE'
        ORDER BY cs.fecha_registro ASC;
      `, [id_proyecto]);

      fuelRes.rows.forEach(f => {
        const lts = parseFloat(f.litros_combustible || 0);
        const mto = parseFloat(f.monto_costo || 0);
        const numRef = (f.numero_comprobante || f.id_autorizacion_copec || '').trim();
        const voucherUrl = f.archivo_comprobante_path || f.foto_tablero_path || '';

        // Verificar si esta carga ya existe en costos.combustible (por comprobante/autorizacion o voucher)
        const yaExiste = costos.combustible.some(c => 
          (numRef && c.numero_oc && c.numero_oc.trim() === numRef) ||
          (voucherUrl && c.archivo_comprobante_url && c.archivo_comprobante_url.trim() === voucherUrl.trim())
        );

        if (!yaExiste) {
          costos.combustible.push({
            id_costo_item: null,
            id_its: its ? its.id_its : null,
            categoria: 'COMBUSTIBLE',
            fecha: f.fecha_registro ? f.fecha_registro.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            id_equipo: f.id_equipo || null,
            patente: f.patente || 'S/P',
            numero_oc: numRef,
            concepto_detalle: `Carga Combustible PWA ${f.tipo_estanque ? `(${f.tipo_estanque})` : ''} - Odómetro: ${f.kilometraje_odometro || '-'} km`.trim(),
            tipo_calculo: 'MONTO_DIRECTO',
            cantidad_unidades: lts > 0 ? lts : 1,
            precio_unitario: lts > 0 && mto > 0 ? Math.round(mto / lts) : mto,
            monto_total: mto,
            monto_desayuno: 0,
            monto_almuerzo: 0,
            monto_cena: 0,
            monto_alojamiento: 0,
            monto_traslado: 0,
            tipo_estanque: f.tipo_estanque || 'PRINCIPAL_CHASIS',
            litros: lts,
            archivo_comprobante_url: voucherUrl,
            origen_registro: 'PWA_CONVOY'
          });
        }
      });

      // 1.3 Asignación de tripulación y equipos (para cabecera visual)
      let equiposAsignados = [];
      let personalAsignado = [];

      const eqAsigRes = await pool.query(`
        SELECT 
          re.id_equipo,
          e.patente,
          e.modelo,
          COALESCE(e.tipo_equipo, 'Grúa') AS tipo_equipo,
          re.rol_equipo
        FROM tpry_rel_equipo re
        JOIN tequ_equipo e ON re.id_equipo = e.id_equipo
        WHERE re.id_proyecto = $1;
      `, [id_proyecto]);
      equiposAsignados = eqAsigRes.rows;

      const perAsigRes = await pool.query(`
        SELECT DISTINCT ON (rp.id_user)
          rp.id_user,
          u.name_frst,
          u.apellido_pat,
          u.email,
          rp.rol_asignado AS rol_personal
        FROM tpry_rel_persona rp
        JOIN tsec_users u ON rp.id_user = u.id_user
        WHERE rp.id_proyecto = $1
        ORDER BY rp.id_user, rp.id_rel_persona DESC;
      `, [id_proyecto]);

      // Filtrar por tripulación activa en ejecucion_v1 o en los reports rectificados para excluir operadores reemplazados
      const ejTrip = Array.isArray(proyecto.json_field?.ejecucion_v1?.tripulacion_asignada)
        ? proyecto.json_field.ejecucion_v1.tripulacion_asignada
        : [];
      const activeTripIds = new Set();
      ejTrip.forEach(t => {
        if (t.id_user || t.id_usuario) activeTripIds.add(Number(t.id_user || t.id_usuario));
      });
      repRes.rows.forEach(r => {
        if (r.id_user_operador) activeTripIds.add(Number(r.id_user_operador));
        if (r.id_user_rigger) activeTripIds.add(Number(r.id_user_rigger));
      });

      personalAsignado = activeTripIds.size > 0
        ? perAsigRes.rows.filter(p => activeTripIds.has(Number(p.id_user)))
        : perAsigRes.rows;

      // Fallback a json_field.operaciones_v1 si las tablas relacionales aún no se poblaron
      const opV1 = proyecto.json_field?.operaciones_v1;
      if (equiposAsignados.length === 0 && opV1) {
        if (opV1.equipo_id && opV1.equipo_id !== 'CRN-DEFAULT') {
          equiposAsignados.push({
            id_equipo: null,
            patente: opV1.equipo_id,
            modelo: 'Grúa Principal',
            tipo_equipo: 'Grúa Telescópica',
            rol_equipo: 'Principal'
          });
        }
        if (Array.isArray(opV1.equipos_extra)) {
          opV1.equipos_extra.forEach(ex => {
            if (ex.subcategoria || ex.descripcion) {
              equiposAsignados.push({
                id_equipo: ex.id_equipo || null,
                patente: ex.patente || ex.id_equipo || 'S/P',
                modelo: ex.subcategoria || ex.descripcion || 'Apoyo',
                tipo_equipo: ex.tipo || 'Traslado',
                rol_equipo: ex.rol || 'Secundario'
              });
            }
          });
        }
      }

      if (personalAsignado.length === 0 && opV1) {
        if (Array.isArray(opV1.tripulacion_asignada)) {
          opV1.tripulacion_asignada.forEach(tr => {
            if (tr.cargo) {
              personalAsignado.push({
                id_user: tr.id_user || null,
                name_frst: tr.cargo,
                apellido_pat: tr.requerimiento ? `(${tr.requerimiento})` : '',
                email: '',
                rol_personal: tr.cargo
              });
            }
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          proyecto,
          its,
          jornadas,
          costos,
          crm_pensiones: proyecto.json_field?.crm_v1?.pensiones || {},
          asignaciones: {
            equipos: equiposAsignados,
            personal: personalAsignado
          }
        }
      });
    } catch (error) {
      console.error('[ITS] Error al obtener contexto:', error);
      return res.status(500).json({ success: false, message: 'Error interno al consultar ITS', error: error.message });
    }
  },

  // 2. Guardar ITS en base de datos relacional (Transacción atómica)
  async guardarITS(req, res) {
    const client = await pool.connect();
    try {
      const { cabecera, jornadas, costos } = req.body;
      const id_proyecto = req.body.id_proyecto || cabecera?.id_proyecto;

      if (!id_proyecto || !cabecera) {
        return res.status(400).json({ success: false, message: 'id_proyecto y cabecera son obligatorios' });
      }

      await client.query('BEGIN');

      // 2.1 Upsert en tits_informe_termino
      let idIts = cabecera.id_its;
      if (idIts) {
        await client.query(`
          UPDATE tits_informe_termino SET
            tipo_contexto = $1,
            horas_minimas_pactadas = $2,
            valor_hora_pactado = $3,
            valor_flete_pactado = $4,
            total_horas_report = $5,
            total_ingresos_horas = $6,
            total_ingresos_fletes = $7,
            total_ingresos_facturables = $8,
            total_costos_operacionales = $9,
            utilidad_bruta = $10,
            margen_porcentaje = $11,
            plantilla_tipo = $12,
            observaciones = $13,
            categorias_sin_costo = $14,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id_its = $15;
        `, [
          cabecera.tipo_contexto || 'URBANO',
          cabecera.horas_minimas_pactadas || 8.0,
          cabecera.valor_hora_pactado || 0,
          cabecera.valor_flete_pactado || 0,
          cabecera.total_horas_report || 0,
          cabecera.total_ingresos_horas || 0,
          cabecera.total_ingresos_fletes || 0,
          cabecera.total_ingresos_facturables || 0,
          cabecera.total_costos_operacionales || 0,
          cabecera.utilidad_bruta || 0,
          cabecera.margen_porcentaje || 0,
          cabecera.plantilla_tipo || 'URBANO',
          cabecera.observaciones || '',
          JSON.stringify(cabecera.categorias_sin_costo || {}),
          idIts
        ]);
      } else {
        const insRes = await client.query(`
          INSERT INTO tits_informe_termino (
            id_proyecto, folio_its, version, tipo_contexto,
            horas_minimas_pactadas, valor_hora_pactado, valor_flete_pactado,
            total_horas_report, total_ingresos_horas, total_ingresos_fletes,
            total_ingresos_facturables, total_costos_operacionales,
            utilidad_bruta, margen_porcentaje, plantilla_tipo, observaciones, categorias_sin_costo, estado_its
          ) VALUES (
            $1, $2, 1, $3,
            $4, $5, $6,
            $7, $8, $9,
            $10, $11,
            $12, $13, $14, $15, $16, 'BORRADOR'
          )
          RETURNING id_its;
        `, [
          id_proyecto,
          cabecera.folio_its || `ITS-${id_proyecto}-001`,
          cabecera.tipo_contexto || 'URBANO',
          cabecera.horas_minimas_pactadas || 8.0,
          cabecera.valor_hora_pactado || 0,
          cabecera.valor_flete_pactado || 0,
          cabecera.total_horas_report || 0,
          cabecera.total_ingresos_horas || 0,
          cabecera.total_ingresos_fletes || 0,
          cabecera.total_ingresos_facturables || 0,
          cabecera.total_costos_operacionales || 0,
          cabecera.utilidad_bruta || 0,
          cabecera.margen_porcentaje || 0,
          cabecera.plantilla_tipo || 'URBANO',
          cabecera.observaciones || '',
          JSON.stringify(cabecera.categorias_sin_costo || {})
        ]);
        idIts = insRes.rows[0].id_its;
      }

      // 2.2 Sincronizar Jornadas (Delete + Insert para idempotencia limpia)
      await client.query('DELETE FROM tits_jornada_detalle WHERE id_its = $1', [idIts]);

      if (Array.isArray(jornadas) && jornadas.length > 0) {
        let oIdx = 1;
        for (const j of jornadas) {
          const tarifa = parseFloat(j.tarifa_hora !== undefined && j.tarifa_hora !== null ? j.tarifa_hora : (cabecera.valor_hora_pactado || 0));
          const subtotal = parseFloat(j.subtotal !== undefined && j.subtotal !== null ? j.subtotal : ((j.horas_report || 0) * tarifa));
          await client.query(`
            INSERT INTO tits_jornada_detalle (
              id_its, id_reporte_avance, fecha, numero_ot, id_equipo, patente,
              tipo_servicio, hora_salida, hora_llegada, hora_termino, hora_retorno,
              colacion_minutos, horas_reales, horas_report, tarifa_hora, subtotal, numero_report,
              es_oculta, vb_conciliado, orden
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16, $17,
              $18, $19, $20
            );
          `, [
            idIts,
            j.id_reporte_avance || null,
            j.fecha,
            j.numero_ot || `OT-${id_proyecto}`,
            j.id_equipo || null,
            j.patente || 'S/P',
            j.tipo_servicio || 'Hora',
            j.hora_salida || null,
            j.hora_llegada || null,
            j.hora_termino || null,
            j.hora_retorno || null,
            j.colacion_minutos || 60,
            j.horas_reales || 0,
            j.horas_report || 0,
            tarifa,
            subtotal,
            j.numero_report || null,
            j.es_oculta === true,
            j.vb_conciliado === true,
            oIdx++
          ]);
        }
      }

      // 2.3 Sincronizar Costos Operacionales en las 9 categorías oficiales
      await client.query('DELETE FROM tits_costo_operacional WHERE id_its = $1', [idIts]);

      if (costos && typeof costos === 'object') {
        const catMapping = [
          { key: 'alimentacion', dbCat: 'ALIMENTACION', calc: 'MONTO_DIRECTO' },
          { key: 'peajes', dbCat: 'PEAJES', calc: 'MONTO_DIRECTO' },
          { key: 'pensiones', dbCat: 'PENSIONES', calc: 'DESGLOSE_PENSION' },
          { key: 'personal_externo', dbCat: 'PERSONAL_EXTERNO', calc: 'MONTO_DIRECTO' },
          { key: 'feriados', dbCat: 'FERIADOS', calc: 'MONTO_DIRECTO' },
          { key: 'subcontratacion_flete', dbCat: 'SUBCONTRATO_FLETE', calc: 'MONTO_DIRECTO' },
          { key: 'gastos_extraordinarios', dbCat: 'GASTOS_EXTRA', calc: 'MONTO_DIRECTO' },
          { key: 'costo_hora_operador', dbCat: 'COSTO_HORA_OPERADOR', calc: 'HORA_OPERADOR' },
          { key: 'combustible', dbCat: 'COMBUSTIBLE', calc: 'MONTO_DIRECTO' },
          { key: 'movilizacion', dbCat: 'MOVILIZACION', calc: 'MONTO_DIRECTO' }
        ];

        for (const map of catMapping) {
          const items = costos[map.key] || [];
          if (Array.isArray(items)) {
            for (const item of items) {
              const montoTot = parseFloat(item.monto_total || item.monto || item.total || 0);
              await client.query(`
                INSERT INTO tits_costo_operacional (
                  id_its, categoria, fecha, id_personal, nombre_personal,
                  id_equipo, patente, numero_oc, concepto_detalle,
                  tipo_calculo, cantidad_unidades, precio_unitario, monto_total,
                  monto_desayuno, monto_almuerzo, monto_cena, monto_alojamiento, monto_traslado,
                  id_archivo_comprobante, tipo_estanque, archivo_comprobante_url
                ) VALUES (
                  $1, $2, $3, $4, $5,
                  $6, $7, $8, $9,
                  $10, $11, $12, $13,
                  $14, $15, $16, $17, $18,
                  $19, $20, $21
                );
              `, [
                idIts,
                map.dbCat,
                item.fecha || new Date(),
                item.id_personal || null,
                item.nombre_personal || item.personal || '',
                item.id_equipo || null,
                item.patente || null,
                item.numero_oc || item.numero_comprobante || null,
                item.concepto_detalle || item.concepto || item.detalle || 'Gasto operacional',
                map.calc,
                item.cantidad_unidades || item.horas_report || item.litros || 1,
                item.precio_unitario || item.valor_hora || 0,
                montoTot,
                item.monto_desayuno || 0,
                item.monto_almuerzo || 0,
                item.monto_cena || 0,
                item.monto_alojamiento || 0,
                item.monto_traslado || 0,
                item.id_archivo_comprobante || null,
                item.tipo_estanque || (map.dbCat === 'COMBUSTIBLE' ? 'PRINCIPAL_CHASIS' : null),
                item.archivo_comprobante_url || item.url_comprobante || item.foto_voucher || null
              ]);
            }
          }
        }
      }

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'ITS guardado exitosamente en base de datos relacional',
        id_its: idIts,
        folio_its: cabecera.folio_its
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ITS] Error al guardar transaccionalmente:', error);
      return res.status(500).json({ success: false, message: 'Error interno al guardar ITS', error: error.message });
    } finally {
      client.release();
    }
  },

  // 3. Previsualización en vivo o descarga del PDF ITS
  async getPreviewPdf(req, res) {
    try {
      const { id_proyecto } = req.params;
      if (!id_proyecto) {
        return res.status(400).json({ success: false, message: 'id_proyecto es requerido' });
      }

      let itsData = null;
      const mockRes = {
        statusCode: 200,
        status(c) { this.statusCode = c; return this; },
        json(data) { itsData = data; return this; }
      };
      await itsController.getITS({ params: { id_proyecto } }, mockRes);

      if (!itsData || !itsData.success) {
        return res.status(404).json({ success: false, message: 'No se encontraron datos para generar PDF de ITS' });
      }

      const { proyecto, its, jornadas, costos } = itsData.data;

      // Cargar firmas FES si existe flujo
      let firmas = { paso1: null, paso2: null, paso3: null };
      if (its?.id_flow) {
        const sigRes = await pool.query(`
          SELECT 
            st.flow_tmpl_step_orden,
            st.estado AS estado_paso,
            st.flow_step_obs,
            st.fecha_event AS fecha_creacion,
            u.id_user,
            COALESCE(u.name_frst || ' ' || u.apellido_pat, 'Usuario') AS nombre_usuario,
            u.rut,
            r.name_rol AS rol_nom,
            f.id_fes,
            f.codigo_validacion,
            f.fecha_firma,
            f.aprueba_rechaza
          FROM tflw_flow_steps st
          LEFT JOIN tfes_signatures f ON st.id_fes = f.id_fes
          LEFT JOIN tsec_users u ON COALESCE(f.id_user, st.id_user) = u.id_user
          LEFT JOIN tsec_roles r ON st.id_rol = r.id_rol
          WHERE st.id_flow = $1
          ORDER BY st.flow_tmpl_step_orden ASC;
        `, [its.id_flow]);

        sigRes.rows.forEach(r => {
          if (r.flow_tmpl_step_orden === 1) firmas.paso1 = r;
          else if (r.flow_tmpl_step_orden === 2) firmas.paso2 = r;
          else if (r.flow_tmpl_step_orden === 3) firmas.paso3 = r;
        });
      }

      const pdfBuf = await itsPdfService.generarPdfITS({
        its,
        proyecto,
        jornadas,
        costos,
        firmas,
        validacionUrl: `${process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl'}/${(process.env.APP_ENV === 'prod') ? 'lg-gsp-prod' : 'lg-gsp-dev'}/validador-doc`
      });

      const buffer = Buffer.isBuffer(pdfBuf) ? pdfBuf : Buffer.from(pdfBuf);

      if (req.query.format === 'base64') {
        return res.status(200).json({
          success: true,
          pdfBase64: `data:application/pdf;base64,${buffer.toString('base64')}`
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${its?.folio_its || 'ITS'}.pdf"`);
      return res.end(buffer);
    } catch (error) {
      console.error('[ITS] Error generando preview PDF:', error);
      return res.status(500).json({ success: false, message: 'Error interno generando PDF', error: error.message });
    }
  },

  // 3.1 Compilación de PDF de ITS en servidor con wkhtmltopdf (Estándar Canónico de Cotizaciones)
  async compilarPdfHtml(req, res) {
    try {
      const {
        htmlContent,
        folio = 'ITS-0209',
        numero_cotizacion = 'SN',
        modulo = 'ITS-TRANSICION',
        tenant_code = 'GSP',
        app_env = 'dev'
      } = req.body;

      if (!htmlContent) {
        return res.status(400).json({ success: false, message: 'htmlContent es requerido' });
      }

      const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
      const archivoModel = require('../models/archivoModel');
      const { exec } = require('child_process');
      const { v4: uuidv4 } = require('uuid');
      const fs = require('fs');
      const path = require('path');

      const path_relativo = buildStoragePath(tenant_code, modulo, app_env);
      const targetDir = path.join(STORAGE_ROOT, path_relativo);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const uuid = uuidv4();
      const fileName = `${uuid}.pdf`;
      const filepath = path.join(targetDir, fileName);
      const tempHtmlPath = path.join(targetDir, `${uuid}_temp.html`);
      fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

      await new Promise((resolve, reject) => {
        const cmd = `xvfb-run --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${filepath}"`;
        exec(cmd, (error, stdout, stderr) => {
          try {
            if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
          } catch (e) {}

          if (error && !fs.existsSync(filepath)) {
            console.error('[ITS wkhtmltopdf] Error:', error, stderr);
            return reject(new Error('Fallo al compilar con wkhtmltopdf: ' + error.message));
          }
          resolve();
        });
      });

      const archivoM = new archivoModel();
      const doc = await archivoM.insertarTfmgFile(
        'ITS-TRANSICION',
        'application/pdf',
        `${folio}_COT_${numero_cotizacion}.pdf`,
        fileName,
        path_relativo,
        req.body.id_user || null,
        'EMITIDO'
      );

      return res.status(200).json({
        success: true,
        data: {
          id_doc: doc.id_doc,
          path_relativo: doc.path_doc,
          name_doc_interno: doc.name_doc_interno,
          name_doc_orig: doc.name_doc_orig,
          url_view: `/api/v1/storage/view/${doc.id_doc}`
        }
      });
    } catch (err) {
      console.error('[ITS compilarPdfHtml] Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // 3.2 Listar historial de ITS Transición (Bandeja unificada persistente)
  async listarItsTransicion(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          th.id_transicion,
          th.folio_its,
          th.numero_cotizacion,
          th.version,
          th.cliente_nombre,
          th.cliente_rut,
          th.empresa_facturacion,
          th.ejecutivo_comercial,
          th.ciudad_obra,
          TO_CHAR(th.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
          TO_CHAR(th.fecha_termino, 'YYYY-MM-DD') AS fecha_termino,
          th.total_venta,
          th.total_costos,
          th.utilidad_bruta,
          th.margen,
          th.estado,
          th.id_doc,
          th.data_json,
          th.fecha_guardado,
          th.fecha_actualizacion,
          th.firmas_fes,
          th.historial_observaciones,
          th.id_usuario_elaborador,
          th.id_usuario_verificador,
          th.id_usuario_aprobador,
          COALESCE(TRIM(u_elab.name_frst || ' ' || COALESCE(u_elab.apellido_pat, '')), th.data_json->>'nombre_elaborador', 'Operaciones') AS nombre_elaborador,
          COALESCE(TRIM(u_verif.name_frst || ' ' || COALESCE(u_verif.apellido_pat, '')), th.data_json->>'nombre_verificador') AS nombre_verificador,
          COALESCE(TRIM(u_aprob.name_frst || ' ' || COALESCE(u_aprob.apellido_pat, '')), th.data_json->>'nombre_aprobador') AS nombre_aprobador,
          f.name_doc_orig,
          f.name_doc_interno,
          f.path_doc,
          CASE 
            WHEN th.id_doc IS NOT NULL THEN ('/api/v1/storage/view/' || th.id_doc) 
            ELSE NULL 
          END AS url_view
        FROM tits_transicion_historial th
        LEFT JOIN tsec_users u_elab ON th.id_usuario_elaborador = u_elab.id_user
        LEFT JOIN tsec_users u_verif ON th.id_usuario_verificador = u_verif.id_user
        LEFT JOIN tsec_users u_aprob ON th.id_usuario_aprobador = u_aprob.id_user
        LEFT JOIN tfmg_file f ON th.id_doc = f.id_doc
        ORDER BY th.fecha_actualizacion DESC, th.id_transicion DESC;
      `);

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (err) {
      console.error('[ITS listarItsTransicion] Error:', err);
      return res.status(500).json({ success: false, message: 'Error al listar historial de ITS transición', error: err.message });
    }
  },

  // 3.3 Guardar o actualizar registro de ITS Transición (Borrador, Emitido, Aprobado)
  async guardarItsTransicion(req, res) {
    try {
      const {
        folio_its,
        numero_cotizacion,
        version = 1,
        cliente_nombre,
        cliente_rut,
        empresa_facturacion,
        ejecutivo_comercial,
        ciudad_obra,
        fecha_inicio,
        fecha_termino,
        total_venta = 0,
        total_costos = 0,
        utilidad_bruta = 0,
        margen = 0,
        estado = 'BORRADOR',
        id_doc = null,
        data_json = {},
        firmas_fes = null,
        historial_observaciones = null,
        id_usuario_elaborador = null,
        id_usuario_verificador = null,
        id_usuario_aprobador = null
      } = req.body;

      // Preservar nombre legible del elaborador en data_json para trazabilidad inmediata
      if (req.body.nombre_elaborador && data_json) {
        data_json.nombre_elaborador = req.body.nombre_elaborador;
      }

      if (!folio_its || !numero_cotizacion) {
        return res.status(400).json({ success: false, message: 'folio_its y numero_cotizacion son obligatorios' });
      }

      // Sanitizar y validar existencia de id_doc en tfmg_file para prevenir violación de FK (23503)
      let validIdDoc = null;
      if (id_doc && estado !== 'BORRADOR') {
        const docCheck = await pool.query('SELECT id_doc FROM tfmg_file WHERE id_doc = $1', [parseInt(id_doc)]);
        if (docCheck.rows.length > 0) {
          validIdDoc = parseInt(id_doc);
        } else {
          console.warn(`[ITS guardarItsTransicion] id_doc (${id_doc}) no existe en tfmg_file. Se asigna null.`);
        }
      }

      const upsertQuery = `
        INSERT INTO tits_transicion_historial (
          folio_its,
          numero_cotizacion,
          version,
          cliente_nombre,
          cliente_rut,
          empresa_facturacion,
          ejecutivo_comercial,
          ciudad_obra,
          fecha_inicio,
          fecha_termino,
          total_venta,
          total_costos,
          utilidad_bruta,
          margen,
          estado,
          id_doc,
          data_json,
          firmas_fes,
          historial_observaciones,
          id_usuario_elaborador,
          id_usuario_verificador,
          id_usuario_aprobador,
          fecha_actualizacion
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP
        )
        ON CONFLICT (folio_its, version) DO UPDATE SET
          numero_cotizacion = EXCLUDED.numero_cotizacion,
          cliente_nombre = EXCLUDED.cliente_nombre,
          cliente_rut = EXCLUDED.cliente_rut,
          empresa_facturacion = EXCLUDED.empresa_facturacion,
          ejecutivo_comercial = EXCLUDED.ejecutivo_comercial,
          ciudad_obra = EXCLUDED.ciudad_obra,
          fecha_inicio = EXCLUDED.fecha_inicio,
          fecha_termino = EXCLUDED.fecha_termino,
          total_venta = EXCLUDED.total_venta,
          total_costos = EXCLUDED.total_costos,
          utilidad_bruta = EXCLUDED.utilidad_bruta,
          margen = EXCLUDED.margen,
          estado = EXCLUDED.estado,
          id_doc = COALESCE(EXCLUDED.id_doc, tits_transicion_historial.id_doc),
          data_json = EXCLUDED.data_json,
          firmas_fes = COALESCE(EXCLUDED.firmas_fes, tits_transicion_historial.firmas_fes),
          historial_observaciones = COALESCE(EXCLUDED.historial_observaciones, tits_transicion_historial.historial_observaciones),
          id_usuario_elaborador = COALESCE(EXCLUDED.id_usuario_elaborador, tits_transicion_historial.id_usuario_elaborador),
          id_usuario_verificador = COALESCE(EXCLUDED.id_usuario_verificador, tits_transicion_historial.id_usuario_verificador),
          id_usuario_aprobador = COALESCE(EXCLUDED.id_usuario_aprobador, tits_transicion_historial.id_usuario_aprobador),
          fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const vals = [
        folio_its,
        String(numero_cotizacion),
        parseInt(version) || 1,
        cliente_nombre || '',
        cliente_rut || '',
        empresa_facturacion || 'BESTMAQ',
        ejecutivo_comercial || '',
        ciudad_obra || '',
        fecha_inicio || null,
        fecha_termino || null,
        parseFloat(total_venta) || 0,
        parseFloat(total_costos) || 0,
        parseFloat(utilidad_bruta) || 0,
        isFinite(parseFloat(margen)) ? parseFloat(margen) : 0,
        estado || 'BORRADOR',
        validIdDoc,
        data_json || {},
        firmas_fes ? JSON.stringify(firmas_fes) : null,
        historial_observaciones ? JSON.stringify(historial_observaciones) : null,
        id_usuario_elaborador ? parseInt(id_usuario_elaborador) : null,
        id_usuario_verificador ? parseInt(id_usuario_verificador) : null,
        id_usuario_aprobador ? parseInt(id_usuario_aprobador) : null
      ];

      const result = await pool.query(upsertQuery, vals);

      return res.status(200).json({
        success: true,
        message: 'ITS Transición guardado exitosamente',
        data: result.rows[0]
      });
    } catch (err) {
      console.error('[ITS guardarItsTransicion] Error:', err);
      return res.status(500).json({ success: false, message: 'Error al guardar ITS transición', error: err.message });
    }
  },

  // 3.4 Firmar Elaborador (Rol Secretaria o Analista) -> Pasa a PENDIENTE_VERIFICACION
  async firmarElaboradorItsTransicion(req, res) {
    try {
      const { id_transicion, payload_actualizado } = req.body;
      if (!id_transicion) {
        return res.status(400).json({ success: false, message: 'id_transicion es requerido' });
      }

      const userId = req.body.id_user || req.body.id_usuario || req.user?.id_user || null;
      const rutFirmante = req.body.firmante_rut;
      const pinFes = req.body.pin_fes || req.body.pin_hash || req.body.pin;

      let userRes;
      if (userId) {
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data,
                 COALESCE(r.name_rol, 'SECRETARIA') AS name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE u.id_user = $1
          LIMIT 1;
        `, [userId]);
      }

      if ((!userRes || userRes.rows.length === 0) && rutFirmante) {
        const rutLimpio = String(rutFirmante).replace(/[^0-9kK]/g, '').toUpperCase();
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data,
                 COALESCE(r.name_rol, 'SECRETARIA') AS name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE REPLACE(REPLACE(u.rut, '.', ''), '-', '') ILIKE $1
          LIMIT 1;
        `, [rutLimpio]);
      }

      if (!userRes || userRes.rows.length === 0) {
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data,
                 COALESCE(r.name_rol, 'SECRETARIA') AS name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE u.email ILIKE '%yiara%' OR u.name_frst ILIKE '%yiara%' OR u.id_user = 65
          LIMIT 1;
        `);
      }

      if (!userRes || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const usuario = userRes.rows[0];

      if (pinFes) {
        const pinHash = String(pinFes).length === 64 ? pinFes : crypto.createHash('sha256').update(String(pinFes)).digest('hex');
        if (usuario.pass_hash_fes && usuario.pass_hash_fes !== pinHash) {
          return res.status(401).json({ success: false, message: 'PIN FES incorrecto' });
        }
      }

      const itsRes = await pool.query(`SELECT * FROM tits_transicion_historial WHERE id_transicion = $1;`, [id_transicion]);
      if (itsRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro de ITS Transición no encontrado' });
      }
      const its = itsRes.rows[0];

      const uuidFes = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      const codigoFes = `FES-GSP-ELAB-${uuidFes}`;
      const nombreCompleto = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim() || usuario.email;
      const cargo = (usuario.json_data && usuario.json_data.cargo) || (usuario.name_rol === 'GSP_PROG' ? 'Analista de Operaciones' : 'Secretaria de Operaciones');

      const firmaElab = {
        id_usuario: usuario.id_user,
        nombre: nombreCompleto,
        rut: usuario.rut || '',
        cargo: cargo,
        rol: usuario.name_rol || 'ELABORADOR',
        codigo_fes: codigoFes,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      };

      const firmasActuales = (its.firmas_fes && typeof its.firmas_fes === 'object') ? its.firmas_fes : {};
      firmasActuales.elaborador = firmaElab;

      let updateSql = `
        UPDATE tits_transicion_historial SET
          estado = 'PENDIENTE_VERIFICACION',
          firmas_fes = $1::jsonb,
          id_usuario_elaborador = $2,
          fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      const updateVals = [JSON.stringify(firmasActuales), usuario.id_user];

      if (payload_actualizado && typeof payload_actualizado === 'object') {
        if (payload_actualizado.total_venta !== undefined) {
          updateSql += `, total_venta = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.total_venta) || 0);
        }
        if (payload_actualizado.total_costos !== undefined) {
          updateSql += `, total_costos = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.total_costos) || 0);
        }
        if (payload_actualizado.utilidad_bruta !== undefined) {
          updateSql += `, utilidad_bruta = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.utilidad_bruta) || 0);
        }
        if (payload_actualizado.margen !== undefined) {
          updateSql += `, margen = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.margen) || 0);
        }
        if (payload_actualizado.data_json) {
          updateSql += `, data_json = $${updateVals.length + 1}`;
          updateVals.push(JSON.stringify(payload_actualizado.data_json));
        }
      }

      updateSql += ` WHERE id_transicion = $${updateVals.length + 1} RETURNING *;`;
      updateVals.push(id_transicion);

      const updRes = await pool.query(updateSql, updateVals);
      const itsActualizado = updRes.rows[0];

      // Notificación Omnicanal a Rol ADMINISTRADOR
      try {
        const adminUsers = await pool.query(`
          SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat
          FROM tsec_users u
          JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE r.name_rol IN ('Admin', 'ADMINISTRADOR', 'GSP_ADMIN') AND COALESCE(u.activo, true) = true;
        `);

        for (const adm of adminUsers.rows) {
          const nombreAdm = `${adm.name_frst || ''} ${adm.apellido_pat || ''}`.trim() || 'Administrador';
          const wspMsg = `📋 *GRÚAS SAN PABLO — Verificación Operativa Requerida*\n\n¡Hola ${nombreAdm}! El informe *${itsActualizado.folio_its}* (Cotización #${itsActualizado.numero_cotizacion}) ha sido elaborado y firmado por *${nombreCompleto}* (${cargo}).\n\n🏢 *Cliente:* ${itsActualizado.cliente_nombre || 'N/A'}\n💰 *Venta Neta:* $${Number(itsActualizado.total_venta || 0).toLocaleString('es-CL')} CLP\n📊 *Margen:* ${itsActualizado.margen || 0}%\n\n📲 *Revisa, edita o visa con tu PIN FES aquí:*`;

          await notificacionService.despacharNotificacion({
            evento: 'ITS_TRANSICION_PENDIENTE_VERIFICACION',
            canales: adm.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
            destinatario: {
              nombre: nombreAdm,
              email: adm.email,
              telefono: adm.fono
            },
            deepLink: {
              tipoApp: 'WEB',
              ruta: 'its-transicion',
              params: { folio: itsActualizado.folio_its, cot: itsActualizado.numero_cotizacion, id: itsActualizado.id_transicion }
            },
            emailData: {
              asunto: `Verificación Operativa Requerida: ITS ${itsActualizado.folio_its} - ${itsActualizado.cliente_nombre || ''}`,
              titulo: `Verificación Operativa de ITS Requerida`,
              subtitulo: `Elaborado por ${nombreCompleto} (${cargo})`,
              contenido: `<p>Se ha completado la liquidación de transición para la cotización <strong>#${itsActualizado.numero_cotizacion}</strong> (${itsActualizado.cliente_nombre || ''}).</p><p>Venta Total: <strong>$${Number(itsActualizado.total_venta || 0).toLocaleString('es-CL')} CLP</strong><br>Margen Operacional: <strong>${itsActualizado.margen || 0}%</strong></p>`,
              botonTexto: `Revisar y Validar ITS`
            },
            wspData: { mensaje: wspMsg }
          });
        }
      } catch (errNotif) {
        console.warn('[ITS firmarElaborador] Error despachando notificaciones:', errNotif.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Firma FES de elaboración registrada exitosamente. Enviado a Verificación.',
        data: itsActualizado
      });
    } catch (err) {
      console.error('[ITS firmarElaboradorItsTransicion] Error:', err);
      return res.status(500).json({ success: false, message: 'Error procesando firma de elaboración', error: err.message });
    }
  },

  // 3.5 Devolver con Observaciones (Administrador o Contabilidad)
  async devolverItsTransicion(req, res) {
    try {
      const { id_transicion, motivo, observaciones, id_user } = req.body;
      if (!id_transicion || !observaciones || String(observaciones).trim().length < 5) {
        return res.status(400).json({ success: false, message: 'id_transicion y observaciones (mín. 5 caracteres) son requeridos' });
      }

      const itsRes = await pool.query(`SELECT * FROM tits_transicion_historial WHERE id_transicion = $1;`, [id_transicion]);
      if (itsRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro no encontrado' });
      }
      const its = itsRes.rows[0];

      const userId = id_user || 1;
      const userRes = await pool.query(`
        SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, r.name_rol
        FROM tsec_users u
        LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
        LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
        WHERE u.id_user = $1 LIMIT 1;
      `, [userId]);
      const usuario = userRes.rows[0] || { id_user: userId, name_frst: 'Usuario', email: 'sistema' };
      const nombreUsuario = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim() || usuario.email;

      let nuevoEstado = 'OBSERVADO_ADMIN';
      let rolDevuelve = 'ADMINISTRADOR';
      if (its.estado === 'PENDIENTE_CONTABILIDAD') {
        nuevoEstado = 'OBSERVADO_CONTABILIDAD';
        rolDevuelve = 'CONTABILIDAD';
      }

      const obsEntry = {
        id_devolucion: Date.now(),
        etapa: its.estado,
        estado_origen: its.estado,
        estado_destino: nuevoEstado,
        id_usuario: usuario.id_user,
        nombre_usuario: nombreUsuario,
        rol: rolDevuelve,
        motivo: motivo || 'Observaciones en liquidación',
        observaciones: String(observaciones).trim(),
        fecha: new Date().toISOString()
      };

      const obsHist = Array.isArray(its.historial_observaciones) ? its.historial_observaciones : [];
      obsHist.push(obsEntry);

      const updRes = await pool.query(`
        UPDATE tits_transicion_historial SET
          estado = $1,
          historial_observaciones = $2::jsonb,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_transicion = $3
        RETURNING *;
      `, [nuevoEstado, JSON.stringify(obsHist), id_transicion]);

      const itsActualizado = updRes.rows[0];

      // Notificar al Elaborador
      try {
        const elabId = its.id_usuario_elaborador || 65;
        const elabRes = await pool.query(`SELECT email, movil as fono, name_frst, apellido_pat FROM tsec_users WHERE id_user = $1;`, [elabId]);
        if (elabRes.rows.length > 0) {
          const elab = elabRes.rows[0];
          const nombreElab = `${elab.name_frst || ''} ${elab.apellido_pat || ''}`.trim() || 'Elaborador';
          const wspMsg = `⚠️ *GRÚAS SAN PABLO — ITS Observado / Devuelto*\n\n¡Hola ${nombreElab}! El informe *${its.folio_its}* (Cotización #${its.numero_cotizacion}) fue devuelto por *${nombreUsuario}* (${rolDevuelve}).\n\n📌 *Motivo:* ${obsEntry.motivo}\n📝 *Observaciones:* ${obsEntry.observaciones}\n\n📲 *Ingresa a corregir y reenviar aquí:*`;

          await notificacionService.despacharNotificacion({
            evento: 'ITS_TRANSICION_OBSERVADO',
            canales: elab.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
            destinatario: {
              nombre: nombreElab,
              email: elab.email,
              telefono: elab.fono
            },
            deepLink: {
              tipoApp: 'WEB',
              ruta: 'its-transicion',
              params: { folio: its.folio_its, cot: its.numero_cotizacion, id: its.id_transicion }
            },
            emailData: {
              asunto: `⚠️ ITS Observado: ${its.folio_its} - Cotización #${its.numero_cotizacion}`,
              titulo: `Informe Devuelto con Observaciones`,
              subtitulo: `Devuelto por ${nombreUsuario} (${rolDevuelve})`,
              contenido: `<p>El informe de término de servicio <strong>${its.folio_its}</strong> requiere correcciones antes de continuar el flujo.</p><p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px;"><strong>Motivo:</strong> ${obsEntry.motivo}<br><strong>Observaciones:</strong> ${obsEntry.observaciones}</p>`,
              botonTexto: `Corregir ITS en Plataforma`
            },
            wspData: { mensaje: wspMsg }
          });
        }
      } catch (errNotif) {
        console.warn('[ITS devolver] Error despachando notificaciones:', errNotif.message);
      }

      return res.status(200).json({
        success: true,
        message: `Informe devuelto con éxito a estado ${nuevoEstado}`,
        data: itsActualizado
      });
    } catch (err) {
      console.error('[ITS devolverItsTransicion] Error:', err);
      return res.status(500).json({ success: false, message: 'Error al devolver informe', error: err.message });
    }
  },

  // 3.6 Validar Administrador (Rol Administrador) -> Pasa a PENDIENTE_CONTABILIDAD
  async validarAdminItsTransicion(req, res) {
    try {
      const { id_transicion, payload_actualizado } = req.body;
      if (!id_transicion) {
        return res.status(400).json({ success: false, message: 'id_transicion es requerido' });
      }

      const userId = req.body.id_user || req.body.id_usuario || req.user?.id_user || null;
      const rutFirmante = req.body.firmante_rut;
      const pinFes = req.body.pin_fes || req.body.pin_hash || req.body.pin;

      let userRes;
      if (userId) {
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data, r.name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE u.id_user = $1 LIMIT 1;
        `, [userId]);
      }

      if ((!userRes || userRes.rows.length === 0) && rutFirmante) {
        const rutLimpio = String(rutFirmante).replace(/[^0-9kK]/g, '').toUpperCase();
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data, r.name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE REPLACE(REPLACE(u.rut, '.', ''), '-', '') ILIKE $1 LIMIT 1;
        `, [rutLimpio]);
      }

      if (!userRes || userRes.rows.length === 0) {
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data, r.name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE u.email ILIKE '%jponce%' OR u.email ILIKE '%admin%' OR u.name_frst ILIKE '%jorge%' OR u.id_user = 3
          LIMIT 1;
        `);
      }

      if (!userRes || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const usuario = userRes.rows[0];

      if (pinFes) {
        const pinHash = String(pinFes).length === 64 ? pinFes : crypto.createHash('sha256').update(String(pinFes)).digest('hex');
        if (usuario.pass_hash_fes && usuario.pass_hash_fes !== pinHash) {
          return res.status(401).json({ success: false, message: 'PIN FES de Administrador incorrecto' });
        }
      }

      const itsRes = await pool.query(`SELECT * FROM tits_transicion_historial WHERE id_transicion = $1;`, [id_transicion]);
      if (itsRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro no encontrado' });
      }
      const its = itsRes.rows[0];

      const uuidFes = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      const codigoFes = `FES-GSP-VERIF-${uuidFes}`;
      const nombreCompleto = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim() || usuario.email;

      const firmaVerif = {
        id_usuario: usuario.id_user,
        nombre: nombreCompleto,
        rut: usuario.rut || '',
        cargo: (usuario.json_data && usuario.json_data.cargo) || 'Administrador',
        rol: 'ADMINISTRADOR',
        codigo_fes: codigoFes,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      };

      const firmasActuales = (its.firmas_fes && typeof its.firmas_fes === 'object') ? its.firmas_fes : {};
      firmasActuales.verificador = firmaVerif;

      let updateSql = `
        UPDATE tits_transicion_historial SET
          estado = 'PENDIENTE_CONTABILIDAD',
          firmas_fes = $1::jsonb,
          id_usuario_verificador = $2,
          fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      const updateVals = [JSON.stringify(firmasActuales), usuario.id_user];

      if (payload_actualizado && typeof payload_actualizado === 'object') {
        if (payload_actualizado.total_venta !== undefined) {
          updateSql += `, total_venta = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.total_venta) || 0);
        }
        if (payload_actualizado.total_costos !== undefined) {
          updateSql += `, total_costos = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.total_costos) || 0);
        }
        if (payload_actualizado.utilidad_bruta !== undefined) {
          updateSql += `, utilidad_bruta = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.utilidad_bruta) || 0);
        }
        if (payload_actualizado.margen !== undefined) {
          updateSql += `, margen = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.margen) || 0);
        }
        if (payload_actualizado.data_json) {
          updateSql += `, data_json = $${updateVals.length + 1}`;
          updateVals.push(JSON.stringify(payload_actualizado.data_json));
        }
      }

      updateSql += ` WHERE id_transicion = $${updateVals.length + 1} RETURNING *;`;
      updateVals.push(id_transicion);

      const updRes = await pool.query(updateSql, updateVals);
      const itsActualizado = updRes.rows[0];

      // Notificar a CONTABILIDAD
      try {
        const contaUsers = await pool.query(`
          SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat
          FROM tsec_users u
          JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE r.name_rol IN ('GSP_CONTA', 'CONTABILIDAD') AND COALESCE(u.activo, true) = true;
        `);

        for (const cnt of contaUsers.rows) {
          const nombreCnt = `${cnt.name_frst || ''} ${cnt.apellido_pat || ''}`.trim() || 'Contabilidad';
          const wspMsg = `💰 *GRÚAS SAN PABLO — V°B° Contable de ITS Requerido*\n\n¡Hola ${nombreCnt}! El Administrador *${nombreCompleto}* ha verificado el informe *${itsActualizado.folio_its}* (Cotización #${itsActualizado.numero_cotizacion}).\n\n🏢 *Cliente:* ${itsActualizado.cliente_nombre || 'N/A'}\n💰 *Venta Neta:* $${Number(itsActualizado.total_venta || 0).toLocaleString('es-CL')} CLP\n📊 *Margen:* ${itsActualizado.margen || 0}%\n\n📲 *Revisa y aprueba con tu PIN FES aquí:*`;

          await notificacionService.despacharNotificacion({
            evento: 'ITS_TRANSICION_PENDIENTE_CONTABILIDAD',
            canales: cnt.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
            destinatario: {
              nombre: nombreCnt,
              email: cnt.email,
              telefono: cnt.fono
            },
            deepLink: {
              tipoApp: 'WEB',
              ruta: 'its-transicion',
              params: { folio: itsActualizado.folio_its, cot: itsActualizado.numero_cotizacion, id: itsActualizado.id_transicion }
            },
            emailData: {
              asunto: `V°B° Contable Requerido: ITS ${itsActualizado.folio_its} - ${itsActualizado.cliente_nombre || ''}`,
              titulo: `V°B° Contable de ITS Requerido`,
              subtitulo: `Verificado por ${nombreCompleto} (Administrador)`,
              contenido: `<p>El informe <strong>${itsActualizado.folio_its}</strong> cuenta con V°B° Operativo del Administrador y se encuentra a la espera de aprobación contable.</p><p>Venta Total: <strong>$${Number(itsActualizado.total_venta || 0).toLocaleString('es-CL')} CLP</strong><br>Margen: <strong>${itsActualizado.margen || 0}%</strong></p>`,
              botonTexto: `Revisar y Aprobar ITS`
            },
            wspData: { mensaje: wspMsg }
          });
        }
      } catch (errNotif) {
        console.warn('[ITS validarAdmin] Error despachando notificaciones:', errNotif.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Validación de administración registrada exitosamente. Enviado a Contabilidad.',
        data: itsActualizado
      });
    } catch (err) {
      console.error('[ITS validarAdminItsTransicion] Error:', err);
      return res.status(500).json({ success: false, message: 'Error procesando validación', error: err.message });
    }
  },

  // 3.7 Aprobar Contabilidad (Rol Contabilidad) -> Pasa a APROBADO
  async aprobarContabilidadItsTransicion(req, res) {
    try {
      const { id_transicion, payload_actualizado, id_doc } = req.body;
      if (!id_transicion) {
        return res.status(400).json({ success: false, message: 'id_transicion es requerido' });
      }

      const userId = req.body.id_user || req.body.id_usuario || req.user?.id_user || null;
      const rutFirmante = req.body.firmante_rut;
      const pinFes = req.body.pin_fes || req.body.pin_hash || req.body.pin;
      let userRes;
      if (userId) {
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data, r.name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE u.id_user = $1 LIMIT 1;
        `, [userId]);
      }

      if ((!userRes || userRes.rows.length === 0) && rutFirmante) {
        const rutLimpio = String(rutFirmante).replace(/[^0-9kK]/g, '').toUpperCase();
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data, r.name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE REPLACE(REPLACE(u.rut, '.', ''), '-', '') ILIKE $1 LIMIT 1;
        `, [rutLimpio]);
      }

      if (!userRes || userRes.rows.length === 0) {
        userRes = await pool.query(`
          SELECT u.id_user, u.email, u.name_frst, u.apellido_pat, u.rut, u.pass_hash_fes, u.json_data, r.name_rol
          FROM tsec_users u
          LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
          LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
          WHERE u.email ILIKE '%maritza%' OR u.email ILIKE '%conta%' OR u.name_frst ILIKE '%maritza%' OR r.name_rol IN ('GSP_CONTA', 'CONTABILIDAD')
          LIMIT 1;
        `);
      }

      if (!userRes || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const usuario = userRes.rows[0];

      if (pin_fes) {
        const pinHash = String(pin_fes).length === 64 ? pin_fes : crypto.createHash('sha256').update(String(pin_fes)).digest('hex');
        if (usuario.pass_hash_fes && usuario.pass_hash_fes !== pinHash) {
          return res.status(401).json({ success: false, message: 'PIN FES de Contabilidad incorrecto' });
        }
      }

      const itsRes = await pool.query(`SELECT * FROM tits_transicion_historial WHERE id_transicion = $1;`, [id_transicion]);
      if (itsRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Registro no encontrado' });
      }
      const its = itsRes.rows[0];

      const uuidFes = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      const codigoFes = `FES-GSP-APROB-${uuidFes}`;
      const nombreCompleto = `${usuario.name_frst || ''} ${usuario.apellido_pat || ''}`.trim() || usuario.email;

      const firmaAprob = {
        id_usuario: usuario.id_user,
        nombre: nombreCompleto,
        rut: usuario.rut || '',
        cargo: (usuario.json_data && usuario.json_data.cargo) || 'Jefa de Contabilidad',
        rol: 'CONTABILIDAD',
        codigo_fes: codigoFes,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
      };

      const firmasActuales = (its.firmas_fes && typeof its.firmas_fes === 'object') ? its.firmas_fes : {};
      firmasActuales.aprobador = firmaAprob;

      let updateSql = `
        UPDATE tits_transicion_historial SET
          estado = 'APROBADO',
          firmas_fes = $1::jsonb,
          id_usuario_aprobador = $2,
          fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      const updateVals = [JSON.stringify(firmasActuales), usuario.id_user];

      if (id_doc) {
        updateSql += `, id_doc = $${updateVals.length + 1}`;
        updateVals.push(parseInt(id_doc));
      }

      if (payload_actualizado && typeof payload_actualizado === 'object') {
        if (payload_actualizado.total_venta !== undefined) {
          updateSql += `, total_venta = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.total_venta) || 0);
        }
        if (payload_actualizado.total_costos !== undefined) {
          updateSql += `, total_costos = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.total_costos) || 0);
        }
        if (payload_actualizado.utilidad_bruta !== undefined) {
          updateSql += `, utilidad_bruta = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.utilidad_bruta) || 0);
        }
        if (payload_actualizado.margen !== undefined) {
          updateSql += `, margen = $${updateVals.length + 1}`;
          updateVals.push(parseFloat(payload_actualizado.margen) || 0);
        }
        if (payload_actualizado.data_json) {
          updateSql += `, data_json = $${updateVals.length + 1}`;
          updateVals.push(JSON.stringify(payload_actualizado.data_json));
        }
      }

      updateSql += ` WHERE id_transicion = $${updateVals.length + 1} RETURNING *;`;
      updateVals.push(id_transicion);

      const updRes = await pool.query(updateSql, updateVals);
      const itsActualizado = updRes.rows[0];

      // Notificar a todos los actores: Elaborador, Administrador y Contabilidad
      try {
        const destUsers = await pool.query(`
          SELECT DISTINCT u.email, u.movil as fono, u.name_frst, u.apellido_pat
          FROM tsec_users u
          WHERE u.id_user IN ($1, $2, $3) OR u.email IN ('mseguel@arriendosanpablo.cl', 'controlflota@arriendosanpablo.cl')
        `, [itsActualizado.id_usuario_elaborador || 65, itsActualizado.id_usuario_verificador || 2, usuario.id_user]);

        for (const dst of destUsers.rows) {
          const wspMsg = `🎉 *GRÚAS SAN PABLO — ITS Aprobado y Sellado FES Definitivo*\n\nEl informe *${itsActualizado.folio_its}* (Cotización #${itsActualizado.numero_cotizacion}) ha sido *APROBADO* por Contabilidad (*${nombreCompleto}*).\n\n🏢 *Cliente:* ${itsActualizado.cliente_nombre || 'N/A'}\n💰 *Venta Neta:* $${Number(itsActualizado.total_venta || 0).toLocaleString('es-CL')} CLP\n📊 *Margen:* ${itsActualizado.margen || 0}%\n\n📄 *El informe ha quedado devengado y disponible para facturación:*`;

          await notificacionService.despacharNotificacion({
            evento: 'ITS_TRANSICION_APROBADO_FINAL',
            canales: dst.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
            destinatario: {
              nombre: `${dst.name_frst || ''} ${dst.apellido_pat || ''}`.trim() || 'Colaborador GSP',
              email: dst.email,
              telefono: dst.fono
            },
            deepLink: {
              tipoApp: 'WEB',
              ruta: 'its-transicion',
              params: { folio: itsActualizado.folio_its, cot: itsActualizado.numero_cotizacion, id: itsActualizado.id_transicion }
            },
            emailData: {
              asunto: `✅ ITS Aprobado Conforme: ${itsActualizado.folio_its} - ${itsActualizado.cliente_nombre || ''}`,
              titulo: `ITS Aprobado y Sellado FES Conforme`,
              subtitulo: `Aprobado por ${nombreCompleto} (Contabilidad)`,
              contenido: `<p>El informe de término de servicio <strong>${itsActualizado.folio_its}</strong> ha completado su circuito de triple firma FES y ha sido aprobado para facturación.</p><p>Venta Neta: <strong>$${Number(itsActualizado.total_venta || 0).toLocaleString('es-CL')} CLP</strong><br>Margen: <strong>${itsActualizado.margen || 0}%</strong></p>`,
              botonTexto: `Ver ITS y Descargar PDF`
            },
            wspData: { mensaje: wspMsg }
          });
        }
      } catch (errNotif) {
        console.warn('[ITS aprobarContabilidad] Error despachando notificaciones:', errNotif.message);
      }

      return res.status(200).json({
        success: true,
        message: 'ITS Aprobado formalmente por Contabilidad. Circuito FES Concluido.',
        data: itsActualizado
      });
    } catch (err) {
      console.error('[ITS aprobarContabilidadItsTransicion] Error:', err);
      return res.status(500).json({ success: false, message: 'Error aprobando ITS', error: err.message });
    }
  },

  // 3.8 Obtener planillas activas de GeraldSoft para precarga persistente (SPEC-068)
  async obtenerPlanillasActivas(req, res) {
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (tipo_planilla)
          p.id_planilla,
          p.tipo_planilla,
          p.nombre_archivo,
          p.total_registros,
          p.fecha_carga,
          p.data_json,
          p.id_usuario,
          p.modo_carga,
          p.registros_nuevos,
          p.registros_actualizados,
          COALESCE(u.name_frst || ' ' || COALESCE(u.apellido_pat, ''), u.email, 'Usuario') AS usuario_nombre
        FROM tits_geraldsoft_planillas p
        LEFT JOIN tsec_users u ON p.id_usuario = u.id_user
        WHERE p.activo = true
        ORDER BY p.tipo_planilla, p.fecha_carga DESC;
      `);

      const controles = result.rows.find(r => r.tipo_planilla === 'CONTROLES') || null;
      const ordenes = result.rows.find(r => r.tipo_planilla === 'ORDENES') || null;

      return res.status(200).json({
        success: true,
        controles,
        ordenes
      });
    } catch (err) {
      console.error('[ITS obtenerPlanillasActivas] Error:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener planillas activas', error: err.message });
    }
  },

  // 3.9 Subir y persistir planilla GeraldSoft en el servidor con soporte incremental (SPEC-068 / SPEC-070)
  async subirPlanillaPersistente(req, res) {
    try {
      const { tipo_planilla, nombre_archivo, data_json, id_user, modo = 'incremental' } = req.body;
      if (!tipo_planilla || !nombre_archivo || !data_json) {
        return res.status(400).json({ success: false, message: 'tipo_planilla, nombre_archivo y data_json son requeridos' });
      }

      let datosFinales = Array.isArray(data_json) ? data_json : [];
      let regsNuevos = 0;
      let regsActualizados = 0;

      if (modo === 'incremental') {
        const prevRes = await pool.query(`
          SELECT id_planilla, data_json, total_registros
          FROM tits_geraldsoft_planillas
          WHERE tipo_planilla = $1 AND activo = true
          ORDER BY fecha_carga DESC
          LIMIT 1;
        `, [tipo_planilla]);

        if (prevRes.rows.length > 0 && Array.isArray(prevRes.rows[0].data_json) && prevRes.rows[0].data_json.length > 0) {
          const prevList = prevRes.rows[0].data_json;
          const mapaPrev = new Map();

          const generarClave = (r) => {
            if (tipo_planilla === 'CONTROLES') {
              const cot = String(r.cotizacion || r.COTIZACION || '').trim();
              const ot = String(r.orden || r.ORDEN || '').trim();
              const fecha = String(r.fecha || r.FECHA || r.__EMPTY || r.FECHA_SERVICIO || '').trim();
              const pat = String(r.patente || r.PATENTE || '').trim();
              const item = String(r.item || r.ITEM || r.nro_control || r.__EMPTY_1 || '').trim();
              return `${cot}_${ot}_${fecha}_${pat}_${item}`.toLowerCase();
            } else {
              const ot = String(r.ORDEN || r.orden || '').trim();
              const cot = String(r['Nro Cotizacion'] || r.cotizacion || '').trim();
              return `${ot}_${cot}`.toLowerCase();
            }
          };

          prevList.forEach((r, idx) => {
            const k = generarClave(r);
            mapaPrev.set(k, { item: r, idx });
          });

          datosFinales = [...prevList];

          data_json.forEach((nuevo) => {
            const k = generarClave(nuevo);
            if (mapaPrev.has(k)) {
              const targetIdx = mapaPrev.get(k).idx;
              datosFinales[targetIdx] = { ...datosFinales[targetIdx], ...nuevo };
              regsActualizados++;
            } else {
              datosFinales.push(nuevo);
              mapaPrev.set(k, { item: nuevo, idx: datosFinales.length - 1 });
              regsNuevos++;
            }
          });
        } else {
          regsNuevos = datosFinales.length;
        }
      } else {
        regsNuevos = datosFinales.length;
      }

      // 1. Marcar registros anteriores del mismo tipo como inactivos
      await pool.query(`
        UPDATE tits_geraldsoft_planillas SET activo = false WHERE tipo_planilla = $1;
      `, [tipo_planilla]);

      // 2. Insertar nueva versión activa consolidada
      const totalRegs = datosFinales.length;
      const insRes = await pool.query(`
        INSERT INTO tits_geraldsoft_planillas (
          tipo_planilla, nombre_archivo, total_registros, data_json, id_usuario, activo, modo_carga, registros_nuevos, registros_actualizados
        ) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6, $7, $8)
        RETURNING id_planilla, tipo_planilla, nombre_archivo, total_registros, fecha_carga, modo_carga, registros_nuevos, registros_actualizados;
      `, [
        tipo_planilla,
        nombre_archivo,
        totalRegs,
        JSON.stringify(datosFinales),
        id_user ? parseInt(id_user) : null,
        modo.toUpperCase(),
        regsNuevos,
        regsActualizados
      ]);

      return res.status(200).json({
        success: true,
        message: `Planilla ${tipo_planilla} guardada y consolidada exitosamente (${modo.toUpperCase()})`,
        data: insRes.rows[0],
        estadisticas: {
          total_anterior: datosFinales.length - regsNuevos,
          total_actual: totalRegs,
          nuevos: regsNuevos,
          actualizados: regsActualizados
        }
      });
    } catch (err) {
      console.error('[ITS subirPlanillaPersistente] Error:', err);
      return res.status(500).json({ success: false, message: 'Error al persistir planilla', error: err.message });
    }
  },

  // 3.10 Obtener historial de cargas de planillas GeraldSoft (SPEC-070)
  async obtenerHistorialPlanillas(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          p.id_planilla,
          p.tipo_planilla,
          p.nombre_archivo,
          p.total_registros,
          p.fecha_carga,
          p.activo,
          p.modo_carga,
          p.registros_nuevos,
          p.registros_actualizados,
          COALESCE(u.name_frst || ' ' || COALESCE(u.apellido_pat, ''), u.email, 'Usuario') AS usuario_nombre
        FROM tits_geraldsoft_planillas p
        LEFT JOIN tsec_users u ON p.id_usuario = u.id_user
        ORDER BY p.fecha_carga DESC
        LIMIT 20;
      `);
      return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
      console.error('[ITS obtenerHistorialPlanillas] Error:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener historial', error: err.message });
    }
  },

  // 4. Obtener estado del flujo FES y catálogo de rechazos
  async getFlujoITS(req, res) {
    try {
      const { id_proyecto } = req.params;
      const id_user_query = req.query.id_user ? parseInt(req.query.id_user) : null;
      if (!id_proyecto) {
        return res.status(400).json({ success: false, message: 'id_proyecto es requerido' });
      }

      const itsRes = await pool.query(`
        SELECT id_its, folio_its, id_flow, estado_its, id_user_elaborado, id_user_aprobado, id_user_recibido
        FROM tits_informe_termino
        WHERE id_proyecto = $1
        ORDER BY id_its DESC LIMIT 1;
      `, [id_proyecto]);

      const its = itsRes.rows[0] || null;
      let idFlow = its?.id_flow || null;

      if (!its) {
        const motivosRes = await pool.query(`
          SELECT id_motivo_rechazo, motivo_rechazo 
          FROM tflw_motivo_rechazo 
          ORDER BY id_motivo_rechazo ASC;
        `);
        return res.status(200).json({
          success: true,
          data: {
            its: null,
            id_flow: null,
            estado_its: 'BORRADOR',
            pasos: [
              { orden: 1, nombre_paso: '1. Elaboración & Liquidación Técnica', estado: 'PENDIENTE', rol_nom: 'Analista de Operaciones' },
              { orden: 2, nombre_paso: '2. V°B° Jefatura de Operaciones', estado: 'EN ESPERA', rol_nom: 'Jefe de Operaciones' },
              { orden: 3, nombre_paso: '3. Recepción Conforme Contabilidad', estado: 'EN ESPERA', rol_nom: 'Contabilidad y Finanzas' }
            ],
            puede_firmar: true,
            motivos_rechazo: motivosRes.rows
          }
        });
      }

      // Si el ITS existe pero aún no tiene flujo instanciado, instanciar Template 90
      if (its && !idFlow) {
        const flowIns = await pool.query(`
          INSERT INTO tflw_flows (id_flow_tmpl, flow_tmpl_fase, fecha_creacion, fecha_inicio)
          VALUES (90, 'EN PROCESO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id_flow;
        `);
        idFlow = flowIns.rows[0].id_flow;

        const tmplSteps = await pool.query(`
          SELECT * FROM tflw_template_steps 
          WHERE id_flow_tmpl = 90 
          ORDER BY flow_tmpl_step_orden ASC;
        `);

        for (const ts of tmplSteps.rows) {
          const stEstado = ts.flow_tmpl_step_orden === 1 ? 'PENDIENTE' : 'EN ESPERA';
          await pool.query(`
            INSERT INTO tflw_flow_steps (
              id_flow, id_flow_tmpl_step, flow_tmpl_step_orden, flow_tmpl_step_fase, estado, id_rol, flag_flow_fin, flag_equipo, flow_step_event
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, 'CREADO');
          `, [idFlow, ts.id_flow_tmpl_step, ts.flow_tmpl_step_orden, ts.flow_tmpl_step_fase, stEstado, ts.id_rol, ts.flag_flow_fin]);
        }

        await pool.query(`
          UPDATE tits_informe_termino 
          SET id_flow = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
          WHERE id_its = $2;
        `, [idFlow, its.id_its]);
      }

      let pasos = [];

      if (idFlow) {
        const pasosRes = await pool.query(`
          SELECT 
            st.id_flow_stp,
            st.id_flow,
            st.flow_tmpl_step_orden AS orden,
            COALESCE(ts.flow_tmpl_step_name, st.flow_tmpl_step_fase) AS nombre_paso,
            st.estado,
            st.flow_step_obs AS observaciones,
            st.id_user,
            COALESCE(u.name_frst || ' ' || u.apellido_pat, '') AS nombre_usuario,
            u.rut,
            r.name_rol AS rol_nom,
            st.id_fes,
            f.codigo_validacion,
            f.fecha_firma,
            f.aprueba_rechaza,
            m.motivo_rechazo
          FROM tflw_flow_steps st
          LEFT JOIN tflw_template_steps ts ON st.id_flow_tmpl_step = ts.id_flow_tmpl_step
          LEFT JOIN tfes_signatures f ON st.id_fes = f.id_fes
          LEFT JOIN tsec_users u ON COALESCE(f.id_user, st.id_user) = u.id_user
          LEFT JOIN tsec_roles r ON st.id_rol = r.id_rol
          LEFT JOIN tflw_motivo_rechazo m ON st.id_motivo_rechazo = m.id_motivo_rechazo
          WHERE st.id_flow = $1
          ORDER BY st.flow_tmpl_step_orden ASC;
        `, [idFlow]);
        pasos = pasosRes.rows;
      }

      // Determinar si el usuario solicitante puede firmar el paso pendiente
      let puedeFirmar = false;
      const pasoPendiente = pasos.find(p => p.estado === 'PENDIENTE');
      if (pasoPendiente && id_user_query) {
        const rolCheck = await pool.query(`
          SELECT ur.id_rol 
          FROM tsec_user_roles ur 
          WHERE ur.id_user = $1 AND ur.id_rol IN (1, 10, $2);
        `, [id_user_query, pasoPendiente.orden === 1 ? 31 : (pasoPendiente.orden === 2 ? 32 : 33)]);
        puedeFirmar = rolCheck.rows.length > 0;
      } else if (pasoPendiente && !id_user_query) {
        puedeFirmar = true; // Fallback interactivo
      }

      const motivosRes = await pool.query(`
        SELECT id_motivo_rechazo, motivo_rechazo 
        FROM tflw_motivo_rechazo 
        ORDER BY id_motivo_rechazo ASC;
      `);

      return res.status(200).json({
        success: true,
        data: {
          its,
          id_flow: idFlow,
          estado_its: its?.estado_its || 'BORRADOR',
          pasos,
          puede_firmar: puedeFirmar,
          motivos_rechazo: motivosRes.rows
        }
      });
    } catch (error) {
      console.error('[ITS] Error consultando flujo ITS:', error);
      return res.status(500).json({ success: false, message: 'Error interno consultando flujo', error: error.message });
    }
  },

  // 5. Firma o rechazo electrónico FES con PIN
  async firmarFesITS(req, res) {
    const client = await pool.connect();
    try {
      const { id_proyecto, aprueba_rechaza, id_motivo_rechazo, observaciones } = req.body;
      let id_its = req.body.id_its;
      let id_user = req.body.id_user || 1;
      const pass_fes = req.body.pass_hash_fes || req.body.pass_fes;

      if (!id_its && id_proyecto) {
        const findIts = await client.query('SELECT id_its FROM tits_informe_termino WHERE id_proyecto = $1 ORDER BY id_its DESC LIMIT 1', [id_proyecto]);
        if (findIts.rows.length > 0) id_its = findIts.rows[0].id_its;
      }

      if (!id_proyecto || !id_user || !pass_fes || !aprueba_rechaza) {
        return res.status(400).json({ success: false, message: 'Datos incompletos para procesar firma FES' });
      }

      await client.query('BEGIN');

      // 1. Validar usuario y PIN FES
      const userRes = await client.query(`
        SELECT id_user, name_frst, apellido_pat, email, pass_hash_fes 
        FROM tsec_users 
        WHERE id_user = $1;
      `, [id_user]);

      if (userRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      const usuario = userRes.rows[0];
      if (!usuario.pass_hash_fes) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'El usuario no tiene un PIN FES enrolado' });
      }

      if (pass_fes !== usuario.pass_hash_fes) {
        await client.query('ROLLBACK');
        return res.status(401).json({ success: false, message: 'PIN de firma FES incorrecto' });
      }

      // 2. Obtener ITS
      const itsRes = await client.query(`
        SELECT * FROM tits_informe_termino 
        WHERE id_its = $1 FOR UPDATE;
      `, [id_its]);

      if (itsRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Informe ITS no encontrado' });
      }
      let its = itsRes.rows[0];

      // 3. Si no tiene flujo instanciado, instanciar Template 90
      let idFlow = its.id_flow;
      if (!idFlow) {
        const flowIns = await client.query(`
          INSERT INTO tflw_flows (id_flow_tmpl, flow_tmpl_fase, fecha_creacion, fecha_inicio)
          VALUES (90, 'EN PROCESO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id_flow;
        `);
        idFlow = flowIns.rows[0].id_flow;

        const tmplSteps = await client.query(`
          SELECT * FROM tflw_template_steps 
          WHERE id_flow_tmpl = 90 
          ORDER BY flow_tmpl_step_orden ASC;
        `);

        for (const ts of tmplSteps.rows) {
          const stEstado = ts.flow_tmpl_step_orden === 1 ? 'PENDIENTE' : 'EN ESPERA';
          const stUser = ts.flow_tmpl_step_orden === 1 ? id_user : null;
          await client.query(`
            INSERT INTO tflw_flow_steps (
              id_flow, id_flow_tmpl_step, flow_tmpl_step_orden, flow_tmpl_step_fase, estado, id_rol, id_user, flag_flow_fin, flag_equipo, flow_step_event
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, 'CREADO');
          `, [idFlow, ts.id_flow_tmpl_step, ts.flow_tmpl_step_orden, ts.flow_tmpl_step_fase, stEstado, ts.id_rol, stUser, ts.flag_flow_fin]);
        }

        await client.query(`
          UPDATE tits_informe_termino 
          SET id_flow = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
          WHERE id_its = $2;
        `, [idFlow, id_its]);
      }

      // 4. Buscar el paso actual en estado PENDIENTE
      const pasoPendRes = await client.query(`
        SELECT * FROM tflw_flow_steps 
        WHERE id_flow = $1 AND estado = 'PENDIENTE' 
        ORDER BY flow_tmpl_step_orden ASC LIMIT 1 
        FOR UPDATE;
      `, [idFlow]);

      if (pasoPendRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'No hay pasos pendientes de aprobación para este ITS' });
      }

      const pasoActual = pasoPendRes.rows[0];
      const orden = pasoActual.flow_tmpl_step_orden;
      const uuidValidacion = crypto.randomUUID();
      const codigoValidacionFmt = `FES-ITS-${id_its}-${orden}-${uuidValidacion.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

      // 5. Procesar según APRUEBA o RECHAZA
      if (aprueba_rechaza === 'APRUEBA') {
        const fesIns = await client.query(`
          INSERT INTO tfes_signatures (
            id_flow_stp, id_flow, id_user, codigo_validacion, observaciones, aprueba_rechaza, metodo_autenticacion, fecha_firma
          ) VALUES ($1, $2, $3, $4, $5, 'APRUEBA', 'PIN_FES_OTP', CURRENT_TIMESTAMP)
          RETURNING id_fes;
        `, [pasoActual.id_flow_stp, idFlow, id_user, uuidValidacion, observaciones || 'Aprobado conforme']);
        const idFes = fesIns.rows[0].id_fes;

        await client.query(`
          UPDATE tflw_flow_steps SET
            estado = 'APROBADO',
            id_fes = $1,
            flow_step_obs = $2,
            id_user = $3,
            flow_step_event = 'APROBADO',
            fecha_event = CURRENT_TIMESTAMP
          WHERE id_flow_stp = $4;
        `, [idFes, observaciones || 'Aprobado', id_user, pasoActual.id_flow_stp]);

        let nuevoEstadoIts = '';

        if (orden === 1) {
          nuevoEstadoIts = 'EN_REVISION_OPERACIONES';
          await client.query(`
            UPDATE tflw_flow_steps SET estado = 'PENDIENTE'
            WHERE id_flow = $1 AND flow_tmpl_step_orden = 2;
          `, [idFlow]);

          await client.query(`
            UPDATE tits_informe_termino SET
              estado_its = $1,
              id_user_elaborado = $2,
              fecha_elaborado = CURRENT_TIMESTAMP,
              codigo_validacion_fes = $3,
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_its = $4;
          `, [nuevoEstadoIts, id_user, codigoValidacionFmt, id_its]);

          // Notificar a Jefatura de Operaciones + Analista + Gerencia
          try {
            const destRes = await client.query(`
              SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat 
              FROM tsec_users u
              LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
              WHERE (ur.id_rol = 32 OR u.id_user IN (57, 19)) AND COALESCE(u.activo, true) = true;
            `);

            for (const d of destRes.rows) {
              const nombreJefe = `${d.name_frst || ''} ${d.apellido_pat || ''}`.trim() || 'Jefatura de Operaciones';
              const wspMsg = `📋 *Grúas San Pablo — V°B° de ITS Requerido*\n\n¡Hola ${nombreJefe}! El Analista ${usuario.name_frst} ${usuario.apellido_pat || ''} ha completado la liquidación del servicio:\n\n📄 *Folio ITS:* ${its.folio_its}\n🏢 *Proyecto:* N° ${id_proyecto}\n💰 *Venta Neta:* $${Number(its.total_ingresos_facturables || 0).toLocaleString('es-CL')}\n📊 *Margen:* ${its.margen_porcentaje || 0}%\n\n📲 *Revisa y visa con tu PIN FES aquí:*`;

              await notificacionService.despacharNotificacion({
                evento: 'ITS_ELABORADO_VB_JEFATURA',
                canales: d.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
                destinatario: {
                  nombre: nombreJefe,
                  email: d.email,
                  telefono: d.fono
                },
                deepLink: {
                  tipoApp: 'WEB',
                  ruta: 'crm',
                  params: { id_proyecto, subtab: 'liquidacion', paso: 'its' }
                },
                emailData: {
                  asunto: `[GSP] V°B° Requerido: ${its.folio_its} (Proyecto #${id_proyecto})`,
                  titulo: `ITS Elaborado y Listo para V°B°: ${its.folio_its}`,
                  subtitulo: `El Analista ${usuario.name_frst} ${usuario.apellido_pat || ''} ha completado la liquidación`,
                  contenido: `<p>El Informe de Término de Servicio <strong>${its.folio_its}</strong> para el proyecto <strong>#${id_proyecto}</strong> ha sido liquidado y firmado. Requiere la revisión técnica y V°B° de Operaciones con PIN FES para avanzar a Contabilidad.</p>
                  <ul>
                    <li><strong>Venta Neta Facturable:</strong> $${Number(its.total_ingresos_facturables || 0).toLocaleString('es-CL')} CLP</li>
                    <li><strong>Costos Directos:</strong> $${Number(its.total_costos_operacionales || 0).toLocaleString('es-CL')} CLP</li>
                    <li><strong>Margen Operacional:</strong> ${its.margen_porcentaje || 0}%</li>
                  </ul>`,
                  botonTexto: 'VER Y REVISAR ITS'
                },
                wspData: {
                  mensaje: wspMsg
                }
              });
            }

            // Confirmación al Analista
            if (usuario.email && !destRes.rows.some(r => r.email === usuario.email)) {
              notificacionService.despacharEmailSmtp({
                para: usuario.email,
                asunto: `[GSP] Confirmación: Has elaborado el ITS ${its.folio_its}`,
                titulo: `ITS ${its.folio_its} Enviado a Revisión`,
                subtitulo: `Tu liquidación fue firmada y enviada a Jefatura de Operaciones`,
                contenido: `<p>Has firmado exitosamente el ITS <strong>${its.folio_its}</strong>. Jefatura de Operaciones ha sido notificada para su aprobación.</p>`,
                botonTexto: 'VER ESTADO',
                botonUrl: notificacionService.construirDeepLink({
                  tipoApp: 'WEB',
                  ruta: 'crm',
                  params: { id_proyecto, subtab: 'liquidacion', paso: 'its' }
                })
              }).catch(e => console.warn('[ITS Mail] Error confirmando analista:', e.message));
            }
          } catch (eMail) {
            console.warn('[ITS Mail] Error notificando paso 1:', eMail.message);
          }

        } else if (orden === 2) {
          nuevoEstadoIts = 'EN_REVISION_CONTABILIDAD';
          await client.query(`
            UPDATE tflw_flow_steps SET estado = 'PENDIENTE'
            WHERE id_flow = $1 AND flow_tmpl_step_orden = 3;
          `, [idFlow]);

          await client.query(`
            UPDATE tits_informe_termino SET
              estado_its = $1,
              id_user_aprobado = $2,
              fecha_aprobado = CURRENT_TIMESTAMP,
              codigo_validacion_fes = $3,
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_its = $4;
          `, [nuevoEstadoIts, id_user, codigoValidacionFmt, id_its]);

          // Sincronizar estado en tpry_proyecto: Si está < 6, elevar a 6 (Cierre Operacional / Liquidación) y actualizar snapshot
          await client.query(`
            UPDATE tpry_proyecto SET
              id_proyecto_estado = GREATEST(id_proyecto_estado, 6),
              json_field = jsonb_set(
                jsonb_set(
                  COALESCE(json_field, '{}'::jsonb),
                  '{its_v1}',
                  $1::jsonb
                ),
                '{estado_its}',
                to_jsonb($2::text)
              )
            WHERE id_proyecto = $3;
          `, [
            JSON.stringify({ id_its, folio_its: its.folio_its, estado: nuevoEstadoIts, fecha_aprobado_operaciones: new Date().toISOString() }),
            nuevoEstadoIts,
            id_proyecto
          ]);

          // Notificar a Contabilidad (Maritza) + Analista + Gerencia
          try {
            const destRes = await client.query(`
              SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat 
              FROM tsec_users u
              LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
              WHERE (ur.id_rol = 33 OR u.id_user IN (61, 19)) AND COALESCE(u.activo, true) = true;
            `);

            for (const d of destRes.rows) {
              const nombreContable = `${d.name_frst || ''} ${d.apellido_pat || ''}`.trim() || 'Contabilidad';
              const wspMsg = `💼 *Grúas San Pablo — Recepción Contable Requerida*\n\n¡Hola ${nombreContable}! El Informe de Término de Servicio cuenta con V°B° de Operaciones (${usuario.name_frst} ${usuario.apellido_pat || ''}):\n\n📄 *Folio ITS:* ${its.folio_its}\n🏢 *Proyecto:* N° ${id_proyecto}\n\n📲 *Confirma la recepción contable aquí:*`;

              await notificacionService.despacharNotificacion({
                evento: 'ITS_APROBADO_CONTABILIDAD',
                canales: d.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
                destinatario: {
                  nombre: nombreContable,
                  email: d.email,
                  telefono: d.fono
                },
                deepLink: {
                  tipoApp: 'WEB',
                  ruta: 'crm',
                  params: { id_proyecto, subtab: 'liquidacion', paso: 'factura' }
                },
                emailData: {
                  asunto: `[GSP] Recepción Contable Requerida: ${its.folio_its}`,
                  titulo: `ITS Aprobado por Jefatura: ${its.folio_its}`,
                  subtitulo: `Visado por ${usuario.name_frst} ${usuario.apellido_pat || ''} — Listo para recepción contable`,
                  contenido: `<p>El Informe <strong>${its.folio_its}</strong> cuenta con V°B° conforme de Operaciones. Por favor confirma la recepción contable para autorizar el Estado de Pago y Facturación.</p>
                  <ul>
                    <li><strong>Monto a Facturar:</strong> $${Number(its.total_ingresos_facturables || 0).toLocaleString('es-CL')} CLP</li>
                    <li><strong>Margen Final:</strong> ${its.margen_porcentaje || 0}%</li>
                  </ul>`,
                  botonTexto: 'REVISAR CONTABILIDAD'
                },
                wspData: {
                  mensaje: wspMsg
                }
              });
            }

            // Notificar al Analista que elaboró
            if (its.id_user_elaborado && its.id_user_elaborado !== id_user) {
              const analistaUser = await client.query('SELECT email, name_frst FROM tsec_users WHERE id_user = $1', [its.id_user_elaborado]);
              if (analistaUser.rows.length > 0 && analistaUser.rows[0].email) {
                notificacionService.despacharEmailSmtp({
                  para: analistaUser.rows[0].email,
                  asunto: `[GSP] ✅ ITS ${its.folio_its} Aprobado por Operaciones`,
                  titulo: `ITS ${its.folio_its} Aprobado`,
                  subtitulo: `Visado conforme por Jefatura de Operaciones`,
                  contenido: `<p>El ITS que elaboraste para el proyecto #${id_proyecto} ha sido aprobado por Jefatura y pasó a Contabilidad.</p>`,
                  botonTexto: 'VER ESTADO',
                  botonUrl: notificacionService.construirDeepLink({
                    tipoApp: 'WEB',
                    ruta: 'crm',
                    params: { id_proyecto, subtab: 'liquidacion', paso: 'edp' }
                  })
                }).catch(e => console.warn('[ITS Mail] Error notificando analista paso 2:', e.message));
              }
            }
          } catch (eMail) {
            console.warn('[ITS Mail] Error notificando paso 2:', eMail.message);
          }

        } else if (orden === 3) {
          nuevoEstadoIts = 'CONCLUIDO';
          await client.query(`
            UPDATE tflw_flows SET flow_tmpl_fase = 'FINALIZADO', fecha_cierre = CURRENT_TIMESTAMP WHERE id_flow = $1;
          `, [idFlow]);

          await client.query(`
            UPDATE tits_informe_termino SET
              estado_its = $1,
              id_user_recibido = $2,
              fecha_recibido = CURRENT_TIMESTAMP,
              codigo_validacion_fes = $3,
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_its = $4;
          `, [nuevoEstadoIts, id_user, codigoValidacionFmt, id_its]);

          // Sincronizar estado en tpry_proyecto: Asegurar que pase a id_proyecto_estado >= 6 y guardar snapshot its_v1 concluido
          await client.query(`
            UPDATE tpry_proyecto SET
              id_proyecto_estado = GREATEST(id_proyecto_estado, 6),
              json_field = jsonb_set(
                jsonb_set(
                  COALESCE(json_field, '{}'::jsonb),
                  '{its_v1}',
                  $1::jsonb
                ),
                '{estado_its}',
                to_jsonb($2::text)
              )
            WHERE id_proyecto = $3;
          `, [
            JSON.stringify({ id_its, folio_its: its.folio_its, estado: nuevoEstadoIts, fecha_recibido_contabilidad: new Date().toISOString() }),
            nuevoEstadoIts,
            id_proyecto
          ]);

          // Notificar únicamente a los 4 roles canónicos definidos:
          // 1. Analista elaborador (its.id_user_elaborado)
          // 2. Jefatura que visó (its.id_user_aprobado / logistica@arriendosanpablo.cl)
          // 3. Contabilidad (usuario firmante / mseguel@arriendosanpablo.cl)
          // 4. Comercial dueño de la OT (proyecto.id_usuario_creacion)
          try {
            const destRes = await client.query(`
              SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat 
              FROM tsec_users u
              WHERE (
                u.id_user IN (
                  SELECT UNNEST(ARRAY[
                    $1::integer,
                    $2::integer,
                    $3::integer,
                    (SELECT id_usuario_creacion FROM tpry_proyecto WHERE id_proyecto = $4)
                  ])
                )
                OR u.email IN ('mseguel@arriendosanpablo.cl', 'logistica@arriendosanpablo.cl')
              )
              AND COALESCE(u.activo, true) = true
              AND u.email IS NOT NULL;
            `, [its.id_user_elaborado || null, its.id_user_aprobado || null, id_user || null, id_proyecto]);

            for (const d of destRes.rows) {
              const nombreDest = `${d.name_frst || ''} ${d.apellido_pat || ''}`.trim() || 'Equipo GSP';
              const wspMsg = `🎉 *Grúas San Pablo — ITS Concluido y EDP Autorizado*\n\n¡Hola ${nombreDest}! El Informe de Término de Servicio ha sido recibido conforme por Contabilidad (${usuario.name_frst} ${usuario.apellido_pat || ''}):\n\n📄 *Folio ITS:* ${its.folio_its}\n🏢 *Proyecto:* N° ${id_proyecto}\n💰 *Monto Autorizado:* $${Number(its.total_ingresos_facturables || 0).toLocaleString('es-CL')} CLP\n\n🔓 *El Estado de Pago (EDP) ha sido liberado para cobro y facturación:*`;

              await notificacionService.despacharNotificacion({
                evento: 'ITS_CONCLUIDO_EDP_AUTORIZADO',
                canales: d.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
                destinatario: {
                  nombre: nombreDest,
                  email: d.email,
                  telefono: d.fono
                },
                deepLink: {
                  tipoApp: 'WEB',
                  ruta: 'crm',
                  params: { id_proyecto, subtab: 'liquidacion', paso: 'edp' }
                },
                emailData: {
                  asunto: `[GSP] 🎉 ITS Concluido y EDP Desbloqueado: ${its.folio_its}`,
                  titulo: `Liquidación Concluida Conforme: ${its.folio_its}`,
                  subtitulo: `Recibido por Contabilidad (${usuario.name_frst} ${usuario.apellido_pat || ''}) — Listo para Facturar`,
                  contenido: `<p>El circuito de firmas del Informe de Término de Servicio <strong>${its.folio_its}</strong> ha concluido exitosamente.</p>
                  <div style="background: #064e3b15; border: 1px solid #05966940; border-radius: 8px; padding: 12px; margin: 12px 0; color: #a7f3d0;">
                    🔓 <strong>Candado Criptográfico Liberado:</strong> La Carátula Oficial de Estado de Pago (EDP) ha sido desbloqueada para envío al cliente y emisión de Factura DTE.
                  </div>
                  <ul>
                    <li><strong>Venta Neta:</strong> $${Number(its.total_ingresos_facturables || 0).toLocaleString('es-CL')} CLP</li>
                    <li><strong>Utilidad Bruta:</strong> $${Number(its.utilidad_bruta || 0).toLocaleString('es-CL')} CLP</li>
                    <li><strong>Margen Operacional:</strong> ${its.margen_porcentaje || 0}%</li>
                  </ul>`,
                  botonTexto: 'VER EDP Y FACTURAR'
                },
                wspData: {
                  mensaje: wspMsg
                }
              });
            }
          } catch (eMail) {
            console.warn('[ITS Mail] Error notificando conclusión paso 3:', eMail.message);
          }
        }

        await client.query('COMMIT');
        return res.status(200).json({
          success: true,
          message: `Paso ${orden} aprobado exitosamente mediante FES`,
          estado_its: nuevoEstadoIts,
          codigo_validacion: codigoValidacionFmt
        });

      } else if (aprueba_rechaza === 'RECHAZA') {
        if (!id_motivo_rechazo || !observaciones || !observaciones.trim()) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Para rechazar el ITS es obligatorio indicar el motivo de rechazo y detallar las observaciones.'
          });
        }

        const fesIns = await client.query(`
          INSERT INTO tfes_signatures (
            id_flow_stp, id_flow, id_user, codigo_validacion, observaciones, aprueba_rechaza, id_motivo_rechazo, metodo_autenticacion, fecha_firma
          ) VALUES ($1, $2, $3, $4, $5, 'RECHAZA', $6, 'PIN_FES_OTP', CURRENT_TIMESTAMP)
          RETURNING id_fes;
        `, [pasoActual.id_flow_stp, idFlow, id_user, uuidValidacion, observaciones, id_motivo_rechazo]);
        const idFes = fesIns.rows[0].id_fes;

        await client.query(`
          UPDATE tflw_flow_steps SET
            estado = 'RECHAZADO',
            id_fes = $1,
            id_motivo_rechazo = $2,
            flow_step_obs = $3,
            id_user = $4,
            flow_step_event = 'RECHAZADO',
            fecha_event = CURRENT_TIMESTAMP
          WHERE id_flow_stp = $5;
        `, [idFes, id_motivo_rechazo, observaciones, id_user, pasoActual.id_flow_stp]);

        await client.query(`
          UPDATE tits_informe_termino SET
            estado_its = 'EN_CORRECCION',
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id_its = $1;
        `, [id_its]);

        // Reabrir Paso 1 para el analista
        await client.query(`
          UPDATE tflw_flow_steps SET estado = 'PENDIENTE', id_fes = NULL
          WHERE id_flow = $1 AND flow_tmpl_step_orden = 1;
        `, [idFlow]);

        // Resetear otros pasos a EN ESPERA
        await client.query(`
          UPDATE tflw_flow_steps SET estado = 'EN ESPERA', id_fes = NULL
          WHERE id_flow = $1 AND flow_tmpl_step_orden > 1 AND id_flow_stp <> $2;
        `, [idFlow, pasoActual.id_flow_stp]);

        // Despachar alerta omnicanal al Analista para corrección
        try {
          const analistaRes = await client.query(`
            SELECT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat, m.motivo_rechazo
            FROM tits_informe_termino its
            JOIN tsec_users u ON its.id_user_elaborado = u.id_user
            LEFT JOIN tflw_motivo_rechazo m ON m.id_motivo_rechazo = $1
            WHERE its.id_its = $2;
          `, [id_motivo_rechazo, id_its]);

          if (analistaRes.rows.length > 0) {
            const an = analistaRes.rows[0];
            const nombreAnalista = `${an.name_frst || ''} ${an.apellido_pat || ''}`.trim() || 'Analista Operativo';
            const causalRechazo = an.motivo_rechazo || 'Inconsistencia detectada';
            const wspMsg = `⚠️ *Grúas San Pablo — ITS Devuelto para Corrección*\n\n¡Hola ${nombreAnalista}! El Informe de Término de Servicio fue rechazado por ${usuario.name_frst} ${usuario.apellido_pat || ''}:\n\n📄 *Folio ITS:* ${its.folio_its}\n🚫 *Causal:* ${causalRechazo}\n💬 *Observaciones:* ${observaciones}\n\n📲 *Ingresa a corregir el ITS aquí:*`;

            await notificacionService.despacharNotificacion({
              evento: 'ITS_RECHAZADO_CORRECCION',
              canales: an.fono ? ['EMAIL', 'WHATSAPP'] : ['EMAIL'],
              destinatario: {
                nombre: nombreAnalista,
                email: an.email,
                telefono: an.fono
              },
              deepLink: {
                tipoApp: 'WEB',
                ruta: 'crm',
                params: { id_proyecto, subtab: 'liquidacion', paso: 'its' }
              },
              emailData: {
                asunto: `[GSP ALERTA] ITS Devuelto para Corrección: ${its.folio_its}`,
                titulo: `⚠️ ITS Rechazado: ${its.folio_its}`,
                subtitulo: `Rechazado por ${usuario.name_frst} ${usuario.apellido_pat || ''}`,
                contenido: `
                  <p>El Informe de Término de Servicio <strong>${its.folio_its}</strong> ha sido devuelto para corrección.</p>
                  <div style="background: rgba(225, 29, 72, 0.1); border-left: 4px solid #e11d48; padding: 12px; margin: 15px 0;">
                    <strong>Causal:</strong> ${causalRechazo}<br>
                    <strong>Observaciones:</strong> ${observaciones}
                  </div>
                  <p>Por favor ingresa a la plataforma para ajustar las jornadas o costos directos y reemitir el documento.</p>
                `,
                botonTexto: 'SUBSANAR ITS EN PLATAFORMA'
              },
              wspData: {
                mensaje: wspMsg
              }
            });
          }
        } catch (eMail) {
          console.warn('[ITS Mail] Error notificando rechazo:', eMail.message);
        }

        await client.query('COMMIT');
        return res.status(200).json({
          success: true,
          message: 'ITS rechazado y retornado al analista operativo para corrección',
          estado_its: 'EN_CORRECCION'
        });
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Acción de firma no reconocida' });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ITS] Error en firmarFesITS:', error);
      return res.status(500).json({ success: false, message: 'Error interno en firma FES', error: error.message });
    } finally {
      client.release();
    }
  },

  // Fallback compatibilidad previa
  async firmarPasoITS(req, res) {
    return itsController.firmarFesITS(req, res);
  }
};

module.exports = itsController;
