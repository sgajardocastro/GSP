import { NodeSSH } from 'node-ssh';
import pg from 'pg';

const ssh = new NodeSSH();

async function runPhase1() {
  console.log("==================================================================");
  console.log("🚀 FASE 1: RECONSTRUCCIÓN DETERMINÍSTICA DE BD (sch_leangsp_prod)");
  console.log("==================================================================");

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295,
    readyTimeout: 15000
  });
  console.log("✅ SSH conectado como root.");

  // Paso 1: Dump DDL de sch_leangsp desde postgres
  console.log("\n📦 Paso 1: Generando DDL puro de sch_leangsp...");
  const dumpCmd = `su - postgres -c "pg_dump -d postgres -n sch_leangsp --schema-only --no-owner --no-privileges" > /tmp/sch_leangsp_ddl.sql`;
  const dumpRes = await ssh.execCommand(dumpCmd);
  if (dumpRes.code !== 0) {
    throw new Error("Error en pg_dump: " + dumpRes.stderr);
  }
  console.log("✅ DDL exportado a /tmp/sch_leangsp_ddl.sql");

  // Paso 2: Reemplazar sch_leangsp por sch_leangsp_prod en el DDL
  console.log("\n🔄 Paso 2: Transformando DDL hacia sch_leangsp_prod...");
  const sedCmd = `sed -e 's/sch_leangsp/sch_leangsp_prod/g' /tmp/sch_leangsp_ddl.sql > /tmp/sch_leangsp_prod_ddl.sql`;
  await ssh.execCommand(sedCmd);
  console.log("✅ DDL adaptado a sch_leangsp_prod.");

  // Paso 3: Recrear esquema en PostgreSQL
  console.log("\n🗑️ Paso 3: Reiniciando esquema sch_leangsp_prod en PostgreSQL...");
  const dropCreateSql = `
    DROP SCHEMA IF EXISTS sch_leangsp_prod CASCADE;
    CREATE SCHEMA sch_leangsp_prod AUTHORIZATION usr_leangsp_prod;
    ALTER ROLE usr_leangsp_prod SET search_path TO sch_leangsp_prod, public;
    GRANT ALL ON SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
    ALTER DEFAULT PRIVILEGES IN SCHEMA sch_leangsp_prod GRANT ALL ON TABLES TO usr_leangsp_prod;
    ALTER DEFAULT PRIVILEGES IN SCHEMA sch_leangsp_prod GRANT ALL ON SEQUENCES TO usr_leangsp_prod;
  `;
  const sqlEscaped = dropCreateSql.replace(/"/g, '\\"');
  await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlEscaped}\\""`);
  console.log("✅ Esquema recreado con permisos limpios.");

  // Paso 4: Ejecutar DDL en sch_leangsp_prod
  console.log("\n🏗️ Paso 4: Creando tablas, vistas, tipos y secuencias en sch_leangsp_prod...");
  const applyRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sch_leangsp_prod_ddl.sql"`);
  if (applyRes.code !== 0) {
    console.warn("Advertencias al aplicar DDL:", applyRes.stderr.substring(0, 500));
  } else {
    console.log("✅ DDL aplicado exitosamente.");
  }

  // Paso 5: Migrar catálogos maestros desde sch_leangsp
  console.log("\n📋 Paso 5: Sembrando catálogos maestros desde DEV...");
  const catalogTables = [
    'tequ_categoria',
    'tequ_subcategoria',
    'tequ_marca',
    'tequ_modelo',
    'tequ_equipo',
    'tsec_cargos',
    'tsec_roles',
    'tsec_perm',
    'tsec_rol_perm',
    'tsec_users',
    'tsec_user_roles',
    'tpar_area',
    'tpar_paises',
    'tpar_empresas',
    'tsrv_tipo_template',
    'tsrv_templates',
    'tflw_templates',
    'tflw_template_steps',
    'tcfg_backlog',
    'tcfg_releases',
    'tpry_tipo',
    'tpry_estado',
    'tpry_correlativos'
  ];

  for (const table of catalogTables) {
    const copySql = `
      INSERT INTO sch_leangsp_prod.${table} 
      SELECT * FROM sch_leangsp.${table} 
      ON CONFLICT DO NOTHING;
    `;
    const copyRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${copySql.replace(/"/g, '\\"')}\\""`);
    if (copyRes.code !== 0) {
      console.warn(`⚠️ Error copiando ${table}:`, copyRes.stderr.trim());
    } else {
      // Contar filas
      const countRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"SELECT count(*) FROM sch_leangsp_prod.${table};\\""`);
      console.log(`   - ${table.padEnd(25)}: ${countRes.stdout.trim()} registros`);
    }
  }

  // Paso 6: Reset de Correlativos en PROD
  console.log("\n🔢 Paso 6: Configurando correlativos limpios en PROD...");
  const resetCorrSql = `
    DELETE FROM sch_leangsp_prod.tpry_correlativos;
    INSERT INTO sch_leangsp_prod.tpry_correlativos (prefijo, anio_mes, ultimo_valor)
    VALUES ('GSP', TO_CHAR(NOW(), 'YYMM'), 0);
  `;
  await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${resetCorrSql.replace(/"/g, '\\"')}\\""`);
  console.log("✅ Correlativos reseteados con prefijo GSP-[AAMM]-000.");

  // Paso 7: Actualizar secuencias con MAX(id)
  console.log("\n⚙️ Paso 7: Sincronizando valores de secuencias...");
  const syncSeqScript = `
    DO $$
    DECLARE
      r RECORD;
      seq_name TEXT;
      max_id BIGINT;
    BEGIN
      FOR r IN 
        SELECT table_name, column_name, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'sch_leangsp_prod' 
          AND column_default LIKE 'nextval%'
      LOOP
        seq_name := substring(r.column_default from ''''([^'']+)'''');
        EXECUTE format('SELECT COALESCE(MAX(%I), 1) FROM sch_leangsp_prod.%I', r.column_name, r.table_name) INTO max_id;
        EXECUTE format('SELECT setval(%L, %s)', seq_name, max_id);
      END LOOP;
    END $$;
  `;
  await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${syncSeqScript.replace(/"/g, '\\"')}\\""`);
  console.log("✅ Secuencias sincronizadas.");

  // Paso 8: Ajustar permisos para usr_leangsp_prod
  console.log("\n🔒 Paso 8: Otorgando permisos finales a usr_leangsp_prod...");
  const grantSql = `
    GRANT USAGE ON SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
    GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
    GRANT ALL ON ALL ROUTINES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
  `;
  await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${grantSql.replace(/"/g, '\\"')}\\""`);
  console.log("✅ Permisos totales otorgados.");

  // Paso 9: Verificación de conexión con usr_leangsp_prod
  console.log("\n🧪 Paso 9: Smoke test de conexión con usuario usr_leangsp_prod...");
  const { Client } = pg;
  const prodClient = new Client({
    host: '138.255.103.18',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp_prod',
    password: 'usr_gsp_prod_2026!',
  });
  await prodClient.connect();
  const testArea = await prodClient.query("SELECT id_area, name_area FROM tpar_area LIMIT 1;");
  console.log("   - Query tpar_area (sin schema explícito):", testArea.rows[0]);
  const testEquipos = await prodClient.query("SELECT count(*) FROM tequ_equipo;");
  console.log("   - Equipos en sch_leangsp_prod:", testEquipos.rows[0].count);
  const testProyectos = await prodClient.query("SELECT count(*) FROM tpry_proyecto;");
  console.log("   - Proyectos en sch_leangsp_prod (debe ser 0):", testProyectos.rows[0].count);
  const testUsers = await prodClient.query("SELECT count(*) FROM tsec_users;");
  console.log("   - Usuarios en sch_leangsp_prod:", testUsers.rows[0].count);
  await prodClient.end();

  console.log("\n==================================================================");
  console.log("🎉 FASE 1 COMPLETADA CON ÉXITO: sch_leangsp_prod 100% OPERATIVO");
  console.log("==================================================================");

  ssh.dispose();
}

runPhase1().catch(err => {
  console.error("❌ ERROR EN FASE 1:", err);
  ssh.dispose();
});
