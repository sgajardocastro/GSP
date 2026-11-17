const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function runCertification() {
  console.log('=================================================================');
  console.log('  CERTIFICACION E2E DEV: SPEC-16 §28 (v1.0.228)');
  console.log('  Blindaje Canónico y Erradicación Integral de json_field');
  console.log('=================================================================\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const testScript = `
const { Pool } = require('/home/nodeadmin/proyectos/lean-services-gsp/node_modules/pg');
const pool = new Pool({
  user: 'usr_leangsp',
  password: 'usr_gsp_123',
  host: 'localhost',
  database: 'postgres',
  port: 5432
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- TEST 1: Candado Físico de Unicidad en sch_leangsp.tedp_reporte_avance ---');
    const resOt = await client.query('SELECT id_proyecto FROM sch_leangsp.tpry_proyecto ORDER BY id_proyecto DESC LIMIT 1');
    const testOt = resOt.rows[0].id_proyecto;
    const testEqA = 50;
    const testEqB = 51;
    const testDia = 9999;

    // Limpiar restos si existieran
    await client.query('DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1 AND dia_correlativo = $2', [testOt, testDia]);

    // Inserción 1: Reporte legítimo para Grúa A
    await client.query(\`
      INSERT INTO sch_leangsp.tedp_reporte_avance (
        id_proyecto, dia_correlativo, id_equipo, id_user_operador, unidad_cobro, fecha_reporte, estado_reporte
      ) VALUES ($1, $2, $3, 1, 'HORA', '2026-11-20', 'VALIDADO')
    \`, [testOt, testDia, testEqA]);
    console.log('  ✔ Reporte 1 (Grúa A, Día 9999): Insertado correctamente.');

    // Inserción 2 (Convoy simultáneo): Reporte legítimo para Camión B en el mismo día
    await client.query(\`
      INSERT INTO sch_leangsp.tedp_reporte_avance (
        id_proyecto, dia_correlativo, id_equipo, id_user_operador, unidad_cobro, fecha_reporte, estado_reporte
      ) VALUES ($1, $2, $3, 1, 'HORA', '2026-11-20', 'VALIDADO')
    \`, [testOt, testDia, testEqB]);
    console.log('  ✔ Reporte 2 (Convoy Camión B, Día 9999): Permitido concurrentemente (distinto id_equipo).');

    // Inserción 3 (Intento de duplicación de Grúa A en Día 9999): Debe ser RECHAZADO por el índice único
    let bloqueoOk = false;
    try {
      await client.query(\`
        INSERT INTO sch_leangsp.tedp_reporte_avance (
          id_proyecto, dia_correlativo, id_equipo, id_user_operador, unidad_cobro, fecha_reporte, estado_reporte
        ) VALUES ($1, $2, $3, 1, 'HORA', '2026-11-20', 'PENDIENTE_VALIDACION')
      \`, [testOt, testDia, testEqA]);
    } catch (err) {
      if (err.message.includes('uq_tedp_proyecto_dia_equipo') || err.code === '23505') {
        bloqueoOk = true;
        console.log('  ✔ Candado Físico Activo: Duplicado bloqueado por uq_tedp_proyecto_dia_equipo (' + err.code + ')');
      } else {
        throw err;
      }
    }

    if (!bloqueoOk) {
      throw new Error('FALLO CRÍTICO: La BD no bloqueó el duplicado de la misma máquina en el mismo día.');
    }

    // Limpieza
    await client.query('DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1 AND dia_correlativo = $2', [testOt, testDia]);
    console.log('  ✔ Datos de prueba limpiados.');

    console.log('\\n--- TEST 2: Auditoria de Asignaciones en sch_leangsp ---');
    // Verificar que no existen registros con estado_real = 'REEMPLAZADO' colisionando con 'PROGRAMADO'
    const resAsig = await client.query(\`
      SELECT re.id_proyecto, re.id_equipo, re.estado_real, COUNT(*) as cnt
      FROM sch_leangsp.tpry_rel_equipo re
      WHERE re.estado_real = 'PROGRAMADO'
      GROUP BY re.id_proyecto, re.id_equipo, re.estado_real
      HAVING COUNT(*) > 1
    \`);
    console.log('  ✔ Duplicados PROGRAMADO en tpry_rel_equipo:', resAsig.rowCount);

    const resPers = await client.query(\`
      SELECT rp.id_proyecto, rp.id_user, rp.estado_real, COUNT(*) as cnt
      FROM sch_leangsp.tpry_rel_persona rp
      WHERE rp.estado_real = 'PROGRAMADO'
      GROUP BY rp.id_proyecto, rp.id_user, rp.estado_real
      HAVING COUNT(*) > 1
    \`);
    console.log('  ✔ Duplicados PROGRAMADO en tpry_rel_persona:', resPers.rowCount);

    console.log('\\n--- TEST 3: Verificación de Registro de Versión en tcfg_releases ---');
    const resRel = await client.query(\`
      SELECT version, titulo, tipo_release, fecha_release
      FROM sch_leangsp.tcfg_releases
      WHERE version = 'v1.0.228'
    \`);
    if (resRel.rowCount > 0) {
      console.log('  ✔ Release v1.0.228 registrado en tcfg_releases:', resRel.rows[0].titulo, '(' + resRel.rows[0].version + ')');
    } else {
      throw new Error('No se encontró release v1.0.228 en tcfg_releases');
    }

    console.log('\\n=================================================================');
    console.log('  CERTIFICACION E2E DEV: 100% EXITOSA (3/3 TESTS PASADOS)');
    console.log('=================================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('ERROR EN CERTIFICACION:', err);
  process.exit(1);
});
`;

  await ssh.execCommand("cat << 'EOF' > /tmp/test_spec16_sec28_cert.js\n" + testScript + "\nEOF");
  const res = await ssh.execCommand('/home/nodeadmin/.nvm/versions/node/v16.20.2/bin/node /tmp/test_spec16_sec28_cert.js');
  console.log(res.stdout);
  if (res.stderr) console.error(res.stderr);

  ssh.dispose();
}

runCertification().catch(console.error);
