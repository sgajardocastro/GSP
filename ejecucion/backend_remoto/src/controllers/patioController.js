const pool = require('../config/postgresPool');

const patioController = {
  // 1. Obtener flota activa para el selector autocompletable
  async getEquiposFlota(req, res) {
    try {
      const sql = `
        SELECT 
          e.id_equipo,
          COALESCE(e.patente, 'S/P') AS patente,
          COALESCE(b.nombre_marca, '') AS marca,
          COALESCE(m.nombre_modelo, '') AS modelo,
          COALESCE(c.nombre_categoria, '') AS categoria,
          COALESCE(s.nombre_subcategoria, '') AS subcategoria,
          COALESCE(emp.name_empresa, emp.razon_social, 'GSP') AS empresa_duena,
          CONCAT(
            COALESCE(e.patente, 'S/P'), 
            ' • ', 
            COALESCE(b.nombre_marca, ''), ' ', COALESCE(m.nombre_modelo, ''), 
            CASE WHEN c.nombre_categoria IS NOT NULL AND TRIM(c.nombre_categoria) != '' THEN CONCAT(' (', c.nombre_categoria, ')') ELSE '' END
          ) AS display_label
        FROM tequ_equipo e
        LEFT JOIN tequ_subcategoria s ON e.id_subcategoria = s.id_subcategoria
        LEFT JOIN tequ_categoria c ON s.id_categoria = c.id_categoria
        LEFT JOIN tequ_modelo m ON e.id_modelo = m.id_modelo
        LEFT JOIN tequ_marca b ON m.id_marca = b.id_marca
        LEFT JOIN tpar_empresas emp ON e.id_empresa = emp.id_empresa
        WHERE e.patente IS NOT NULL AND TRIM(e.patente) != ''
        ORDER BY e.patente ASC
      `;
      const result = await pool.query(sql);
      return res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error en getEquiposFlota:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Iniciar / crear una inspección autónoma de patio
  async iniciarInspeccionPatio(req, res) {
    try {
      const { tipo_movimiento, patente, id_equipo, id_user, ot_referencia } = req.body;

      if (!tipo_movimiento || !patente) {
        return res.status(400).json({ success: false, error: 'tipo_movimiento y patente son requeridos' });
      }

      // 2.1 Obtener template 79
      const tmplRes = await pool.query(
        "SELECT id_template, id_tipo_srv, id_flow_tmpl, body_seed, header_seed, approval_seed FROM tsrv_templates WHERE codi_template_srv = 'TMPL-GSP-CHECKLIST-PATIO' OR id_template = 79"
      );
      if (tmplRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Template TMPL-GSP-CHECKLIST-PATIO no encontrado en base de datos' });
      }
      const tmpl = tmplRes.rows[0];

      // 2.2 Obtener datos del equipo y usuario para precargar
      let equipoInfo = {};
      if (id_equipo || patente) {
        const eqRes = await pool.query(`
          SELECT e.id_equipo, e.patente, c.nombre_categoria, s.nombre_subcategoria, m.nombre_modelo, b.nombre_marca, e.id_empresa
          FROM tequ_equipo e
          LEFT JOIN tequ_subcategoria s ON e.id_subcategoria = s.id_subcategoria
          LEFT JOIN tequ_categoria c ON s.id_categoria = c.id_categoria
          LEFT JOIN tequ_modelo m ON e.id_modelo = m.id_modelo
          LEFT JOIN tequ_marca b ON m.id_marca = b.id_marca
          WHERE e.id_equipo = $1 OR UPPER(TRIM(e.patente)) = UPPER(TRIM($2))
          LIMIT 1
        `, [id_equipo || null, patente]);
        if (eqRes.rows.length > 0) {
          equipoInfo = eqRes.rows[0];
        }
      }

      let operadorNombre = 'Inspector de Patio';
      if (id_user) {
        const uRes = await pool.query("SELECT nombre_user, id_empresa FROM tsec_users WHERE id_user = $1", [id_user]);
        if (uRes.rows.length > 0) {
          operadorNombre = uRes.rows[0].nombre_user;
        }
      }

      // 2.3 Preparar body_exec presembrado con datos generales (Segmento 1)
      let bodyData = tmpl.body_seed;
      if (typeof bodyData === 'string') {
        try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = { segmentos: [] }; }
      }

      if (bodyData && Array.isArray(bodyData.segmentos) && bodyData.segmentos.length > 0) {
        const seg1 = bodyData.segmentos[0];
        if (Array.isArray(seg1.attributes)) {
          for (const attr of seg1.attributes) {
            if (attr.label === 'TIPO DE MOVIMIENTO') {
              attr.default = tipo_movimiento;
              if (attr.values) attr.values.selected = tipo_movimiento;
            } else if (attr.label === 'PLACA PATENTE / EQUIPO') {
              attr.default = patente;
            } else if (attr.label === 'CATEGORÍA DEL EQUIPO') {
              attr.default = equipoInfo.nombre_categoria || '';
            } else if (attr.label === 'SUBCATEGORÍA / MODELO') {
              attr.default = equipoInfo.nombre_modelo || equipoInfo.nombre_subcategoria || '';
            } else if (attr.label === 'NOMBRE OPERADOR / INSPECTOR') {
              attr.default = operadorNombre;
            } else if (attr.label === 'NÚMERO DE OT / PROYECTO (OPCIONAL)') {
              attr.default = ot_referencia || '';
            }
          }
        }
      }

      // 2.4 Resolver proyecto y empresa cliente (Patrón Operaciones Internas)
      const proyRes = await pool.query(`
        SELECT id_proyecto, id_empresa_cliente 
        FROM tpry_proyecto 
        WHERE codi_proyecto ILIKE '%PATIO%' OR nombre_proyecto ILIKE '%PATIO%' OR id_proyecto = 94
        ORDER BY id_proyecto ASC 
        LIMIT 1
      `);
      const idProyectoBase = proyRes.rows.length > 0 ? proyRes.rows[0].id_proyecto : 94;
      const idEmpresaCliente = equipoInfo.id_empresa || (proyRes.rows.length > 0 ? proyRes.rows[0].id_empresa_cliente : 9) || 9;

      const headerExec = {
        tipo_movimiento,
        patente,
        id_equipo: equipoInfo.id_equipo || id_equipo || null,
        nombre_operador: operadorNombre,
        ot_referencia: ot_referencia || null,
        creado_en: new Date().toISOString()
      };

      // 2.5 Insertar en tsrv_survey
      const insertSql = `
        INSERT INTO tsrv_survey (
          id_tipo_srv,
          id_template,
          id_user,
          id_user_creacion,
          id_empresa_cliente,
          estado_srv,
          header_seed,
          body_seed,
          approval_seed,
          header_exec,
          body_exec,
          approval_exec,
          fecha_plan_ini,
          fecha_plan_fin,
          fecha_real_ini,
          id_proyecto,
          id_flow_tmpl
        ) VALUES (
          $1, $2, $3, $4, $5, 'Creado',
          $6, $7, $8, $9, $10, $11,
          NOW(), NOW(), NOW(),
          $12, $13
        ) RETURNING id_survey;
      `;

      const values = [
        tmpl.id_tipo_srv || 2,
        tmpl.id_template,
        id_user || 1,
        id_user || 1,
        idEmpresaCliente,
        JSON.stringify(headerExec),
        JSON.stringify(bodyData),
        JSON.stringify(tmpl.approval_seed || {}),
        JSON.stringify(headerExec),
        JSON.stringify(bodyData),
        JSON.stringify(tmpl.approval_seed || {}),
        idProyectoBase,
        tmpl.id_flow_tmpl || 1
      ];

      const insRes = await pool.query(insertSql, values);
      const idSurvey = insRes.rows[0].id_survey;

      return res.status(201).json({
        success: true,
        message: 'Inspección de patio iniciada correctamente',
        id_survey: idSurvey
      });

    } catch (err) {
      console.error('Error en iniciarInspeccionPatio:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = patioController;
