import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const q = await client.query(
      `SELECT id_log_desplazamiento, pings_ruta 
       FROM sch_leangsp.tequ_log_desplazamiento 
       WHERE id_log_desplazamiento = 12`
    );
    const pings = q.rows[0].pings_ruta || [];
    console.log('Original pings count:', pings.length);
    
    // Filter out any ping with lat ~ -36.6172
    const cleaned = pings.filter(p => {
      const lat = p.lat || p.latitud;
      const lng = p.lng || p.longitud;
      const isChillan = Math.abs(lat - (-36.6172)) < 0.01 && Math.abs(lng - (-72.1148)) < 0.01;
      return !isChillan;
    });
    console.log('Cleaned pings count:', cleaned.length);

    await client.query(
      `UPDATE sch_leangsp.tequ_log_desplazamiento 
       SET pings_ruta = $1::jsonb 
       WHERE id_log_desplazamiento = 12`,
      [JSON.stringify(cleaned)]
    );
    console.log('✅ Log 12 actualizado sin el ping espurio de Chillán.');

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
