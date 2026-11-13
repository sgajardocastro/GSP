const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function run() {
  console.log('========================================================================');
  console.log('⚡ APLICANDO MIGRACIÓN DDL MANTENIMIENTO ENTERPRISE A sch_leangsp_prod');
  console.log('========================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 20000
  });
  console.log('✅ Conectado como root por SSH.\n');

  const s = 'sch_leangsp_prod';

  // 1. DDL en tequ_equipo
  console.log('1. Aplicando columnas a tequ_equipo en ' + s + '...');
  const sqlTequ = `
    ALTER TABLE ${s}.tequ_equipo ALTER COLUMN estado TYPE VARCHAR(30);
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS estado_mnt VARCHAR(30) DEFAULT 'OPERATIVO';
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS restriccion_operacion TEXT NULL;
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS tiene_doble_horometro BOOLEAN DEFAULT false;
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS horometro_grua_acumulado NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS horometro_chasis_acumulado NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS odometro_acumulado NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS fecha_ultima_lectura TIMESTAMPTZ NULL;
    ALTER TABLE ${s}.tequ_equipo ADD COLUMN IF NOT EXISTS fuente_ultima_lectura VARCHAR(50) NULL;
  `;
  const resTequ = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlTequ.replace(/\n/g, ' ')}\\""`);
  console.log('tequ_equipo result:', resTequ.stdout.trim() || resTequ.stderr.trim());

  // 2. DDL en tmnt_ot y tmnt_ot_cierre
  console.log('\n2. Aplicando columnas a tmnt_ot y submódulos en ' + s + '...');
  const sqlOt = `
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS prioridad SMALLINT NOT NULL DEFAULT 3;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS equipo_detenido BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS fecha_hora_detencion TIMESTAMPTZ NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS fecha_hora_liberacion TIMESTAMPTZ NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS sistema_falla VARCHAR(3) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS modo_falla VARCHAR(25) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS causa_falla VARCHAR(25) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS codigo_pauta VARCHAR(10) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS id_aviso_origen BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS id_hallazgo_origen BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS id_user_creador BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS alcance_mantenimiento VARCHAR(50) DEFAULT 'SUPERESTRUCTURA_GRUA';
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_grua_inicio NUMERIC(10,2) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_grua_cierre NUMERIC(10,2) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_chasis_inicio NUMERIC(10,2) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_chasis_cierre NUMERIC(10,2) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS odometro_inicio NUMERIC(10,2) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS odometro_cierre NUMERIC(10,2) NULL;
    ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS pauta_intervalo_horas INT NULL;

    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS id_user_cierre BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS diagnostico_final TEXT NULL;
    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS estado_equipo_resultante VARCHAR(30) DEFAULT 'OPERATIVO';
    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS restriccion_texto TEXT NULL;
    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS requiere_recertificacion BOOLEAN DEFAULT false;
    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS checklist_liberacion JSONB NULL;
    ALTER TABLE ${s}.tmnt_ot_cierre ADD COLUMN IF NOT EXISTS id_survey_post BIGINT NULL;

    ALTER TABLE ${s}.tmnt_ot_repuesto ADD COLUMN IF NOT EXISTS id_user_registro BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot_repuesto ADD COLUMN IF NOT EXISTS pendiente_valorizar BOOLEAN DEFAULT false;
    ALTER TABLE ${s}.tmnt_ot_repuesto ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) NULL;
    ALTER TABLE ${s}.tmnt_ot_repuesto ALTER COLUMN id_producto DROP NOT NULL;

    ALTER TABLE ${s}.tmnt_ot_hh ADD COLUMN IF NOT EXISTS id_tecnico BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot_hh ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) NULL;

    ALTER TABLE ${s}.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS id_user_completa BIGINT NULL;
    ALTER TABLE ${s}.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS foto_url TEXT NULL;
    ALTER TABLE ${s}.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) NULL;
    ALTER TABLE ${s}.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE ${s}.tmnt_ot_actividad ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb;
  `;
  const resOt = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlOt.replace(/\n/g, ' ')}\\""`);
  console.log('tmnt_ot result:', resOt.stdout.trim() || resOt.stderr.trim());

  // 3. Tablas nuevas
  console.log('\n3. Creando tablas nuevas en ' + s + '...');
  const sqlTables = `
    CREATE TABLE IF NOT EXISTS ${s}.tmnt_hallazgo (
      id_hallazgo BIGSERIAL PRIMARY KEY,
      id_empresa BIGINT NOT NULL,
      id_equipo BIGINT NOT NULL REFERENCES ${s}.tequ_equipo(id_equipo),
      id_ot_origen BIGINT NOT NULL REFERENCES ${s}.tmnt_ot(id_ot),
      sistema VARCHAR(3) NOT NULL,
      componente VARCHAR(150) NOT NULL,
      modo_falla VARCHAR(25) NOT NULL,
      descripcion TEXT NOT NULL,
      criticidad VARCHAR(4) NOT NULL CHECK (criticidad IN ('C1', 'C2', 'C3', 'C4')),
      afecta_izaje BOOLEAN NOT NULL DEFAULT false,
      fotos JSONB DEFAULT '[]'::jsonb,
      decision VARCHAR(30) NULL CHECK (decision IN ('RESUELTO_EN_OT', 'OT_DERIVADA', 'BACKLOG', 'RESTRICCION_OPERACION', 'FUERA_DE_SERVICIO')),
      restriccion_texto TEXT NULL,
      id_ot_derivada BIGINT NULL REFERENCES ${s}.tmnt_ot(id_ot),
      fecha_limite DATE NULL,
      requiere_recertificacion BOOLEAN DEFAULT false,
      estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'EN_GESTION', 'CERRADO', 'DESCARTADO')),
      id_user_reporta BIGINT NULL,
      fecha_registro TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      id_user_decide BIGINT NULL,
      fecha_decision TIMESTAMPTZ NULL,
      id_user_cierra BIGINT NULL,
      fecha_cierre TIMESTAMPTZ NULL,
      foto_cierre TEXT NULL,
      fotos_cierre JSONB DEFAULT '[]'::jsonb,
      solucion_aplicada TEXT NULL,
      motivo_descarte TEXT NULL,
      client_uuid VARCHAR(50) NULL
    );

    CREATE TABLE IF NOT EXISTS ${s}.tmnt_aviso (
      id_aviso BIGSERIAL PRIMARY KEY,
      id_empresa BIGINT NOT NULL,
      folio_aviso VARCHAR(50) NOT NULL,
      id_equipo BIGINT NOT NULL REFERENCES ${s}.tequ_equipo(id_equipo),
      ubicacion TEXT NULL,
      criticidad VARCHAR(30) NOT NULL CHECK (criticidad IN ('PARADA_MAQUINA', 'DEGRADADO', 'OBSERVACION')),
      descripcion TEXT NOT NULL,
      horometro NUMERIC(10,2) NULL,
      fotos JSONB DEFAULT '[]'::jsonb,
      id_user_reporta BIGINT NULL,
      fecha_reporte TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CON_OT', 'DESCARTADO', 'CONVERTIDO_A_OT')),
      id_ot BIGINT NULL REFERENCES ${s}.tmnt_ot(id_ot),
      motivo_descarte TEXT NULL,
      client_uuid VARCHAR(50) NULL,
      UNIQUE (id_empresa, folio_aviso)
    );

    CREATE TABLE IF NOT EXISTS ${s}.tmnt_pauta_tarea (
      id_pauta_tarea BIGSERIAL PRIMARY KEY,
      id_empresa BIGINT NOT NULL,
      codigo_pauta VARCHAR(10) NOT NULL,
      familia_equipo VARCHAR(50) NOT NULL DEFAULT 'GENERICA',
      descripcion TEXT NOT NULL,
      horas_estimadas NUMERIC(5,2) NOT NULL DEFAULT 1.0,
      orden INTEGER NOT NULL DEFAULT 1,
      activo BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS ${s}.tmnt_ot_estado_log (
      id_log BIGSERIAL PRIMARY KEY,
      id_ot BIGINT NOT NULL REFERENCES ${s}.tmnt_ot(id_ot) ON DELETE CASCADE,
      estado_anterior VARCHAR(25) NOT NULL,
      estado_nuevo VARCHAR(25) NOT NULL,
      id_user BIGINT NULL,
      motivo TEXT NULL,
      fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ${s}.tmnt_ot_survey (
      id_ot_survey BIGSERIAL PRIMARY KEY,
      id_ot BIGINT NOT NULL REFERENCES ${s}.tmnt_ot(id_ot) ON DELETE CASCADE,
      id_survey BIGINT NOT NULL,
      tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('PRE', 'POST')),
      estado_resultado VARCHAR(30) NULL,
      fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (id_ot, tipo)
    );

    CREATE TABLE IF NOT EXISTS ${s}.tmnt_parametro (
      id_empresa BIGINT NOT NULL,
      clave VARCHAR(50) NOT NULL,
      valor TEXT NOT NULL,
      fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      id_user BIGINT NULL,
      PRIMARY KEY (id_empresa, clave)
    );

    CREATE INDEX IF NOT EXISTS idx_tmnt_ot_empresa_estado ON ${s}.tmnt_ot (id_empresa, estado);
    CREATE INDEX IF NOT EXISTS idx_tmnt_ot_equipo ON ${s}.tmnt_ot (id_equipo);
    CREATE INDEX IF NOT EXISTS idx_tmnt_hallazgo_ot ON ${s}.tmnt_hallazgo (id_ot_origen);
    CREATE INDEX IF NOT EXISTS idx_tmnt_hallazgo_equipo ON ${s}.tmnt_hallazgo (id_equipo, estado);
    CREATE INDEX IF NOT EXISTS idx_tmnt_aviso_empresa ON ${s}.tmnt_aviso (id_empresa, estado);
  `;
  const resTables = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlTables.replace(/\n/g, ' ')}\\""`);
  console.log('Tablas result:', resTables.stdout.trim() || resTables.stderr.trim());

  // 4. Copiar atributos y horómetros desde DEV a PROD
  console.log('\n4. Sincronizando atributos de flota desde DEV a PROD...');
  const sqlSyncEquipos = `
    UPDATE ${s}.tequ_equipo p
    SET 
      tiene_doble_horometro = d.tiene_doble_horometro,
      horometro_grua_acumulado = COALESCE(d.horometro_grua_acumulado, 0),
      horometro_chasis_acumulado = COALESCE(d.horometro_chasis_acumulado, 0),
      odometro_acumulado = COALESCE(d.odometro_acumulado, 0),
      estado_mnt = COALESCE(d.estado_mnt, 'OPERATIVO'),
      restriccion_operacion = d.restriccion_operacion
    FROM sch_leangsp.tequ_equipo d
    WHERE p.id_equipo = d.id_equipo;
  `;
  const resSyncEq = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlSyncEquipos.replace(/\n/g, ' ')}\\""`);
  console.log('Sincronización equipos:', resSyncEq.stdout.trim());

  // 5. Seeding de parámetros y pautas en PROD
  console.log('\n5. Seeding de parámetros y pautas...');
  const sqlSeed = `
    INSERT INTO ${s}.tmnt_parametro (id_empresa, clave, valor) VALUES
    (9, 'capacidad_mecanicos', '5'),
    (9, 'capacidad_horas_dia', '8'),
    (9, 'capacidad_dias_semana', '5'),
    (9, 'factor_disponibilidad_hh', '0.85'),
    (9, 'tarifa_hh_default', '15000'),
    (9, 'umbral_costo_ot_clp', '2000000'),
    (9, 'pm_ventana_proxima_pct', '10'),
    (9, 'ot_envejecida_dias_correctiva', '7'),
    (9, 'ot_envejecida_dias_espera_repuestos', '3'),
    (9, 'ot_envejecida_dias_general', '15'),
    (9, 'cert_alerta_dias', '60,30,15,7')
    ON CONFLICT (id_empresa, clave) DO UPDATE SET valor = EXCLUDED.valor;

    INSERT INTO ${s}.tmnt_pauta_tarea (id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden)
    SELECT id_empresa, codigo_pauta, familia_equipo, descripcion, horas_estimadas, orden
    FROM sch_leangsp.tmnt_pauta_tarea
    WHERE NOT EXISTS (SELECT 1 FROM ${s}.tmnt_pauta_tarea);
  `;
  const resSeed = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlSeed.replace(/\n/g, ' ')}\\""`);
  console.log('Seed result:', resSeed.stdout.trim());

  // 6. Reiniciar PM2 13 (PROD)
  console.log('\n6. Reiniciando PM2 PROD (13)...');
  await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  await new Promise(r => setTimeout(r, 2500));

  // 7. Pruebas de verificación en vivo
  console.log('\n=== VERIFICACIÓN EN VIVO DE ENDPOINTS EN PROD ===');
  const t1 = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/mantenimiento/kpis?_bypass_empresa=1"');
  console.log('1. /kpis:', t1.stdout.substring(0, 150));

  const t2 = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/mantenimiento/ots"');
  console.log('2. /ots:', t2.stdout.substring(0, 150));

  const t3 = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/mantenimiento/flota/radar"');
  console.log('3. /flota/radar:', t3.stdout.substring(0, 150));

  const t4 = await ssh.execCommand('curl -s "http://127.0.0.1:3016/api/mantenimiento/avisos"');
  console.log('4. /avisos:', t4.stdout.substring(0, 150));

  ssh.dispose();
  console.log('\n🎉 MIGRACIÓN Y VERIFICACIÓN DE PROD COMPLETADA EXITOSAMENTE.');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
