const pool = require("../config/postgresPool");

exports.getEmpresas = async (req, res) => {
  try {
    const { search, externo, id } = req.query;
    let query = `SELECT * FROM tpar_empresas WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (id) {
      query += ` AND id_empresa = $${paramIndex++}`;
      values.push(Number(id));
    }

    if (externo !== undefined) {
      query += ` AND flag_externo = $${paramIndex++}`;
      values.push(externo === 'true');
    }

    if (search) {
      const cleanSearch = search.replace(/\./g, '');
      query += ` AND (rut_empresa LIKE $${paramIndex} OR razon_social ILIKE $${paramIndex} OR name_empresa ILIKE $${paramIndex})`;
      values.push(`%${cleanSearch}%`);
      paramIndex++;
    }

    query += ` ORDER BY id_empresa ASC`;

    if (search) {
      query += ` LIMIT 20`;
    }

    const { rows } = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error getEmpresas:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createEmpresa = async (req, res) => {
  try {
    const {
      rut_empresa,
      razon_social,
      name_empresa,
      giro,
      direccion,
      fono_contacto,
      flag_externo,
      region_facturacion,
      comuna_facturacion,
      direccion_facturacion
    } = req.body;

    const finalName = name_empresa || razon_social;

    const query = `
      INSERT INTO tpar_empresas (
        rut_empresa, razon_social, name_empresa, 
        giro, direccion, fono_contacto, flag_externo,
        region_facturacion, comuna_facturacion, direccion_facturacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      rut_empresa || null,
      razon_social || null,
      finalName || null,
      giro || null,
      direccion || null,
      fono_contacto || null,
      flag_externo !== undefined ? flag_externo : false,
      region_facturacion || null,
      comuna_facturacion || null,
      direccion_facturacion || null
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error createEmpresa:", error);
    res.status(500).json({ error: error.message });
  }
};
