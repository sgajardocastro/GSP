const path = require('path');
require(path.join(__dirname, '../ejecucion/backend_remoto/node_modules/dotenv')).config({ path: path.join(__dirname, '../ejecucion/backend_remoto/.env') });
const pool = require('../ejecucion/backend_remoto/src/config/postgresPool');

async function migrate() {
  try {
    console.log('--- Ejecutando migración: tits_transicion_historial ---');
    const sql = `
      CREATE TABLE IF NOT EXISTS sch_leangsp.tits_transicion_historial (
        id_transicion SERIAL PRIMARY KEY,
        folio_its VARCHAR(50) NOT NULL,
        numero_cotizacion VARCHAR(50) NOT NULL,
        version INT DEFAULT 1,
        cliente_nombre VARCHAR(255),
        cliente_rut VARCHAR(50),
        empresa_facturacion VARCHAR(255),
        ejecutivo_comercial VARCHAR(255),
        ciudad_obra VARCHAR(255),
        fecha_inicio DATE,
        fecha_termino DATE,
        total_venta NUMERIC(15,2) DEFAULT 0,
        total_costos NUMERIC(15,2) DEFAULT 0,
        utilidad_bruta NUMERIC(15,2) DEFAULT 0,
        margen NUMERIC(5,2) DEFAULT 0,
        estado VARCHAR(50) DEFAULT 'BORRADOR',
        id_doc INT REFERENCES sch_leangsp.tfmg_file(id_doc),
        data_json JSONB,
        fecha_guardado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uk_transicion_folio_ver UNIQUE (folio_its, version)
      );

      CREATE INDEX IF NOT EXISTS idx_tits_transicion_cot ON sch_leangsp.tits_transicion_historial (numero_cotizacion);
    `;

    await pool.query(sql);
    console.log('Tabla tits_transicion_historial creada exitosamente.');

    const check = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tits_transicion_historial' ORDER BY ordinal_position");
    console.log('Columnas creadas:', check.rows);
  } catch (err) {
    console.error('Error al migrar tabla:', err);
  } finally {
    await pool.end();
  }
}

migrate();
