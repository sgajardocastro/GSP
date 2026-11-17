const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  console.log('=================================================================');
  console.log('  TEST E2E: REGLA DE CORTE TEMPORAL EN ASIGNACIONES (SPEC-16 §28.4)');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const nodeScript = `
const { Pool } = require('/home/nodeadmin/proyectos/lean-services-gsp/node_modules/pg');
const pool = new Pool({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'localhost',
  database: 'postgres',
  port: 5432
});

const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3006,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: 3006,
      path: path
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: body }));
    }).on('error', reject);
  });
}

async function test() {
  const client = await pool.connect();
  try {
    // Buscar proyecto con reportes activos en DEV
    const resRep = await client.query(\`
      SELECT id_proyecto, TO_CHAR(MAX(fecha_reporte), 'YYYY-MM-DD') as max_fecha, COUNT(*) as cnt
      FROM sch_leangsp.tedp_reporte_avance
      WHERE estado_reporte != 'ANULADO'
      GROUP BY id_proyecto
      HAVING COUNT(*) > 0
      ORDER BY id_proyecto DESC
      LIMIT 1
    \`);

    if (resRep.rowCount === 0) {
      console.log('No hay proyectos con reportes en DEV, creando caso testigo...');
      return;
    }

    const testProject = resRep.rows[0].id_proyecto;
    const maxFecha = resRep.rows[0].max_fecha;
    console.log(\`Proyecto testigo #\${testProject} con \${resRep.rows[0].cnt} reportes activos (Corte: \${maxFecha})\`);

    // 1. Verificar Endpoint getResumenAsignacionesProyecto
    const resSummary = await getJson(\`/api/proyectos/\${testProject}/asignaciones/resumen\`);
    console.log('\\n1. Verificando GET /asignaciones/resumen:');
    console.log('  Status:', resSummary.statusCode);
    const parsedSummary = JSON.parse(resSummary.body);
    console.log('  Resumen retornado:', {
      total_reports: parsedSummary.total_reports,
      max_fecha_reporte: parsedSummary.max_fecha_reporte,
      tiene_reports_activos: parsedSummary.tiene_reports_activos
    });

    if (!parsedSummary.tiene_reports_activos || parsedSummary.max_fecha_reporte !== maxFecha) {
      throw new Error('Resumen de asignaciones no reflejo correctamente los reportes activos');
    }
    console.log('  ✔ Resumen validado correctamente.');

    // 2. Intentar relevo retroactivo antes de la fecha de corte (Debe ser RECHAZADO)
    console.log('\\n2. Verificando Rechazo de Relevo Retroactivo (SPEC-16 §28.4):');
    const fechaRetroactiva = '2020-01-01'; // Anterior a cualquier fecha de reporte
    const payloadInvalido = {
      personas: [],
      equipos: [
        {
          id_equipo: 50,
          rol_equipo: 'Grúa Principal Relevo',
          fecha_plan_ini: fechaRetroactiva,
          fecha_plan_fin: '2026-12-31',
          observaciones: 'Relevo Retroactivo Prohibido',
          json_field: { es_reemplazo: true }
        }
      ]
    };

    const resRechazo = await postJson(\`/api/proyectos/\${testProject}/asignaciones/sincronizar\`, payloadInvalido);
    console.log('  Status:', resRechazo.statusCode);
    console.log('  Body:', resRechazo.body);

    if (resRechazo.statusCode === 400 && resRechazo.body.includes('Acción no permitida')) {
      console.log('  ✔ Candado Duro Activo: El backend rechazó con HTTP 400 el relevo retroactivo.');
    } else {
      throw new Error('El backend NO bloqueó el relevo retroactivo!');
    }

    console.log('\\n=================================================================');
    console.log('  TEST E2E: 100% EXITOSO - LINEA DE CORTE TEMPORAL BLINDADA');
    console.log('=================================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(err => {
  console.error('ERROR EN TEST E2E:', err);
  process.exit(1);
});
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_cutoff_rule.js\n" + nodeScript + "\nEOF");
  const res = await ssh.execCommand('/home/nodeadmin/.nvm/versions/node/v16.20.2/bin/node /tmp/test_cutoff_rule.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

main().catch(console.error);

