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

  await run('EQUIPOS CON ODOMETRO ACUMULADO > 0 EN PROD', `
    SELECT id_equipo, patente, modelo, marca, tipo_equipo,
           odometro_acumulado, horometro_chasis_acumulado, horometro_grua_acumulado,
           fuente_ultima_lectura, fecha_ultima_lectura
    FROM sch_leangsp_prod.tequ_equipo
    WHERE COALESCE(odometro_acumulado, 0) > 0
    ORDER BY odometro_acumulado DESC;
  `);

  await run('REGISTROS EN TEDP_REPORTE_AVANCE CON ODOMETRO EN PROD', `
    SELECT id_reporte_avance, id_proyecto, id_equipo, dia_correlativo, fecha_reporte,
           odometro_inicio, odometro_termino, horometro_inicio, horometro_termino
    FROM sch_leangsp_prod.tedp_reporte_avance
    WHERE odometro_inicio IS NOT NULL OR odometro_termino IS NOT NULL
    ORDER BY id_reporte_avance DESC;
  `);

  await run('REGISTROS EN TEQU_LOG_DESPLAZAMIENTO CON KM EN PROD', `
    SELECT id_log_desplazamiento, id_proyecto, id_equipo, km_inicial, km_final,
           horometro_inicial, horometro_final, token_viaje
    FROM sch_leangsp_prod.tequ_log_desplazamiento
    WHERE km_inicial IS NOT NULL OR km_final IS NOT NULL
    ORDER BY id_log_desplazamiento DESC;
  `);

  ssh.dispose();
}

main().catch(err => {
  console.error(err);
  ssh.dispose();
});
