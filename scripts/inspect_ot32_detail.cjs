const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  const r = await ssh.execCommand(`node -e "
    const itsController = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js');
    async function test() {
      let itsData = null;
      const mockRes = {
        statusCode: 200,
        status(c) { this.statusCode = c; return this; },
        json(data) { itsData = data; return this; }
      };
      await itsController.getITS({ params: { id_proyecto: 32 } }, mockRes);
      const p = (itsData.data && itsData.data.proyecto && itsData.data.proyecto.json_field) || {};
      const crm = p.crm_v1 || {};
      console.log('--- LINEAS COTIZACION ---');
      console.log(JSON.stringify(crm.lineas_cotizacion || crm.items_cotizacion || crm.servicios, null, 2));
      console.log('--- JORNADAS ---');
      console.log(JSON.stringify(itsData.data.jornadas, null, 2));
      console.log('--- ITS ---');
      console.log(JSON.stringify(itsData.data.its, null, 2));
    }
    test().catch(console.error);
  "`);
  console.log(r.stdout);
  console.log(r.stderr);
  ssh.dispose();
}

main().catch(console.error);
