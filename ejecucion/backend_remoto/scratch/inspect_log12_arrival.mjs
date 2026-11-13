import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q = await client.query(
      `SELECT id_log_desplazamiento, id_proyecto, patente, token_viaje, estado_trayecto,
              fecha_salida_patio, latitud_salida_patio, longitud_salida_patio,
              fecha_llegada_faena, latitud_llegada_faena, longitud_llegada_faena,
              km_inicial, km_final, horometro_inicial, horometro_final,
              pings_ruta, obs_termino
       FROM sch_leangsp.tequ_log_desplazamiento 
       WHERE id_log_desplazamiento = 12`
    );
    console.log('LOG 12 (TYGC.45-1):');
    const r = q.rows[0];
    console.log({
      id: r.id_log_desplazamiento,
      patente: r.patente,
      estado: r.estado_trayecto,
      salida: { fecha: r.fecha_salida_patio, lat: r.latitud_salida_patio, lng: r.longitud_salida_patio, km: r.km_inicial, horo: r.horometro_inicial },
      llegada: { fecha: r.fecha_llegada_faena, lat: r.latitud_llegada_faena, lng: r.longitud_llegada_faena, km: r.km_final, horo: r.horometro_final },
      pings_count: r.pings_ruta ? r.pings_ruta.length : 0,
      pings: r.pings_ruta
    });

    const p = await client.query(
      `SELECT id_proyecto, codi_proyecto, nombre_proyecto, json_field 
       FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 99`
    );
    console.log('PROYECTO 99:');
    console.log('json_field:', JSON.stringify(p.rows[0].json_field, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
