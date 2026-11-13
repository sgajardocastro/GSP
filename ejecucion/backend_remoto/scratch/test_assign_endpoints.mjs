import client from '../src/config/dbConfig.js';

const BASE_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';

async function testAssignEndpoints() {
  console.log('--- TEST EMPÍRICO: ASIGNAR VIAJE Y PERSISTENCIA DE FECHA/HORA ---');
  
  const tripPayload = {
    id_proyecto: 99,
    id_equipo: 43,
    id_user_chofer: 55,
    patente: 'TYGC.45-1',
    token_viaje: 'vj-99-43-7gcmz',
    tipo_trayecto: 'IDA',
    fecha_inspeccion_plan: '2026-09-30',
    hora_inspeccion_plan: '10:30'
  };

  const res = await fetch(`${BASE_URL}/operaciones/viaje/asignar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripPayload)
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Respuesta endpoint asignar viaje:', data);

  // Verificar en base de datos si fecha_programada quedó guardada
  const checkDb = await client.query(
    'SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, token_viaje, fecha_programada, estado_trayecto FROM sch_leangsp.tequ_log_desplazamiento WHERE token_viaje = $1',
    ['vj-99-43-7gcmz']
  );
  console.log('Fila persistida en PostgreSQL:');
  console.table(checkDb.rows);

  console.log('✔ Fecha y hora programada:', checkDb.rows[0]?.fecha_programada);
  process.exit(0);
}

testAssignEndpoints().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
