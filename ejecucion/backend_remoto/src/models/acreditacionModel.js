const pool = require("../config/postgresPool");

class AcreditacionModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  // Obtener lista general con semáforos HSEC resumidos
  async getAcreditacionPersonal(filters = {}) {
    try {
      const { q, from, to } = filters;
      const values = [];
      let whereClause = "WHERE u.id_empresa = 9";
      let paramIdx = 1;

      if (q) {
        whereClause += ` AND (
          UPPER(u.name_frst) LIKE $${paramIdx} OR 
          UPPER(u.apellido_pat) LIKE $${paramIdx} OR 
          UPPER(u.rut) LIKE $${paramIdx}
        )`;
        values.push(`%${q.toUpperCase()}%`);
        paramIdx++;
      }

      const sql = `
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

        FROM tsec_users u
        LEFT JOIN tsec_certificados_persona cp ON u.id_user = cp.id_user
        LEFT JOIN tsec_tipos_certificado_persona tp ON cp.id_tipo_certificado_persona = tp.id_tipo_certificado_persona
        ${whereClause}
        GROUP BY u.id_user
        ORDER BY u.id_user DESC
      `;

      const { rows } = await this.pool.query(sql, values);

      let filteredRows = rows.map(row => {
        return {
          id_user: row.id_user,
          nombre: row.nombre.replace(/\s+/g, ' ').trim(),
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
  }

  // Obtener detalle de un usuario y sus certificados
  async getAcreditacionPersonalDetail(id_user) {
    try {
      const userSql = `
        SELECT id_user, rut, email, name_frst, name_sec, apellido_pat, apellido_mat, movil, activo, json_data
        FROM tsec_users
        WHERE id_user = $1 AND id_empresa = 9
      `;
      const { rows: userRows } = await this.pool.query(userSql, [id_user]);
      if (userRows.length === 0) return null;

      const user = userRows[0];
      let cargo = 'Operador';
      try {
        const parsed = typeof user.json_data === 'string' ? JSON.parse(user.json_data) : user.json_data;
        if (parsed?.cargo) cargo = parsed.cargo;
      } catch (e) {}

      const certsSql = `
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
        FROM tsec_certificados_persona cp
        JOIN tsec_tipos_certificado_persona tp ON cp.id_tipo_certificado_persona = tp.id_tipo_certificado_persona
        WHERE cp.id_user = $1
        ORDER BY cp.fecha_vencimiento DESC NULLS FIRST, cp.id_certificado_persona DESC
      `;
      const { rows: certsRows } = await this.pool.query(certsSql, [id_user]);

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
  }

  // Modificar usuario
  async updateAcreditacionPersonal(id_user, data) {
    try {
      const { name_frst, name_sec, apellido_pat, apellido_mat, rut, email, movil, activo, cargo } = data;
      
      const json_data = JSON.stringify({ cargo });

      const sql = `
        UPDATE tsec_users
        SET name_frst = $1, name_sec = $2, apellido_pat = $3, apellido_mat = $4,
            rut = $5, email = $6, movil = $7, activo = $8, json_data = $9,
            fecha_actualizacion = NOW()
        WHERE id_user = $10 AND id_empresa = 9
        RETURNING id_user
      `;
      const { rows } = await this.pool.query(sql, [
        name_frst, name_sec || null, apellido_pat, apellido_mat || null,
        rut, email, movil || null, activo, json_data, id_user
      ]);

      return rows.length > 0;
    } catch (err) {
      console.error("Error en updateAcreditacionPersonal:", err);
      throw err;
    }
  }

  // Agregar certificado
  async addCertificado(id_user, certData) {
    try {
      const { id_tipo_certificado_persona, fecha_emision, fecha_vencimiento, id_doc, observaciones } = certData;
      const sql = `
        INSERT INTO tsec_certificados_persona (
          id_user, id_tipo_certificado_persona, fecha_emision, fecha_vencimiento, id_doc, observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_certificado_persona
      `;
      const { rows } = await this.pool.query(sql, [
        id_user, id_tipo_certificado_persona, 
        fecha_emision || null, 
        fecha_vencimiento || null, 
        id_doc || null, 
        observaciones || null
      ]);

      // Forzar actualización de fecha_actualizacion del usuario para semáforos de control
      await this.pool.query('UPDATE tsec_users SET fecha_actualizacion = NOW() WHERE id_user = $1', [id_user]);

      return rows[0].id_certificado_persona;
    } catch (err) {
      console.error("Error en addCertificado:", err);
      throw err;
    }
  }

  // Eliminar certificado
  async deleteCertificado(id_certificado_persona, id_user) {
    try {
      const sql = `
        DELETE FROM tsec_certificados_persona
        WHERE id_certificado_persona = $1 AND id_user = $2
      `;
      const { rowCount } = await this.pool.query(sql, [id_certificado_persona, id_user]);

      // Forzar actualización de fecha_actualizacion del usuario
      await this.pool.query('UPDATE tsec_users SET fecha_actualizacion = NOW() WHERE id_user = $1', [id_user]);

      return rowCount > 0;
    } catch (err) {
      console.error("Error en deleteCertificado:", err);
      throw err;
    }
  }

  // Obtener maestro de tipos de certificados de persona
  async getTiposCertificadoPersona() {
    try {
      const sql = `
        SELECT id_tipo_certificado_persona, nombre_tipo, obligatorio, dias_alerta
        FROM tsec_tipos_certificado_persona
        ORDER BY obligatorio DESC, nombre_tipo ASC
      `;
      const { rows } = await this.pool.query(sql);
      return rows;
    } catch (err) {
      console.error("Error en getTiposCertificadoPersona:", err);
      throw err;
    }
  }
}

module.exports = AcreditacionModel;
