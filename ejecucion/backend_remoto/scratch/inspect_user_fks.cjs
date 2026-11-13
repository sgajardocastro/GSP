const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectFks() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== VERIFICANDO REFERENCIAS DE ID_USER = 59 EN sch_leangsp_prod ===');
  const findColsSql = `
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp_prod' AND column_name IN ('id_user', 'id_usuario', 'id_user_operador', 'id_user_rigger', 'id_chofer', 'id_conductor');
  `;
  const colsRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"${findColsSql.replace(/\n/g, ' ')}\\""`);
  const lines = colsRes.stdout.trim().split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const [table, col] = line.split('|').map(s => s.trim());
    if (!table || !col) continue;
    const countSql = `SELECT count(*) FROM sch_leangsp_prod.${table} WHERE ${col} IN (53, 59);`;
    const countRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -t -c \\"${countSql}\\""`);
    const cnt = parseInt(countRes.stdout.trim(), 10) || 0;
    if (cnt > 0) {
      console.log(`⚠️ Tabla ${table}.${col} tiene ${cnt} referencias a usuarios 53 o 59!`);
    } else {
      console.log(`✓ Tabla ${table}.${col}: 0 referencias.`);
    }
  }

  // Verificar si hay registros de enrolamiento o tokens
  const enrolCheck = `
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'sch_leangsp_prod' AND (table_name LIKE '%enrol%' OR table_name LIKE '%token%' OR table_name LIKE '%auth%');
  `;
  const enrolRes = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${enrolCheck.replace(/\n/g, ' ')}\\""`);
  console.log('\nTablas de enrolamiento/token/auth en PROD:\n', enrolRes.stdout || 'Ninguna');

  ssh.dispose();
}

inspectFks().catch(console.error);
