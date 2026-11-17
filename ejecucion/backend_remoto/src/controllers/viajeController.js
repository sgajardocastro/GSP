const viajeModel = require('../models/viajeModel');
const estadoPagoModel = require('../models/estadoPagoModel');

function evaluarExencionBitacoraViaje(v = {}, distanciaFallback = 0) {
  const idSub = Number(v.id_subcategoria || 0);
  const subEq = String(v.nombre_subcategoria || '').toUpperCase();
  const codEq = String(v.codigo_interno || '').toUpperCase();
  const tipoEq = String(v.tipo_equipo || '').toUpperCase();
  const modEq = String(v.modelo || '').toUpperCase();
  const distKm = Number(v.distancia_km ?? distanciaFallback ?? 0);

  const esRamplaOSemi = (
    idSub === 84 ||
    subEq.includes('SEMI') ||
    subEq.includes('RAMPLA') ||
    subEq.includes('CAMA BAJA') ||
    codEq.startsWith('RPL-') ||
    codEq.startsWith('CBA-') ||
    tipoEq.includes('RAMPLA') ||
    tipoEq.includes('CAMA BAJA') ||
    tipoEq.includes('CAMABAJA') ||
    tipoEq.includes('SEMI') ||
    modEq.includes('SRPL') ||
    modEq.includes('RAMPLA') ||
    modEq.includes('CAMA BAJA') ||
    modEq.includes('CAMABAJA') ||
    modEq.includes('SEMI')
  );
  const esCamionetaUrbana = (
    (idSub === 100 ||
      subEq.includes('CAMIONETA') ||
      codEq.startsWith('CTA-') ||
      tipoEq.includes('VEHICULOS LIVIANOS') ||
      tipoEq.includes('CAMIONETA') ||
      modEq.includes('CAMIONETA')) &&
    distKm <= 30
  );
  return Boolean(esRamplaOSemi || esCamionetaUrbana);
}

