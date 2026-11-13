const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES (
        'REQ-1058',
        'Soporte Mono-Equipo y Pareo Resiliente de Patentes en Cálculo de Ingresos y Mano de Obra en ITS Transición',
        'SPEC-066 Master (Sección 4.3): Cálculo automático y resiliente de ingresos por horas y mano de obra para servicios con mono-equipo (sin requerir patente exacta en cada jornada) y pareo normalizado para multi-equipo con fallback a equipo principal.',
        'Alta',
        CURRENT_DATE,
        'Sergio Gajardo',
        'Implementado'
      )
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      INSERT INTO ${s}.tcfg_releases (version, titulo, tipo_release, descripcion_impacto, requerimientos_asociados, publicado_por)
      VALUES (
        'v1.0.150',
        'Portal Web GSP v1.0.150 - Soporte Mono-Equipo y Pareo Resiliente de Patentes en ITS Transición',
        'BUGFIX',
        'Corrige fallo donde servicios con un solo equipo (ej. Cotización 11308 de Tracto Camión) valorizaban ingresos por horas en $0 cuando la patente de las jornadas no coincidía de forma exacta. Ahora calcula determinísticamente las horas reportadas por la tarifa horaria del equipo.',
        '["REQ-1058"]'::jsonb,
        'Sergio Gajardo'
      )
      ON CONFLICT (version) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        descripcion_impacto = EXCLUDED.descripcion_impacto,
        requerimientos_asociados = EXCLUDED.requerimientos_asociados;
    `;

    // Escribir archivo temporal en el servidor para evitar problemas de escape bash
    await ssh.execCommand(`cat << 'EOF' > /tmp/sync_v150_${s}.sql\n${sql}\nEOF`);
    const resSql = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_v150_${s}.sql"`);
    console.log(`Base de Datos (${s}):`, resSql.stdout.trim() || resSql.stderr);
    await ssh.execCommand(`rm -f /tmp/sync_v150_${s}.sql`);
  }

  ssh.dispose();
  console.log('✅ Sincronización BD v1.0.150 finalizada.');
}

main().catch(console.error);
