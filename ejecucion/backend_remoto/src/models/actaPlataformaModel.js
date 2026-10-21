const pool = require('../config/postgresPool');

class ActaPlataformaModel {
  constructor() {
    this.pool = pool;
  }

  async generarFolioActa(id_proyecto) {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `ACT-${yy}${mm}-${String(id_proyecto).padStart(3, '0')}`;
  }

  async getActaByProyecto(id_proyecto) {
    const q = `
      SELECT 
        a.*,
        eq.marca AS equipo_marca,
        eq.modelo AS equipo_modelo,
        eq.patente AS equipo_patente,
        eq.tipo_equipo AS equipo_tipo,
        eq.numero_serie AS equipo_serie,
        TRIM(COALESCE(u_ent.name_frst, '') || ' ' || COALESCE(u_ent.apellido_pat, '')) AS chofer_entrega_nombre,
        u_ent.rut AS chofer_entrega_rut,
        TRIM(COALESCE(u_ret.name_frst, '') || ' ' || COALESCE(u_ret.apellido_pat, '')) AS chofer_retiro_nombre,
        u_ret.rut AS chofer_retiro_rut,
        f_pdf_ent.id_doc AS id_doc_pdf_entrega,
        f_pdf_fin.id_doc AS id_doc_pdf_final
      FROM tope_acta_plataforma a
      LEFT JOIN tequ_equipo eq ON a.id_equipo_plataforma = eq.id_equipo
      LEFT JOIN tsec_users u_ent ON a.id_chofer_entrega = u_ent.id_user
      LEFT JOIN tsec_users u_ret ON a.id_chofer_retiro = u_ret.id_user
      LEFT JOIN tfmg_file f_pdf_ent ON a.id_file_pdf_entrega = f_pdf_ent.id_doc
      LEFT JOIN tfmg_file f_pdf_fin ON a.id_file_pdf_final = f_pdf_fin.id_doc
      WHERE a.id_proyecto = $1
      ORDER BY a.id_acta DESC
      LIMIT 1;
    `;
    const { rows } = await this.pool.query(q, [id_proyecto]);
    return rows[0] || null;
  }

  async guardarEntrega(data) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const folio = data.folio_acta || await this.generarFolioActa(data.id_proyecto);

      const checkQ = `SELECT id_acta FROM tope_acta_plataforma WHERE id_proyecto = $1`;
      const checkRes = await client.query(checkQ, [data.id_proyecto]);

