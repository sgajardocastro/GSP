const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO TABLAS EN sch_leangsp_prod ===');
  const res1 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'sch_leangsp_prod' AND table_name IN ('tnot_notification_web', 'tedp_reporte_avance', 'tpry_proyecto', 'tcfg_releases', 'tcfg_backlog', 'tpry_rel_equipo');\\""`);
  console.log(res1.stdout);

  console.log('=== VERIFICANDO COLUMNAS COLACION EN tedp_reporte_avance ===');
  const res2 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance' AND column_name IN ('hora_inicio_colacion', 'hora_termino_colacion', 'horas_colacion');\\""`);
  console.log(res2.stdout);

  console.log('=== VERIFICANDO COLUMNAS HORARIOS EN tpry_proyecto ===');
  const res3 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tpry_proyecto' AND column_name IN ('hora_llegada_plan', 'plan_diario');\\""`);
  console.log(res3.stdout);

  console.log('=== VERIFICANDO BACKEND PROD (PM2 ID 13) ===');
  const res4 = await ssh.execCommand('curl -s http://localhost:3016/api/usuarios | head -c 120');
  console.log('HTTP 3016 /api/usuarios:', res4.stdout);

  console.log('\n=== VERIFICANDO ENDPOINT CONTROL VIVO EN PROD (PM2 ID 13) ===');
  const res5 = await ssh.execCommand('curl -s http://localhost:3016/api/operaciones/control-vivo | head -c 120');
  console.log('HTTP 3016 /api/operaciones/control-vivo:', res5.stdout || '(Sin respuesta / 404)');

  ssh.dispose();
}

check().catch(console.error);
