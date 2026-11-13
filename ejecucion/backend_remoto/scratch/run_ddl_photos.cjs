const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function runDDL() {
  try {
    console.log('Conectando a servidor.leanglobal.cl:1295 como root...');
    await ssh.connect({
      host: '138.255.103.18',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 20000
    });
    console.log('Conectado.');

    const ddl = `
      ALTER TABLE tequ_log_desplazamiento
        ADD COLUMN IF NOT EXISTS foto_odometro_salida_path text,
        ADD COLUMN IF NOT EXISTS foto_horometro_salida_path text,
        ADD COLUMN IF NOT EXISTS foto_odometro_llegada_path text,
        ADD COLUMN IF NOT EXISTS foto_horometro_camion_llegada_path text,
        ADD COLUMN IF NOT EXISTS foto_horometro_grua_llegada_path text;
    `;

    // 1. Ejecutar en dev_leangsp (o sch_leangsp en postgres)
    console.log('Ejecutando DDL en postgres (sch_leangsp)...');
    const r1 = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SET search_path TO sch_leangsp, public; ${ddl}\\""`);
    console.log('Postgres:', r1.stdout || r1.stderr);

    // 2. Ejecutar en dev_leangsp si existe
    console.log('Ejecutando DDL en dev_leangsp...');
    const r2 = await ssh.execCommand(`su - postgres -c "psql -d dev_leangsp -c \\"${ddl}\\""`);
    console.log('dev_leangsp:', r2.stdout || r2.stderr);

    // Verificar columnas agregadas
    const check = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'sch_leangsp' AND table_name = 'tequ_log_desplazamiento' AND column_name LIKE 'foto%';\\""`);
    console.log('Columnas de fotos en sch_leangsp.tequ_log_desplazamiento:');
    console.log(check.stdout);

  } catch (err) {
    console.error('Error ejecutando DDL:', err);
  } finally {
    ssh.dispose();
  }
}

runDDL();
