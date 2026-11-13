import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q = await client.query(
      `SELECT id_log_desplazamiento, patente, token_viaje, estado_trayecto,
              fecha_salida_patio, latitud_salida_patio, longitud_salida_patio,
              fecha_llegada_faena, latitud_llegada_faena, longitud_llegada_faena,
              km_inicial, km_final, pings_ruta
       FROM sch_leangsp.tequ_log_desplazamiento 
       WHERE id_log_desplazamiento = 12`
    );
    const r = q.rows[0];
    console.log('SALIDA:', r.latitud_salida_patio, r.longitud_salida_patio, r.fecha_salida_patio);
    console.log('LLEGADA:', r.latitud_llegada_faena, r.longitud_llegada_faena, r.fecha_llegada_faena);
    console.log('PINGS COUNT:', r.pings_ruta?.length);
    console.log('PINGS:');
    r.pings_ruta?.forEach((p, i) => {
      console.log(`[${i}]`, p.ts, 'lat:', p.lat || p.latitud, 'lng:', p.lng || p.longitud, 'kmh:', p.kmh || p.velocidad_kmh);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
