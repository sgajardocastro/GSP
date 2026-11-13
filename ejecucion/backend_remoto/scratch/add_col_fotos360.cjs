const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();
async function main() {
  await ssh.connect({ host: '138.255.103.18', username: 'root', password: 'lgbl2025.', port: 1295 });
  console.log('Aplicando columna fotos_recepcion_360...');
  for (const s of ['sch_leangsp', 'sch_leangsp_prod']) {
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"ALTER TABLE ${s}.tmnt_ot ADD COLUMN IF NOT EXISTS fotos_recepcion_360 JSONB DEFAULT '{}'::jsonb;\\""`);
    console.log(`Esquema ${s}:`, res.stdout.trim() || res.stderr.trim());
  }
  ssh.dispose();
}
main().catch(console.error);
