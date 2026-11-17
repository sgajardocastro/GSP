const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const workerScript = `
const { Pool } = require('pg');
const proyecto = require('./src/models/proyectoModel');

async function ejecutar() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://usr_leangsp_prod:usr_gsp_prod_2026!@localhost:5432/postgres'
  });
  const client = await pool.connect();

  try {
    console.log('1. Actualizando datos de origen en sch_leangsp_prod.tpry_proyecto id = 90...');
    const q = await client.query('SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 90');
    const jf = q.rows[0].json_field || {};

    const datosPte = {
      serie: 'PTE-86-SN',
      motor: 'S/N',
      marca: 'ZOOMLION',
      modelo: 'ZS0808AC-LI',
      anio: '2026'
    };

    // Actualizar lineas_servicio[0]
    if (jf.crm_v1 && Array.isArray(jf.crm_v1.lineas_servicio) && jf.crm_v1.lineas_servicio.length > 0) {
      jf.crm_v1.lineas_servicio[0] = { ...jf.crm_v1.lineas_servicio[0], ...datosPte };
    }

    // Actualizar lineas_operativas_vigentes[0]
    if (jf.crm_v1 && Array.isArray(jf.crm_v1.lineas_operativas_vigentes) && jf.crm_v1.lineas_operativas_vigentes.length > 0) {
      jf.crm_v1.lineas_operativas_vigentes[0] = { ...jf.crm_v1.lineas_operativas_vigentes[0], ...datosPte };
    }

    // Sincronizar bloque contrato
    if (jf.crm_v1 && jf.crm_v1.contrato) {
      jf.crm_v1.contrato.maquinaria = { ...datosPte };
    }
    if (jf.contrato_arriendo) {
      jf.contrato_arriendo.maquinaria = { ...datosPte };
    }

    await client.query('UPDATE sch_leangsp_prod.tpry_proyecto SET json_field = $1 WHERE id_proyecto = 90', [jf]);
    console.log('Datos de origen actualizados con exito en BD!');

    console.log('2. Invocando generacion oficial del contrato SIN datosExtra (simulando boton CRM)...');
    const p = new proyecto();
    const payloadCrm = {
      id_empresa_arrendador: 11,
      fecha_inicio: '2026-11-16',
      fecha_termino: '2026-11-17',
      representante_nombre: 'EDUARDO PEREIRA',
      representante_rut: '96891540-1',
      representante_cargo: 'Administrador de Contrato',
      representante_telefono: '984073588'
    };

    const resGen = await p.generarContratoArriendoVersion(90, payloadCrm);
    console.log('Resultado generacion contrato:', JSON.stringify(resGen.contrato, null, 2));

    // Mantener estado ENVIADO_FES y token intactos
    const token = '9dfd5555bd9da92dd9a9c30c8714c12da43f145ea2c6cc69';
    const urlFirma = 'https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato?token=' + token;

    const qAfter = await client.query('SELECT json_field FROM sch_leangsp_prod.tpry_proyecto WHERE id_proyecto = 90');
    const jfAfter = qAfter.rows[0].json_field || {};
    if (jfAfter.crm_v1 && jfAfter.crm_v1.contrato) {
      jfAfter.crm_v1.contrato.estado = 'ENVIADO_FES';
      jfAfter.crm_v1.contrato.token_publico = token;
      jfAfter.crm_v1.contrato.url_publica_firma = urlFirma;
    }
    if (jfAfter.contrato_arriendo) {
      jfAfter.contrato_arriendo = { ...(jfAfter.contrato_arriendo || {}), ...(jfAfter.crm_v1?.contrato || {}) };
    }
    await client.query('UPDATE sch_leangsp_prod.tpry_proyecto SET json_field = $1 WHERE id_proyecto = 90', [jfAfter]);
    console.log('Estado FES y tokens sincronizados con exito!');

  } finally {
    client.release();
    await pool.end();
  }
}

ejecutar().catch(console.error);
`;

  await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp-prod/actualizar_origen.cjs\n${workerScript}\nEOF`);
  const res = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node actualizar_origen.cjs"');
  console.log('OUTPUT EJECUCION:');
  console.log(res.stdout);
  console.log(res.stderr);
  await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp-prod/actualizar_origen.cjs');

  const resPdf = await ssh.execCommand('pdftotext /u05/LeanDocs/GSP/prod/contratos/2026/11/CTR-2026-0090.pdf - | grep -A 15 "INDIVIDUALIZACION DE LA MAQUINARIA"');
  console.log('TEXTO PDF GENERADO:');
  console.log(resPdf.stdout);

  const curl1 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato?token=9dfd5555bd9da92dd9a9c30c8714c12da43f145ea2c6cc69"');
  const curl2 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" "https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/1964"');
  console.log('HTTP firmar-contrato:', curl1.stdout);
  console.log('HTTP api/archivo/ver/1964:', curl2.stdout);

  ssh.dispose();
}

run().catch(console.error);