      let result;
      if (checkRes.rows.length > 0) {
        const id_acta = checkRes.rows[0].id_acta;
        const updateQ = `
          UPDATE tope_acta_plataforma
          SET 
            id_equipo_plataforma = COALESCE($1, id_equipo_plataforma),
            id_camion_traslado = COALESCE($2, id_camion_traslado),
            id_desplazamiento_ida = COALESCE($3, id_desplazamiento_ida),
            numero_contrato = COALESCE($4, numero_contrato),
            estado = 'ENTREGADA',
            fecha_entrega = NOW(),
            id_chofer_entrega = COALESCE($5, id_chofer_entrega),
            horometro_in = $6,
            combustible_in = $7,
            checklist_entrega = $8::jsonb,
            fotos_entrega = $9::jsonb,
            obs_entrega = $10,
            receptor_entrega_nombre = $11,
            receptor_entrega_rut = $12,
            receptor_entrega_cargo = $13,
            id_file_firma_entrega = COALESCE($14, id_file_firma_entrega),
            id_file_pdf_entrega = COALESCE($15, id_file_pdf_entrega),
            updated_at = NOW()
          WHERE id_acta = $16
          RETURNING *;
        `;
        const res = await client.query(updateQ, [
          data.id_equipo_plataforma,
          data.id_camion_traslado || null,
          data.id_desplazamiento_ida || null,
          data.numero_contrato || null,
          data.id_chofer_entrega || null,
          data.horometro_in || null,
          data.combustible_in || '4/4 (Lleno)',
          JSON.stringify(data.checklist_entrega || []),
          JSON.stringify(data.fotos_entrega || []),
          data.obs_entrega || '',
          data.receptor_entrega_nombre || '',
          data.receptor_entrega_rut || '',
          data.receptor_entrega_cargo || '',
          data.id_file_firma_entrega || null,
          data.id_file_pdf_entrega || null,
          id_acta
        ]);
        result = res.rows[0];
      } else {
        const insertQ = `
          INSERT INTO tope_acta_plataforma (
            id_proyecto,
            id_equipo_plataforma,
            id_camion_traslado,
            id_desplazamiento_ida,
            folio_acta,
            numero_contrato,
            estado,
            fecha_entrega,
            id_chofer_entrega,
            horometro_in,
            combustible_in,
            checklist_entrega,
            fotos_entrega,
            obs_entrega,
            receptor_entrega_nombre,
            receptor_entrega_rut,
            receptor_entrega_cargo,
            id_file_firma_entrega,
            id_file_pdf_entrega,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'ENTREGADA', NOW(), $7, $8, $9,
            $10::jsonb, $11::jsonb, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          ) RETURNING *;
        `;
        const res = await client.query(insertQ, [
          data.id_proyecto,
          data.id_equipo_plataforma,
          data.id_camion_traslado || null,
          data.id_desplazamiento_ida || null,
          folio,
          data.numero_contrato || null,
          data.id_chofer_entrega || null,
          data.horometro_in || null,
          data.combustible_in || '4/4 (Lleno)',
          JSON.stringify(data.checklist_entrega || []),
          JSON.stringify(data.fotos_entrega || []),
          data.obs_entrega || '',
          data.receptor_entrega_nombre || '',
          data.receptor_entrega_rut || '',
          data.receptor_entrega_cargo || '',
          data.id_file_firma_entrega || null,
          data.id_file_pdf_entrega || null
        ]);
        result = res.rows[0];
      }

      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async guardarRetiro(data) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const updateQ = `
        UPDATE tope_acta_plataforma
        SET 
          id_desplazamiento_retorno = COALESCE($1, id_desplazamiento_retorno),
          estado = 'RECIBIDA_CONFORME',
          fecha_retiro = NOW(),
          id_chofer_retiro = COALESCE($2, id_chofer_retiro),
          horometro_out = $3,
          combustible_out = $4,
          checklist_retiro = $5::jsonb,
          fotos_retiro = $6::jsonb,
          obs_retiro = $7,
          receptor_retiro_nombre = $8,
          receptor_retiro_rut = $9,
          receptor_retiro_cargo = $10,
          id_file_firma_retiro = COALESCE($11, id_file_firma_retiro),
          id_file_pdf_final = COALESCE($12, id_file_pdf_final),
          updated_at = NOW()
        WHERE id_proyecto = $13
        RETURNING *;
      `;
      const res = await client.query(updateQ, [
        data.id_desplazamiento_retorno || null,
        data.id_chofer_retiro || null,
        data.horometro_out || null,
        data.combustible_out || '4/4 (Lleno)',
        JSON.stringify(data.checklist_retiro || []),
        JSON.stringify(data.fotos_retiro || []),
        data.obs_retiro || '',
        data.receptor_retiro_nombre || '',
        data.receptor_retiro_rut || '',
        data.receptor_retiro_cargo || '',
        data.id_file_firma_retiro || null,
        data.id_file_pdf_final || null,
        data.id_proyecto
      ]);

      await client.query('COMMIT');
      return res.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getActasByEquipo(id_equipo) {
    const q = `
      SELECT 
        a.*,
        p.codi_proyecto,
        p.nombre_proyecto,
        e.razon_social AS cliente_nombre,
        f_pdf_ent.id_doc AS id_doc_pdf_entrega,
        f_pdf_fin.id_doc AS id_doc_pdf_final
      FROM tope_acta_plataforma a
      LEFT JOIN tpry_proyecto p ON a.id_proyecto = p.id_proyecto
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      LEFT JOIN tfmg_file f_pdf_ent ON a.id_file_pdf_entrega = f_pdf_ent.id_doc
      LEFT JOIN tfmg_file f_pdf_fin ON a.id_file_pdf_final = f_pdf_fin.id_doc
      WHERE a.id_equipo_plataforma = $1
      ORDER BY a.id_acta DESC;
    `;
    const { rows } = await this.pool.query(q, [id_equipo]);
    return rows;
  }

  async getTodasLasActas() {
    const q = `
      SELECT 
        a.*,
        p.codi_proyecto,
        p.nombre_proyecto,
        e.razon_social AS cliente_nombre,
        eq.patente AS equipo_patente,
        eq.modelo AS equipo_modelo,
        f_pdf_ent.id_doc AS id_doc_pdf_entrega,
        f_pdf_fin.id_doc AS id_doc_pdf_final
      FROM tope_acta_plataforma a
      LEFT JOIN tpry_proyecto p ON a.id_proyecto = p.id_proyecto
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      LEFT JOIN tequ_equipo eq ON a.id_equipo_plataforma = eq.id_equipo
      LEFT JOIN tfmg_file f_pdf_ent ON a.id_file_pdf_entrega = f_pdf_ent.id_doc
      LEFT JOIN tfmg_file f_pdf_fin ON a.id_file_pdf_final = f_pdf_fin.id_doc
      ORDER BY a.id_acta DESC;
    `;
    const { rows } = await this.pool.query(q);
    return rows;
  }
}

module.exports = new ActaPlataformaModel();
