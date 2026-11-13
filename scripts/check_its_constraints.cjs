const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  console.log('=== CHECK CONSTRAINT EN DEV Y PROD ===');
  const q = `
    SELECT nspname AS schema, relname AS table, conname AS constraint, pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE conname LIKE '%tipo_servicio%' OR conname LIKE '%tits_jornada_detalle%';
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${q.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  ssh.dispose();
}

main().catch(console.error);
