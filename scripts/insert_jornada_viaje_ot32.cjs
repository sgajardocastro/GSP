const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    -- Insertar fila de Control de Flota para Tracto Camión JC.2796-2 en OT 32 si no existe
    INSERT INTO sch_leangsp_prod.tits_jornada_detalle (
      id_its, id_reporte_avance, fecha, numero_ot, id_equipo, patente,
      tipo_servicio, hora_salida, hora_llegada, hora_termino, hora_retorno,
      colacion_minutos, horas_reales, horas_report, tarifa_hora, subtotal,
      numero_report, es_oculta, vb_conciliado, orden
    )
    SELECT 
      9, NULL, '2026-11-04', 'GSP-2611-00003', 73, 'JC.2796-2',
      'Registro de Viaje', '13:02', '13:44', '15:40', '16:42',
      0, 2.63, 2.63, 0.00, 0.00,
      'VIAJE-32-31', false, true, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM sch_leangsp_prod.tits_jornada_detalle 
      WHERE id_its = 9 AND (patente = 'JC.2796-2' OR tipo_servicio = 'Registro de Viaje')
    );

    -- Verificar filas resultantes de id_its = 9
    SELECT id_jornada, id_its, fecha, patente, tipo_servicio, hora_salida, hora_llegada, hora_termino, hora_retorno, horas_report, tarifa_hora, subtotal, numero_report
    FROM sch_leangsp_prod.tits_jornada_detalle
    WHERE id_its = 9
    ORDER BY orden ASC, id_jornada ASC;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/insert_jornada_viaje.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/insert_jornada_viaje.sql"');
  console.log('Resultado inserción jornada viaje en BD:\n', res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

main().catch(console.error);
