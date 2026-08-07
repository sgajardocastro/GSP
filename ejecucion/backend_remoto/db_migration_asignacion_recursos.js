require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🔄 Iniciando migración de BD para Asignación de Recursos (Spec 22)...');
    
    // 1. Tabla tpry_rel_persona
    console.log('📦 Creando tabla tpry_rel_persona...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tpry_rel_persona (
          id_rel_persona SERIAL PRIMARY KEY,
          id_proyecto INT NOT NULL,
          id_user INT NOT NULL,
          rol_asignado VARCHAR(100),
          fecha_plan_ini TIMESTAMP WITH TIME ZONE NOT NULL,
          fecha_plan_fin TIMESTAMP WITH TIME ZONE NOT NULL,
          turnos_plan VARCHAR(100),
          horas_plan NUMERIC(8,2),
          fecha_real_ini TIMESTAMP WITH TIME ZONE,
          fecha_real_fin TIMESTAMP WITH TIME ZONE,
          horas_reales NUMERIC(8,2),
          estado_real VARCHAR(50) DEFAULT 'PROGRAMADO',
          observaciones TEXT,
          json_field JSONB DEFAULT '{}'::jsonb,
          id_user_creacion INT,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_tpry_rel_persona_proyecto FOREIGN KEY (id_proyecto) REFERENCES tpry_proyecto(id_proyecto) ON DELETE CASCADE,
          CONSTRAINT fk_tpry_rel_persona_user FOREIGN KEY (id_user) REFERENCES tsec_users(id_user) ON DELETE RESTRICT,
          CONSTRAINT fk_tpry_rel_persona_creacion FOREIGN KEY (id_user_creacion) REFERENCES tsec_users(id_user) ON DELETE SET NULL,
          CONSTRAINT chk_fechas_plan_persona CHECK (fecha_plan_fin >= fecha_plan_ini),
          CONSTRAINT chk_fechas_real_persona CHECK (fecha_real_fin IS NULL OR fecha_real_ini IS NULL OR fecha_real_fin >= fecha_real_ini)
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_tpry_rel_persona_proyecto ON tpry_rel_persona(id_proyecto);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tpry_rel_persona_user ON tpry_rel_persona(id_user);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tpry_rel_persona_fechas_plan ON tpry_rel_persona(fecha_plan_ini, fecha_plan_fin);`);
    console.log('✅ Tabla tpry_rel_persona e índices asegurados.');

    // 2. Tabla tpry_rel_equipo
    console.log('📦 Creando tabla tpry_rel_equipo...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tpry_rel_equipo (
          id_rel_equipo SERIAL PRIMARY KEY,
          id_proyecto INT NOT NULL,
          id_equipo INT NOT NULL,
          rol_equipo VARCHAR(100),
          fecha_plan_ini TIMESTAMP WITH TIME ZONE NOT NULL,
          fecha_plan_fin TIMESTAMP WITH TIME ZONE NOT NULL,
          turnos_plan VARCHAR(100),
          horas_plan NUMERIC(8,2),
          fecha_real_ini TIMESTAMP WITH TIME ZONE,
          fecha_real_fin TIMESTAMP WITH TIME ZONE,
          horas_reales NUMERIC(8,2),
          estado_real VARCHAR(50) DEFAULT 'PROGRAMADO',
          observaciones TEXT,
          json_field JSONB DEFAULT '{}'::jsonb,
          id_user_creacion INT,
          fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_tpry_rel_equipo_proyecto FOREIGN KEY (id_proyecto) REFERENCES tpry_proyecto(id_proyecto) ON DELETE CASCADE,
          CONSTRAINT fk_tpry_rel_equipo_equipo FOREIGN KEY (id_equipo) REFERENCES tequ_equipo(id_equipo) ON DELETE RESTRICT,
          CONSTRAINT fk_tpry_rel_equipo_creacion FOREIGN KEY (id_user_creacion) REFERENCES tsec_users(id_user) ON DELETE SET NULL,
          CONSTRAINT chk_fechas_plan_equipo CHECK (fecha_plan_fin >= fecha_plan_ini),
          CONSTRAINT chk_fechas_real_equipo CHECK (fecha_real_fin IS NULL OR fecha_real_ini IS NULL OR fecha_real_fin >= fecha_real_ini)
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_tpry_rel_equipo_proyecto ON tpry_rel_equipo(id_proyecto);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tpry_rel_equipo_equipo ON tpry_rel_equipo(id_equipo);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tpry_rel_equipo_fechas_plan ON tpry_rel_equipo(fecha_plan_ini, fecha_plan_fin);`);
    console.log('✅ Tabla tpry_rel_equipo e índices asegurados.');

    await client.query('COMMIT');
    console.log('🎉 Migración de Asignación de Recursos completada correctamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
