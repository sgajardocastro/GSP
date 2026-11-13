const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  for (const f of ['2026-10-06', '2026-10-07']) {
    console.log(`\n=== CONSULTANDO CONTROL EN VIVO PARA ${f} ===`);
    const res = await ssh.execCommand(`curl -s "http://127.0.0.1:3016/api/operaciones/control-vivo?fecha=${f}"`);
    try {
      const data = JSON.parse(res.stdout);
      console.log('Response:', data);
      if (Array.isArray(data)) {
        console.log('Data is array, length:', data.length);
        console.log('Sample item keys:', Object.keys(data[0] || {}));
      } else if (data.data) {
        console.log('data.data keys/length:', Array.isArray(data.data) ? data.data.length : Object.keys(data.data));
      }
      const servicios = data.servicios || data.data || (Array.isArray(data) ? data : []);
      console.log('Total servicios retornados:', servicios.length);
      console.log('Códigos de OT presentes:', servicios.map(s => `${s.id_proyecto}: ${s.codi_proyecto}`));
      const ot4 = servicios.find(s => s.id_proyecto === 4 || s.codi_proyecto?.includes('233'));
      if (ot4) {
        console.log('OT 4 encontrada:');
        ot4.equipos?.forEach(e => {
          console.log(`Equipo: ${e.patente}`);
          e.actividades?.forEach(a => {
            console.log(`  ${a.clave.padEnd(18)}: Plan ${a.hora_plan} -> Real ${a.hora_real || '--:--'} [${a.estado}]`);
          });
        });
      } else {
        console.log('OT 4 NO está en la lista para esta fecha.');
      }
    } catch (e) {
      console.log('Error parseando JSON:', e.message);
    }
  }

  ssh.dispose();
}

check().catch(console.error);
