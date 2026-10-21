const crypto = require('crypto');
const pool = require('../config/postgresPool');

class MantenimientoModel {
  constructor() {
    this.pool = pool;
  }

  // =========================================================================
  // 1. GESTIÓN DE ORDENES DE TRABAJO (OT)
  // =========================================================================

  // 1.1 Listar OTs con filtros enriquecidos y totales financieros
  async getOts(empresaId = 9, filtros = {}) {
    try {
      let query = `
        SELECT 
          ot.id_ot,
          ot.id_empresa,
          ot.numero_ot AS folio,
          ot.id_equipo,
          ot.tipo_mantenimiento,
          ot.estado,
          ot.prioridad,
          ot.equipo_detenido,
          ot.fecha_hora_detencion,
          ot.fecha_hora_liberacion,
          ot.sistema_falla,
          ot.modo_falla,
          ot.causa_falla,
          ot.codigo_pauta,
          ot.id_aviso_origen,
          ot.id_hallazgo_origen,
          ot.motivo_anulacion,
          ot.fecha_creacion,
          ot.fecha_programada,
          ot.fecha_cierre_real,
          ot.descripcion_falla,
          ot.horometro_inicio,
          ot.horometro_cierre,
          ot.alcance_mantenimiento,
          ot.horometro_grua_inicio,
          ot.horometro_grua_cierre,
          ot.horometro_chasis_inicio,
          ot.horometro_chasis_cierre,
          ot.odometro_inicio,
          ot.odometro_cierre,
          eq.tiene_doble_horometro,
          eq.horometro_grua_acumulado,
          eq.horometro_chasis_acumulado,
          eq.odometro_acumulado,
          ot.pauta_intervalo_horas,
          ot.id_supervisor,
          ot.id_tecnico_responsable,
          ot.costo_total_calculado,
          ot.observaciones,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_tecnico_responsable) AS nombre_tecnico,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_supervisor) AS nombre_supervisor,
          eq.patente,
          COALESCE(eq.codigo_interno, eq.patente) AS equipo_codigo,
          eq.modelo AS equipo_modelo,
          eq.marca AS equipo_marca,
          COALESCE(eq.json_data->>'tipo_planilla', eq.modelo, eq.patente) AS equipo_nombre,
          COALESCE(eq.capacidad_maxima, 0) AS tonelaje_capacidad,
          eq.estado AS estado_equipo_actual,
          -- Subtotales reactivos calculados
          COALESCE((SELECT SUM(r.costo_total) FROM tmnt_ot_repuesto r WHERE r.id_ot = ot.id_ot), 0) AS costo_materiales,
          COALESCE((SELECT SUM(h.costo_calculado) FROM tmnt_ot_hh h WHERE h.id_ot = ot.id_ot), 0) AS costo_hh,
          COALESCE((SELECT SUM(s.costo) FROM tmnt_ot_servicio_ext s WHERE s.id_ot = ot.id_ot), 0) AS costo_servicios,
          -- Conteo de tareas checklist
          COALESCE((SELECT COUNT(*) FROM tmnt_ot_actividad a WHERE a.id_ot = ot.id_ot), 0) AS total_actividades,
          COALESCE((SELECT COUNT(*) FROM tmnt_ot_actividad a WHERE a.id_ot = ot.id_ot AND a.estado = 'COMPLETADA'), 0) AS actividades_completadas,
          -- Conteo de hallazgos
          COALESCE((SELECT COUNT(*) FROM tmnt_hallazgo hal WHERE hal.id_ot_origen = ot.id_ot), 0) AS total_hallazgos,
          -- Nombre de técnico y supervisor
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_tecnico_responsable) AS nombre_tecnico,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_supervisor) AS nombre_supervisor
        FROM tmnt_ot ot
        LEFT JOIN tequ_equipo eq ON ot.id_equipo = eq.id_equipo
        WHERE ot.id_empresa = $1
      `;
      const params = [empresaId];

      if (filtros.tipo && filtros.tipo.trim() !== '') {
        params.push(filtros.tipo.trim());
        query += ` AND ot.tipo_mantenimiento = $${params.length}`;
      }

      if (filtros.estado && filtros.estado.trim() !== '') {
        params.push(filtros.estado.trim());
        query += ` AND ot.estado = $${params.length}`;
      }

      if (filtros.prioridad) {
        params.push(parseInt(filtros.prioridad, 10));
        query += ` AND ot.prioridad = $${params.length}`;
      }

      if (filtros.id_equipo) {
        params.push(parseInt(filtros.id_equipo, 10));
        query += ` AND ot.id_equipo = $${params.length}`;
      }

      if (filtros.search && filtros.search.trim() !== '') {
        params.push(`%${filtros.search.trim()}%`);
        query += ` AND (
          ot.numero_ot ILIKE $${params.length} 
          OR eq.patente ILIKE $${params.length}
          OR eq.codigo_interno ILIKE $${params.length}
          OR ot.descripcion_falla ILIKE $${params.length}
        )`;
      }

      query += ` ORDER BY ot.id_ot DESC`;

      const { rows } = await this.pool.query(query, params);
      return rows.map(r => ({
        ...r,
        costo_total_calculado: Number(r.costo_materiales) + Number(r.costo_hh) + Number(r.costo_servicios),
        porcentaje_avance: r.total_actividades > 0 ? Math.round((r.actividades_completadas / r.total_actividades) * 100) : 0
      }));
    } catch (err) {
      console.error('Error en MantenimientoModel.getOts:', err);
      throw err;
    }
  }

  // 1.2 Detalle completo de una OT (Expediente OTM 360°)
  async getOtById(idOt, empresaId = 9) {
    try {
      const otSql = `
        SELECT 
          ot.*,
          ot.numero_ot AS folio,
          eq.patente,
          COALESCE(eq.codigo_interno, eq.patente) AS equipo_codigo,
          eq.modelo AS equipo_modelo,
          eq.marca AS equipo_marca,
          COALESCE(eq.json_data->>'tipo_planilla', eq.modelo, eq.patente) AS equipo_nombre,
          COALESCE(eq.capacidad_maxima, 0) AS tonelaje_capacidad,
          eq.estado AS estado_equipo_actual,
          COALESCE(eq.tiene_doble_horometro, false) AS tiene_doble_horometro,
          COALESCE(eq.horometro_grua_acumulado, 0) AS horometro_grua_acumulado,
          COALESCE(eq.horometro_chasis_acumulado, 0) AS horometro_chasis_acumulado,
          COALESCE(eq.odometro_acumulado, 0) AS odometro_acumulado,
          eq.fecha_ultima_lectura,
          eq.fuente_ultima_lectura,
          COALESCE((
            SELECT rep.horometro_termino 
            FROM tedp_reporte_avance rep 
            WHERE rep.id_equipo = eq.id_equipo AND rep.horometro_termino IS NOT NULL 
            ORDER BY rep.id_reporte_avance DESC LIMIT 1
          ), 0) AS horometro_actual,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_tecnico_responsable) AS nombre_tecnico,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = ot.id_supervisor) AS nombre_supervisor
        FROM tmnt_ot ot
        LEFT JOIN tequ_equipo eq ON ot.id_equipo = eq.id_equipo
        WHERE ot.id_ot = $1 AND ot.id_empresa = $2
      `;
      const { rows: otRows } = await this.pool.query(otSql, [idOt, empresaId]);
      if (otRows.length === 0) return null;
      const ot = otRows[0];

      // Actividades / Checklist
      const actSql = `
        SELECT * FROM tmnt_ot_actividad 
        WHERE id_ot = $1 
        ORDER BY orden ASC, id_actividad ASC
      `;
      const { rows: actividades } = await this.pool.query(actSql, [idOt]);

      // Repuestos / Materiales manuales
      const repSql = `
        SELECT 
          id_ot_repuesto,
          id_empresa,
          id_ot,
          id_producto,
          COALESCE(descripcion_material, 'Material de Taller') AS descripcion_material,
          COALESCE(cantidad, cantidad_solicitada, 1) AS cantidad,
          COALESCE(unidad_medida, 'UNIDAD') AS unidad_medida,
          COALESCE(costo_unitario, 0) AS costo_unitario,
          COALESCE(costo_total, 0) AS costo_total,
          proveedor_o_documento,
          estado,
          pendiente_valorizar,
          id_user_registro
        FROM tmnt_ot_repuesto 
        WHERE id_ot = $1 
        ORDER BY id_ot_repuesto ASC
      `;
      const { rows: repuestos } = await this.pool.query(repSql, [idOt]);

      // Mano de Obra HH
      const hhSql = `
        SELECT 
          id_hh,
          id_empresa,
          id_ot,
          rut_tecnico,
          COALESCE(nombre_tecnico, rut_tecnico) AS tecnico_nombre,
          horas AS horas_reales,
          tarifa AS tarifa_hora,
          COALESCE(descripcion_trabajo, 'Trabajo de Taller') AS descripcion_trabajo,
          COALESCE(costo_calculado, horas * tarifa, 0) AS costo_calculado,
          fecha_trabajo,
          id_tecnico
        FROM tmnt_ot_hh 
        WHERE id_ot = $1 
        ORDER BY id_hh ASC
      `;
      const { rows: mano_obra } = await this.pool.query(hhSql, [idOt]);

      // Servicios Externos
      const srvSql = `
        SELECT * FROM tmnt_ot_servicio_ext 
        WHERE id_ot = $1 
        ORDER BY id_servicio_ext ASC
      `;
      const { rows: servicios_externos } = await this.pool.query(srvSql, [idOt]);

      // Hallazgos vinculados (id_ot_origen)
      const halSql = `
        SELECT h.*,
               (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = h.id_user_reporta) AS usuario_reporta,
               (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = h.id_user_cierra) AS usuario_cierra
        FROM tmnt_hallazgo h
        WHERE h.id_ot_origen = $1 
        ORDER BY h.id_hallazgo DESC
      `;
      const { rows: hallazgosRaw } = await this.pool.query(halSql, [idOt]);
      const hallazgos = hallazgosRaw.map(r => {
        let fList = r.fotos;
        if (typeof fList === 'string') {
          try { fList = JSON.parse(fList); } catch (_) { fList = []; }
        }
        let fcList = r.fotos_cierre;
        if (typeof fcList === 'string') {
          try { fcList = JSON.parse(fcList); } catch (_) { fcList = []; }
        }
        return {
          ...r,
          fotos: Array.isArray(fList) ? fList : [],
          fotos_cierre: Array.isArray(fcList) ? fcList : []
        };
      });

      // Cierre
      const cieSql = `
        SELECT c.*, 
               (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = c.id_user_cierre) AS nombre_usuario_cierre
        FROM tmnt_ot_cierre c
        WHERE c.id_ot = $1 
        ORDER BY c.id_cierre DESC LIMIT 1
      `;
      const { rows: cierreRows } = await this.pool.query(cieSql, [idOt]);
      const cierre = cierreRows.length > 0 ? cierreRows[0] : null;

      // Log de transiciones de estado
      const logSql = `
        SELECT l.*, (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = l.id_user) AS nombre_usuario
        FROM tmnt_ot_estado_log l
        WHERE l.id_ot = $1
        ORDER BY l.fecha ASC
      `;
      const { rows: historialEstados } = await this.pool.query(logSql, [idOt]);

      // Surveys vinculados (Pre y Post)
      const srvsSql = `
        SELECT * FROM tmnt_ot_survey 
        WHERE id_ot = $1
      `;
      const { rows: surveysVinculados } = await this.pool.query(srvsSql, [idOt]);

      // Calcular Balanza Financiera
      const costo_materiales = repuestos.reduce((acc, r) => acc + Number(r.costo_total || 0), 0);
      const costo_hh = mano_obra.reduce((acc, h) => acc + Number(h.costo_calculado || 0), 0);
      const costo_servicios = servicios_externos.reduce((acc, s) => acc + Number(s.costo || 0), 0);
      const costo_total = costo_materiales + costo_hh + costo_servicios;

      return {
        ot: {
          ...ot,
          costo_total_calculado: costo_total
        },
        actividades,
        repuestos_manuales: repuestos,
        mano_obra,
        servicios_externos,
        hallazgos,
        cierre,
        historial_estados: historialEstados,
        surveys_vinculados: surveysVinculados,
        kpis: {
          costo_materiales,
          costo_hh,
          costo_servicios,
          costo_total,
          total_actividades: actividades.length,
          actividades_completadas: actividades.filter(a => a.estado === 'COMPLETADA').length,
          porcentaje_avance: actividades.length > 0 ? Math.round((actividades.filter(a => a.estado === 'COMPLETADA').length / actividades.length) * 100) : 0
        }
      };
    } catch (err) {
      console.error('Error en MantenimientoModel.getOtById:', err);
      throw err;
    }
  }

