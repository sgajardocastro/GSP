const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  
  console.log('Obteniendo primera OT...');
  const resOts = await ssh.execCommand('curl -s http://127.0.0.1:3006/api/mantenimiento/ots');
  const otsData = JSON.parse(resOts.stdout);
  const ot = otsData.data?.[0];
  console.log(`OT encontrada: ID ${ot?.id_ot}, Folio ${ot?.numero_ot}, Patente ${ot?.patente}`);

  if (ot) {
    console.log('\n4. Probando PUT /api/mantenimiento/ots/:id/medidores-inicio:');
    const payloadMed = JSON.stringify({
      horometro_grua_inicio: 1540.5,
      horometro_chasis_inicio: 1220.0,
      odometro_inicio: 45200
    });
    const resMed = await ssh.execCommand(`curl -s -X PUT http://127.0.0.1:3006/api/mantenimiento/ots/${ot.id_ot}/medidores-inicio -H "Content-Type: application/json" -d '${payloadMed}'`);
    console.log(resMed.stdout);

    console.log('\n5. Probando POST /api/mantenimiento/ots/:id/fotos-360:');
    const payloadFoto = JSON.stringify({
      posicion: 'frente',
      id_doc: '1234',
      url: 'https://servidor.leanglobal.cl/api/v1/storage/view/1234'
    });
    const resFoto = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3006/api/mantenimiento/ots/${ot.id_ot}/fotos-360 -H "Content-Type: application/json" -d '${payloadFoto}'`);
    console.log(resFoto.stdout);
  }

  ssh.dispose();
}
main().catch(console.error);
