const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres"
});

async function run() {
  try {
    await client.connect();
    await client.query("SET search_path TO sch_leangsp, public");

    const sql = `
      SELECT 
        e.id_equipo,
        e.patente,
        e.codigo_interno,
        COUNT(ce.id_certificado) AS total_certs,
        COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP')) AS cant_cert_legal,
        COUNT(ce.id_certificado) FILTER (WHERE tc.nombre_tipo NOT IN ('Permiso de Circulación', 'Revisión Técnica', 'SOAP')) AS cant_cert_gral,
        MIN(ce.fecha_vencimiento) AS min_vencimiento
      FROM tequ_equipo e
      LEFT JOIN tequ_certificados_equipo ce ON e.id_equipo = ce.id_equipo
      LEFT JOIN tequ_tipos_certificado tc ON ce.id_tipo_certificado = tc.id_tipo_certificado
      WHERE e.patente LIKE '%DXGG%' OR e.codigo_interno LIKE '%TRC-126%'
      GROUP BY e.id_equipo
    `;

    const { rows } = await client.query(sql);
    console.log("SQL Result for DXGG / TRC-126:\n", rows);

    // Let's also check all certificates for DXGG
    if (rows.length > 0) {
      const certsSql = `
        SELECT ce.id_certificado, ce.fecha_vencimiento, tc.nombre_tipo, f.name_doc_orig
        FROM tequ_certificados_equipo ce
        JOIN tequ_tipos_certificado tc ON ce.id_tipo_certificado = tc.id_tipo_certificado
        LEFT JOIN tfmg_file f ON ce.id_doc = f.id_doc
        WHERE ce.id_equipo = $1
      `;
      const certsRes = await client.query(certsSql, [rows[0].id_equipo]);
      console.log("\nCertificates for this equipo:\n", certsRes.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