const viajeController = {
  // 1. Obtener datos del viaje por token (Público / PWA)
  async getViajePorToken(req, res) {
    try {
      const { token } = req.params;
      const viaje = await viajeModel.getViajePorToken(token);
      if (!viaje) {
        return res.status(404).json({ error: 'Viaje no encontrado o token inválido' });
      }

      // SPEC-129 1.11.M / 3.1.M / 4.8.M: Marcar exención de bitácora para ramplas sin motor y camionetas urbanas
      viaje.exento_bitacora_viaje = evaluarExencionBitacoraViaje(viaje, viaje.distancia_km);

      res.json(viaje);
    } catch (err) {
      console.error('Error al obtener viaje por token:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 2. Registrar Salida de Patio (Paso 1)
  async registrarSalida(req, res) {
    try {
      const { token } = req.params;
      const {
        km_inicial,
        horometro_inicial,
        combustible_salida,
        foto_salida,
        foto_odometro_salida,
        foto_horometro_salida,
        pin_hash,
        latitud,
        longitud,
        id_proyecto,
        id_equipo,
        id_user_chofer,
        device_timestamp
      } = req.body;

      if (!km_inicial || !pin_hash) {
        return res.status(400).json({ error: 'Odómetro y PIN son requeridos para iniciar salida' });
      }

      const actualizado = await viajeModel.registrarSalida({
        token_viaje: token,
        id_proyecto,
        id_equipo,
        id_user_chofer,
        km_inicial,
        horometro_inicial,
        combustible_salida,
        foto_salida,
        foto_odometro_salida,
        foto_horometro_salida,
        pin_hash,
        latitud,
        longitud,
        device_timestamp
      });

      res.json({ success: true, message: 'Salida de patio registrada exitosamente', data: actualizado });
    } catch (err) {
      console.error('Error registrando salida:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 3. Registrar Carga de Combustible (Copec / Acuerdo #1)
  async registrarCombustible(req, res) {
    try {
      const { token } = req.params;
      const db = require('../config/dbConfig');

      const payload = req.body || {};
      const cargaObj = payload.carga_combustible || {};
      const cargasArray = Array.isArray(payload.cargas_combustible) ? payload.cargas_combustible : null;

      // Resolver parámetros admitiendo carga_combustible, cargas_combustible o campos raíz
      const primeraCarga = (cargasArray && cargasArray.length > 0) ? cargasArray[0] : cargaObj;
      const horaCarga = primeraCarga.hora_carga || payload.hora_carga || null;
      const litros = primeraCarga.litros !== undefined ? primeraCarga.litros : payload.litros;
      const monto = primeraCarga.valor_total ?? primeraCarga.monto ?? payload.valor_total ?? payload.monto ?? payload.monto_costo ?? 0;
      const odometro = primeraCarga.odometro !== undefined ? primeraCarga.odometro : payload.odometro;
      const horometro = primeraCarga.horometro !== undefined ? primeraCarga.horometro : payload.horometro;
      const tipo_estanque = primeraCarga.tipo_estanque || payload.tipo_estanque || 'ESTANQUE_PRINCIPAL';
      const foto_voucher = primeraCarga.foto_voucher || payload.foto_voucher || null;
      const foto_tablero = primeraCarga.foto_tablero || payload.foto_tablero || null;
      const id_autorizacion_copec = primeraCarga.id_autorizacion_copec || payload.id_autorizacion_copec || null;
      const observacion = primeraCarga.observacion || payload.observacion || (horaCarga ? `Carga registrada hora: ${horaCarga}` : null);

      // Validación cronológica obligatoria (Acuerdo #1):
      // Si viene hora_carga y el viaje ya tiene hora_salida_patio en la misma fecha (o timestamp), no puede ser anterior
      if (horaCarga) {
        const viajeCheck = await db.query(
          `SELECT fecha_salida_patio, km_inicial FROM tequ_log_desplazamiento WHERE token_viaje = $1 LIMIT 1`,
          [token]
        );
        if (viajeCheck.rows.length > 0 && viajeCheck.rows[0].fecha_salida_patio) {
          const fSalida = viajeCheck.rows[0].fecha_salida_patio;
          const hCargaStr = String(horaCarga).trim();
          let esAnterior = false;

          if (/^\d{1,2}:\d{2}/.test(hCargaStr)) {
            const mCarga = hCargaStr.match(/^(\d{1,2}):(\d{2})/);
            const minCarga = parseInt(mCarga[1], 10) * 60 + parseInt(mCarga[2], 10);
            const dSal = new Date(fSalida);
            if (!isNaN(dSal.getTime())) {
              const hhSal = dSal.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
              const mSal = hhSal.match(/^(\d{1,2}):(\d{2})/);
              if (mSal) {
                const minSal = parseInt(mSal[1], 10) * 60 + parseInt(mSal[2], 10);
                if (minCarga < minSal) {
                  esAnterior = true;
                }
              }
            }
          } else {
            const tsCarga = new Date(hCargaStr).getTime();
            const tsSal = new Date(fSalida).getTime();
            if (!isNaN(tsCarga) && !isNaN(tsSal) && tsCarga < tsSal) {
              esAnterior = true;
            }
          }

          if (esAnterior) {
            return res.status(400).json({
              success: false,
              error: 'La hora de carga de combustible no puede ser anterior a la hora de salida de patio.',
              message: 'La hora de carga de combustible no puede ser anterior a la hora de salida de patio.'
            });
          }
        }
      }

      // Si vienen múltiples cargas en cargas_combustible
      let costoRegistrado = null;
      if (cargasArray && cargasArray.length > 0) {
        for (const c of cargasArray) {
          costoRegistrado = await viajeModel.registrarCombustible({
            token_viaje: token,
            tipo_estanque: c.tipo_estanque || tipo_estanque,
            litros: c.litros || 0,
            monto: c.valor_total || c.monto || 0,
            foto_voucher: c.foto_voucher || null,
            foto_tablero: c.foto_tablero || null,
            id_autorizacion_copec: c.id_autorizacion_copec || null,
            odometro: c.odometro || null,
            horometro: c.horometro || null,
            observacion: c.observacion || (c.hora_carga ? `Carga ${c.hora_carga}` : null)
          });
        }
      } else {
        costoRegistrado = await viajeModel.registrarCombustible({
          token_viaje: token,
          tipo_estanque,
          litros: litros || 0,
          monto: monto || 0,
          foto_voucher,
          foto_tablero,
          id_autorizacion_copec,
          odometro,
          horometro,
          observacion
        });
      }

      res.status(201).json({ success: true, message: 'Carga de combustible registrada exitosamente', data: costoRegistrado });
    } catch (err) {
      console.error('Error registrando combustible:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 4. Registrar Llegada a Faena (Paso 3)
  async registrarLlegada(req, res) {
    try {
      const { token } = req.params;
      const {
        km_final,
        horometro_final,
        horometro_grua,
        horometro_grua_inicial,
        combustible_llegada,
        foto_llegada,
        foto_odometro_llegada,
        foto_horometro_camion_llegada,
        foto_horometro_grua_llegada,
        pin_hash,
        latitud,
        longitud,
        obs_termino,
        device_timestamp
      } = req.body;

      if (!km_final || !pin_hash) {
        return res.status(400).json({ error: 'Odómetro de llegada y PIN son requeridos' });
      }

      const hGrua = horometro_grua || horometro_grua_inicial || null;

      const actualizado = await viajeModel.registrarLlegada({
        token_viaje: token,
        km_final,
        horometro_final,
        horometro_grua_inicial: hGrua,
        combustible_llegada,
        foto_llegada,
        foto_odometro_llegada,
        foto_horometro_camion_llegada,
        foto_horometro_grua_llegada,
        pin_hash,
        latitud,
        longitud,
        obs_termino,
        device_timestamp
      });

      // Handoff Automático del Traslado (Requerimiento 3 / Spec 54 & Spec 49)
      if (actualizado && actualizado.id_proyecto) {
        try {
          await viajeController.procesarHandoffTraslado(actualizado, token);
        } catch (handoffErr) {
          console.warn('[Handoff Traslado] Error en handoff automático:', handoffErr.message);
        }
      }

      res.json({ success: true, message: 'Llegada a faena registrada exitosamente', data: actualizado });
    } catch (err) {
      console.error('Error registrando llegada:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 5. Ping de Telemetría GPS
  async registrarPing(req, res) {
    try {
      const { token } = req.params;
      const { latitud, longitud, velocidad_kmh } = req.body;

      const data = await viajeModel.registrarPingViaje(token, {
        latitud,
        longitud,
        velocidad_kmh
      });

      res.json({ success: true, message: 'Ping registrado', data });
    } catch (err) {
      console.error('Error registrando ping de viaje:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 6. Crear o Asignar Viaje desde el CRM
  async crearOAsignarViaje(req, res) {
    try {
      const {
        id_proyecto,
        id_equipo,
        id_user_chofer,
        patente,
        tipo_trayecto,
        token_viaje,
        fecha_programada,
        fecha_inspeccion_plan,
        hora_inspeccion_plan
      } = req.body;
      if (!id_proyecto || !id_equipo) {
        return res.status(400).json({ error: 'id_proyecto e id_equipo son requeridos' });
      }

      let fProg = fecha_programada || null;
      if (!fProg && fecha_inspeccion_plan) {
        const hora = (hora_inspeccion_plan && hora_inspeccion_plan.trim()) ? hora_inspeccion_plan.trim() : '08:00';
        fProg = `${fecha_inspeccion_plan}T${hora.length === 5 ? hora + ':00' : hora}`;
      }

      const viaje = await viajeModel.crearOObtenerViaje({
        id_proyecto,
        id_equipo,
        id_user_chofer,
        patente,
        tipo_trayecto,
        token_viaje,
        fecha_programada: fProg
      });

      res.status(201).json({ success: true, data: viaje });
    } catch (err) {
      console.error('Error al crear o asignar viaje:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 7. Listar Viajes de un Proyecto (CRM)
  async getViajesPorProyecto(req, res) {
    try {
      const { id_proyecto } = req.params;
      const db = require('../config/dbConfig');
      const pryRes = await db.query('SELECT json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
      let distanciaKm = 0;
      if (pryRes.rows.length > 0) {
        const jf = pryRes.rows[0].json_field || {};
        distanciaKm = Number(jf.crm_v1?.distancia_km ?? jf.distancia_km ?? 0);
      }

      const viajes = await viajeModel.getViajesPorProyecto(id_proyecto);
      const viajesMapeados = (viajes || []).map(v => ({
        ...v,
        distancia_km: distanciaKm,
        exento_bitacora_viaje: evaluarExencionBitacoraViaje(v, distanciaKm)
      }));

      res.json(viajesMapeados);
    } catch (err) {
      console.error('Error al listar viajes por proyecto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 8. Consultar viaje activo asignado a un usuario (PWA)
  async getViajeActivo(req, res) {
    try {
      const id_user = req.user?.id_user || req.query.id_user;
      if (!id_user) {
        return res.status(400).json({ error: 'id_user es requerido' });
      }

      const viaje = await viajeModel.getViajeActivoPorUsuario(id_user);
      res.json({ activo: !!viaje, data: viaje });
    } catch (err) {
      console.error('Error al consultar viaje activo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // 9. Handoff Automático: Cumplimiento de TRASLADO en Estructurador e Inyección en Report Diario / ITS
  async procesarHandoffTraslado(actualizado, token) {
    const db = require('../config/dbConfig');
    const idPry = actualizado.id_proyecto;
    if (!idPry) return;

    // 9.1 SPEC-16 §28: Marcar cumplimiento de traslado en tpry_linea_servicio (metadata_json)
    try {
      await db.query(`
        UPDATE tpry_linea_servicio
        SET metadata_json = jsonb_set(
          COALESCE(metadata_json, '{}'::jsonb),
          '{cumplido}',
          'true'::jsonb,
          true
        )
        WHERE id_proyecto = $1 
          AND (UPPER(descripcion) LIKE '%TRASLADO%' OR UPPER(descripcion) LIKE '%FLETE%' OR UPPER(subcategoria) LIKE '%TRASLADO%' OR UPPER(subcategoria) LIKE '%FLETE%')
      `, [idPry]);
      console.log(`[Handoff Traslado] Ítem TRASLADO marcado como CUMPLIDO relacionalmente en tpry_linea_servicio (#${idPry})`);
    } catch (errLs) {
      console.warn(`[Handoff Traslado] Error actualizando cumplimiento en tpry_linea_servicio:`, errLs.message);
    }

    // Acuerdo #8 / SPEC-129 1.8.M / 3.1.M: Verificar si es vehículo de transporte/soporte (incluyendo catálogo real tequ_subcategoria)
    let tipoEqNorm = '';
    let modeloEqNorm = '';
    let subEqNorm = '';
    let codEqNorm = '';
    if (actualizado.id_equipo) {
      const eqRes = await db.query(
        `SELECT e.tipo_equipo, e.modelo, e.codigo_interno, COALESCE(sc.nombre_subcategoria, '') AS nombre_subcategoria
         FROM tequ_equipo e
         LEFT JOIN tequ_subcategoria sc ON e.id_subcategoria = sc.id_subcategoria
         WHERE e.id_equipo = $1`,
        [actualizado.id_equipo]
      );
      if (eqRes.rows.length > 0) {
        tipoEqNorm = String(eqRes.rows[0].tipo_equipo || '').toUpperCase();
        modeloEqNorm = String(eqRes.rows[0].modelo || '').toUpperCase();
        subEqNorm = String(eqRes.rows[0].nombre_subcategoria || '').toUpperCase();
        codEqNorm = String(eqRes.rows[0].codigo_interno || '').toUpperCase();
      }
    }
    if (!tipoEqNorm && actualizado.tipo_equipo) tipoEqNorm = String(actualizado.tipo_equipo).toUpperCase();
    if (!modeloEqNorm && actualizado.modelo) modeloEqNorm = String(actualizado.modelo).toUpperCase();

    const noEsPlumaNiGrua = !subEqNorm.includes('PLUMA') && !tipoEqNorm.includes('PLUMA') && !modeloEqNorm.includes('PLUMA') && !tipoEqNorm.includes('GRUA') && !tipoEqNorm.includes('GRÚA');
    const esVehiculoTransporte = noEsPlumaNiGrua && (
      tipoEqNorm === 'CAMIONES' ||
      tipoEqNorm.includes('VEHICULOS LIVIANOS') ||
      tipoEqNorm.includes('TRACTO') ||
      tipoEqNorm.includes('CAMA BAJA') ||
      tipoEqNorm.includes('CAMABAJA') ||
      tipoEqNorm.includes('RAMPLA') ||
      tipoEqNorm.includes('SEMI') ||
      tipoEqNorm.includes('CAMIONETA') ||
      tipoEqNorm.includes('TRANSPORTE') ||
      tipoEqNorm.includes('SOPORTE') ||
      subEqNorm.includes('TRACTO') ||
      subEqNorm.includes('SEMI') ||
      subEqNorm.includes('RAMPLA') ||
      subEqNorm.includes('CAMA BAJA') ||
      subEqNorm.includes('CAMIONETA') ||
      codEqNorm.startsWith('TRC-') ||
      codEqNorm.startsWith('CBA-') ||
      codEqNorm.startsWith('RPL-') ||
      codEqNorm.startsWith('CTA-') ||
      modeloEqNorm.includes('TRACTO') ||
      modeloEqNorm.includes('CAMA BAJA') ||
      modeloEqNorm.includes('CAMABAJA') ||
      modeloEqNorm.includes('RAMPLA') ||
      modeloEqNorm.includes('CAMIONETA')
    );

    let idReporteFlete = null;
    const tokenReport = `FLT-${token}`;

    if (esVehiculoTransporte) {
      // Choferes de Tracto, Cama Baja, Rampla y Camioneta tienen sueldo fijo mensual, $0 bono hora y $0 viático automático.
      // Su registro vive en tequ_log_desplazamiento / fila 'Registro de Viaje' informativa. Cero FLT- en tedp_reporte_avance.
      console.log(`[Handoff Traslado] Vehículo de transporte/soporte detectado (${tipoEqNorm || modeloEqNorm || 'TRANSPORTE'}). Se omite generación de Report Diario FLT- y bono de chofer según Acuerdo #8 / SPEC-129 1.8.M / 3.1.M.`);
    } else {
      // 9.2 Inyectar automáticamente en Report Diario (tedp_reporte_avance) sólo para grúas autopropulsadas
      const repCheck = await db.query(
        'SELECT id_reporte_avance FROM tedp_reporte_avance WHERE token_report = $1 OR id_log_desplazamiento = $2 LIMIT 1',
        [tokenReport, actualizado.id_log_desplazamiento]
      );

      if (repCheck.rows.length === 0) {
        const fIni = actualizado.fecha_salida_patio || new Date().toISOString();
        const fFin = actualizado.fecha_llegada_faena || new Date().toISOString();
        const diffMs = new Date(fFin) - new Date(fIni);
        const horasCarretera = Math.max(0.1, Number((diffMs / 3600000).toFixed(1)));

        const insertRepSql = `
          INSERT INTO tedp_reporte_avance (
            id_proyecto, id_equipo, id_user_operador, id_log_desplazamiento,
            dia_correlativo, fecha_reporte, fecha_inicio_servicio, fecha_termino_servicio,
            unidad_cobro, horas_operadas, horas_minimas, horas_facturables,
            horometro_inicio, horometro_termino, odometro_inicio, odometro_termino,
            observacion_trabajo, cliente_nombre, cliente_cargo,
            estado_reporte, estado_jornada, token_report, incluye_flete_independiente
          ) VALUES (
            $1, $2, $3, $4,
            1, CURRENT_DATE, $5, $6,
            'GL', $7, 0, 0,
            $8, $9, $10, $11,
            'FLETE / TRASLADO CARRETERA (CUMPLIDO AUTOMÁTICO DESDE CONVOY)',
            'Control Conductor', 'Flete Carretero',
            'VALIDADO_ANALISTA', 'FINALIZADA', $12, true
          ) RETURNING id_reporte_avance;
        `;
        const repIns = await db.query(insertRepSql, [
          idPry,
          actualizado.id_equipo || null,
          actualizado.id_user_chofer || 55,
          actualizado.id_log_desplazamiento,
          fIni,
          fFin,
          horasCarretera,
          actualizado.horometro_inicial || null,
          actualizado.horometro_final || null,
          actualizado.km_inicial || null,
          actualizado.km_final || null,
          tokenReport
        ]);
        idReporteFlete = repIns.rows[0]?.id_reporte_avance;
        console.log(`[Handoff Traslado] Report Diario de Flete inyectado ID: ${idReporteFlete}`);
      } else {
        idReporteFlete = repCheck.rows[0].id_reporte_avance;
      }
    }

    // 9.3 Sincronizar en Liquidación ITS (tits_jornada_detalle) si ya existe (Acuerdo #8: corregido nombre de tabla tits_informe_termino)
    if (!esVehiculoTransporte && idReporteFlete) {
      const itsRes = await db.query('SELECT id_its FROM tits_informe_termino WHERE id_proyecto = $1 LIMIT 1', [idPry]);
      if (itsRes.rows.length > 0) {
        const idIts = itsRes.rows[0].id_its;
        const jorCheck = await db.query(
          'SELECT id_jornada FROM tits_jornada_detalle WHERE id_its = $1 AND (numero_report = $2 OR tipo_servicio ILIKE \'%Flete%\') LIMIT 1',
          [idIts, tokenReport]
        );
        if (jorCheck.rows.length === 0) {
          const horaSal = actualizado.fecha_salida_patio ? new Date(actualizado.fecha_salida_patio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '06:40';
          const horaLleg = actualizado.fecha_llegada_faena ? new Date(actualizado.fecha_llegada_faena).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '08:30';
          const diffH = Math.max(0.1, Number(((new Date(actualizado.fecha_llegada_faena || Date.now()) - new Date(actualizado.fecha_salida_patio || Date.now())) / 3600000).toFixed(1)));

          await db.query(`
            INSERT INTO tits_jornada_detalle (
              id_its, id_reporte_avance, fecha, numero_ot, id_equipo, patente,
              tipo_servicio, hora_salida, hora_llegada, hora_termino, hora_retorno,
              colacion_minutos, horas_reales, horas_report, numero_report, es_oculta, vb_conciliado, orden
            ) VALUES (
              $1, $2, CURRENT_DATE, $3, $4, $5,
              'Flete Solo Ida', $6, $7, $7, $7,
              0, $8, 1, $9, false, true, 0
            );
          `, [
            idIts, idReporteFlete, proyecto.codi_proyecto || `OT-${idPry}`,
            actualizado.id_equipo || null, actualizado.patente || 'S/P',
            horaSal, horaLleg, diffH, tokenReport
          ]);
          console.log(`[Handoff Traslado] Flete Solo Ida inyectado en ITS ID: ${idIts}`);
        }
      }
    }

    // 9.4 Pre-inicializar Horómetro Inicial de Grúa en Report Diario de Faena (Spec 49)
    if (actualizado.tipo_trayecto !== 'RETORNO' && actualizado.horometro_grua_inicial && actualizado.id_equipo) {
      try {
        const fechaHoy = new Date().toISOString().split('T')[0];
        const horaLleg = actualizado.fecha_llegada_faena 
          ? new Date(actualizado.fecha_llegada_faena).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) 
          : '08:30';
        const fGrua = actualizado.foto_horometro_grua_llegada_path || null;
        
        await db.query(`
          UPDATE tedp_reporte_avance
          SET horometro_inicio = $1,
              hora_inicio_faena = COALESCE(hora_inicio_faena, $2),
              foto_tablero_inicio = COALESCE(foto_tablero_inicio, $6)
          WHERE id_proyecto = $3 AND id_equipo = $4 AND fecha_reporte = $5 AND (token_report IS NULL OR token_report NOT LIKE 'FLT-%');
        `, [Number(actualizado.horometro_grua_inicial), horaLleg, idPry, actualizado.id_equipo, fechaHoy, fGrua]);
        console.log(`[Handoff Traslado] Horómetro Inicial de Grúa pre-cargado: ${actualizado.horometro_grua_inicial} hrs con foto en OT ${idPry}`);
      } catch (errRep) {
        console.warn('[Handoff Traslado] Advertencia pre-cargando horómetro de grúa:', errRep.message);
      }
    }
  }
};

module.exports = viajeController;
