import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q = await client.query(
      `SELECT * FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = 99`
    );
    console.log('KEYS:', Object.keys(q.rows[0]).join(', '));
    for (const r of q.rows) {
      console.log('--- EQUIPO:', r.patente, 'TOKEN:', r.token_viaje);
      for (const [k, v] of Object.entries(r)) {
        if (v !== null && v !== undefined && v !== '') {
          console.log(`  ${k}:`, typeof v === 'object' ? JSON.stringify(v) : v);
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
