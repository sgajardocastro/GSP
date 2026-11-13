const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function syncSequence() {
  console.log('=== SINCRONIZANDO SECUENCIA tsec_users_id_user_seq EN PROD Y DEV ===\n');

  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
    -- Diagnóstico previo
    SELECT 
      'ANTES PROD' as estado,
      (SELECT MAX(id_user) FROM sch_leangsp_prod.tsec_users) as max_id_user,
      (SELECT last_value FROM sch_leangsp_prod.tsec_users_id_user_seq) as seq_val;

    -- Ajuste en Producción
    SELECT setval('sch_leangsp_prod.tsec_users_id_user_seq', COALESCE((SELECT MAX(id_user) FROM sch_leangsp_prod.tsec_users), 1));

    -- Ajuste en Desarrollo
    SELECT setval('sch_leangsp.tsec_users_id_user_seq', COALESCE((SELECT MAX(id_user) FROM sch_leangsp.tsec_users), 1));

    -- Diagnóstico posterior
    SELECT 
      'DESPUES PROD' as estado,
      (SELECT MAX(id_user) FROM sch_leangsp_prod.tsec_users) as max_id_user,
      (SELECT last_value FROM sch_leangsp_prod.tsec_users_id_user_seq) as seq_val
    UNION ALL
    SELECT 
      'DESPUES DEV' as estado,
      (SELECT MAX(id_user) FROM sch_leangsp.tsec_users) as max_id_user,
      (SELECT last_value FROM sch_leangsp.tsec_users_id_user_seq) as seq_val;
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/sync_seq_users.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -f /tmp/sync_seq_users.sql"`);
  console.log(res.stdout || res.stderr);

  ssh.dispose();
  console.log('✓ Secuencia sincronizada con éxito.');
}

syncSequence().catch(err => {
  console.error('Error sincronizando secuencia:', err);
  process.exit(1);
});
