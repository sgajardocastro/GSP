import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const cols = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'sch_leangsp' AND table_name = 'tequ_log_desplazamiento'`
    );
    console.log('COLUMNS tequ_log_desplazamiento:');
    console.table(cols.rows);

    const q = await client.query(
      `SELECT * FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = 99`
    );
    console.log('LOG ROWS FOR PROYECTO 99:', q.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