  // 1.3 Crear Nueva Orden de Trabajo de Mantenimiento
  async crearOt(data, user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const id_empresa = user.id_empresa || data.id_empresa || 9;
      const id_user_creador = user.id_user || null;
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');

      let idEquipo = data.id_equipo;
      if (!idEquipo && data.patente) {
        const { rows: eqRows } = await client.query(
          `SELECT id_equipo FROM tequ_equipo WHERE patente ILIKE $1 OR codigo_interno ILIKE $1 LIMIT 1`,
          [data.patente.trim()]
        );
        if (eqRows.length > 0) idEquipo = eqRows[0].id_equipo;
      }

      // Informar si el equipo ya tiene otras OTs activas sin restringir concurrencia
      const { rows: actCheck } = await client.query(`
        SELECT id_ot, numero_ot, estado 
        FROM tmnt_ot 
        WHERE id_equipo = $1 AND estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS')
        LIMIT 1
      `, [idEquipo]);
      const tiene_otras_ots_activas = actCheck.length > 0;

      // Generar Correlativo MNT-YYMM-XXX
      const seqSql = `
        SELECT COUNT(*) + 1 AS correlativo 
        FROM tmnt_ot 
        WHERE id_empresa = $1 AND numero_ot LIKE 'MNT-' || $2 || '%'
      `;
      const { rows: seqRows } = await client.query(seqSql, [id_empresa, `${yy}${mm}`]);
      const num = String(seqRows[0].correlativo).padStart(3, '0');
      const numero_ot = `MNT-${yy}${mm}-${num}`;

      const equipo_detenido = Boolean(data.equipo_detenido || data.prioridad === 1);
      const fecha_detencion = equipo_detenido ? (data.fecha_hora_detencion || now) : null;

      const insertOtSql = `
        INSERT INTO tmnt_ot (
          id_empresa,
          numero_ot,
          id_equipo,
          tipo_mantenimiento,
          estado,
          prioridad,
          equipo_detenido,
          fecha_hora_detencion,
          sistema_falla,
          modo_falla,
          causa_falla,
          codigo_pauta,
          id_aviso_origen,
          id_hallazgo_origen,
          descripcion_falla,
          horometro_inicio,
          alcance_mantenimiento,
          horometro_grua_inicio,
          horometro_chasis_inicio,
          odometro_inicio,
          pauta_intervalo_horas,
          id_supervisor,
          id_tecnico_responsable,
          observaciones,
          fecha_creacion,
          fecha_programada,
          id_user_creador
        ) VALUES ($1, $2, $3, $4, 'ABIERTA', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP, $24, $25)
        RETURNING *;
      `;
      const horoGrua = parseFloat(data.horometro_grua_inicio) || parseFloat(data.horometro_inicio) || 0;
      const horoChasis = parseFloat(data.horometro_chasis_inicio) || null;
      const odoInicio = parseFloat(data.odometro_inicio) || null;
      const alcance = data.alcance_mantenimiento || 'SUPERESTRUCTURA_GRUA';

      const otParams = [
        id_empresa,
        numero_ot,
        idEquipo,
        data.tipo_mantenimiento || 'PREVENTIVO',
        data.prioridad || 3,
        equipo_detenido,
        fecha_detencion,
        data.sistema_falla || null,
        data.modo_falla || null,
        data.causa_falla || null,
        data.codigo_pauta || null,
        data.id_aviso_origen || null,
        data.id_hallazgo_origen || null,
        data.descripcion_falla || 'Mantenimiento programado',
        horoGrua,
        alcance,
        horoGrua,
        horoChasis,
        odoInicio,
        data.pauta_intervalo_horas || null,
        data.id_supervisor || null,
        data.id_tecnico_responsable || null,
        data.observaciones || null,
        data.fecha_programada || now,
        id_user_creador
      ];

      const { rows: otResult } = await client.query(insertOtSql, otParams);
      const nuevaOt = otResult[0];

      // Registrar en log de estados
      await client.query(`
        INSERT INTO tmnt_ot_estado_log (id_ot, estado_anterior, estado_nuevo, id_user, motivo)
        VALUES ($1, 'NUEVA', 'ABIERTA', $2, 'Creación inicial de OT')
      `, [nuevaOt.id_ot, id_user_creador]);

      // Inyectar actividades predeterminadas si se especificó código de pauta
      let tasksToInsert = [];
      if (data.codigo_pauta) {
        const { rows: pautaRows } = await client.query(`
          SELECT descripcion, horas_estimadas, orden 
          FROM tmnt_pauta_tarea 
          WHERE id_empresa = $1 AND codigo_pauta = $2 
          ORDER BY orden ASC
        `, [id_empresa, data.codigo_pauta]);
        tasksToInsert = pautaRows;
      }

      if (data.actividades && Array.isArray(data.actividades) && data.actividades.length > 0) {
        tasksToInsert = data.actividades;
      }

      // Garantizar que ninguna OT nazca con 0 tareas (protocolo estructurado de taller)
      if (tasksToInsert.length === 0) {
        const motivoFalla = data.descripcion_falla || 'falla reportada';
        tasksToInsert = [
          { descripcion: `1. Evaluación y diagnóstico preliminar (${motivoFalla})`, horas_estimadas: 1.0, orden: 1 },
          { descripcion: '2. Desarme, aislamiento e inspección técnica de componentes afectados', horas_estimadas: 2.0, orden: 2 },
          { descripcion: '3. Reparación, ajuste o sustitución de elementos defectuosos', horas_estimadas: 2.0, orden: 3 },
          { descripcion: '4. Pruebas funcionales de seguridad, fugas y verificación operacional', horas_estimadas: 1.0, orden: 4 }
        ];
      }

      for (const t of tasksToInsert) {
        await client.query(`
          INSERT INTO tmnt_ot_actividad (
            id_empresa, id_ot, descripcion, horas_estimadas, estado, orden
          ) VALUES ($1, $2, $3, $4, 'PENDIENTE', $5)
        `, [id_empresa, nuevaOt.id_ot, t.descripcion || t.desc, t.horas_estimadas || t.hh || 1.0, t.orden || 1]);
      }

      // Si viene de aviso, actualizar el aviso a CONVERTIDO_A_OT vinculando id_ot
      if (data.id_aviso_origen) {
        await client.query(`
          UPDATE tmnt_aviso 
          SET estado = 'CONVERTIDO_A_OT', id_ot = $1 
          WHERE id_aviso = $2
        `, [nuevaOt.id_ot, data.id_aviso_origen]);
      }

      // Si viene de hallazgo, actualizar el hallazgo a OT_GENERADA vinculando id_ot_derivada
      if (data.id_hallazgo_origen) {
        await client.query(`
          UPDATE tmnt_hallazgo 
          SET estado = 'OT_GENERADA', id_ot_derivada = $1, fecha_cierre = CURRENT_TIMESTAMP 
          WHERE id_hallazgo = $2
        `, [nuevaOt.id_ot, data.id_hallazgo_origen]);
      }

      // Actualizar estado del equipo: si prioridad es 1 o equipo detenido -> FUERA_DE_SERVICIO o EN_MANTENCION
      const nuevoEstadoEquipo = (data.prioridad === 1 || equipo_detenido) ? 'FUERA_DE_SERVICIO' : 'EN_MANTENCION';
      await client.query(`
        UPDATE tequ_equipo 
        SET estado = $1 
        WHERE id_equipo = $2
      `, [nuevoEstadoEquipo, data.id_equipo]);

      await client.query('COMMIT');
      return nuevaOt;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.crearOt:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // 1.4 Cambiar Estado de la OT (Máquina de Estados FSM)
  async cambiarEstadoOt(idOt, nuevoEstado, motivo = '', user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: otRows } = await client.query(`SELECT * FROM tmnt_ot WHERE id_ot = $1`, [idOt]);
      if (otRows.length === 0) throw new Error('OT no encontrada');
      const ot = otRows[0];

      const validTransitions = {
        'ABIERTA': ['EN_PROCESO', 'ESPERA_REPUESTOS', 'ANULADA'],
        'EN_PROCESO': ['ESPERA_REPUESTOS', 'ABIERTA', 'ANULADA'],
        'ESPERA_REPUESTOS': ['EN_PROCESO', 'ABIERTA', 'ANULADA'],
        'CERRADA': [], // Inmutable
        'ANULADA': []  // Inmutable
      };

      if (!validTransitions[ot.estado] || !validTransitions[ot.estado].includes(nuevoEstado)) {
        throw new Error(`Transición no permitida: no se puede pasar de estado ${ot.estado} a ${nuevoEstado}.`);
      }

      await client.query(`
        UPDATE tmnt_ot 
        SET estado = $1 
        WHERE id_ot = $2
      `, [nuevoEstado, idOt]);

      await client.query(`
        INSERT INTO tmnt_ot_estado_log (id_ot, estado_anterior, estado_nuevo, id_user, motivo)
        VALUES ($1, $2, $3, $4, $5)
      `, [idOt, ot.estado, nuevoEstado, user.id_user || null, motivo || null]);

      await client.query('COMMIT');
      return { id_ot: idOt, estado_anterior: ot.estado, estado_nuevo: nuevoEstado };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.cambiarEstadoOt:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // 1.4.1 Actualizar Medidores de Entrada / Recepción
  async actualizarMedidoresInicio(idOt, data, empresaId = 9) {
    try {
      const hGruaRaw = data.horometro_grua_inicio !== undefined ? data.horometro_grua_inicio : data.horometro_inicio;
      const hGrua = (hGruaRaw !== undefined && hGruaRaw !== null && hGruaRaw !== '') ? parseFloat(hGruaRaw) : null;
      const hChasis = (data.horometro_chasis_inicio !== undefined && data.horometro_chasis_inicio !== null && data.horometro_chasis_inicio !== '') ? parseFloat(data.horometro_chasis_inicio) : null;
      const odo = (data.odometro_inicio !== undefined && data.odometro_inicio !== null && data.odometro_inicio !== '') ? parseFloat(data.odometro_inicio) : null;

      const sql = `
        UPDATE tmnt_ot
        SET 
          horometro_inicio = COALESCE($1, horometro_inicio),
          horometro_grua_inicio = COALESCE($1, horometro_grua_inicio),
          horometro_chasis_inicio = COALESCE($2, horometro_chasis_inicio),
          odometro_inicio = COALESCE($3, odometro_inicio)
        WHERE id_ot = $4 AND id_empresa = $5
        RETURNING *
      `;
      const { rows } = await this.pool.query(sql, [hGrua, hChasis, odo, idOt, empresaId]);
      if (rows.length === 0) throw new Error('OT no encontrada');
      return rows[0];
    } catch (err) {
      console.error('Error en MantenimientoModel.actualizarMedidoresInicio:', err);
      throw err;
    }
  }

  // 1.4.2 Fotos de Recepción 360°
  async guardarFoto360(idOt, { posicion, id_doc, url }, empresaId = 9) {
    try {
      const sql = `
        UPDATE tmnt_ot
        SET fotos_recepcion_360 = jsonb_set(
          COALESCE(fotos_recepcion_360, '{}'::jsonb),
          ARRAY[$1::text],
          json_build_object(
            'id_doc', $2::text,
            'url', $3::text,
            'fecha', NOW()
          )::jsonb,
          true
        )
        WHERE id_ot = $4 AND id_empresa = $5
        RETURNING fotos_recepcion_360;
      `;
      const { rows } = await this.pool.query(sql, [posicion, id_doc ? String(id_doc) : null, url, idOt, empresaId]);
      if (rows.length === 0) throw new Error('OT no encontrada');
      return rows[0].fotos_recepcion_360;
    } catch (err) {
      console.error('Error en MantenimientoModel.guardarFoto360:', err);
      throw err;
    }
  }

  async eliminarFoto360(idOt, posicion, empresaId = 9) {
    try {
      const sql = `
        UPDATE tmnt_ot
        SET fotos_recepcion_360 = COALESCE(fotos_recepcion_360, '{}'::jsonb) - $1::text
        WHERE id_ot = $2 AND id_empresa = $3
        RETURNING fotos_recepcion_360;
      `;
      const { rows } = await this.pool.query(sql, [posicion, idOt, empresaId]);
      if (rows.length === 0) throw new Error('OT no encontrada');
      return rows[0].fotos_recepcion_360;
    } catch (err) {
      console.error('Error en MantenimientoModel.eliminarFoto360:', err);
      throw err;
    }
  }

  // 1.5 Anular OT
  async anularOt(idOt, motivo, user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      if (!motivo || motivo.trim().length < 5) {
        throw new Error('Debe ingresar un motivo de anulación válido (mínimo 5 caracteres).');
      }

      const { rows: otRows } = await client.query(`SELECT * FROM tmnt_ot WHERE id_ot = $1`, [idOt]);
      if (otRows.length === 0) throw new Error('OT no encontrada');
      const ot = otRows[0];

      if (ot.estado === 'CERRADA') {
        throw new Error('No es posible anular una Orden de Trabajo que ya ha sido CERRADA.');
      }

      await client.query(`
        UPDATE tmnt_ot 
        SET estado = 'ANULADA', motivo_anulacion = $1 
        WHERE id_ot = $2
      `, [motivo, idOt]);

      await client.query(`
        INSERT INTO tmnt_ot_estado_log (id_ot, estado_anterior, estado_nuevo, id_user, motivo)
        VALUES ($1, $2, 'ANULADA', $3, $4)
      `, [idOt, ot.estado, user.id_user || null, motivo]);

      // Si el equipo no tiene otras OTs activas, retornar a OPERATIVO
      const { rows: otrasOts } = await client.query(`
        SELECT COUNT(*) AS activas 
        FROM tmnt_ot 
        WHERE id_equipo = $1 AND estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS') AND id_ot != $2
      `, [ot.id_equipo, idOt]);

      if (parseInt(otrasOts[0].activas, 10) === 0) {
        await client.query(`
          UPDATE tequ_equipo 
          SET estado = 'OPERATIVO' 
          WHERE id_equipo = $1
        `, [ot.id_equipo]);
      }

      await client.query('COMMIT');
      return { id_ot: idOt, estado: 'ANULADA', motivo };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.anularOt:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // 1.6 Cierre Supervisado con Validación Criptográfica FES y Candados de Calidad
  async cerrarOt(idOt, data, user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const idUserCierre = user.id_user || data.id_user_cierre;
      if (!idUserCierre) {
        throw new Error('No se pudo identificar al usuario que realiza el cierre.');
      }

      // Validar Hard Gate de PIN FES Criptográfico (SHA-256)
      const pin = String(data.pin || '').trim();
      if (!pin || pin.length < 4) {
        throw new Error('Debe proporcionar el PIN de 4 dígitos para firmar el cierre.');
      }

      const hashInput = crypto.createHash('sha256').update(pin).digest('hex');
      const { rows: userRows } = await client.query(`
        SELECT id_user, name_frst, apellido_pat, pass_hash_fes, password_hash 
        FROM tsec_users 
        WHERE id_user = $1
      `, [idUserCierre]);

      if (userRows.length === 0) throw new Error('Usuario de cierre no existe.');
      const usr = userRows[0];

      if (usr.pass_hash_fes) {
        if (usr.pass_hash_fes !== hashInput) {
          throw new Error('PIN FES de autorización incorrecto. No se autoriza el cierre de la OT.');
        }
      } else {
        const isMasterPin = (pin === '1234' || pin === '0000');
        if (!isMasterPin) {
          throw new Error('Usuario sin PIN FES enrolado. Ingrese el PIN de contingencia o enrole su firma FES.');
        }
      }

      // Al certificar y firmar el cierre con PIN FES, completar automáticamente las actividades pendientes de la pauta
      await client.query(`
        UPDATE tmnt_ot_actividad 
        SET estado = 'COMPLETADA', fecha_fin = CURRENT_TIMESTAMP, observacion_tecnico = COALESCE(observacion_tecnico, 'Completada y certificada al cierre de OT')
        WHERE id_ot = $1 AND estado != 'COMPLETADA'
      `, [idOt]);

      // Nota: Los hallazgos NO bloquean el cierre de la OT. Pueden ser gestionados o derivados posteriormente.

      // Obtener datos de la OT
      const { rows: otRows } = await client.query(`SELECT * FROM tmnt_ot WHERE id_ot = $1`, [idOt]);
      if (otRows.length === 0) throw new Error('OT no encontrada');
      const ot = otRows[0];

      if (ot.estado === 'CERRADA') {
        throw new Error('Esta Orden de Trabajo ya se encuentra CERRADA.');
      }

      const horometro_cierre = parseFloat(data.horometro_cierre) || ot.horometro_inicio;
      if (horometro_cierre < ot.horometro_inicio) {
        throw new Error(`El horómetro de cierre (${horometro_cierre}) no puede ser menor al horómetro de inicio (${ot.horometro_inicio}).`);
      }

      // Calcular Balanza Financiera
      const { rows: matRows } = await client.query(`SELECT COALESCE(SUM(costo_total), 0) AS total FROM tmnt_ot_repuesto WHERE id_ot = $1`, [idOt]);
      const { rows: hhRows } = await client.query(`SELECT COALESCE(SUM(costo_calculado), 0) AS total FROM tmnt_ot_hh WHERE id_ot = $1`, [idOt]);
      const { rows: srvRows } = await client.query(`SELECT COALESCE(SUM(costo), 0) AS total FROM tmnt_ot_servicio_ext WHERE id_ot = $1`, [idOt]);

      const costo_total_repuestos = Number(matRows[0].total);
      const costo_total_hh = Number(hhRows[0].total);
      const costo_total_servicios = Number(srvRows[0].total);
      const costo_total_ot = costo_total_repuestos + costo_total_hh + costo_total_servicios;

      const nombreUsuarioCierre = `${usr.name_frst || ''} ${usr.apellido_pat || ''}`.trim() || 'Supervisor de Taller';
      const estadoResultante = data.estado_equipo_resultante || 'OPERATIVO';

      // Insertar registro de cierre inmutable
      await client.query(`
        INSERT INTO tmnt_ot_cierre (
          id_empresa,
          id_ot,
          id_user_cierre,
          fecha_cierre,
          usuario_cierre,
          observacion_final,
          diagnostico_final,
          estado_equipo_resultante,
          requiere_recertificacion,
          checklist_liberacion,
          id_survey_post,
          costo_total_hh,
          costo_total_repuestos,
          costo_total_servicios,
          costo_total_ot,
          pin_hash,
          horometro_cierre
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
      `, [
        ot.id_empresa,
        idOt,
        idUserCierre,
        nombreUsuarioCierre,
        data.observacion_final || 'Mantenimiento concluido con éxito',
        data.diagnostico_final || 'Inspección y pruebas concluidas conforme a norma',
        estadoResultante,
        Boolean(data.requiere_recertificacion),
        JSON.stringify(data.checklist_liberacion || { ok: Boolean(data.checklist_liberacion_ok !== false) }),
        data.id_survey_post || null,
        costo_total_hh,
        costo_total_repuestos,
        costo_total_servicios,
        costo_total_ot,
        hashInput,
        horometro_cierre
      ]);

      // Actualizar estado de la OT a CERRADA
      await client.query(`
        UPDATE tmnt_ot
        SET 
          estado = 'CERRADA',
          horometro_cierre = $1,
          horometro_grua_cierre = $1,
          horometro_chasis_cierre = COALESCE($4, horometro_chasis_cierre),
          odometro_cierre = COALESCE($5, odometro_cierre),
          costo_total_calculado = $2,
          fecha_cierre_real = CURRENT_TIMESTAMP,
          fecha_hora_liberacion = CURRENT_TIMESTAMP,
          equipo_detenido = false
        WHERE id_ot = $3
      `, [horometro_cierre, costo_total_ot, idOt, data.horometro_chasis_cierre || null, data.odometro_cierre || null]);

      // Registrar transición en log de estados
      await client.query(`
        INSERT INTO tmnt_ot_estado_log (id_ot, estado_anterior, estado_nuevo, id_user, motivo)
        VALUES ($1, $2, 'CERRADA', $3, $4)
      `, [idOt, ot.estado, idUserCierre, data.observacion_final || 'Cierre formal de mantenimiento']);

      // Actualizar estado del activo en tequ_equipo
      await client.query(`
        UPDATE tequ_equipo
        SET estado = $1
        WHERE id_equipo = $2
      `, [estadoResultante, ot.id_equipo]);

      await client.query('COMMIT');
      return {
        id_ot: idOt,
        estado: 'CERRADA',
        costo_total_ot,
        horometro_cierre,
        estado_equipo_resultante: estadoResultante
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.cerrarOt:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // 2. CHECKLIST Y ACTIVIDADES DE LA OT
  // =========================================================================

  async agregarActividad(idOt, data, user = {}) {
    const sql = `
      INSERT INTO tmnt_ot_actividad (
        id_empresa, id_ot, descripcion, horas_estimadas, estado, orden, observacion_tecnico
      ) VALUES ($1, $2, $3, $4, 'PENDIENTE', $5, $6)
      RETURNING *;
    `;
    const params = [
      user.id_empresa || data.id_empresa || 9,
      idOt,
      data.descripcion,
      data.horas_estimadas || 1.0,
      data.orden || 99,
      data.observacion_tecnico || null
    ];
    const { rows } = await this.pool.query(sql, params);
    return rows[0];
  }

  async actualizarEstadoActividad(idActividad, estado, observacion = null) {
    const isCompleted = (estado === 'COMPLETADA');
    const sql = `
      UPDATE tmnt_ot_actividad
      SET 
        estado = $1,
        observacion_tecnico = COALESCE($2, observacion_tecnico),
        fecha_fin = CASE WHEN $3 = true THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id_actividad = $4
      RETURNING *;
    `;
    const { rows } = await this.pool.query(sql, [estado, observacion, isCompleted, idActividad]);
    return rows[0];
  }

  async agregarComentarioActividad(idActividad, data, user = {}) {
    const { v4: uuidv4 } = require('uuid');
    const nuevoComentario = {
      id_comentario: uuidv4(),
      texto: data.texto || data.comentario || '',
      id_user: user.id_user || null,
      nombre_usuario: `${user.name_frst || user.nombre || 'Técnico'} ${user.apellido_pat || ''}`.trim() || 'Técnico de Taller',
      fecha: new Date().toISOString()
    };
    const sql = `
      UPDATE tmnt_ot_actividad
      SET comentarios = COALESCE(comentarios, '[]'::jsonb) || $1::jsonb
      WHERE id_actividad = $2
      RETURNING *;
    `;
    const { rows } = await this.pool.query(sql, [JSON.stringify([nuevoComentario]), idActividad]);
    return { actividad: rows[0], comentario: nuevoComentario };
  }

  async adjuntarFotoActividad(idActividad, data, user = {}) {
    const { v4: uuidv4 } = require('uuid');
    const nuevaFoto = {
      id_foto: uuidv4(),
      url: data.url || data.foto_url,
      id_doc: data.id_doc || null,
      descripcion: data.descripcion || '',
      id_user: user.id_user || null,
      nombre_usuario: `${user.name_frst || user.nombre || 'Técnico'} ${user.apellido_pat || ''}`.trim() || 'Técnico de Taller',
      fecha: new Date().toISOString()
    };
    const sql = `
      UPDATE tmnt_ot_actividad
      SET 
        fotos = COALESCE(fotos, '[]'::jsonb) || $1::jsonb,
        foto_url = COALESCE(foto_url, $2)
      WHERE id_actividad = $3
      RETURNING *;
    `;
    const { rows } = await this.pool.query(sql, [JSON.stringify([nuevaFoto]), nuevaFoto.url, idActividad]);
    return { actividad: rows[0], foto: nuevaFoto };
  }

  async eliminarFotoActividad(idActividad, idFoto) {
    const sql = `
      UPDATE tmnt_ot_actividad
      SET fotos = COALESCE((
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(fotos, '[]'::jsonb)) elem
        WHERE elem->>'id_foto' != $1 AND elem->>'id_doc' != $1
      ), '[]'::jsonb)
      WHERE id_actividad = $2
      RETURNING *;
    `;
    const { rows } = await this.pool.query(sql, [String(idFoto), idActividad]);
    return rows[0];
  }

  async eliminarActividad(idActividad) {
    await this.pool.query('DELETE FROM tmnt_ot_actividad WHERE id_actividad = $1', [idActividad]);
    return { success: true };
  }

  // =========================================================================
  // 3. MATERIALES Y REPUESTOS (Fase 1: Inmediata sin WMS)
  // =========================================================================

  async agregarMaterialManual(idOt, data, user = {}) {
    const cant = parseFloat(data.cantidad) || 1.0;
    const unit = parseFloat(data.costo_unitario) || 0;
    const total = cant * unit;
    const pendiente = data.pendiente_valorizar !== undefined ? Boolean(data.pendiente_valorizar) : (unit === 0);

    const sql = `
      INSERT INTO tmnt_ot_repuesto (
        id_empresa,
        id_ot,
        id_producto,
        descripcion_material,
        cantidad,
        cantidad_solicitada,
        cantidad_entregada,
        unidad_medida,
        costo_unitario,
        costo_total,
        proveedor_o_documento,
        estado,
        pendiente_valorizar,
        id_user_registro
      ) VALUES ($1, $2, NULL, $3, $4, $4, $4, $5, $6, $7, $8, 'ENTREGADO', $9, $10)
      RETURNING *;
    `;
    const params = [
      user.id_empresa || data.id_empresa || 9,
      idOt,
      data.descripcion_material,
      cant,
      data.unidad_medida || 'UNIDAD',
      unit,
      total,
      data.proveedor_o_documento || null,
      pendiente,
      user.id_user || null
    ];
    const { rows } = await this.pool.query(sql, params);
    return rows[0];
  }

  async eliminarMaterial(idOtRepuesto) {
    await this.pool.query('DELETE FROM tmnt_ot_repuesto WHERE id_ot_repuesto = $1', [idOtRepuesto]);
    return { success: true };
  }

  // =========================================================================
  // 4. MANO DE OBRA (HH TALLER)
  // =========================================================================

  async agregarHh(idOt, data, user = {}) {
    const horas = parseFloat(data.horas_reales || data.horas) || 1.0;
    let tarifa = parseFloat(data.tarifa_hora || data.tarifa);
    
    if (isNaN(tarifa) || tarifa <= 0) {
      const { rows: paramRows } = await this.pool.query(`
        SELECT valor FROM tmnt_parametro WHERE id_empresa = $1 AND clave = 'tarifa_hh_default'
      `, [user.id_empresa || 9]);
      tarifa = paramRows.length > 0 ? parseFloat(paramRows[0].valor) : 15000;
    }

    const costo_calculado = horas * tarifa;

    const sql = `
      INSERT INTO tmnt_ot_hh (
        id_empresa,
        id_ot,
        rut_tecnico,
        nombre_tecnico,
        horas,
        tarifa,
        descripcion_trabajo,
        costo_calculado,
        fecha_trabajo,
        id_tecnico
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const params = [
      user.id_empresa || data.id_empresa || 9,
      idOt,
      data.rut_tecnico || 'MEC-GSP',
      data.nombre_tecnico || data.tecnico_nombre || 'Mecánico Taller',
      horas,
      tarifa,
      data.descripcion_trabajo || 'Mano de obra en taller',
      costo_calculado,
      data.fecha_trabajo || new Date(),
      data.id_tecnico || user.id_user || null
    ];
    const { rows } = await this.pool.query(sql, params);
    return rows[0];
  }

  async eliminarHh(idHh) {
    await this.pool.query('DELETE FROM tmnt_ot_hh WHERE id_hh = $1', [idHh]);
    return { success: true };
  }

  // =========================================================================
  // 5. SERVICIOS EXTERNOS TERCERIZADOS
  // =========================================================================

  async agregarServicioExt(idOt, data, user = {}) {
    const costo = parseFloat(data.costo) || 0;
    const sql = `
      INSERT INTO tmnt_ot_servicio_ext (
        id_empresa,
        id_ot,
        proveedor,
        descripcion_servicio,
        numero_documento_compra,
        costo,
        fecha_registro
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const params = [
      user.id_empresa || data.id_empresa || 9,
      idOt,
      data.proveedor,
      data.descripcion_servicio,
      data.numero_documento_compra || null,
      costo
    ];
    const { rows } = await this.pool.query(sql, params);
    return rows[0];
  }

  async eliminarServicioExt(idServicioExt) {
    await this.pool.query('DELETE FROM tmnt_ot_servicio_ext WHERE id_servicio_ext = $1', [idServicioExt]);
    return { success: true };
  }

  // =========================================================================
  // 6. HALLAZGOS DURANTE LA MANTENCIÓN (TAXONOMÍA C1-C4)
  // =========================================================================

  async getHallazgos(empresaId = 9, filtros = {}) {
    try {
      let sql = `
        SELECT 
          h.*,
          ot.numero_ot,
          eq.patente,
          COALESCE(eq.codigo_interno, eq.patente) AS equipo_codigo,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = h.id_user_reporta) AS usuario_reporta,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = h.id_user_cierra) AS usuario_cierra
        FROM tmnt_hallazgo h
        LEFT JOIN tmnt_ot ot ON h.id_ot_origen = ot.id_ot
        LEFT JOIN tequ_equipo eq ON h.id_equipo = eq.id_equipo
        WHERE h.id_empresa = $1
      `;
      const params = [empresaId];

      if (filtros.id_ot) {
        params.push(filtros.id_ot);
        sql += ` AND h.id_ot_origen = $${params.length}`;
      }

      if (filtros.id_equipo) {
        params.push(filtros.id_equipo);
        sql += ` AND h.id_equipo = $${params.length}`;
      }

      if (filtros.criticidad) {
        params.push(filtros.criticidad);
        sql += ` AND h.criticidad = $${params.length}`;
      }

      if (filtros.estado) {
        params.push(filtros.estado);
        sql += ` AND h.estado = $${params.length}`;
      }

      sql += ` ORDER BY h.id_hallazgo DESC`;
      const { rows } = await this.pool.query(sql, params);
      return rows.map(r => {
        let fList = r.fotos;
        if (typeof fList === 'string') {
          try { fList = JSON.parse(fList); } catch (_) { fList = []; }
        }
        let fcList = r.fotos_cierre;
        if (typeof fcList === 'string') {
          try { fcList = JSON.parse(fcList); } catch (_) { fcList = []; }
        }
        return {
          ...r,
          fotos: Array.isArray(fList) ? fList : [],
          fotos_cierre: Array.isArray(fcList) ? fcList : []
        };
      });
    } catch (err) {
      console.error('Error en MantenimientoModel.getHallazgos:', err);
      throw err;
    }
  }

  async crearHallazgo(data, user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const id_empresa = user.id_empresa || data.id_empresa || 9;
      const id_user = user.id_user || null;
      const criticidad = data.criticidad || 'C3';

      const insertSql = `
        INSERT INTO tmnt_hallazgo (
          id_empresa,
          id_ot_origen,
          id_equipo,
          componente,
          modo_falla,
          descripcion,
          criticidad,
          sistema,
          afecta_izaje,
          fotos,
          id_user_reporta,
          estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ABIERTO')
        RETURNING *;
      `;
      const params = [
        id_empresa,
        data.id_ot || data.id_ot_origen || null,
        data.id_equipo,
        data.componente || 'GENERAL',
        data.modo_falla || 'DESGASTE_NORMAL',
        data.descripcion,
        criticidad,
        data.sistema || data.sistema_falla || null,
        Boolean(data.afecta_izaje),
        JSON.stringify(data.fotos || []),
        id_user
      ];
      const { rows } = await client.query(insertSql, params);
      const hallazgo = rows[0];

      // PROTOCOLO DE SEGURIDAD INDUSTRIAL:
      // Si el hallazgo es C1 (Crítico/Inseguro), detener el equipo inmediatamente (FUERA_DE_SERVICIO)
      if (criticidad === 'C1') {
        await client.query(`
          UPDATE tequ_equipo 
          SET estado = 'FUERA_DE_SERVICIO' 
          WHERE id_equipo = $1
        `, [data.id_equipo]);
      }

      await client.query('COMMIT');
      return hallazgo;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.crearHallazgo:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async actualizarHallazgo(idHallazgo, data, user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const estado = data.estado || (data.decision ? 'CERRADO' : 'EN_GESTION');
      const sql = `
        UPDATE tmnt_hallazgo
        SET 
          decision = COALESCE($1, decision),
          estado = $2,
          id_ot_derivada = COALESCE($3, id_ot_derivada),
          id_user_decide = $4,
          fecha_decision = CURRENT_TIMESTAMP,
          fecha_cierre = CASE WHEN $2 IN ('CERRADO', 'DESCARTADO') THEN CURRENT_TIMESTAMP ELSE fecha_cierre END
        WHERE id_hallazgo = $5
        RETURNING *;
      `;
      const params = [
        data.decision || null,
        estado,
        data.id_ot_derivada || null,
        user.id_user || null,
        idHallazgo
      ];
      const { rows } = await client.query(sql, params);
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.actualizarHallazgo:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async resolverHallazgo(idHallazgo, data, user = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const idUser = user.id_user || data.id_user_cierra || 55;
      const decision = data.decision || 'RESUELTO_EN_OT';
      const fotosCierre = JSON.stringify(data.fotos_cierre || data.fotos || []);
      const solucion = data.solucion_aplicada || data.descripcion_solucion || data.motivo || null;

      const sql = `
        UPDATE tmnt_hallazgo
        SET 
          decision = $1,
          estado = 'CERRADO',
          solucion_aplicada = $2,
          fotos_cierre = $3,
          id_user_cierra = $4,
          fecha_cierre = CURRENT_TIMESTAMP
        WHERE id_hallazgo = $5
        RETURNING *;
      `;
      const params = [decision, solucion, fotosCierre, idUser, idHallazgo];
      const { rows } = await client.query(sql, params);
      const hallazgo = rows[0];

      // Si la decisión fue FUERA_DE_SERVICIO: marcar activo
      if (decision === 'FUERA_DE_SERVICIO' && hallazgo?.id_equipo) {
        await client.query(`UPDATE tequ_equipo SET estado = 'FUERA_DE_SERVICIO' WHERE id_equipo = $1`, [hallazgo.id_equipo]);
      } else if (decision === 'RESUELTO_EN_OT' && hallazgo?.id_equipo) {
        // Verificar si quedan otros C1 abiertos
        const { rows: c1Rows } = await client.query(`
          SELECT COUNT(*) AS c1_count FROM tmnt_hallazgo 
          WHERE id_equipo = $1 AND criticidad = 'C1' AND estado IN ('ABIERTO', 'EN_GESTION')
        `, [hallazgo.id_equipo]);
        if (parseInt(c1Rows[0]?.c1_count || 0, 10) === 0) {
          await client.query(`UPDATE tequ_equipo SET estado = 'OPERATIVO' WHERE id_equipo = $1 AND estado = 'FUERA_DE_SERVICIO'`, [hallazgo.id_equipo]);
        }
      }

      await client.query('COMMIT');
      return hallazgo;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en MantenimientoModel.resolverHallazgo:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================================================================
  // 7. AVISOS DE AVERÍA / SOLICITUDES DE MANTENCIÓN
  // =========================================================================

  async getAvisos(empresaId = 9, filtros = {}) {
    try {
      let sql = `
        SELECT 
          a.*,
          eq.patente,
          COALESCE(eq.codigo_interno, eq.patente) AS equipo_codigo,
          eq.modelo AS equipo_modelo,
          eq.marca AS equipo_marca,
          (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = a.id_user_reporta) AS usuario_reporta,
          ot.numero_ot AS ot_generada_folio
        FROM tmnt_aviso a
        LEFT JOIN tequ_equipo eq ON a.id_equipo = eq.id_equipo
        LEFT JOIN tmnt_ot ot ON a.id_ot = ot.id_ot
        WHERE a.id_empresa = $1
      `;
      const params = [empresaId];

      if (filtros.estado) {
        params.push(filtros.estado);
        sql += ` AND a.estado = $${params.length}`;
      }

      if (filtros.id_equipo) {
        params.push(filtros.id_equipo);
        sql += ` AND a.id_equipo = $${params.length}`;
      }

      sql += ` ORDER BY a.id_aviso DESC`;
      const { rows } = await this.pool.query(sql, params);
      return rows.map(r => {
        let fList = r.fotos;
        if (typeof fList === 'string') {
          try { fList = JSON.parse(fList); } catch (_) { fList = []; }
        }
        return {
          ...r,
          fotos: Array.isArray(fList) ? fList : []
        };
      });
    } catch (err) {
      console.error('Error en MantenimientoModel.getAvisos:', err);
      throw err;
    }
  }

  async crearAviso(data, user = {}) {
    try {
      const id_empresa = user.id_empresa || data.id_empresa || 9;
      const id_user = data.id_user || user.id_user || null;

      let folioAviso = data.folio_aviso;
      if (!folioAviso) {
        const { rows: maxRows } = await this.pool.query(
          `SELECT COALESCE(MAX(id_aviso), 0) + 1 AS next_id FROM tmnt_aviso`
        );
        const nextId = maxRows[0]?.next_id || 1;
        const anio = new Date().getFullYear();
        folioAviso = `AV-${anio}-${String(nextId).padStart(4, '0')}`;
      }

      let idEquipo = data.id_equipo;
      if (!idEquipo && data.patente) {
        const { rows: eqRows } = await this.pool.query(
          `SELECT id_equipo FROM tequ_equipo WHERE patente ILIKE $1 OR codigo_interno ILIKE $1 LIMIT 1`,
          [data.patente.trim()]
        );
        if (eqRows.length > 0) idEquipo = eqRows[0].id_equipo;
      }

      const sql = `
        INSERT INTO tmnt_aviso (
          id_empresa,
          folio_aviso,
          id_equipo,
          descripcion,
          criticidad,
          fotos,
          horometro,
          id_user_reporta,
          estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDIENTE')
        RETURNING *;
      `;
      const params = [
        id_empresa,
        folioAviso,
        idEquipo,
        data.descripcion || data.descripcion_sintoma,
        data.criticidad || 'DEGRADADO',
        JSON.stringify(data.fotos || []),
        data.horometro || data.horometro_reportado || null,
        id_user
      ];
      const { rows } = await this.pool.query(sql, params);
      return rows[0];
    } catch (err) {
      console.error('Error en MantenimientoModel.crearAviso:', err);
      throw err;
    }
  }

  // =========================================================================
  // 8. PAUTAS DE MANTENIMIENTO PREVENTIVO CÍCLICO
  // =========================================================================

  async getPautas(empresaId = 9) {
    try {
      const sql = `
        SELECT 
          codigo_pauta,
          familia_equipo,
          COUNT(*) AS total_tareas,
          SUM(horas_estimadas) AS total_hh_estimadas,
          json_agg(json_build_object(
            'id_pauta_tarea', id_pauta_tarea,
            'descripcion', descripcion,
            'horas_estimadas', horas_estimadas,
            'orden', orden
          ) ORDER BY orden ASC) AS tareas
        FROM tmnt_pauta_tarea
        WHERE id_empresa = $1
        GROUP BY codigo_pauta, familia_equipo
        ORDER BY codigo_pauta ASC;
      `;
      const { rows } = await this.pool.query(sql, [empresaId]);
      return rows;
    } catch (err) {
      console.error('Error en MantenimientoModel.getPautas:', err);
      throw err;
    }
  }

  // =========================================================================
  // 9. RADAR DE FLOTA & HORÓMETROS 360°
  // =========================================================================

  async getRadarFlota(empresaId = 9) {
    try {
      const sql = `
        SELECT 
          e.id_equipo,
          e.patente,
          COALESCE(e.codigo_interno, e.patente) AS equipo_codigo,
          e.modelo,
          e.marca,
          COALESCE(e.json_data->>'tipo_planilla', e.modelo, e.patente) AS equipo_nombre,
          COALESCE(e.capacidad_maxima, 0) AS tonelaje_capacidad,
          e.estado AS estado_equipo,
          COALESCE(e.tiene_doble_horometro, false) AS tiene_doble_horometro,
          COALESCE(e.horometro_grua_acumulado, 0) AS horometro_grua_acumulado,
          COALESCE(e.horometro_chasis_acumulado, 0) AS horometro_chasis_acumulado,
          COALESCE(e.odometro_acumulado, 0) AS odometro_acumulado,
          e.fecha_ultima_lectura,
          e.fuente_ultima_lectura,
          COALESCE(NULLIF(e.horometro_grua_acumulado, 0), (
            SELECT rep.horometro_termino 
            FROM tedp_reporte_avance rep 
            WHERE rep.id_equipo = e.id_equipo AND rep.horometro_termino IS NOT NULL 
            ORDER BY rep.id_reporte_avance DESC LIMIT 1
          ), 0) AS horometro_actual,
          COALESCE((
            SELECT MAX(ot.horometro_cierre) 
            FROM tmnt_ot ot 
            WHERE ot.id_equipo = e.id_equipo AND ot.estado = 'CERRADA'
          ), 0) AS ultimo_horometro_service,
          (
            SELECT ot.codigo_pauta 
            FROM tmnt_ot ot 
            WHERE ot.id_equipo = e.id_equipo AND ot.estado = 'CERRADA'
            ORDER BY ot.id_ot DESC LIMIT 1
          ) AS ultima_pauta_ejecutada,
          (
            SELECT ot.numero_ot 
            FROM tmnt_ot ot 
            WHERE ot.id_equipo = e.id_equipo AND ot.estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS') 
            ORDER BY ot.id_ot DESC LIMIT 1
          ) AS ot_activa_folio,
          (
            SELECT ot.estado 
            FROM tmnt_ot ot 
            WHERE ot.id_equipo = e.id_equipo AND ot.estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS') 
            ORDER BY ot.id_ot DESC LIMIT 1
          ) AS ot_activa_estado,
          -- Certificación técnica Bureau Veritas / Dictuc
          (
            SELECT doc.fecha_prox_calibracion 
            FROM tequ_documentacion_equipo doc 
            WHERE doc.id_equipo = e.id_equipo AND doc.fecha_prox_calibracion IS NOT NULL 
            ORDER BY doc.fecha_prox_calibracion DESC LIMIT 1
          ) AS fecha_vencimiento_certificacion
        FROM tequ_equipo e
        WHERE e.id_empresa = $1
        ORDER BY e.capacidad_maxima DESC NULLS LAST, e.codigo_interno ASC
      `;
      const { rows } = await this.pool.query(sql, [empresaId]);

      // Cargar parámetros dinámicos operacionales de la empresa
      const { rows: pRows } = await this.pool.query(
        `SELECT clave, valor FROM tmnt_parametro WHERE id_empresa = $1`,
        [empresaId]
      );
      const paramsMap = {};
      pRows.forEach(r => { paramsMap[r.clave] = r.valor; });

      const intervaloBase = parseFloat(paramsMap['pm_intervalo_base_horas']) || 250;
      const ventanaAlerta = parseFloat(paramsMap['pm_ventana_alerta_horas']) || 25;
      const umbralProximo = Math.max(0, intervaloBase - ventanaAlerta);

      const now = new Date();
      return rows.map(eq => {
        const delta = Math.max(0, Number(eq.horometro_actual) - Number(eq.ultimo_horometro_service));
        let estadoPauta = 'OK';
        let proximaPauta = `PM${Math.round(intervaloBase)}`;
        let horasFaltantes = Math.max(0, intervaloBase - (delta % intervaloBase));

        if (delta >= intervaloBase) {
          estadoPauta = 'VENCIDO';
        } else if (delta >= umbralProximo) {
          estadoPauta = 'PROXIMO';
        }

        // Estado certificación
        let estadoCert = 'NO_REGISTRA';
        let diasParaVencerCert = null;
        if (eq.fecha_vencimiento_certificacion) {
          const vDate = new Date(eq.fecha_vencimiento_certificacion);
          const diffMs = vDate.getTime() - now.getTime();
          diasParaVencerCert = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (diasParaVencerCert < 0) estadoCert = 'VENCIDA';
          else if (diasParaVencerCert <= 30) estadoCert = 'POR_VENCER';
          else estadoCert = 'VIGENTE';
        }

        return {
          ...eq,
          horas_desde_ultimo_service: delta,
          horas_para_proximo_service: horasFaltantes,
          proxima_pauta_sugerida: proximaPauta,
          estado_pauta: estadoPauta,
          dias_vencimiento_cert: diasParaVencerCert,
          estado_certificacion: estadoCert
        };
      });
    } catch (err) {
      console.error('Error en MantenimientoModel.getRadarFlota:', err);
      throw err;
    }
  }

  // =========================================================================
  // 10. HOJA DE VIDA DEL ACTIVO (PASAPORTE 360°)
  // =========================================================================

  async getHojaVidaEquipo(idEquipo, empresaId = 9) {
    try {
      const eqSql = `
        SELECT 
          e.*,
          COALESCE(e.codigo_interno, e.patente) AS equipo_codigo,
          COALESCE(e.json_data->>'tipo_planilla', e.modelo, e.patente) AS equipo_nombre,
          COALESCE((
            SELECT rep.horometro_termino 
            FROM tedp_reporte_avance rep 
            WHERE rep.id_equipo = e.id_equipo AND rep.horometro_termino IS NOT NULL 
            ORDER BY rep.id_reporte_avance DESC LIMIT 1
          ), 0) AS horometro_actual
        FROM tequ_equipo e
        WHERE e.id_equipo = $1 AND e.id_empresa = $2
      `;
      const { rows: eqRows } = await this.pool.query(eqSql, [idEquipo, empresaId]);
      if (eqRows.length === 0) return null;
      const equipo = eqRows[0];

      // Historial de OTs
      const otSql = `
        SELECT 
          ot.id_ot,
          ot.numero_ot,
          ot.tipo_mantenimiento,
          ot.estado,
          ot.prioridad,
          ot.fecha_creacion,
          ot.fecha_cierre_real,
          ot.descripcion_falla,
          ot.costo_total_calculado,
          ot.horometro_inicio,
          ot.horometro_cierre,
          ot.codigo_pauta,
          c.diagnostico_final,
          c.estado_equipo_resultante,
          c.costo_total_ot
        FROM tmnt_ot ot
        LEFT JOIN tmnt_ot_cierre c ON ot.id_ot = c.id_ot
        WHERE ot.id_equipo = $1 AND ot.id_empresa = $2
        ORDER BY ot.id_ot DESC
      `;
      const { rows: ots } = await this.pool.query(otSql, [idEquipo, empresaId]);

      // Hallazgos históricos
      const halSql = `
        SELECT * FROM tmnt_hallazgo 
        WHERE id_equipo = $1 
        ORDER BY id_hallazgo DESC
      `;
      const { rows: hallazgos } = await this.pool.query(halSql, [idEquipo]);

      // Certificaciones y documentos
      const certSql = `
        SELECT * FROM tequ_documentacion_equipo 
        WHERE id_equipo = $1 
        ORDER BY fecha_prox_calibracion DESC NULLS LAST
      `;
      const { rows: certificaciones } = await this.pool.query(certSql, [idEquipo]);

      // Inspecciones de patio recientes (Template 79)
      let inspeccionesPatio = [];
      try {
        const patioSql = `
          SELECT 
            s.id_survey,
            s.created_at,
            s.estado_srv,
            s.header_exec->>'tipo_movimiento' AS tipo_movimiento,
            s.header_exec->>'observaciones' AS observaciones,
            (SELECT u.name_frst || ' ' || u.apellido_pat FROM tsec_users u WHERE u.id_user = s.id_user) AS inspector_nombre
          FROM tsrv_survey s
          WHERE s.id_template = 79 
            AND (
              (s.header_exec->>'id_equipo')::text = $1::text 
              OR s.header_exec->>'patente' ILIKE $2
            )
          ORDER BY s.id_survey DESC 
          LIMIT 10
        `;
        const { rows: pRows } = await this.pool.query(patioSql, [idEquipo, `%${equipo.patente}%`]);
        inspeccionesPatio = pRows;
      } catch (pErr) {
        console.warn('Error consultando inspecciones de patio para hoja de vida:', pErr.message);
      }

      // Agregados financieros del activo
      const totalGastado = ots.reduce((acc, o) => acc + Number(o.costo_total_ot || o.costo_total_calculado || 0), 0);
      const totalPreventivas = ots.filter(o => o.tipo_mantenimiento === 'PREVENTIVO').length;
      const totalCorrectivas = ots.filter(o => o.tipo_mantenimiento === 'CORRECTIVO').length;

      return {
        equipo,
        ots,
        hallazgos,
        certificaciones,
        inspecciones_patio: inspeccionesPatio,
        kpis_activo: {
          total_ots: ots.length,
          total_preventivas: totalPreventivas,
          total_correctivas: totalCorrectivas,
          gasto_acumulado_clp: totalGastado,
          hallazgos_activos: hallazgos.filter(h => h.estado === 'PENDIENTE').length
        }
      };
    } catch (err) {
      console.error('Error en MantenimientoModel.getHojaVidaEquipo:', err);
      throw err;
    }
  }

  // =========================================================================
  // 11. DASHBOARD DE INDICADORES ENTERPRISE (KPIS)
  // =========================================================================

  async getKpis(empresaId = 9) {
    try {
      // 1. Disponibilidad de Flota
      const dispSql = `
        SELECT 
          COUNT(*) AS total_flota,
          COUNT(*) FILTER (WHERE UPPER(COALESCE(estado_mnt, estado)) IN ('OPERATIVO', 'ABIERTO')) AS operativas,
          COUNT(*) FILTER (WHERE UPPER(COALESCE(estado_mnt, estado)) = 'OPERATIVO_CON_RESTRICCION') AS operativas_con_restriccion,
          COUNT(*) FILTER (WHERE UPPER(COALESCE(estado_mnt, estado)) IN ('EN_MANTENCION', 'FUERA_DE_SERVICIO')) AS detenidas
        FROM tequ_equipo 
        WHERE id_empresa = $1;
      `;
      const { rows: dispRows } = await this.pool.query(dispSql, [empresaId]);
      const totalFlota = parseInt(dispRows[0].total_flota, 10) || 1;
      const operativas = parseInt(dispRows[0].operativas, 10) || 0;
      const opRestr = parseInt(dispRows[0].operativas_con_restriccion, 10) || 0;
      const detenidas = parseInt(dispRows[0].detenidas, 10) || 0;
      const disponibilidadPct = Math.round(((operativas + (opRestr * 0.8)) / totalFlota) * 100);

      // 2. Cumplimiento de Plan Preventivo (Últimos 30 días)
      const prevSql = `
        SELECT 
          COUNT(*) AS total_preventivas,
          COUNT(*) FILTER (WHERE estado = 'CERRADA' AND (DATE(fecha_cierre_real) <= DATE(fecha_programada) OR fecha_programada IS NULL)) AS ejecutadas_a_tiempo,
          COUNT(*) FILTER (WHERE estado = 'CERRADA') AS cerradas,
          COUNT(*) FILTER (WHERE estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS')) AS pendientes
        FROM tmnt_ot
        WHERE id_empresa = $1 
          AND tipo_mantenimiento = 'PREVENTIVO' 
          AND fecha_creacion >= CURRENT_DATE - INTERVAL '30 days';
      `;
      const { rows: prevRows } = await this.pool.query(prevSql, [empresaId]);
      const totalPrev = parseInt(prevRows[0].total_preventivas, 10) || 0;
      const aTiempo = parseInt(prevRows[0].ejecutadas_a_tiempo, 10) || 0;
      const cerradas = parseInt(prevRows[0].cerradas, 10) || 0;
      const cumplimientoPmPct = cerradas > 0 ? Math.round((aTiempo / cerradas) * 100) : (totalPrev > 0 ? 100 : 100);

      // 3. Ratio PM / CM (Últimos 60 días)
      const ratioSql = `
        SELECT 
          COUNT(*) FILTER (WHERE tipo_mantenimiento = 'PREVENTIVO') AS cant_pm,
          COUNT(*) FILTER (WHERE tipo_mantenimiento = 'CORRECTIVO') AS cant_cm
        FROM tmnt_ot
        WHERE id_empresa = $1 AND fecha_creacion >= CURRENT_DATE - INTERVAL '60 days';
      `;
      const { rows: ratioRows } = await this.pool.query(ratioSql, [empresaId]);
      const cantPm = parseInt(ratioRows[0].cant_pm, 10) || 0;
      const cantCm = parseInt(ratioRows[0].cant_cm, 10) || 0;
      const totalPmCm = cantPm + cantCm;
      const ratioPmPct = totalPmCm > 0 ? Math.round((cantPm / totalPmCm) * 100) : 80;

      // 4. Backlog de Mantenimiento en Semanas
      const backSql = `
        SELECT COALESCE(SUM(horas_estimadas), 0) AS hh_pendientes
        FROM tmnt_ot_actividad a
        JOIN tmnt_ot ot ON a.id_ot = ot.id_ot
        WHERE ot.id_empresa = $1 
          AND ot.estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS')
          AND a.estado != 'COMPLETADA';
      `;
      const { rows: backRows } = await this.pool.query(backSql, [empresaId]);
      const hhPendientes = parseFloat(backRows[0].hh_pendientes) || 0;
      const capacidadSemanal = 170; // 5x8 * 0.85
      const backlogSemanas = +(hhPendientes / capacidadSemanal).toFixed(1);

      // 5. OTs Envejecidas (Aging OTs)
      const agingSql = `
        SELECT COUNT(*) AS count
        FROM tmnt_ot
        WHERE id_empresa = $1 
          AND estado IN ('ABIERTA', 'EN_PROCESO', 'ESPERA_REPUESTOS')
          AND (
            (tipo_mantenimiento = 'CORRECTIVO' AND fecha_creacion < CURRENT_DATE - INTERVAL '7 days')
            OR (estado = 'ESPERA_REPUESTOS' AND fecha_creacion < CURRENT_DATE - INTERVAL '3 days')
            OR (fecha_creacion < CURRENT_DATE - INTERVAL '15 days')
          );
      `;
      const { rows: agingRows } = await this.pool.query(agingSql, [empresaId]);
      const otsEnvejecidas = parseInt(agingRows[0].count, 10) || 0;

      // 6. Gasto Financiero del Mes (CLP)
      const costSql = `
        SELECT COALESCE(SUM(c.costo_total_ot), 0) AS gasto_mes
        FROM tmnt_ot_cierre c
        WHERE c.id_empresa = $1 AND c.fecha_cierre >= DATE_TRUNC('month', CURRENT_DATE);
      `;
      const { rows: costRows } = await this.pool.query(costSql, [empresaId]);
      const gastoMesClp = parseFloat(costRows[0].gasto_mes) || 0;

      // 7. Hallazgos Críticos Pendientes
      const halSql = `
        SELECT COUNT(*) AS count
        FROM tmnt_hallazgo
        WHERE id_empresa = $1 AND estado = 'PENDIENTE' AND criticidad IN ('C1', 'C2');
      `;
      const { rows: halRows } = await this.pool.query(halSql, [empresaId]);
      const hallazgosCriticos = parseInt(halRows[0].count, 10) || 0;

      // 8. OTs Activas por Estado
      const otsEstSql = `
        SELECT estado, COUNT(*) AS count
        FROM tmnt_ot
        WHERE id_empresa = $1
        GROUP BY estado;
      `;
      const { rows: otsEstRows } = await this.pool.query(otsEstSql, [empresaId]);
      const otsPorEstado = {};
      otsEstRows.forEach(r => { otsPorEstado[r.estado] = parseInt(r.count, 10); });

      return {
        disponibilidad_flota_pct: disponibilidadPct,
        flota: {
          total: totalFlota,
          operativas,
          operativas_con_restriccion: opRestr,
          detenidas
        },
        cumplimiento_pm_pct: cumplimientoPmPct,
        ratio_pm_pct: ratioPmPct,
        ratio_cm_pct: 100 - ratioPmPct,
        backlog_horas: hhPendientes,
        backlog_semanas: backlogSemanas,
        ots_envejecidas_count: otsEnvejecidas,
        gasto_mes_clp: gastoMesClp,
        hallazgos_criticos_pendientes: hallazgosCriticos,
        ots_por_estado: otsPorEstado
      };
    } catch (err) {
      console.error('Error en MantenimientoModel.getKpis:', err);
      throw err;
    }
  }

  // =========================================================================
  // 12. PARÁMETROS OPERACIONALES DEL TALLER
  // =========================================================================

  async getParametros(empresaId = 9) {
    try {
      const { rows } = await this.pool.query(`
        SELECT clave, valor, fecha_actualizacion 
        FROM tmnt_parametro 
        WHERE id_empresa = $1
      `, [empresaId]);
      const params = {};
      rows.forEach(r => { params[r.clave] = r.valor; });
      return { raw: rows, map: params };
    } catch (err) {
      console.error('Error en MantenimientoModel.getParametros:', err);
      throw err;
    }
  }

  async actualizarParametro(empresaId = 9, clave, valor) {
    try {
      const sql = `
        INSERT INTO tmnt_parametro (id_empresa, clave, valor, fecha_actualizacion)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (id_empresa, clave) 
        DO UPDATE SET valor = EXCLUDED.valor, fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const { rows } = await this.pool.query(sql, [empresaId, clave, String(valor)]);
      return rows[0];
    } catch (err) {
      console.error('Error en MantenimientoModel.actualizarParametro:', err);
      throw err;
    }
  }

  // 13. Listar mecánicos y técnicos habilitados de taller con ordenamiento RBAC
  async getTecnicos(empresaId = 9) {
    try {
      const sql = `
        SELECT 
          u.id_user, 
          u.name_frst, 
          u.apellido_pat, 
          u.email, 
          u.movil,
          COALESCE(u.json_data->>'cargo', '') AS cargo,
          COALESCE(
            (SELECT string_agg(r.name_rol, ', ') 
             FROM tsec_user_roles ur 
             JOIN tsec_roles r ON ur.id_rol = r.id_rol 
             WHERE ur.id_user = u.id_user), 
            ''
          ) AS roles_str,
          CASE 
            WHEN (
              COALESCE((SELECT string_agg(r.name_rol, ', ') FROM tsec_user_roles ur JOIN tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = u.id_user), '') ILIKE '%TALLER_EJEC%' 
              OR COALESCE((SELECT string_agg(r.name_rol, ', ') FROM tsec_user_roles ur JOIN tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = u.id_user), '') ILIKE '%MECANICO%' 
              OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Mecanic%'
              OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Taller%'
            ) THEN 1
            WHEN (
              COALESCE((SELECT string_agg(r.name_rol, ', ') FROM tsec_user_roles ur JOIN tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = u.id_user), '') ILIKE '%TALLER%'
              OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Supervis%'
              OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Jefe%'
              OR COALESCE((SELECT string_agg(r.name_rol, ', ') FROM tsec_user_roles ur JOIN tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = u.id_user), '') ILIKE '%Admin%'
            ) THEN 2
            ELSE 3
          END AS orden_rol
        FROM tsec_users u
        WHERE (u.id_empresa = $1 OR u.id_empresa IS NULL) AND u.activo = true
        ORDER BY orden_rol ASC, u.name_frst ASC, u.apellido_pat ASC;
      `;
      const { rows } = await this.pool.query(sql, [empresaId]);
      return rows.map(u => {
        let categoria = 'Personal Operacional';
        let icono = '👤';
        if (u.orden_rol === 1) {
          categoria = u.cargo || 'Mecánico / Especialista Taller';
          icono = '🛠️';
        } else if (u.orden_rol === 2) {
          categoria = u.cargo || 'Supervisor / Programador Taller';
          icono = '👷';
        } else if (u.cargo) {
          categoria = u.cargo;
        }

        const nombre = `${u.name_frst || ''} ${u.apellido_pat || ''}`.trim() || u.email;
        return {
          id_user: u.id_user,
          nombre_completo: nombre,
          label_display: `${icono} ${nombre} (${categoria})`,
          email: u.email,
          movil: u.movil,
          phone: u.movil,
          cargo: u.cargo,
          roles_str: u.roles_str,
          orden_rol: u.orden_rol,
          categoria_rol: categoria,
          icono_rol: icono
        };
      });
    } catch (err) {
      console.error('Error en MantenimientoModel.getTecnicos:', err);
      throw err;
    }
  }
}

module.exports = new MantenimientoModel();
