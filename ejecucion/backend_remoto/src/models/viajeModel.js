const db = require('../config/dbConfig');
const crypto = require('crypto');

const viajeModel = {
  // 1.3 Resolver dinámicamente el proyecto y equipo a partir del token (sin importar formato)
  async resolverContextoPorToken(token) {
    if (!token) return { id_proyecto: null, id_equipo: null };

    // Formatos soportados:
    // vj_74_42_hash | vj-74-42-hash | vj-gsp26082856042-42-hash
    const raw = token.replace(/^vj[-_]/i, '');
    const parts = raw.split(/[-_]/);

    let idPry = null;
    let idEq = null;

    if (parts.length >= 2) {
      const part1 = parts[0].trim();
      const part2 = parts[1].trim();

      // 1. Resolver Equipo
      const eqNum = parseInt(part2, 10);
      if (!isNaN(eqNum)) {
        idEq = eqNum;
      } else {
        const eqRes = await db.query('SELECT id_equipo FROM sch_leangsp.tequ_equipo WHERE patente ILIKE $1 LIMIT 1', [part2]);
        if (eqRes.rows.length > 0) idEq = eqRes.rows[0].id_equipo;
      }

      // 2. Resolver Proyecto
      const pryNum = parseInt(part1, 10);
      if (!isNaN(pryNum) && String(pryNum) === part1) {
        idPry = pryNum;
      } else {
        const cleanCodi = part1.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pryRes = await db.query(`
          SELECT id_proyecto FROM sch_leangsp.tpry_proyecto 
          WHERE LOWER(REPLACE(codi_proyecto, '-', '')) LIKE '%' || $1 || '%'
             OR LOWER(REPLACE(nombre_proyecto, '-', '')) LIKE '%' || $1 || '%'
          ORDER BY id_proyecto DESC LIMIT 1;
        `, [cleanCodi]);
        if (pryRes.rows.length > 0) idPry = pryRes.rows[0].id_proyecto;
      }
    }

    return { id_proyecto: idPry, id_equipo: idEq };
  },

  // 1. Obtener viaje completo por token (con fallback dinámico por token de proyecto/equipo)
  async getViajePorToken(token) {
    if (!token) throw new Error('Token requerido');

    // 1.1 Buscar primero si ya existe un registro de log de desplazamiento
    const sql = `
      SELECT 
        v.id_log_desplazamiento,
        v.id_proyecto,
        v.id_equipo,
        v.id_user_chofer,
        v.patente,
        v.tipo_trayecto,
        v.fecha_salida_patio,
        v.fecha_llegada_faena,
        v.fecha_salida_faena,
        v.fecha_llegada_patio,
        v.latitud_salida_patio,
        v.longitud_salida_patio,
        v.latitud_llegada_faena,
        v.longitud_llegada_faena,
        v.km_inicial,
        v.km_final,
        v.horometro_inicial,
        v.horometro_final,
        v.foto_tablero_salida_path,
        v.foto_tablero_llegada_path,
        v.estado_trayecto,
        v.token_viaje,
        v.obs_termino,
        COALESCE(v.pings_ruta, '[]'::jsonb) AS pings_ruta,
        p.nombre_proyecto,
        p.codi_proyecto,
        COALESCE(p.json_field->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
        COALESCE(p.json_field->>'direccion_obra', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena Operacional GSP') AS obra_direccion,
        COALESCE(u.name_frst || ' ' || u.apellido_pat, 'Conductor Asignado') AS chofer_nombre,
        u.email AS chofer_email,
        COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
        COALESCE(e.modelo, 'Maquinaria de Izaje') AS modelo,
        COALESCE(e.marca, 'GSP') AS marca
      FROM sch_leangsp.tequ_log_desplazamiento v
      JOIN sch_leangsp.tpry_proyecto p ON v.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tequ_equipo e ON v.id_equipo = e.id_equipo
      LEFT JOIN sch_leangsp.tsec_users u ON v.id_user_chofer = u.id_user
      WHERE v.token_viaje = $1;
    `;
    const res = await db.query(sql, [token]);
    if (res.rows.length > 0) {
      const viaje = res.rows[0];
      const fuelSql = `
        SELECT 
          id_costo,
          id_log_desplazamiento,
          categoria_costo,
          monto_costo,
          litros_combustible,
          kilometraje_odometro,
          horometro_odometro,
          tipo_estanque,
          id_autorizacion_copec,
          numero_comprobante,
          archivo_comprobante_path,
          foto_tablero_path,
          observacion,
          fecha_registro
        FROM sch_leangsp.tedp_costos_servicio
        WHERE id_log_desplazamiento = $1
        ORDER BY id_costo ASC;
      `;
      const fuelRes = await db.query(fuelSql, [viaje.id_log_desplazamiento]);
      viaje.cargas_combustible = fuelRes.rows;
      return viaje;
    }

    // 1.2 Si no existe aún la fila en tequ_log_desplazamiento, resolver por token dinámicamente
    const { id_proyecto, id_equipo } = await viajeModel.resolverContextoPorToken(token);
    if (id_proyecto) {
      const infoSql = `
        SELECT 
          p.id_proyecto,
          p.nombre_proyecto,
          p.codi_proyecto,
          COALESCE(p.json_field->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
          COALESCE(p.json_field->>'direccion_obra', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena Operacional GSP') AS obra_direccion,
          e.id_equipo,
          e.patente,
          COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
          COALESCE(e.modelo, 'Maquinaria de Izaje') AS modelo,
          COALESCE(e.marca, 'GSP') AS marca
        FROM sch_leangsp.tpry_proyecto p
        LEFT JOIN sch_leangsp.tequ_equipo e ON e.id_equipo = $2
        WHERE p.id_proyecto = $1;
      `;
      const infoRes = await db.query(infoSql, [id_proyecto, id_equipo || 0]);
      if (infoRes.rows.length > 0) {
        const row = infoRes.rows[0];
        return {
          id_log_desplazamiento: null,
          id_proyecto: row.id_proyecto,
          id_equipo: row.id_equipo || null,
          id_user_chofer: null,
          patente: row.patente || 'S/P',
          tipo_trayecto: 'IDA',
          fecha_salida_patio: null,
          fecha_llegada_faena: null,
          fecha_salida_faena: null,
          fecha_llegada_patio: null,
          latitud_salida_patio: null,
          longitud_salida_patio: null,
          latitud_llegada_faena: null,
          longitud_llegada_faena: null,
          km_inicial: null,
          km_final: null,
          horometro_inicial: null,
          horometro_final: null,
          foto_tablero_salida_path: null,
          foto_tablero_llegada_path: null,
          estado_trayecto: 'ASIGNADO',
          token_viaje: token,
          obs_termino: null,
          pings_ruta: [],
          nombre_proyecto: row.nombre_proyecto,
          codi_proyecto: row.codi_proyecto,
          obra_nombre: row.obra_nombre,
          obra_direccion: row.obra_direccion,
          chofer_nombre: 'Conductor Asignado',
          tipo_equipo: row.tipo_equipo,
          modelo: row.modelo,
          marca: row.marca,
          cargas_combustible: []
        };
      }
    }

    return null;
  },

  // 2. Registrar Salida de Patio (Paso 1 - Con Creación/Insert Garantizado)
  async registrarSalida({ token_viaje, id_proyecto, id_equipo, id_user_chofer, km_inicial, horometro_inicial, foto_salida, pin_hash, latitud, longitud }) {
    if (!token_viaje) throw new Error('token_viaje requerido');

    // 2.1 Verificar si ya existe fila para este token
    const checkSql = `SELECT id_log_desplazamiento FROM sch_leangsp.tequ_log_desplazamiento WHERE token_viaje = $1;`;
    const checkRes = await db.query(checkSql, [token_viaje]);

    if (checkRes.rows.length > 0) {
      // Ya existía -> Actualizar
      const updateSql = `
        UPDATE sch_leangsp.tequ_log_desplazamiento
        SET 
          km_inicial = $1,
          horometro_inicial = $2,
          foto_tablero_salida_path = $3,
          pin_hash = $4,
          fecha_salida_patio = CURRENT_TIMESTAMP,
          latitud_salida_patio = $5,
          longitud_salida_patio = $6,
          estado_trayecto = 'EN_RUTA'
        WHERE token_viaje = $7
        RETURNING *;
      `;
      const res = await db.query(updateSql, [
        km_inicial,
        horometro_inicial || null,
        foto_salida || null,
        pin_hash || null,
        latitud || null,
        longitud || null,
        token_viaje
      ]);
      const viajeActualizado = res.rows[0];

      // Spec 35: Elevación automática del Macro-Estado del proyecto a 5 (En Ejecución) si estaba en 4 (Preparación)
      if (viajeActualizado.id_proyecto) {
        try {
          await db.query(
            `UPDATE sch_leangsp.tpry_proyecto SET id_proyecto_estado = 5 WHERE id_proyecto = $1 AND id_proyecto_estado = 4;`,
            [viajeActualizado.id_proyecto]
          );
        } catch (ePry) {
          console.warn('Error al elevar estado del proyecto:', ePry.message);
        }
      }

      return viajeActualizado;
    } else {
      // NO existía -> INSERT DIRECTO GARANTIZADO
      let idPry = id_proyecto;
      let idEq = id_equipo;
      let pat = 'S/P';

      if (!idPry || !idEq) {
        const ctx = await viajeModel.resolverContextoPorToken(token_viaje);
        if (!idPry) idPry = ctx.id_proyecto;
        if (!idEq) idEq = ctx.id_equipo;
      }

      if (idEq) {
        const eqRes = await db.query('SELECT patente FROM sch_leangsp.tequ_equipo WHERE id_equipo = $1', [idEq]);
        if (eqRes.rows.length > 0) pat = eqRes.rows[0].patente;
      }

      const insertSql = `
        INSERT INTO sch_leangsp.tequ_log_desplazamiento (
          id_proyecto,
          id_equipo,
          id_user_chofer,
          patente,
          tipo_trayecto,
          estado_trayecto,
          token_viaje,
          km_inicial,
          horometro_inicial,
          foto_tablero_salida_path,
          pin_hash,
          fecha_salida_patio,
          latitud_salida_patio,
          longitud_salida_patio,
          pings_ruta
        ) VALUES (
          $1, $2, $3, $4, 'IDA', 'EN_RUTA', $5,
          $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11, '[]'::jsonb
        ) RETURNING *;
      `;
      const res = await db.query(insertSql, [
        idPry,
        idEq,
        id_user_chofer || null,
        pat,
        token_viaje,
        km_inicial,
        horometro_inicial || null,
        foto_salida || null,
        pin_hash || null,
        latitud || null,
        longitud || null
      ]);
      const viajeNuevo = res.rows[0];

      if (viajeNuevo.id_proyecto) {
        try {
          await db.query(
            `UPDATE sch_leangsp.tpry_proyecto SET id_proyecto_estado = 5 WHERE id_proyecto = $1 AND id_proyecto_estado = 4;`,
            [viajeNuevo.id_proyecto]
          );
        } catch (ePry) {
          console.warn('Error al elevar estado del proyecto:', ePry.message);
        }
      }

      return viajeNuevo;
    }
  },

  // 3. Registrar Ping de GPS para un viaje específico
  async registrarPingViaje(token_viaje, { latitud, longitud, velocidad_kmh }) {
    const pingObj = {
      lat: Number(latitud) || null,
      lng: Number(longitud) || null,
      kmh: Number(velocidad_kmh || 0),
      ts: new Date().toISOString()
    };
    const sql = `
      UPDATE sch_leangsp.tequ_log_desplazamiento
      SET pings_ruta = COALESCE(pings_ruta, '[]'::jsonb) || $1::jsonb
      WHERE token_viaje = $2
      RETURNING *;
    `;
    const res = await db.query(sql, [JSON.stringify([pingObj]), token_viaje]);
    if (res.rows.length === 0) throw new Error('Viaje no encontrado para registrar ping');
    return res.rows[0];
  },

  // 4. Registrar Llegada a Faena (Paso 3)
  async registrarLlegada({ token_viaje, km_final, horometro_final, foto_llegada, pin_hash, latitud, longitud, obs_termino }) {
    const sql = `
      UPDATE sch_leangsp.tequ_log_desplazamiento
      SET 
        km_final = $1,
        horometro_final = $2,
        foto_tablero_llegada_path = $3,
        pin_hash = $4,
        fecha_llegada_faena = CURRENT_TIMESTAMP,
        latitud_llegada_faena = $5,
        longitud_llegada_faena = $6,
        obs_termino = $7,
        estado_trayecto = 'ARRIBADO'
      WHERE token_viaje = $8
      RETURNING *;
    `;
    const res = await db.query(sql, [
      km_final,
      horometro_final || null,
      foto_llegada || null,
      pin_hash || null,
      latitud || null,
      longitud || null,
      obs_termino || 'Arribo a faena verificado con éxito',
      token_viaje
    ]);
    if (res.rows.length === 0) throw new Error('Viaje no encontrado para registrar llegada');
    return res.rows[0];
  },

  // 5. Registrar Carga de Combustible (Copec)
  async registrarCombustible({ token_viaje, tipo_estanque, litros, monto, foto_voucher, foto_tablero, id_autorizacion_copec, odometro, horometro, observacion }) {
    const viajeRes = await db.query(`SELECT id_proyecto, id_log_desplazamiento FROM sch_leangsp.tequ_log_desplazamiento WHERE token_viaje = $1`, [token_viaje]);
    if (viajeRes.rows.length === 0) throw new Error('Viaje no encontrado');
    const { id_proyecto, id_log_desplazamiento } = viajeRes.rows[0];

    const sql = `
      INSERT INTO sch_leangsp.tedp_costos_servicio (
        id_proyecto,
        id_log_desplazamiento,
        categoria_costo,
        monto_costo,
        litros_combustible,
        kilometraje_odometro,
        horometro_odometro,
        tipo_estanque,
        id_autorizacion_copec,
        numero_comprobante,
        archivo_comprobante_path,
        foto_tablero_path,
        observacion,
        estado_autorizacion
      ) VALUES ($1, $2, 'COMBUSTIBLE', $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, 'APROBADO')
      RETURNING *;
    `;
    const res = await db.query(sql, [
      id_proyecto,
      id_log_desplazamiento,
      monto || 0,
      litros || 0,
      odometro || null,
      horometro || null,
      tipo_estanque || 'ESTANQUE_CHASIS',
      id_autorizacion_copec || null,
      foto_voucher || null,
      foto_tablero || null,
      observacion || null
    ]);
    return res.rows[0];
  },

  // 6. Crear o Asignar Viaje desde CRM
  async crearOObtenerViaje({ id_proyecto, id_equipo, id_user_chofer, patente, tipo_trayecto }) {
    const token = `vj_${id_proyecto}_${id_equipo}_${crypto.randomBytes(4).toString('hex')}`;
    const insertSql = `
      INSERT INTO sch_leangsp.tequ_log_desplazamiento (
        id_proyecto, id_equipo, id_user_chofer, patente, tipo_trayecto,
        estado_trayecto, token_viaje, pings_ruta
      ) VALUES ($1, $2, $3, $4, $5, 'ASIGNADO', $6, '[]'::jsonb)
      RETURNING *;
    `;
    const res = await db.query(insertSql, [
      id_proyecto,
      id_equipo || null,
      id_user_chofer || null,
      patente || null,
      tipo_trayecto || 'IDA',
      token
    ]);
    return res.rows[0];
  },

  // 7. Listar viajes por proyecto (Para el CRM)
  async getViajesPorProyecto(id_proyecto) {
    const sql = `
      SELECT 
        v.*,
        COALESCE(u.name_frst || ' ' || u.apellido_pat, 'Sin Conductor') AS chofer_nombre,
        u.email AS chofer_email,
        e.tipo_equipo,
        e.modelo,
        e.marca,
        COALESCE(comb.total_litros, 0) AS total_litros,
        COALESCE(comb.total_gasto, 0) AS total_gasto
      FROM sch_leangsp.tequ_log_desplazamiento v
      LEFT JOIN sch_leangsp.tsec_users u ON v.id_user_chofer = u.id_user
      LEFT JOIN sch_leangsp.tequ_equipo e ON v.id_equipo = e.id_equipo
      LEFT JOIN (
        SELECT id_log_desplazamiento, SUM(litros_combustible) AS total_litros, SUM(monto_costo) AS total_gasto
        FROM sch_leangsp.tedp_costos_servicio
        WHERE categoria_costo = 'COMBUSTIBLE'
        GROUP BY id_log_desplazamiento
      ) comb ON v.id_log_desplazamiento = comb.id_log_desplazamiento
      WHERE v.id_proyecto = $1
      ORDER BY v.id_log_desplazamiento DESC;
    `;
    const res = await db.query(sql, [id_proyecto]);
    return res.rows;
  },

  // 8. Obtener viaje activo o arribado para un usuario conductor (PWA)
  async getViajeActivoPorUsuario(id_user) {
    const sql = `
      SELECT 
        v.id_log_desplazamiento,
        v.id_proyecto,
        v.id_equipo,
        v.patente,
        v.tipo_trayecto,
        v.estado_trayecto,
        v.token_viaje,
        v.fecha_salida_patio,
        v.fecha_llegada_faena,
        v.km_inicial,
        v.km_final,
        v.horometro_inicial,
        v.horometro_final,
        p.nombre_proyecto,
        p.codi_proyecto,
        COALESCE(p.json_field->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
        COALESCE(p.json_field->>'cliente_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'razon_social', 'Mandante GSP') AS cliente_nombre,
        COALESCE(p.json_field->>'direccion_obra', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena Operacional GSP') AS obra_direccion,
        COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
        COALESCE(e.modelo, 'Maquinaria de Izaje') AS modelo,
        COALESCE(e.marca, 'GSP') AS marca
      FROM sch_leangsp.tequ_log_desplazamiento v
      JOIN sch_leangsp.tpry_proyecto p ON v.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tequ_equipo e ON v.id_equipo = e.id_equipo
      WHERE v.id_user_chofer = $1
      ORDER BY v.id_log_desplazamiento DESC
      LIMIT 1;
    `;
    const res = await db.query(sql, [id_user]);
    return res.rows[0] || null;
  }
};

module.exports = viajeModel;
