const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'servidor.leanglobal.cl',
    port: 5432,
    database: 'postgres',
    user: 'usr_leangsp',
    password: 'usr_gsp_123'
  });
  await client.connect();

  const res = await client.query(
    "SELECT id_proyecto, codi_proyecto, id_proyecto_estado, json_field FROM sch_leangsp.tpry_proyecto WHERE codi_proyecto = 'GSP-2609-4855-008'"
  );
  if (res.rows.length === 0) {
    console.log('No encontrado exactamente GSP-2609-4855-008');
    return;
  }
  const r = res.rows[0];
  console.log('ID:', r.id_proyecto, 'Estado:', r.id_proyecto_estado);
  const jf = r.json_field || {};
  console.log('\n--- CRM lines_equipos_principales ---');
  console.dir(jf.crm_v1?.lines_equipos_principales, { depth: null });

  console.log('\n--- Asignacion tripulacion ---');
  console.dir(jf.asignacion_v1?.tripulacion, { depth: null });

  console.log('\n--- Preparacion salida inspecciones_patio ---');
  console.dir(jf.ejecucion_v1?.preparacion_salida?.inspecciones_patio, { depth: null });

  const surveys = await client.query(
    "SELECT id_survey, id_template, id_user, estado_srv FROM sch_leangsp.tsrv_survey WHERE id_proyecto = $1",
    [r.id_proyecto]
  );
  console.log('\n--- Surveys asociados ---');
  console.dir(surveys.rows, { depth: null });

  const viajes = await client.query(
    "SELECT id, id_equipo, id_conductor, estado, token_desplazamiento FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = $1",
    [r.id_proyecto]
  );
  console.log('\n--- Viajes asociados ---');
  console.dir(viajes.rows, { depth: null });

  const usuarios = await client.query(
    "SELECT id_user, nombre_user, name_user, name_frst, apellido_pat FROM sch_leangsp.tsec_users WHERE id_user IN (SELECT DISTINCT id_user FROM sch_leangsp.tsrv_survey WHERE id_proyecto = $1 UNION SELECT DISTINCT id_conductor FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = $1)",
    [r.id_proyecto]
  );
  console.log('\n--- Usuarios encontrados en surveys / viajes ---');
  console.dir(usuarios.rows, { depth: null });

  await client.end();
}

run().catch(console.error);
