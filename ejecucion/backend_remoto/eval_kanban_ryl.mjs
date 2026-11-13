import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const script = `
      const pool = require('./src/config/postgresPool');
      const ProyectoModel = require('./src/models/proyectoModel');
      const proyecto = new ProyectoModel();

      async function run() {
        try {
          const proyectos = await proyecto.getProyectos(null, 'ALL');
          const ryl = proyectos.find(p => p.id_proyecto === 48 || p.codi_proyecto === 'RYL-2611-00001');
          console.log('--- PROYECTO 48 EN getProyectos ---');
          if (!ryl) {
            console.log('No encontrado en getProyectos');
            return;
          }
          console.log('id_proyecto:', ryl.id_proyecto);
          console.log('codi_proyecto:', ryl.codi_proyecto);
          console.log('id_proyecto_estado:', ryl.id_proyecto_estado);
          console.log('estado_its:', ryl.estado_its);
          console.log('estado_financiero:', ryl.estado_financiero);
          console.log('motivo_desestimacion:', ryl.motivo_desestimacion);
          
          const jf = ryl.json_field || {};
          console.log('jf.its_v1:', jf.its_v1);
          console.log('jf.ejecucion_v1.preparacion_salida:', jf.ejecucion_v1 && jf.ejecucion_v1.preparacion_salida);
          console.log('jf.ejecucion_v1.retorno_concluido:', jf.ejecucion_v1 && jf.ejecucion_v1.retorno_concluido);
          console.log('jf.ejecucion_v1.viaje_iniciado:', jf.ejecucion_v1 && jf.ejecucion_v1.viaje_iniciado);
          console.log('jf.ejecucion_v1.subtab_activa:', jf.ejecucion_v1 && jf.ejecucion_v1.subtab_activa);
          console.log('jf.ejecucion_v1.subtab_actual_view:', jf.ejecucion_v1 && jf.ejecucion_v1.subtab_actual_view);

          // Evaluar esFinalizadoOperacional
          const st = Number(ryl.id_proyecto_estado);
          const c1 = st >= 99 || (st === 6 && ryl.motivo_desestimacion);
          const c2 = (st === 7 || st === 8);
          const c3 = (st === 6 && !ryl.motivo_desestimacion);
          const c4 = ['EN_REVISION_CONTABILIDAD', 'CONCLUIDO'].includes(ryl.estado_its);
          const c5 = ['FACTURADO_CONFORME', 'DEVENGADO_PENDIENTE_FACTURA'].includes(ryl.estado_financiero);
          const c6 = Boolean(jf.its_v1 && jf.its_v1.concluido) || Boolean(jf.ejecucion_v1 && jf.ejecucion_v1.preparacion_salida && jf.ejecucion_v1.preparacion_salida.ejecucion_finalizada);
          
          console.log('EVAL esFinalizadoOperacional:');
          console.log({ st, c1, c2, c3, c4, c5, c6, RESULTADO_FINAL: (!c1 && (c2 || c3 || c4 || c5 || c6)) });

          // Y en qué columna cae según Torre.vue
          console.log('--- COLUMNAS EVAL ---');
          const estaEnFaena = Boolean(
            (jf.ejecucion_v1 && jf.ejecucion_v1.preparacion_salida && jf.ejecucion_v1.preparacion_salida.preparacion_finalizada) ||
            (jf.ejecucion_v1 && jf.ejecucion_v1.viaje_iniciado) ||
            (jf.ejecucion_v1 && (jf.ejecucion_v1.subtab_activa === 'reports' || jf.ejecucion_v1.subtab_activa === 'despacho' || jf.ejecucion_v1.subtab_actual_view === 'reports'))
          );
          console.log('estaEnFaena:', estaEnFaena);

        } catch(e) {
          console.error('Error:', e);
        } finally {
          await pool.end();
        }
      }
      run();
    `;

    const remoteDir = '/home/nodeadmin/proyectos/lean-services-gsp-prod';
    await ssh.execCommand(`cat << 'EOF' > ${remoteDir}/temp_eval_ryl.js\n${script}\nEOF`);
    const res = await ssh.execCommand('su - nodeadmin -c "node /home/nodeadmin/proyectos/lean-services-gsp-prod/temp_eval_ryl.js"');
    console.log(res.stdout);
    if (res.stderr) console.error('STDERR:', res.stderr);
    await ssh.execCommand(`rm -f ${remoteDir}/temp_eval_ryl.js`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
