const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Conectando a servidor.leanglobal.cl:1295...');
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      port: 1295,
      username: 'root',
      password: 'lgbl2025.'
    });
    console.log('Conexión SSH establecida con éxito.');

    const sql = `
      GRANT ALL ON SCHEMA sch_leangsp TO usr_leangsp;
      GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp TO usr_leangsp;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA sch_leangsp TO usr_leangsp;
      ALTER TABLE sch_leangsp.tmnt_ot_servicio_ext OWNER TO usr_leangsp;

      GRANT ALL ON SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
      GRANT ALL ON ALL TABLES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA sch_leangsp_prod TO usr_leangsp_prod;
      ALTER TABLE sch_leangsp_prod.tmnt_ot_servicio_ext OWNER TO usr_leangsp_prod;
    `;
    const res = await ssh.execCommand(`sudo -u postgres psql -d postgres -c "${sql.replace(/\s+/g, ' ').trim()}"`);
    console.log(res.stdout);
    if (res.stderr) console.error('STDERR:', res.stderr);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
