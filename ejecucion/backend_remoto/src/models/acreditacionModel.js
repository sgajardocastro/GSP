const db = require('../config/dbConfig');

const acreditacionModel = {
  // Obtener todas las acreditaciones activas para el Kanban de Torre de Control
  async getAcreditacionesKanban() {
    const sql = `
      SELECT 
        a.id_acreditacion,
        a.id_proyecto,
        p.nombre_proyecto,
        p.codi_proyecto,
        c.name_empresa AS nombre_cliente,
        a.estado_acreditacion,
        a.porcentaje_avance,
        a.fecha_inicio,
        a.fecha_aprobacion_final,
        com.name_frst || ' ' || com.apellido_pat AS nombre_comercial,
        ana.name_frst || ' ' || ana.apellido_pat AS nombre_analista,
        COUNT(d.id_acreditacion_doc) AS total_docs,
        COUNT(CASE WHEN d.estado_doc = 'APROBADO' THEN 1 END) AS docs_aprobados,
        COUNT(CASE WHEN d.estado_doc = 'RECHAZADO' THEN 1 END) AS docs_rechazados
      FROM sch_leangsp.tpry_acreditacion a
      JOIN sch_leangsp.tpry_proyecto p ON a.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      LEFT JOIN sch_leangsp.tsec_users com ON a.id_user_comercial = com.id_user
      LEFT JOIN sch_leangsp.tsec_users ana ON a.id_user_analista = ana.id_user
      LEFT JOIN sch_leangsp.tpry_acreditacion_doc d ON a.id_acreditacion = d.id_acreditacion
      GROUP BY a.id_acreditacion, p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, c.name_empresa, com.name_frst, com.apellido_pat, ana.name_frst, ana.apellido_pat
      ORDER BY a.updated_at DESC
    `;
    const result = await db.query(sql);
    return result.rows;
  },

  // Obtener nómina de personal para la vista Acreditación Personal
  async getPersonalAcreditacion(q = '') {
    let sql = `
      SELECT 
        u.id_user,
        TRIM(COALESCE(u.name_frst,'') || ' ' || COALESCE(u.name_sec,'') || ' ' || COALESCE(u.apellido_pat,'') || ' ' || COALESCE(u.apellido_mat,'')) AS nombre,
        u.rut,
        COALESCE(u.json_data->>'cargo', 'ESPECIALISTA') AS rol,
        u.email,
        u.json_data->>'fecha_vencimiento_hsec' AS "fechaControl",
        COALESCE(u.json_data->>'estado_hsec', 'habilitado') AS estado
      FROM sch_leangsp.tsec_users u
      WHERE u.activo = true
    `;
    const params = [];
    if (q && q.trim() !== '') {
      params.push(`%${q.trim()}%`);
      sql += ` AND (
        UPPER(u.name_frst) LIKE UPPER($1) OR 
        UPPER(u.apellido_pat) LIKE UPPER($1) OR 
        UPPER(u.rut) LIKE UPPER($1) OR
        UPPER(COALESCE(u.json_data->>'cargo', '')) LIKE UPPER($1)
      )`;
    }
    sql += ` ORDER BY u.id_user DESC`;
    const result = await db.query(sql, params);
    return result.rows;
  },

  // Obtener detalle completo de expediente de trabajador
  async getPersonalDetail(id_user) {
    const sqlUser = `
      SELECT 
        u.id_user,
        u.name_frst,
        u.name_sec,
        u.apellido_pat,
        u.apellido_mat,
        u.rut,
        u.email,
        u.movil,
        COALESCE(u.json_data->>'cargo', 'Operador') AS cargo,
        u.activo,
        u.json_data
      FROM sch_leangsp.tsec_users u
      WHERE u.id_user = $1
    `;
    const resUser = await db.query(sqlUser, [id_user]);
    if (resUser.rows.length === 0) return null;
    const user = resUser.rows[0];

    let certificados = [];
    if (user.json_data && Array.isArray(user.json_data.certificados)) {
      certificados = user.json_data.certificados;
    }

    return {
      ...user,
      certificados
    };
  },

  // Obtener trabajador por RUT (normalizando guiones y puntos)
  async getPersonalByRut(rutParam) {
    const cleanRut = (rutParam || '').replace(/[^0-9kK]/g, '').toUpperCase();
    const sqlUser = `
      SELECT 
        u.id_user,
        u.name_frst,
        u.name_sec,
        u.apellido_pat,
        u.apellido_mat,
        u.rut,
        u.email,
        u.movil,
        COALESCE(u.json_data->>'cargo', 'Operador') AS cargo,
        u.activo,
        u.json_data
      FROM sch_leangsp.tsec_users u
      WHERE UPPER(REGEXP_REPLACE(u.rut, '[^0-9kK]', '', 'g')) = $1
    `;
    const resUser = await db.query(sqlUser, [cleanRut]);
    if (resUser.rows.length === 0) return null;
    const user = resUser.rows[0];

    let certificados = [];
    if (user.json_data && Array.isArray(user.json_data.certificados)) {
      certificados = user.json_data.certificados;
    }

    return {
      ...user,
      certificados
    };
  },

  // Actualizar datos básicos de trabajador
  async updatePersonalDetail(id_user, data) {
    const { name_frst, name_sec, apellido_pat, apellido_mat, rut, email, movil, cargo, activo } = data;
    
    const check = await db.query('SELECT json_data FROM sch_leangsp.tsec_users WHERE id_user = $1', [id_user]);
    const currentJson = check.rows[0]?.json_data || {};
    currentJson.cargo = cargo || currentJson.cargo || 'Operador';

    const sql = `
      UPDATE sch_leangsp.tsec_users
      SET name_frst = $2,
          name_sec = $3,
          apellido_pat = $4,
          apellido_mat = $5,
          rut = $6,
          email = $7,
          movil = $8,
          activo = $9,
          json_data = $10,
          fecha_actualizacion = NOW()
      WHERE id_user = $1
      RETURNING *
    `;
    const res = await db.query(sql, [id_user, name_frst || '', name_sec || '', apellido_pat || '', apellido_mat || '', rut || '', email || '', movil || '', activo !== false, JSON.stringify(currentJson)]);
    return res.rows[0];
  },

  // Vincular certificado a expediente de trabajador
  async addPersonalCertificado(id_user, certData) {
    const { id_tipo_certificado_persona, fecha_emision, fecha_vencimiento, observaciones, id_doc } = certData;

    const check = await db.query('SELECT json_data FROM sch_leangsp.tsec_users WHERE id_user = $1', [id_user]);
    if (check.rows.length === 0) return null;

    const currentJson = check.rows[0].json_data || {};
    if (!Array.isArray(currentJson.certificados)) {
      currentJson.certificados = [];
    }

    const newCert = {
      id_cert: Date.now(),
      id_tipo_certificado_persona,
      fecha_emision,
      fecha_vencimiento,
      observaciones,
      id_doc,
      created_at: new Date().toISOString()
    };

    currentJson.certificados.push(newCert);

    await db.query('UPDATE sch_leangsp.tsec_users SET json_data = $2 WHERE id_user = $1', [id_user, JSON.stringify(currentJson)]);
    return newCert;
  },

  // Obtener detalle de expediente por id_acreditacion
  async getDetalleAcreditacion(id_acreditacion) {
    const sqlHead = `
      SELECT 
        a.*,
        p.nombre_proyecto,
        p.codi_proyecto,
        COALESCE(c.name_empresa, 'Cliente GSP') AS nombre_cliente
      FROM sch_leangsp.tpry_acreditacion a
      JOIN sch_leangsp.tpry_proyecto p ON a.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE a.id_acreditacion = $1
    `;
    const resHead = await db.query(sqlHead, [id_acreditacion]);
    if (resHead.rows.length === 0) return null;

    const sqlDocs = `
      SELECT 
        d.*,
        f.name_file_original,
        f.name_file_disk,
        f.path_file
      FROM sch_leangsp.tpry_acreditacion_doc d
      LEFT JOIN sch_leangsp.tfmg_file f ON d.id_doc = f.id_doc
      WHERE d.id_acreditacion = $1
      ORDER BY d.id_acreditacion_doc ASC
    `;
    const resDocs = await db.query(sqlDocs, [id_acreditacion]);

    return {
      encabezado: resHead.rows[0],
      documentos: resDocs.rows
    };
  },

  // Subir o actualizar documento
  async subirDocumento(id_acreditacion_doc, id_doc) {
    const sql = `
      UPDATE sch_leangsp.tpry_acreditacion_doc
      SET id_doc = $2, estado_doc = 'SUBIDO', updated_at = NOW()
      WHERE id_acreditacion_doc = $1
      RETURNING *
    `;
    const result = await db.query(sql, [id_acreditacion_doc, id_doc]);
    await this.recalcularAvance(result.rows[0].id_acreditacion);
    return result.rows[0];
  },

  // Auditar documento por Analista de Gestión (Aprobar / Rechazar)
  async auditarDocumento(id_acreditacion_doc, estado_doc, observacion_analista, id_user_analista) {
    const sql = `
      UPDATE sch_leangsp.tpry_acreditacion_doc
      SET estado_doc = $2, observacion_analista = $3, updated_at = NOW()
      WHERE id_acreditacion_doc = $1
      RETURNING *
    `;
    const result = await db.query(sql, [id_acreditacion_doc, estado_doc, observacion_analista]);
    const doc = result.rows[0];

    // Asignar analista al encabezado si no estaba asignado
    if (id_user_analista) {
      await db.query(`UPDATE sch_leangsp.tpry_acreditacion SET id_user_analista = $2 WHERE id_acreditacion = $1 AND id_user_analista IS NULL`, [doc.id_acreditacion, id_user_analista]);
    }

    await this.recalcularAvance(doc.id_acreditacion);
    return doc;
  },

  // Recalcular avance porcentual y estado global del expediente
  async recalcularAvance(id_acreditacion) {
    const sqlCount = `
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN estado_doc = 'APROBADO' THEN 1 END) AS aprobados,
        COUNT(CASE WHEN estado_doc = 'RECHAZADO' THEN 1 END) AS rechazados
      FROM sch_leangsp.tpry_acreditacion_doc
      WHERE id_acreditacion = $1
    `;
    const resCount = await db.query(sqlCount, [id_acreditacion]);
    const { total, aprobados, rechazados } = resCount.rows[0];

    const totalInt = parseInt(total) || 0;
    const aprobadosInt = parseInt(aprobados) || 0;
    const rechazadosInt = parseInt(rechazados) || 0;

    const porcentaje = totalInt > 0 ? Math.round((aprobadosInt / totalInt) * 100) : 0;
    let nuevoEstado = 'EN_TRAMITE';

    if (porcentaje === 100) {
      nuevoEstado = 'ACREDITADO_OK';
    } else if (rechazadosInt > 0) {
      nuevoEstado = 'OBSERVADO';
    }

    const sqlUpdate = `
      UPDATE sch_leangsp.tpry_acreditacion
      SET porcentaje_avance = $2, 
          estado_acreditacion = $3,
          fecha_aprobacion_final = (CASE WHEN $3 = 'ACREDITADO_OK' THEN NOW() ELSE fecha_aprobacion_final END),
          updated_at = NOW()
      WHERE id_acreditacion = $1
    `;
    await db.query(sqlUpdate, [id_acreditacion, porcentaje, nuevoEstado]);
  }
};

module.exports = acreditacionModel;
