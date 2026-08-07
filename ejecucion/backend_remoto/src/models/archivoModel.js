//const db = require('../config/dbConfig');
const pool = require("../config/postgresPool");

class Archivo {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  async insertarTfmgFile(
    tipo_doc,
    mimetype,
    name_doc_orig,
    name_doc_interno,
    path_doc,
    id_user,
    estado
  ) {
    const sql = `INSERT INTO tfmg_file (
                tipo_doc,
                mimetype,
                name_doc_orig,
                name_doc_interno,
                path_doc,
                id_user,
                estado
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id_doc, fecha_creacion, name_doc_orig, name_doc_interno`;
    try {
      const { rows } = await this.pool.query(sql, [
        tipo_doc,
        mimetype,
        name_doc_orig,
        name_doc_interno,
        path_doc,
        id_user,
        estado,
      ]);
      return rows[0] || null;
    } catch (err) {
      console.error("Error en postArchivo:", err);
      throw new Error("Error al crear archivo");
    }
  }

  async guardarArchivoDesdeRutaTransaccional(data) {
  const query = `
    INSERT INTO tfmg_file (
      tipo_doc,
      mimetype,
      name_doc_orig,
      name_doc_interno,
      path_doc,
      id_user,
      estado
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id_doc;
  `;

  const values = [
    data.tipo_doc,
    data.mimetype,
    data.name_doc_orig,
    data.name_doc_interno,
    data.path_doc,
    data.id_user,
    data.estado
  ];

  const result = await this.pool.query(query, values);
  return result.rows[0].id_doc;
}

  async insertarTfmgCnxLoad(data) {
    const {
      id_doc,
      id_user,
      fecha_proyectada_ejecucion,
      cant_total_excel,
      cant_cargados,
      cant_rechazados,
      flag_recarga,
      geoloc_lat,
      geoloc_lng,
      estado_carga,
      observaciones
    } = data;

    const query = `
      INSERT INTO tfmg_cnx_load (
        id_doc,
        id_user,
        fecha_proyectada_ejecucion,
        cant_total_excel,
        cant_cargados,
        cant_rechazados,
        flag_recarga,
        geoloc_lat,
        geoloc_lng,
        estado_carga,
        observaciones
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING
        id_load,
        id_doc,
        id_user,
        fecha_carga,
        fecha_proyectada_ejecucion,
        cant_total_excel,
        cant_cargados,
        cant_rechazados,
        flag_recarga,
        geoloc_lat,
        geoloc_lng,
        estado_carga,
        observaciones
    `;

    const values = [
      id_doc,
      id_user,
      fecha_proyectada_ejecucion,
      cant_total_excel,
      cant_cargados,
      cant_rechazados,
      flag_recarga,
      geoloc_lat,
      geoloc_lng,
      estado_carga,
      observaciones
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getArchivoById(id) {
    try {
      const cleanId = String(id || '').trim();
      const sql = 'SELECT * FROM tfmg_file WHERE id_doc::text = $1 OR name_doc_interno = $1';
      const { rows } = await this.pool.query(sql, [cleanId]);
      return rows[0];
    } catch (err) {
      console.error("Error en getArchivoById:", err);
      return null;
    }
  }

}

module.exports = Archivo;