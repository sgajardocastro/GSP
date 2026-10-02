const pool = require('../config/postgresPool');
const itsPdfService = require('../services/itsPdfService');
const MessageModel = require('../models/messageModel');
const notificacionService = require('../services/notificacionService');
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
        FROM sch_leangsp.tpry_proyecto p
        LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
        LEFT JOIN sch_leangsp.tpar_empresas emp ON p.id_empresa = emp.id_empresa
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

      // Consultar todos los reports diarios de terreno desde sch_leangsp.tedp_reporte_avance con respaldos
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
          COALESCE(e.patente, 'S/P') AS patente,
          COALESCE(e.modelo, '') AS equipo_modelo,
          COALESCE(e.id_equipo, ra.id_equipo) AS id_equipo,
          TO_CHAR(ra.fecha_inicio_servicio, 'HH24:MI') AS hora_inicio,
          TO_CHAR(ra.fecha_termino_servicio, 'HH24:MI') AS hora_termino
        FROM sch_leangsp.tedp_reporte_avance ra
        LEFT JOIN sch_leangsp.tequ_equipo e ON ra.id_equipo = e.id_equipo
        WHERE ra.id_proyecto = $1
        ORDER BY ra.fecha_reporte ASC, ra.id_reporte_avance ASC;
      `, [id_proyecto]);

      // 1.3 Buscar si ya existe cabecera de ITS relacional
      const itsRes = await pool.query(`
        SELECT * FROM sch_leangsp.tits_informe_termino
        WHERE id_proyecto = $1
        ORDER BY id_its DESC
        LIMIT 1;
      `, [id_proyecto]);

      let its = null;
      let jornadas = [];
      let costos = {
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
            COALESCE(e.modelo, '') AS equipo_modelo
          FROM sch_leangsp.tits_jornada_detalle jd
          LEFT JOIN sch_leangsp.tedp_reporte_avance ra ON jd.id_reporte_avance = ra.id_reporte_avance
          LEFT JOIN sch_leangsp.tequ_equipo e ON jd.id_equipo = e.id_equipo
          WHERE jd.id_its = $1
          ORDER BY jd.orden ASC, jd.fecha ASC, jd.id_jornada ASC;
        `, [its.id_its, its.valor_hora_pactado || valorHoraPactado]);
        jornadas = jorRes.rows;

        // Cargar costos relacionales
        const cosRes = await pool.query(`
          SELECT * FROM sch_leangsp.tits_costo_operacional
          WHERE id_its = $1
          ORDER BY fecha ASC, id_costo_item ASC;
        `, [its.id_its]);

        cosRes.rows.forEach(c => {
          const catKey = c.categoria.toLowerCase();
          if (catKey === 'peajes') costos.peajes.push(c);
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
            } else {
              // Incorporar reporte que ingresó a terreno posteriormente
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
                numero_report: r.token_report ? r.token_report.slice(0, 12) : `REP-${r.id_reporte_avance}`,
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

          // Recalcular totales reactivos en cabecera
          const sumHrs = jornadas.filter(j => !j.es_oculta).reduce((acc, j) => acc + (parseFloat(j.horas_report) || 0), 0);
          const sumIngresos = jornadas.filter(j => !j.es_oculta).reduce((acc, j) => acc + (parseFloat(j.subtotal) || ((parseFloat(j.horas_report) || 0) * (parseFloat(j.tarifa_hora) || parseFloat(its.valor_hora_pactado) || 0))), 0);
          its.total_horas_report = sumHrs;
          its.total_ingresos_horas = sumIngresos;
          its.total_ingresos_facturables = sumIngresos + (parseFloat(its.total_ingresos_fletes) || 0);
          its.utilidad_bruta = its.total_ingresos_facturables - (parseFloat(its.total_costos_operacionales) || 0);
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
            numero_report: r.token_report ? r.token_report.slice(0, 12) : `REP-${r.id_reporte_avance}`,
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

        // Actualizar totales calculados iniciales
        its.total_horas_report = sumHrs;
        its.total_ingresos_horas = sumIngresos;
        its.total_ingresos_facturables = its.total_ingresos_horas + its.total_ingresos_fletes;
        its.utilidad_bruta = its.total_ingresos_facturables;
        its.margen_porcentaje = its.total_ingresos_facturables > 0 ? 100 : 0;
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
        FROM sch_leangsp.tedp_costos_servicio cs
        LEFT JOIN sch_leangsp.tequ_log_desplazamiento ld ON cs.id_log_desplazamiento = ld.id_log_desplazamiento
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
        FROM sch_leangsp.tpry_rel_equipo re
        JOIN sch_leangsp.tequ_equipo e ON re.id_equipo = e.id_equipo
        WHERE re.id_proyecto = $1;
      `, [id_proyecto]);
      equiposAsignados = eqAsigRes.rows;

      const perAsigRes = await pool.query(`
        SELECT 
          rp.id_user,
          u.name_frst,
          u.apellido_pat,
          u.email,
          rp.rol_asignado AS rol_personal
        FROM sch_leangsp.tpry_rel_persona rp
        JOIN sch_leangsp.tsec_users u ON rp.id_user = u.id_user
        WHERE rp.id_proyecto = $1;
      `, [id_proyecto]);
      personalAsignado = perAsigRes.rows;

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

      // 2.1 Upsert en sch_leangsp.tits_informe_termino
      let idIts = cabecera.id_its;
      if (idIts) {
        await client.query(`
          UPDATE sch_leangsp.tits_informe_termino SET
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
          INSERT INTO sch_leangsp.tits_informe_termino (
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
      await client.query('DELETE FROM sch_leangsp.tits_jornada_detalle WHERE id_its = $1', [idIts]);

      if (Array.isArray(jornadas) && jornadas.length > 0) {
        let oIdx = 1;
        for (const j of jornadas) {
          const tarifa = parseFloat(j.tarifa_hora !== undefined && j.tarifa_hora !== null ? j.tarifa_hora : (cabecera.valor_hora_pactado || 0));
          const subtotal = parseFloat(j.subtotal !== undefined && j.subtotal !== null ? j.subtotal : ((j.horas_report || 0) * tarifa));
          await client.query(`
            INSERT INTO sch_leangsp.tits_jornada_detalle (
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
      await client.query('DELETE FROM sch_leangsp.tits_costo_operacional WHERE id_its = $1', [idIts]);

      if (costos && typeof costos === 'object') {
        const catMapping = [
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
                INSERT INTO sch_leangsp.tits_costo_operacional (
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
          FROM sch_leangsp.tflw_flow_steps st
          LEFT JOIN sch_leangsp.tfes_signatures f ON st.id_fes = f.id_fes
          LEFT JOIN sch_leangsp.tsec_users u ON COALESCE(f.id_user, st.id_user) = u.id_user
          LEFT JOIN sch_leangsp.tsec_roles r ON st.id_rol = r.id_rol
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
        validacionUrl: `${process.env.APP_BASE_URL || 'https://servidor.leanglobal.cl'}/lg-gsp-dev/validador-doc`
      });

      if (req.query.format === 'base64') {
        return res.status(200).json({
          success: true,
          pdfBase64: `data:application/pdf;base64,${pdfBuf.toString('base64')}`
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${its?.folio_its || 'ITS'}.pdf"`);
      return res.send(pdfBuf);
    } catch (error) {
      console.error('[ITS] Error generando preview PDF:', error);
      return res.status(500).json({ success: false, message: 'Error interno generando PDF', error: error.message });
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
        FROM sch_leangsp.tits_informe_termino
        WHERE id_proyecto = $1
        ORDER BY id_its DESC LIMIT 1;
      `, [id_proyecto]);

      const its = itsRes.rows[0] || null;
      let idFlow = its?.id_flow || null;

      // Si el ITS existe pero aún no tiene flujo instanciado, instanciar Template 90
      if (its && !idFlow) {
        const flowIns = await pool.query(`
          INSERT INTO sch_leangsp.tflw_flows (id_flow_tmpl, flow_tmpl_fase, fecha_creacion, fecha_inicio)
          VALUES (90, 'EN PROCESO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id_flow;
        `);
        idFlow = flowIns.rows[0].id_flow;

        const tmplSteps = await pool.query(`
          SELECT * FROM sch_leangsp.tflw_template_steps 
          WHERE id_flow_tmpl = 90 
          ORDER BY flow_tmpl_step_orden ASC;
        `);

        for (const ts of tmplSteps.rows) {
          const stEstado = ts.flow_tmpl_step_orden === 1 ? 'PENDIENTE' : 'EN ESPERA';
          await pool.query(`
            INSERT INTO sch_leangsp.tflw_flow_steps (
              id_flow, id_flow_tmpl_step, flow_tmpl_step_orden, flow_tmpl_step_fase, estado, id_rol, flag_flow_fin, flag_equipo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, false);
          `, [idFlow, ts.id_flow_tmpl_step, ts.flow_tmpl_step_orden, ts.flow_tmpl_step_fase, stEstado, ts.id_rol, ts.flag_flow_fin]);
        }

        await pool.query(`
          UPDATE sch_leangsp.tits_informe_termino 
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
          FROM sch_leangsp.tflw_flow_steps st
          LEFT JOIN sch_leangsp.tflw_template_steps ts ON st.id_flow_tmpl_step = ts.id_flow_tmpl_step
          LEFT JOIN sch_leangsp.tfes_signatures f ON st.id_fes = f.id_fes
          LEFT JOIN sch_leangsp.tsec_users u ON COALESCE(f.id_user, st.id_user) = u.id_user
          LEFT JOIN sch_leangsp.tsec_roles r ON st.id_rol = r.id_rol
          LEFT JOIN sch_leangsp.tflw_motivo_rechazo m ON st.id_motivo_rechazo = m.id_motivo_rechazo
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
          FROM sch_leangsp.tsec_user_roles ur 
          WHERE ur.id_user = $1 AND ur.id_rol IN (1, 10, $2);
        `, [id_user_query, pasoPendiente.orden === 1 ? 31 : (pasoPendiente.orden === 2 ? 32 : 33)]);
        puedeFirmar = rolCheck.rows.length > 0;
      } else if (pasoPendiente && !id_user_query) {
        puedeFirmar = true; // Fallback interactivo
      }

      const motivosRes = await pool.query(`
        SELECT id_motivo_rechazo, motivo_rechazo 
        FROM sch_leangsp.tflw_motivo_rechazo 
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
        const findIts = await client.query('SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto = $1 ORDER BY id_its DESC LIMIT 1', [id_proyecto]);
        if (findIts.rows.length > 0) id_its = findIts.rows[0].id_its;
      }

      if (!id_proyecto || !id_user || !pass_fes || !aprueba_rechaza) {
        return res.status(400).json({ success: false, message: 'Datos incompletos para procesar firma FES' });
      }

      await client.query('BEGIN');

      // 1. Validar usuario y PIN FES
      const userRes = await client.query(`
        SELECT id_user, name_frst, apellido_pat, email, pass_hash_fes 
        FROM sch_leangsp.tsec_users 
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
        SELECT * FROM sch_leangsp.tits_informe_termino 
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
          INSERT INTO sch_leangsp.tflw_flows (id_flow_tmpl, flow_tmpl_fase, fecha_creacion, fecha_inicio)
          VALUES (90, 'EN PROCESO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id_flow;
        `);
        idFlow = flowIns.rows[0].id_flow;

        const tmplSteps = await client.query(`
          SELECT * FROM sch_leangsp.tflw_template_steps 
          WHERE id_flow_tmpl = 90 
          ORDER BY flow_tmpl_step_orden ASC;
        `);

        for (const ts of tmplSteps.rows) {
          const stEstado = ts.flow_tmpl_step_orden === 1 ? 'PENDIENTE' : 'EN ESPERA';
          const stUser = ts.flow_tmpl_step_orden === 1 ? id_user : null;
          await client.query(`
            INSERT INTO sch_leangsp.tflw_flow_steps (
              id_flow, id_flow_tmpl_step, flow_tmpl_step_orden, flow_tmpl_step_fase, estado, id_rol, id_user, flag_flow_fin, flag_equipo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false);
          `, [idFlow, ts.id_flow_tmpl_step, ts.flow_tmpl_step_orden, ts.flow_tmpl_step_fase, stEstado, ts.id_rol, stUser, ts.flag_flow_fin]);
        }

        await client.query(`
          UPDATE sch_leangsp.tits_informe_termino 
          SET id_flow = $1, fecha_actualizacion = CURRENT_TIMESTAMP 
          WHERE id_its = $2;
        `, [idFlow, id_its]);
      }

      // 4. Buscar el paso actual en estado PENDIENTE
      const pasoPendRes = await client.query(`
        SELECT * FROM sch_leangsp.tflw_flow_steps 
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
      const codigoValidacion = `FES-ITS-${id_its}-${orden}-${Date.now().toString(36).toUpperCase()}`;

      // 5. Procesar según APRUEBA o RECHAZA
      if (aprueba_rechaza === 'APRUEBA') {
        const fesIns = await client.query(`
          INSERT INTO sch_leangsp.tfes_signatures (
            id_flow_stp, id_flow, id_user, codigo_validacion, observaciones, aprueba_rechaza, metodo_autenticacion, fecha_firma
          ) VALUES ($1, $2, $3, $4, $5, 'APRUEBA', 'PIN_FES_OTP', CURRENT_TIMESTAMP)
          RETURNING id_fes;
        `, [pasoActual.id_flow_stp, idFlow, id_user, codigoValidacion, observaciones || 'Aprobado conforme']);
        const idFes = fesIns.rows[0].id_fes;

        await client.query(`
          UPDATE sch_leangsp.tflw_flow_steps SET
            estado = 'APROBADO',
            id_fes = $1,
            flow_step_obs = $2,
            id_user = $3,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id_flow_stp = $4;
        `, [idFes, observaciones || 'Aprobado', id_user, pasoActual.id_flow_stp]);

        let nuevoEstadoIts = '';

        if (orden === 1) {
          nuevoEstadoIts = 'EN_REVISION_OPERACIONES';
          await client.query(`
            UPDATE sch_leangsp.tflw_flow_steps SET estado = 'PENDIENTE'
            WHERE id_flow = $1 AND flow_tmpl_step_orden = 2;
          `, [idFlow]);

          await client.query(`
            UPDATE sch_leangsp.tits_informe_termino SET
              estado_its = $1,
              id_user_elaborado = $2,
              fecha_elaborado = CURRENT_TIMESTAMP,
              codigo_validacion_fes = $3,
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_its = $4;
          `, [nuevoEstadoIts, id_user, codigoValidacion, id_its]);

          // Notificar a Jefatura de Operaciones + Analista + Gerencia
          try {
            const destRes = await client.query(`
              SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat 
              FROM sch_leangsp.tsec_users u
              LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
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
            UPDATE sch_leangsp.tflw_flow_steps SET estado = 'PENDIENTE'
            WHERE id_flow = $1 AND flow_tmpl_step_orden = 3;
          `, [idFlow]);

          await client.query(`
            UPDATE sch_leangsp.tits_informe_termino SET
              estado_its = $1,
              id_user_aprobado = $2,
              fecha_aprobado = CURRENT_TIMESTAMP,
              codigo_validacion_fes = $3,
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_its = $4;
          `, [nuevoEstadoIts, id_user, codigoValidacion, id_its]);

          // Notificar a Contabilidad (Maritza) + Analista + Gerencia
          try {
            const destRes = await client.query(`
              SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat 
              FROM sch_leangsp.tsec_users u
              LEFT JOIN sch_leangsp.tsec_user_roles ur ON u.id_user = ur.id_user
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
              const analistaUser = await client.query('SELECT email, name_frst FROM sch_leangsp.tsec_users WHERE id_user = $1', [its.id_user_elaborado]);
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
            UPDATE sch_leangsp.tflw_flows SET flow_tmpl_fase = 'FINALIZADO', fecha_cierre = CURRENT_TIMESTAMP WHERE id_flow = $1;
          `, [idFlow]);

          await client.query(`
            UPDATE sch_leangsp.tits_informe_termino SET
              estado_its = $1,
              id_user_recibido = $2,
              fecha_recibido = CURRENT_TIMESTAMP,
              codigo_validacion_fes = $3,
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_its = $4;
          `, [nuevoEstadoIts, id_user, codigoValidacion, id_its]);

          // Notificar únicamente a los 4 roles canónicos definidos:
          // 1. Analista elaborador (its.id_user_elaborado)
          // 2. Jefatura que visó (its.id_user_aprobado / logistica@arriendosanpablo.cl)
          // 3. Contabilidad (usuario firmante / mseguel@arriendosanpablo.cl)
          // 4. Comercial dueño de la OT (proyecto.id_usuario_creacion)
          try {
            const destRes = await client.query(`
              SELECT DISTINCT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat 
              FROM sch_leangsp.tsec_users u
              WHERE (
                u.id_user IN (
                  SELECT UNNEST(ARRAY[
                    $1::integer,
                    $2::integer,
                    $3::integer,
                    (SELECT id_usuario_creacion FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $4)
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
          codigo_validacion: codigoValidacion
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
          INSERT INTO sch_leangsp.tfes_signatures (
            id_flow_stp, id_flow, id_user, codigo_validacion, observaciones, aprueba_rechaza, id_motivo_rechazo, metodo_autenticacion, fecha_firma
          ) VALUES ($1, $2, $3, $4, $5, 'RECHAZA', $6, 'PIN_FES_OTP', CURRENT_TIMESTAMP)
          RETURNING id_fes;
        `, [pasoActual.id_flow_stp, idFlow, id_user, codigoValidacion, observaciones, id_motivo_rechazo]);
        const idFes = fesIns.rows[0].id_fes;

        await client.query(`
          UPDATE sch_leangsp.tflw_flow_steps SET
            estado = 'RECHAZADO',
            id_fes = $1,
            id_motivo_rechazo = $2,
            flow_step_obs = $3,
            id_user = $4,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id_flow_stp = $5;
        `, [idFes, id_motivo_rechazo, observaciones, id_user, pasoActual.id_flow_stp]);

        await client.query(`
          UPDATE sch_leangsp.tits_informe_termino SET
            estado_its = 'EN_CORRECCION',
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id_its = $1;
        `, [id_its]);

        // Reabrir Paso 1 para el analista
        await client.query(`
          UPDATE sch_leangsp.tflw_flow_steps SET estado = 'PENDIENTE', id_fes = NULL
          WHERE id_flow = $1 AND flow_tmpl_step_orden = 1;
        `, [idFlow]);

        // Resetear otros pasos a EN ESPERA
        await client.query(`
          UPDATE sch_leangsp.tflw_flow_steps SET estado = 'EN ESPERA', id_fes = NULL
          WHERE id_flow = $1 AND flow_tmpl_step_orden > 1 AND id_flow_stp <> $2;
        `, [idFlow, pasoActual.id_flow_stp]);

        // Despachar alerta omnicanal al Analista para corrección
        try {
          const analistaRes = await client.query(`
            SELECT u.id_user, u.email, u.movil as fono, u.name_frst, u.apellido_pat, m.motivo_rechazo
            FROM sch_leangsp.tits_informe_termino its
            JOIN sch_leangsp.tsec_users u ON its.id_user_elaborado = u.id_user
            LEFT JOIN sch_leangsp.tflw_motivo_rechazo m ON m.id_motivo_rechazo = $1
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
