const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const envRes = await ssh.execCommand('grep -E "PORT|PREFIX|APP_ENV" /home/nodeadmin/proyectos/lean-services-gsp/.env');
  console.log('DEV .env:\n', envRes.stdout);

  const prodIdx = await ssh.execCommand('grep -n "controlVivo" /home/nodeadmin/proyectos/lean-services-gsp-prod/src/index.js');
  console.log('PROD index.js controlVivo:\n', prodIdx.stdout);

  const prodRoutes = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/lean-services-gsp-prod/src/routes/');
  console.log('PROD routes files:\n', prodRoutes.stdout);

  const devRoutes = await ssh.execCommand('ls -la /home/nodeadmin/proyectos/lean-services-gsp/src/routes/');
  console.log('DEV routes files:\n', devRoutes.stdout);

  const curl3006 = await ssh.execCommand('curl -s "http://127.0.0.1:3006/api/operaciones/control-vivo"');
  try {
    const data = JSON.parse(curl3006.stdout);
    console.log('Total OTs en DEV:', data.servicios?.length);
    const otMulti = data.servicios?.find(s => s.equipos?.[0]?.franja_multidia?.length > 1) || data.servicios?.[0];
    if (otMulti) {
      console.log(`OT: ${otMulti.codigo_ot} - ${otMulti.cliente}`);
      const eq = otMulti.equipos?.[0];
      console.log(`Equipo: ${eq?.patente} - Franja (${eq?.franja_multidia?.length} días):`);
      eq?.franja_multidia?.forEach(j => {
        console.log(`  - Día ${j.dia} (${j.fecha}): [${j.estado}] tiene_report=${j.tiene_report} (${j.id_reporte_avance || 'sin id'}) tiene_viaje=${j.tiene_viaje} (${j.actividades?.length || 0} acts)`);
        j.actividades?.forEach(a => console.log(`      * ${a.clave}: Plan ${a.hora_plan} -> Real ${a.hora_real || '--:--'} [${a.estado}]`));
      });
    }
  } catch (err) {
    console.error('Error parseando JSON 3006:', err.message);
  }


  ssh.dispose();
}

inspect().catch(console.error);
