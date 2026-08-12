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
