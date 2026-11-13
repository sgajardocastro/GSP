const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const res = await ssh.execCommand('curl -s http://127.0.0.1:3016/api/proyectos');
  const parsed = JSON.parse(res.stdout);
  const list = Array.isArray(parsed) ? parsed : (parsed.data || parsed.proyectos || []);
  const p48 = list.find(p => p.id_proyecto === 48);

  const esFinalizadoOperacional = (p) => {
    if (!p) return false;
    const st = Number(p.id_proyecto_estado);
    if (st >= 99 || (st === 6 && p.motivo_desestimacion)) return false;
    if (st === 7 || st === 8) return true;
    if (st === 6 && !p.motivo_desestimacion) return true;
    return false;
  };

  const estaEnFaena = (p) => {
    const ej = p.json_field?.ejecucion_v1 || {};
    if (ej.preparacion_salida?.preparacion_finalizada || ej.viaje_iniciado || ej.subtab_activa === 'reports' || ej.subtab_activa === 'despacho' || ej.subtab_actual_view === 'reports') {
      return true;
    }
    const rep = p.reportes_count || p.total_reports || (p.reportes && p.reportes.length) || 0;
    return rep > 0;
  };

  const st = Number(p48.id_proyecto_estado);
  const esFin = esFinalizadoOperacional(p48);
  const enFaena = estaEnFaena(p48);

  console.log('=== EVALUACIÓN EXACTA FRONTEND PARA P48 ===');
  console.log('id_proyecto:', p48.id_proyecto, p48.codigo);
  console.log('id_proyecto_estado:', st);
  console.log('esFinalizadoOperacional:', esFin);
  console.log('estaEnFaena:', enFaena);
  console.log('¿Va a Columna 5 (EN EJECUCIÓN / FAENA)?:', (!esFin && st === 5 && enFaena));
  console.log('¿Va a Columna 6 (FINALIZADO / CONTABILIDAD)?:', esFin);

  ssh.dispose();
}

main().catch(console.error);
