const pool = require('../src/config/dbConfig.js');

async function run() {
  try {
    const sql = `
        SELECT 
          e.*,
          s.nombre_subcategoria,
          c.id_categoria,
          c.nombre_categoria,
          m.nombre_modelo,
          b.id_marca,
          b.nombre_marca,
          emp.name_empresa,
          emp.razon_social,
          (
            SELECT COUNT(DISTINCT srv.id_survey)
            FROM tsrv_survey srv
            WHERE srv.id_equipo = e.id_equipo 
               OR (srv.body_exec->>'patente' IS NOT NULL AND UPPER(TRIM(srv.body_exec->>'patente')) = UPPER(TRIM(e.patente)))
               OR (srv.header_exec->>'patente' IS NOT NULL AND UPPER(TRIM(srv.header_exec->>'patente')) = UPPER(TRIM(e.patente)))
          ) AS cant_inspecciones,
          CASE 
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP')) = 0 THEN 'empty'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento < CURRENT_DATE) > 0 THEN 'error'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days') > 0 THEN 'warning'
            ELSE 'ok'
          END AS estado_doc_legal,
          CASE 
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP')) = 0 THEN 'empty'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento < CURRENT_DATE) > 0 THEN 'error'
            WHEN COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP') AND ce.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days') > 0 THEN 'warning'
            ELSE 'ok'
          END AS estado_doc_gral
        FROM tequ_equipo e
        LEFT JOIN tequ_subcategoria s ON e.id_subcategoria = s.id_subcategoria
        LEFT JOIN tequ_categoria c ON s.id_categoria = c.id_categoria
        LEFT JOIN tequ_modelo m ON e.id_modelo = m.id_modelo
        LEFT JOIN tequ_marca b ON m.id_marca = b.id_marca
        LEFT JOIN tpar_empresas emp ON e.id_empresa = emp.id_empresa
        LEFT JOIN tequ_certificados_equipo ce ON e.id_equipo = ce.id_equipo
        LEFT JOIN tequ_tipos_certificado tc ON ce.id_tipo_certificado = tc.id_tipo_certificado
        GROUP BY e.id_equipo, s.id_subcategoria, c.id_categoria, m.id_modelo, b.id_marca, emp.id_empresa
        ORDER BY e.id_equipo DESC
        LIMIT 5
    `;
    const res = await pool.query(sql);
    console.log('Query result length:', res.rows.length);
    console.log('Sample row inspection count:', res.rows[0].cant_inspecciones);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
