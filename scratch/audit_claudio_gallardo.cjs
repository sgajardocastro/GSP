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

  await run('PROYECTOS RECIENTES DONDE APARECE CLAUDIO (ID 62)', `
    SELECT p.id_proyecto, p.codigo_proyecto, p.nombre_proyecto, p.id_proyecto_estado,
           p.json_field->'ejecucion_v1'->>'id_equipo_principal' as id_eq_ppal,
           p.json_field->'ejecucion_v1'->>'operador_asignado' as op_asignado,
           p.json_field->'ejecucion_v1'->'tripulacion_asignada' as tripulacion
    FROM sch_leangsp_prod.tpry_proyecto p
    WHERE p.json_field::text LIKE '%62%'
       OR p.json_field::text ILIKE '%gallardo%'
       OR p.json_field::text ILIKE '%claudio%'
    ORDER BY p.id_proyecto DESC LIMIT 10;
  `);

  await run('REPORTES DIARIOS RECIENTES', `
    SELECT r.id_reporte_avance, r.id_proyecto, r.id_equipo,
           r.dia_correlativo, r.fecha_reporte, r.estado_reporte,
           r.horometro_inicio, r.horometro_termino,
           r.odometro_inicio, r.odometro_termino,
           r.id_user_operador
    FROM sch_leangsp_prod.tedp_reporte_avance r
    WHERE r.id_user_operador = 62
       OR r.id_reporte_avance > (SELECT MAX(id_reporte_avance) - 15 FROM sch_leangsp_prod.tedp_reporte_avance)
    ORDER BY r.id_reporte_avance DESC LIMIT 15;
  `);

  await run('LOGS DESPLAZAMIENTO / VIAJES RECIENTES', `
    SELECT v.id_log_desplazamiento, v.id_proyecto, v.id_equipo,
           v.id_user_chofer, v.tipo_trayecto, v.estado_trayecto,
           v.km_inicial, v.km_final,
           v.horometro_inicial, v.horometro_final,
           v.token_viaje
    FROM sch_leangsp_prod.tequ_log_desplazamiento v
    ORDER BY v.id_log_desplazamiento DESC LIMIT 10;
  `);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  ssh.dispose();
});
