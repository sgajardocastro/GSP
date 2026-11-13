const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function adjustReqCode() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const schemas = ['sch_leangsp', 'sch_leangsp_prod'];
  for (const s of schemas) {
    const sql = `
      -- 1. Insertar REQ-1011 formalmente
      INSERT INTO ${s}.tcfg_backlog (codigo_req, nombre_requerimiento, descripcion, prioridad, fecha_implementacion, solicitado_por, estado)
      VALUES ('REQ-1011', 'Desacoplamiento Traslados Grúa y Contrapesos Pestaña C', 'Matriz de 5 casos Spec 65, supresión de traslados autopropulsados en equipos_extra, logística de contrapesos y protección de rol Operador', 'Alta', CURRENT_DATE, 'Sergio Gajardo', 'Implementado')
      ON CONFLICT (codigo_req) DO UPDATE SET 
        nombre_requerimiento = EXCLUDED.nombre_requerimiento,
        descripcion = EXCLUDED.descripcion,
        estado = 'Implementado',
        fecha_implementacion = CURRENT_DATE,
        updated_at = NOW();

      -- 2. Actualizar tcfg_releases para v1.0.109 asociando REQ-1011
      UPDATE ${s}.tcfg_releases 
      SET requerimientos_asociados = json_build_array('REQ-1011')
      WHERE version = 'v1.0.109';
    `;
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
    console.log(`Esquema ${s}:`, res.stdout.replace(/\n+/g, ' ').trim());
  }

  const verifFinal = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT version, titulo, requerimientos_asociados FROM sch_leangsp_prod.tcfg_releases ORDER BY id DESC LIMIT 3;\\""`);
  console.log('\n--- VERIFICACIÓN RELEASES EN PROD ---');
  console.log(verifFinal.stdout.trim());

  const verifBacklog = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT codigo_req, nombre_requerimiento, estado FROM sch_leangsp_prod.tcfg_backlog WHERE codigo_req IN ('REQ-1010', 'REQ-1011') ORDER BY codigo_req;\\""`);
  console.log('\n--- VERIFICACIÓN BACKLOG EN PROD ---');
  console.log(verifBacklog.stdout.trim());

  ssh.dispose();
}

adjustReqCode().catch(console.error);
