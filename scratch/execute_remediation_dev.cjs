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

  const sql = `
    -- Saneamiento Relacional SPEC-134 en DEV (sch_leangsp)
    -- 1. Cancelar equipos duplicados con id_linea_servicio NULL
    UPDATE sch_leangsp.tpry_rel_equipo
    SET estado_real = 'CANCELADO',
        observaciones = COALESCE(observaciones, '') || ' [SPEC-134 Duplicado Cancelado]'
    WHERE id_rel_equipo IN (223, 224, 203);

    -- 2. Cancelar tripulantes duplicados con id_linea_servicio NULL
    UPDATE sch_leangsp.tpry_rel_persona
    SET estado_real = 'CANCELADO'
    WHERE id_rel_persona IN (210, 211);
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/remediate_dev.sql
${sql}
EOF`);

  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/remediate_dev.sql"`);
  console.log("Resultado remediación SQL:\n", res.stdout);
  await ssh.execCommand(`rm -f /tmp/remediate_dev.sql`);

  ssh.dispose();
}

run().catch(console.error);
