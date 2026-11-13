const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const run = async (title, sql) => {
    console.log(`\n=================== ${title} ===================`);
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${cleanSql}\\""`);
    console.log(res.stdout || res.stderr);
  };

  await run('DATOS DEL EQUIPO 36 EN TEQU_EQUIPO', `
    SELECT id_equipo, patente, modelo, marca, tipo_equipo,
           horometro_grua_acumulado, horometro_chasis_acumulado, odometro_acumulado,
           fecha_ultima_lectura, fuente_ultima_lectura, estado
    FROM sch_leangsp_prod.tequ_equipo
    WHERE id_equipo = 36;
  `);

  await run('DATOS DE LA OT / PROYECTO 62', `
    SELECT p.id_proyecto, p.codi_proyecto, p.nombre_proyecto, p.id_proyecto_estado,
           p.json_field->'cliente' as cliente,
           p.json_field->'ejecucion_v1'->>'id_equipo_principal' as id_eq_ppal,
           p.json_field->'ejecucion_v1'->>'operador_asignado' as op_asignado,
           p.json_field->'ejecucion_v1'->'equipos_asignados' as eqs_asignados,
           p.json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion
    FROM sch_leangsp_prod.tpry_proyecto p
    WHERE p.id_proyecto = 62;
  `);

  await run('HISTORIAL DE REPORTES DEL EQUIPO 36', `
    SELECT r.id_reporte_avance, r.id_proyecto, r.dia_correlativo, r.fecha_reporte, r.estado_reporte,
           r.horometro_inicio, r.horometro_termino,
           r.odometro_inicio, r.odometro_termino,
           r.id_user_operador, u.name_frst || ' ' || u.apellido_pat as operador
    FROM sch_leangsp_prod.tedp_reporte_avance r
    LEFT JOIN sch_leangsp_prod.tsec_users u ON u.id_user = r.id_user_operador
    WHERE r.id_equipo = 36
    ORDER BY r.id_reporte_avance DESC;
  `);

  await run('HISTORIAL DE VIAJES DEL EQUIPO 36', `
    SELECT v.id_log_desplazamiento, v.id_proyecto, v.tipo_trayecto, v.estado_trayecto,
           v.km_inicial, v.km_final,
           v.horometro_inicial, v.horometro_final,
           v.id_user_chofer, u.name_frst || ' ' || u.apellido_pat as chofer,
           v.token_viaje
    FROM sch_leangsp_prod.tequ_log_desplazamiento v
    LEFT JOIN sch_leangsp_prod.tsec_users u ON u.id_user = v.id_user_chofer
    WHERE v.id_equipo = 36
    ORDER BY v.id_log_desplazamiento DESC;
  `);

  await run('PLAN MANTENIMIENTO / CHECKLIST EQUIPO 36', `
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp_prod' AND table_name LIKE '%mant%';
  `);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  ssh.dispose();
});
