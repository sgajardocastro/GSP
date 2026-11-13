import client from '../src/config/dbConfig.js';

async function main() {
  try {
    const schema = 'sch_leangsp';
    await client.query(`
      INSERT INTO ${schema}.tcfg_releases (version, fecha_release, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.54', '2026-09-25', 'Corrección de Coordenadas Fallback en Telemetría y Saneamiento de Ruta GPS',
        'Bugfix & Telemetría',
        'Erradicación de coordenadas iniciales por defecto que contaminaban la traza con desvíos espurios hacia Chillán, blindaje con validación GPS_REAL y saneamiento de bitácora en viaje TYGC.45-1.',
        '["REQ-008"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE
      SET fecha_release = EXCLUDED.fecha_release,
          titulo = EXCLUDED.titulo,
          tipo_release = EXCLUDED.tipo_release,
          descripcion_impacto = EXCLUDED.descripcion_impacto,
          requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `);
    console.log('✅ v1.0.54 registrado en DB.');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

setTimeout(main, 1000);
