const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. APLICANDO DDL AMPLITUD CONSTRAINT TIPO_SERVICIO ===\n');

  const ddlSql = `
    -- PROD
    ALTER TABLE sch_leangsp_prod.tits_jornada_detalle DROP CONSTRAINT IF EXISTS tits_jornada_detalle_tipo_servicio_check;
    ALTER TABLE sch_leangsp_prod.tits_jornada_detalle ADD CONSTRAINT tits_jornada_detalle_tipo_servicio_check 
      CHECK (tipo_servicio IN (
        'Hora', 'Mensual', 'Fijo', 'Valor Fijo', 'Valor Fijo / Jornada', 
        'Registro de Viaje', 'Traslado', 
        'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 
        'Visita Terreno', 'Interno'
      ));

    -- DEV
    ALTER TABLE sch_leangsp.tits_jornada_detalle DROP CONSTRAINT IF EXISTS tits_jornada_detalle_tipo_servicio_check;
    ALTER TABLE sch_leangsp.tits_jornada_detalle ADD CONSTRAINT tits_jornada_detalle_tipo_servicio_check 
      CHECK (tipo_servicio IN (
        'Hora', 'Mensual', 'Fijo', 'Valor Fijo', 'Valor Fijo / Jornada', 
        'Registro de Viaje', 'Traslado', 
        'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 
        'Visita Terreno', 'Interno'
      ));

    -- Sincronizar fechas log desplazamiento JC.2796-2 id_log_desplazamiento = 31 en PROD
    UPDATE sch_leangsp_prod.tequ_log_desplazamiento
    SET 
      fecha_salida_patio = '2026-11-04 16:02:32.911+00',
      fecha_llegada_faena = '2026-11-04 16:44:20.589+00',
      fecha_salida_faena = '2026-11-04 18:40:00+00',
      fecha_llegada_patio = '2026-11-04 19:42:26.334+00',
      estado_trayecto = 'FINALIZADO',
      id_user_chofer = 40
    WHERE id_log_desplazamiento = 31 OR (id_proyecto = 32 AND id_equipo = 73);

    -- Verificar log 31
    SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, tipo_trayecto, fecha_salida_patio, fecha_llegada_faena, fecha_salida_faena, fecha_llegada_patio, id_user_chofer, estado_trayecto
    FROM sch_leangsp_prod.tequ_log_desplazamiento
    WHERE id_proyecto = 32 AND id_equipo = 73;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/apply_ddl_viaje.sql\n${ddlSql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/apply_ddl_viaje.sql"');
  console.log('Salida DDL y Sync Log:\n', res.stdout);
  if (res.stderr) console.error('Error:', res.stderr);

  ssh.dispose();
}

main().catch(console.error);
