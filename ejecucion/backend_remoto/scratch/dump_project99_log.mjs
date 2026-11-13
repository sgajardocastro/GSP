import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q = await client.query(
      `SELECT * FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = 99`
    );
    for (const r of q.rows) {
      console.log('ID:', r.id_desplazamiento, 'ESTADO:', r.estado_viaje, 'TOKEN:', r.token_viaje);
      console.log('EQUIPO:', r.id_equipo, 'PATENTE:', r.patente);
      console.log('SALIDA:', {
        hora_salida: r.hora_salida,
        hora_salida_estimada: r.hora_salida_estimada,
        hora_salida_real: r.hora_salida_real,
        odometro_salida: r.odometro_salida,
        horometro_salida: r.horometro_salida,
        lat_origen: r.lat_origen,
        lng_origen: r.lng_origen
      });
      console.log('LLEGADA:', {
        hora_llegada_estimada: r.hora_llegada_estimada,
        hora_llegada_real: r.hora_llegada_real,
        odometro_llegada: r.odometro_llegada,
        horometro_llegada: r.horometro_llegada,
        lat_destino: r.lat_destino,
        lng_destino: r.lng_destino
      });
      console.log('WAYPOINTS:', r.waypoints);
      console.log('TRACKING / PINGS:', r.tracking_data, r.pings, r.historial_pings);
      console.log('UPDATED_AT:', r.updated_at, 'CREATED_AT:', r.created_at);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
