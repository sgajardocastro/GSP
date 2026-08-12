const db = require('../config/dbConfig');

const acreditacionModel = {
  // Obtener todas las acreditaciones activas para el Kanban de Torre de Control
  async getAcreditacionesKanban() {
    const sql = \
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
    \;
    const result = await db.query(sql);
    return result.rows;
  },

  // Obtener detalle de expediente por id_acreditacion
  async getDetalleAcreditacion(id_acreditacion) {
    const sqlHead = \
      SELECT 
        a.*,
        p.nombre_proyecto,
        p.codi_proyecto,
        COALESCE(c.name_empresa, 'Cliente GSP') AS nombre_cliente
      FROM sch_leangsp.tpry_acreditacion a
      JOIN sch_leangsp.tpry_proyecto p ON a.id_proyecto = p.id_proyecto
      LEFT JOIN sch_leangsp.tpar_empresas c ON p.id_empresa_cliente = c.id_empresa
      WHERE a.id_acreditacion = \
    \;
    const resHead = await db.query(sqlHead, [id_acreditacion]);
    if (resHead.rows.length === 0) return null;

    const sqlDocs = \
      SELECT 
        d.*,
        f.name_file_original,
        f.name_file_disk,
        f.path_file
      FROM sch_leangsp.tpry_acreditacion_doc d
      LEFT JOIN sch_leangsp.tfmg_file f ON d.id_doc = f.id_doc
      WHERE d.id_acreditacion = \
      ORDER BY d.id_acreditacion_doc ASC
    \;
    const resDocs = await db.query(sqlDocs, [id_acreditacion]);

    return {
      encabezado: resHead.rows[0],
      documentos: resDocs.rows
    };
  },

  // Subir o actualizar documento
  async subirDocumento(id_acreditacion_doc, id_doc) {
    const sql = \
      UPDATE sch_leangsp.tpry_acreditacion_doc
      SET id_doc = \, estado_doc = 'SUBIDO', updated_at = NOW()
      WHERE id_acreditacion_doc = \
      RETURNING *
    \;
    const result = await db.query(sql, [id_acreditacion_doc, id_doc]);
    await this.recalcularAvance(result.rows[0].id_acreditacion);
    return result.rows[0];
  },

  // Auditar documento por Analista de Gestión (Aprobar / Rechazar)
  async auditarDocumento(id_acreditacion_doc, estado_doc, observacion_analista, id_user_analista) {
    const sql = \
      UPDATE sch_leangsp.tpry_acreditacion_doc
      SET estado_doc = \, observacion_analista = \, updated_at = NOW()
      WHERE id_acreditacion_doc = \
      RETURNING *
    \;
    const result = await db.query(sql, [id_acreditacion_doc, estado_doc, observacion_analista]);
    const doc = result.rows[0];

    // Asignar analista al encabezado si no estaba asignado
    if (id_user_analista) {
      await db.query(\UPDATE sch_leangsp.tpry_acreditacion SET id_user_analista = \ WHERE id_acreditacion = \ AND id_user_analista IS NULL\, [doc.id_acreditacion, id_user_analista]);
    }

    await this.recalcularAvance(doc.id_acreditacion);
    return doc;
  },

  // Recalcular avance porcentual y estado global del expediente
  async recalcularAvance(id_acreditacion) {
    const sqlCount = \
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN estado_doc = 'APROBADO' THEN 1 END) AS aprobados,
        COUNT(CASE WHEN estado_doc = 'RECHAZADO' THEN 1 END) AS rechazados
      FROM sch_leangsp.tpry_acreditacion_doc
      WHERE id_acreditacion = \
    \;
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

    const sqlUpdate = \
      UPDATE sch_leangsp.tpry_acreditacion
      SET porcentaje_avance = \, 
          estado_acreditacion = \,
          fecha_aprobacion_final = (CASE WHEN \ = 'ACREDITADO_OK' THEN NOW() ELSE fecha_aprobacion_final END),
          updated_at = NOW()
      WHERE id_acreditacion = \
    \;
    await db.query(sqlUpdate, [id_acreditacion, porcentaje, nuevoEstado]);
  },

  // Obtener lista general con semáforos HSEC resumidos
  async getAcreditacionPersonal(filters = {}) {
    try {
      const { q, from, to } = filters;
      const values = [];
      let whereClause = "WHERE u.id_empresa = 9";
      let paramIdx = 1;

      if (q) {
        whereClause += \ AND (
          UPPER(u.name_frst) LIKE \$\ OR 
          UPPER(u.apellido_pat) LIKE \$\ OR 
          UPPER(u.rut) LIKE \$\
        )\;
        values.push(\%\%\);
        paramIdx++;
      }

      const sql = \
        SELECT 
          u.id_user,
          CONCAT(u.name_frst, ' ', COALESCE(u.name_sec, ''), ' ', u.apellido_pat, ' ', COALESCE(u.apellido_mat, '')) AS nombre,
          u.rut,
          u.email,
          u.movil,
          u.activo,
          COALESCE(u.json_data->>'cargo', 'Operador') AS cargo,
          u.fecha_actualizacion AS "fechaControl",
          
          -- Estado general idéntico a equipos
          CASE 
            WHEN COUNT(cp.id_certificado_persona) = 0 THEN 'sin_documentos'
            WHEN COUNT(cp.id_certificado_persona) FILTER (
              WHERE tp.obligatorio = true 
              AND cp.fecha_vencimiento < CURRENT_DATE
            ) > 0 THEN 'bloqueado'
            WHEN COUNT(cp.id_certificado_persona) FILTER (
              WHERE tp.obligatorio = true 
              AND cp.fecha_vencimiento >= CURRENT_DATE 
              AND cp.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
            ) > 0 THEN 'por_vencer'
            ELSE 'habilitado'
          END AS estado

        FROM sch_leangsp.tsec_users u
        LEFT JOIN sch_leangsp.tsec_certificados_persona cp ON u.id_user = cp.id_user
        LEFT JOIN sch_leangsp.tsec_tipos_certificado_persona tp ON cp.id_tipo_certificado_persona = tp.id_tipo_certificado_persona
        \
        GROUP BY u.id_user
        ORDER BY u.id_user DESC
      \;

      const { rows } = await db.query(sql, values);

      let filteredRows = rows.map(row => {
        return {
          id_user: row.id_user,
          nombre: row.nombre.replace(/\\s+/g, ' ').trim(),
          rut: row.rut,
          email: row.email,
          movil: row.movil,
          activo: row.activo,
          rol: row.cargo,
          fechaControl: row.fechaControl ? row.fechaControl.toISOString().split('T')[0] : 'S/I',
          estado: row.estado
        };
      });

      if (from || to) {
        filteredRows = filteredRows.filter(row => {
          if (row.fechaControl === 'S/I') return false;
          if (from && row.fechaControl < from) return false;
          if (to && row.fechaControl > to) return false;
          return true;
        });
      }

      return filteredRows;
    } catch (err) {
      console.error("Error en getAcreditacionPersonal:", err);
      throw err;
    }
  },

  // Obtener detalle de un usuario y sus certificados
  async getAcreditacionPersonalDetail(id_user) {
    try {
      const userSql = \
        SELECT id_user, rut, email, name_frst, name_sec, apellido_pat, apellido_mat, movil, activo, json_data
        FROM sch_leangsp.tsec_users
        WHERE id_user = \ AND id_empresa = 9
      \;
      const { rows: userRows } = await db.query(userSql, [id_user]);
      if (userRows.length === 0) return null;

      const user = userRows[0];
      let cargo = 'Operador';
      try {
        const parsed = typeof user.json_data === 'string' ? JSON.parse(user.json_data) : user.json_data;
        if (parsed?.cargo) cargo = parsed.cargo;
      } catch (e) {}

      const certsSql = \
        SELECT 
          cp.id_certificado_persona,
          cp.id_tipo_certificado_persona,
          tp.nombre_tipo,
          tp.obligatorio,
          cp.fecha_emision,
          cp.fecha_vencimiento,
          cp.id_doc,
          cp.observaciones,
          CASE 
            WHEN cp.fecha_vencimiento IS NULL THEN 'Vigente'
            WHEN cp.fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
            WHEN cp.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por Vencer'
            ELSE 'Vigente'
          END AS estado_vigencia
        FROM sch_leangsp.tsec_certificados_persona cp
        JOIN sch_leangsp.tsec_tipos_certificado_persona tp ON cp.id_tipo_certificado_persona = tp.id_tipo_certificado_persona
        WHERE cp.id_user = \
        ORDER BY cp.fecha_vencimiento DESC NULLS FIRST, cp.id_certificado_persona DESC
      \;
      const { rows: certsRows } = await db.query(certsSql, [id_user]);

      return {
        id_user: user.id_user,
        rut: user.rut,
        email: user.email,
        name_frst: user.name_frst,
        name_sec: user.name_sec,
        apellido_pat: user.apellido_pat,
        apellido_mat: user.apellido_mat,
        movil: user.movil,
        activo: user.activo,
        cargo,
        certificados: certsRows.map(c => ({
          id_certificado_persona: c.id_certificado_persona,
          id_tipo_certificado_persona: c.id_tipo_certificado_persona,
          nombre_tipo: c.nombre_tipo,
          obligatorio: c.obligatorio,
          fecha_emision: c.fecha_emision ? c.fecha_emision.toISOString().split('T')[0] : null,
          fecha_vencimiento: c.fecha_vencimiento ? c.fecha_vencimiento.toISOString().split('T')[0] : null,
          id_doc: c.id_doc,
          observaciones: c.observaciones,
          estado_vigencia: c.estado_vigencia
        }))
      };
    } catch (err) {
      console.error("Error en getAcreditacionPersonalDetail:", err);
      throw err;
    }
  },

  // Modificar usuario
  async updateAcreditacionPersonal(id_user, data) {
    try {
      const { name_frst, name_sec, apellido_pat, apellido_mat, rut, email, movil, activo, cargo } = data;
      
      const json_data = JSON.stringify({ cargo });

      const sql = \
        UPDATE sch_leangsp.tsec_users
        SET name_frst = \, name_sec = \, apellido_pat = \, apellido_mat = \,
            rut = \, email = \, movil = \, activo = \, json_data = \,
            fecha_actualizacion = NOW()
        WHERE id_user = \ AND id_empresa = 9
        RETURNING id_user
      \;
      const { rows } = await db.query(sql, [
        name_frst, name_sec || null, apellido_pat, apellido_mat || null,
        rut, email, movil || null, activo, json_data, id_user
      ]);

      return rows.length > 0;
    } catch (err) {
      console.error("Error en updateAcreditacionPersonal:", err);
      throw err;
    }
  },

  // Agregar certificado
  async addCertificado(id_user, certData) {
    try {
      const { id_tipo_certificado_persona, fecha_emision, fecha_vencimiento, id_doc, observaciones } = certData;
      const sql = \
        INSERT INTO sch_leangsp.tsec_certificados_persona (
          id_user, id_tipo_certificado_persona, fecha_emision, fecha_vencimiento, id_doc, observaciones
        )
        VALUES (\, \, \, \, \, \)
        RETURNING id_certificado_persona
      \;
      const { rows } = await db.query(sql, [
        id_user, id_tipo_certificado_persona, 
        fecha_emision || null, 
        fecha_vencimiento || null, 
        id_doc || null, 
        observaciones || null
      ]);

      // Forzar actualización de fecha_actualizacion del usuario para semáforos de control
      await db.query('UPDATE sch_leangsp.tsec_users SET fecha_actualizacion = NOW() WHERE id_user = \', [id_user]);

      return rows[0].id_certificado_persona;
    } catch (err) {
      console.error("Error en addCertificado:", err);
      throw err;
    }
  },

  // Eliminar certificado
  async deleteCertificado(id_certificado_persona, id_user) {
    try {
      const sql = \
        DELETE FROM sch_leangsp.tsec_certificados_persona
        WHERE id_certificado_persona = \ AND id_user = \
      \;
      const { rowCount } = await db.query(sql, [id_certificado_persona, id_user]);

      // Forzar actualización de fecha_actualizacion del usuario
      await db.query('UPDATE sch_leangsp.tsec_users SET fecha_actualizacion = NOW() WHERE id_user = \', [id_user]);

      return rowCount > 0;
    } catch (err) {
      console.error("Error en deleteCertificado:", err);
      throw err;
    }
  },

  // Obtener maestro de tipos de certificados de persona
  async getTiposCertificadoPersona() {
    try {
      const sql = \
        SELECT id_tipo_certificado_persona, nombre_tipo, obligatorio, dias_alerta
        FROM sch_leangsp.tsec_tipos_certificado_persona
        ORDER BY obligatorio DESC, nombre_tipo ASC
      \;
      const { rows } = await db.query(sql);
      return rows;
    } catch (err) {
      console.error("Error en getTiposCertificadoPersona:", err);
      throw err;
    }
  }
};

module.exports = acreditacionModel;
