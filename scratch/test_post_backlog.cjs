const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const payload = JSON.stringify({
    nombre_requerimiento: 'Test Validación Guardar Requerimiento Post-Fix',
    descripcion: 'Prueba de inserción para certificar erradicación de error debe ser dueño de la tabla',
    prioridad: 'Media',
    solicitado_por: 'Alfonso',
    estado: 'Pendiente',
    adjuntos: []
  });

  console.log('--- TEST POST BACKLOG PROD ---');
  const resProd = await ssh.execCommand(`curl -s -X POST -H "Content-Type: application/json" -d '${payload}' https://servidor.leanglobal.cl/lg-gsp-prod/api/backlog`);
  console.log('PROD POST RESPONSE:', resProd.stdout);

  // Si se insertó con éxito, limpiamos el registro de prueba
  try {
    const data = JSON.parse(resProd.stdout);
    if (data.success && data.data?.id) {
      console.log('Borrando registro de prueba ID:', data.data.id);
      await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"DELETE FROM sch_leangsp_prod.tcfg_backlog WHERE id = ${data.data.id};\\""`);
      console.log('Registro de prueba eliminado limpiamente.');
    }
  } catch (e) {
    console.error('Error parseando JSON respuesta:', e.message);
  }

  ssh.dispose();
}

main().catch(console.error);