import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = 'sch_leangsp' AND table_name = 'tequ_log_desplazamiento'
       ORDER BY ordinal_position`
    );
    console.log('COLUMNS:', cols.rows.map(c => c.column_name).join(', '));

    // Exclude large base64 columns: foto_tablero_salida, foto_tablero_llegada
    const selectCols = cols.rows
      .map(c => c.column_name)
      .filter(c => !c.startsWith('foto_tablero'))
      .join(', ');

    const q = await client.query(
      `SELECT ${selectCols} FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = 99`
    );
    for (const r of q.rows) {
      console.log('ROW:', JSON.stringify(r, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
