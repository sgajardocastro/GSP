import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q1 = await client.query(
      "SELECT id_proyecto, codi_proyecto, nombre_proyecto FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto ILIKE '%2164%' OR codi_proyecto ILIKE '%2609-2164%'"
    );
    console.log('PROYECTO:', q1.rows);

    if (q1.rows.length > 0) {
      const idPry = q1.rows[0].id_proyecto;
      const q2 = await client.query(
        "SELECT * FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = $1 ORDER BY id_log DESC",
        [idPry]
      );
      console.log('LOGS DESPLAZAMIENTO COUNT:', q2.rows.length);
      for (const row of q2.rows) {
        console.log({
          id_log: row.id_log,
          token_viaje: row.token_viaje,
          patente: row.patente_equipo || row.patente,
          id_equipo: row.id_equipo,
          estado_viaje: row.estado_viaje,
          origen: row.origen,
          destino: row.destino,
          hora_salida: row.hora_salida,
          hora_llegada: row.hora_llegada,
          odometro_salida: row.odometro_salida,
          horometro_salida: row.horometro_salida,
          odometro_llegada: row.odometro_llegada,
          horometro_llegada: row.horometro_llegada,
          waypoints_count: Array.isArray(row.waypoints) ? row.waypoints.length : (row.waypoints ? 'not-array' : 0),
          waypoints_sample: Array.isArray(row.waypoints) ? row.waypoints.slice(0, 3) : row.waypoints,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
