const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const path = require('path');
const https = require('https');
const ssh = new NodeSSH();

const getJson = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { Connection: 'close' } }, (res) => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
      catch (e) { resolve({ status: res.statusCode, raw: b.slice(0, 200) }); }
    });
  }).on('error', reject);
});

(async () => {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295, readyTimeout: 10000 });
  const localCtrl = path.resolve(__dirname, '../ejecucion/backend_remoto/src/controllers/reportDiarioController.js');

  for (const dir of ['/home/nodeadmin/proyectos/lean-services-gsp', '/home/nodeadmin/proyectos/lean-services-gsp-prod']) {
    await ssh.putFile(localCtrl, `${dir}/src/controllers/reportDiarioController.js`);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${dir}/src/controllers/reportDiarioController.js`);
  }

  const sql = [
    'UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 3 WHERE id_reporte_avance = 23 AND id_proyecto = 16;',
    'UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 4 WHERE id_reporte_avance = 26 AND id_proyecto = 16;',
    'UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 5 WHERE id_reporte_avance = 27 AND id_proyecto = 16;',
    'UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 6 WHERE id_reporte_avance = 22 AND id_proyecto = 16;',
    'SELECT id_reporte_avance, dia_correlativo, fecha_reporte::date, horometro_inicio, horometro_termino, estado_reporte FROM sch_leangsp_prod.tedp_reporte_avance WHERE id_proyecto = 16 ORDER BY dia_correlativo;'
  ].join('\n');

  const rSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -P pager=off" << 'EOF'\n${sql}\nEOF`);
  console.log('=== OT 16 EN PROD ===\n' + (rSql.stdout || rSql.stderr).trim());

  await ssh.execCommand('su - nodeadmin -c "pm2 restart 10 && pm2 restart 13"');
  ssh.dispose();

  await new Promise(r => setTimeout(r, 2500));
  const ctx = await getJson('https://servidor.leanglobal.cl/lg-gsp-prod/api/operaciones/report/contexto/16?id_equipo=45&id_user=49');
  const d = ctx.body?.data || {};
  console.log('=== API PROD CONTEXTO OT 16 ===', JSON.stringify({
    status: ctx.status,
    id_equipo_seleccionado: d.id_equipo_seleccionado,
    equipo_corregido: d.equipo_corregido,
    dia_sugerido: d.dia_sugerido,
    horometro_sugerido: d.horometro_sugerido,
    dias_reportados: d.dias_reportados,
    total_dias: d.total_dias,
    jornada_activa: d.jornada_activa
  }, null, 2));
  process.exit(0);
})().catch(e => {
  console.error('ERR:', e);
  process.exit(1);
});
