const { Pool } = require("pg");
const pool = new Pool({ connectionString: "postgres://usr_leangsp:usr_gsp_123@servidor.leanglobal.cl:5432/postgres" });

async function check() {
  const reps = await pool.query(`
    SELECT 
      ra.id_reporte_avance,
      ra.id_proyecto,
      ra.dia_correlativo,
      ra.fecha_reporte,
      ra.horas_operadas,
      ra.horas_facturables,
      ra.horas_minimas,
      ra.horas_colacion,
      ra.horometro_inicio,
      ra.horometro_termino,
      ra.estado_reporte,
      ra.fecha_registro,
      ra.cliente_nombre,
      ra.cliente_rut,
      ra.cliente_firma_canvas_base64 IS NOT NULL as tiene_firma,
      ra.foto_horometro,
      ra.foto_tablero_inicio,
      ra.foto_tablero_termino,
      ra.ajustes_analista,
      p.codi_proyecto,
      p.nombre_proyecto,
      COALESCE(clt.razon_social, clt.name_empresa, p.json_field->'crm_v1'->>'cliente_nombre', 'Cliente') as cliente_nombre_ot,
      COALESCE(p.json_field->'crm_v1'->>'obra_nombre', p.json_field->>'obra_nombre', 'Faena') as obra_nombre,
      COALESCE(e.patente, 'S/P') as equipo_patente,
      COALESCE(e.modelo, '') as equipo_modelo,
      COALESCE(u_op.name_frst || ' ' || u_op.apellido_pat, 'Operador') as operador_nombre
    FROM sch_leangsp.tedp_reporte_avance ra
    LEFT JOIN sch_leangsp.tpry_proyecto p ON ra.id_proyecto = p.id_proyecto
    LEFT JOIN sch_leangsp.tpar_empresas clt ON p.id_empresa_cliente = clt.id_empresa
    LEFT JOIN sch_leangsp.tequ_equipo e ON ra.id_equipo = e.id_equipo
    LEFT JOIN sch_leangsp.tsec_users u_op ON ra.id_user_operador = u_op.id_user
    ORDER BY 
      CASE WHEN ra.estado_reporte = 'PENDIENTE_VALIDACION' THEN 0 ELSE 1 END,
      ra.fecha_reporte DESC,
      ra.id_reporte_avance DESC
  `);
  console.log("Reports encontrados:", reps.rows.length);
  console.table(reps.rows.slice(0, 5).map(r => ({
    id: r.id_reporte_avance,
    ot: r.codi_proyecto,
    dia: r.dia_correlativo,
    fecha: r.fecha_reporte,
    patente: r.equipo_patente,
    operador: r.operador_nombre,
    horas: r.horas_facturables,
    estado: r.estado_reporte
  })));

  pool.end();
}
check().catch(console.error);
