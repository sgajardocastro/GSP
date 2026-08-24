const db = require('../config/dbConfig');
const crypto = require('crypto');

const viajeModel = {
  // 1. Obtener viaje completo por token
  async getViajePorToken(token) {
    if (!token) throw new Error('Token requerido');

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
        v.pings_ruta,
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
    if (res.rows.length === 0) return null;

    const viaje = res.rows[0];

    // Consultar cargas de combustible asociadas
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
  },

  // 2. Crear o recuperar viaje para un equipo y proyecto
  async crearOObtenerViaje({ id_proyecto, id_equipo, id_user_chofer, patente, tipo_trayecto }) {
    // Buscar si ya existe un viaje activo o asignado
    const checkSql = `
      SELECT * FROM sch_leangsp.tequ_log_desplazamiento 
      WHERE id_proyecto = $1 AND id_equipo = $2 AND estado_trayecto IN ('ASIGNADO', 'EN_RUTA')
      ORDER BY id_log_desplazamiento DESC LIMIT 1;
    `;
    const checkRes = await db.query(checkSql, [id_proyecto, id_equipo]);
    if (checkRes.rows.length > 0) {
      const existing = checkRes.rows[0];
      // Si no tenía token, generárselo
      if (!existing.token_viaje) {
        const token = `vj_${id_proyecto}_${id_equipo}_${crypto.randomBytes(4).toString('hex')}`;
        await db.query(`UPDATE sch_leangsp.tequ_log_desplazamiento SET token_viaje = $1 WHERE id_log_desplazamiento = $2`, [token, existing.id_log_desplazamiento]);
        existing.token_viaje = token;
      }
      return existing;
    }

    // Crear nuevo viaje
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

  // 3. Registrar Salida de Patio (Paso 1)
  async registrarSalida({ token_viaje, km_inicial, horometro_inicial, foto_salida, pin_hash, latitud, longitud }) {
    const sql = `
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
    const res = await db.query(sql, [
      km_inicial,
      horometro_inicial || null,
      foto_salida || null,
      pin_hash || null,
      latitud || null,
      longitud || null,
      token_viaje
    ]);
    if (res.rows.length === 0) throw new Error('Viaje no encontrado para el token suministrado');
    return res.rows[0];
  },

  // 4. Registrar Carga de Combustible (Copec)
  async registrarCombustible({ token_viaje, tipo_estanque, litros, monto, foto_voucher, foto_tablero, id_autorizacion_copec, odometro, horometro, observacion }) {
    // Obtener id_proyecto e id_log_desplazamiento
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

  // 5. Registrar Llegada a Faena (Paso 3)
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
        estado_trayecto = 'LLEGADO'
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
      obs_termino || 'Arribo a faena conforme',
      token_viaje
    ]);
    if (res.rows.length === 0) throw new Error('Viaje no encontrado');
    return res.rows[0];
  },

  // 6. Listar viajes por proyecto (Para el CRM)
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
  // 7. Obtener viaje activo para un usuario conductor (PWA)
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
        v.km_inicial,
        v.horometro_inicial,
        p.nombre_proyecto,
        p.codi_proyecto,
        COALESCE(p.json_field->>'obra_nombre', p.json_field->'ejecucion_v1'->'cliente'->>'obra', p.nombre_proyecto) AS obra_nombre,
        COALESCE(p.json_field->>'direccion_obra', p.json_field->'ejecucion_v1'->'cliente'->>'direccion_faena', 'Faena Operacional GSP') AS obra_direccion,
        COALESCE(e.tipo_equipo, 'GRUAS TELESCOPICAS') AS tipo_equipo,
        COALESCE(e.modelo, 'Maquinaria de Izaje') AS modelo,
        COALESCE(e.marca, 'GSP') AS marca
      FROM sch_leangsp.tequ_log_desplazamiento v
      JOIN sch_leangsp.tpry_proyecto p ON v.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tequ_equipo e ON v.id_equipo = e.id_equipo
      WHERE v.id_user_chofer = $1 AND v.estado_trayecto IN ('ASIGNADO', 'EN_RUTA')
      ORDER BY v.id_log_desplazamiento DESC
      LIMIT 1;
    `;
    const res = await db.query(sql, [id_user]);
    return res.rows[0] || null;
  }
};

module.exports = viajeModel;
