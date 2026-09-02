import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkUsers() {
  try {
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });

    const script = `
const pool = require('./src/config/postgresPool');
async function check() {
  const { rows } = await pool.query("SELECT id_user, name_frst, apellido_pat, email FROM sch_leangsp.tsec_users LIMIT 10;");
  console.log('--- USUARIOS EN BD ---');
  console.log(rows);
  pool.end();
}
check();
`;
    await ssh.execCommand(`cat << 'EOF' > /home/nodeadmin/proyectos/lean-services-gsp/check_u.js\n${script}\nEOF`);
    const res = await ssh.execCommand('cd /home/nodeadmin/proyectos/lean-services-gsp && node check_u.js');
    console.log(res.stdout);
    await ssh.execCommand('rm -f /home/nodeadmin/proyectos/lean-services-gsp/check_u.js');

  } catch (err) {
    console.error(err);
  } finally {
    ssh.dispose();
  }
}
checkUsers();
