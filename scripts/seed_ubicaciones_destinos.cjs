const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function seed() {
  console.log('=== CREANDO UBICACIONES OPERATIVAS PARA BODEGAS 2 Y 3 EN DEV ===\n');
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 2, 'ANF-REC', 'REC', '1', '1', 'PULMON_RECEPCION', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 2 AND codigo = 'ANF-REC');

    INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 2, 'ANF-R1-A1', 'R1', 'A', '1', 'RACK', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 2 AND codigo = 'ANF-R1-A1');

    INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 2, 'ANF-PATIO', 'PATIO', '1', '1', 'CORRAL_PATIO', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 2 AND codigo = 'ANF-PATIO');

    INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 3, 'MOV-PANIOL', 'PANIOL', '1', '1', 'PULMON_RECEPCION', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 3 AND codigo = 'MOV-PANIOL');

    INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 3, 'MOV-CAJON-1', 'CAJON', '1', '1', 'RACK', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 3 AND codigo = 'MOV-CAJON-1');

    INSERT INTO sch_leangsp.tinv_ubicacion (id_bodega, codigo, estanteria, nivel, posicion, tipo_zona, permite_mezcla_sku, estado)
    SELECT 3, 'MOV-CAJON-2', 'CAJON', '1', '2', 'RACK', true, 'OPERATIVA'
    WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tinv_ubicacion WHERE id_bodega = 3 AND codigo = 'MOV-CAJON-2');

    GRANT ALL PRIVILEGES ON TABLE sch_leangsp.tinv_ubicacion TO usr_leangsp, usrpglgbl;
  `;

  const remoteFile = '/tmp/seed_ubicaciones.sql';
  await ssh.execCommand(`cat << 'EOF' > ${remoteFile}\n${sql}\nEOF`);
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f ${remoteFile}"`);
  console.log(res.stdout || res.stderr);
  await ssh.execCommand(`rm -f ${remoteFile}`);

  ssh.dispose();
  console.log('\n Ubicaciones operativas verificadas.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
