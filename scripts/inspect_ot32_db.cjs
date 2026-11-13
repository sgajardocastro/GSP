const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  const rProy = await ssh.execCommand(`PGPASSWORD='usr_gsp_prod_2026!' psql -h localhost -p 5432 -U usr_leangsp_prod -d postgres -c "
    SELECT id_proyecto, codi_proyecto, json_field->'cotizacion' as cotizacion, json_field->'crm_v1'->'servicios' as servicios, json_field->'crm_v1'->'lineas_cotizacion' as lineas
    FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 32;
  "`);
  console.log('--- PROYECTO 32 ---');
  console.log(rProy.stdout);

  const rReports = await ssh.execCommand(`PGPASSWORD='usr_gsp_prod_2026!' psql -h localhost -p 5432 -U usr_leangsp_prod -d postgres -c "
    SELECT id_reporte_avance, id_proyecto, numero_reporte, horas_reales, horas_report, horas_operadas, estado
    FROM sch_leangsp_prod.topr_reporte_avance WHERE id_proyecto = 32;
  "`);
  const rRep = await ssh.execCommand(`PGPASSWORD='usr_gsp_prod_2026!' psql -h localhost -p 5432 -U usr_leangsp_prod -d postgres -c "
    SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp_prod' AND table_name = 'tedp_reporte_avance';
  "`);
  console.log('COLS:', rRep.stdout);

  ssh.dispose();
}

main().catch(console.error);
