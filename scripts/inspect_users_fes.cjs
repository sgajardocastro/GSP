const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  for (const s of ['sch_leangsp', 'sch_leangsp_prod']) {
    console.log(`\n=== ESQUEMA: ${s} ===`);
    const sql = `SELECT id_user, email, name_frst, apellido_pat, rut, id_empresa FROM ${s}.tsec_users WHERE id_user IN (55, 65) OR email ILIKE '%gajardo%';`;
    const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql}\\""`);
    console.log(res.stdout || res.stderr);

    console.log(`--- COTIZACIÓN 11493 EN ${s}.tits_transicion_historial ---`);
    const sqlCot = `SELECT id_transicion, folio_its, numero_cotizacion, cliente_nombre, estado, id_usuario_elaborador, firmas_fes FROM ${s}.tits_transicion_historial WHERE numero_cotizacion = '11493';`;
    const resCot = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlCot}\\""`);
    console.log(resCot.stdout || resCot.stderr);
  }

  ssh.dispose();
}

check().catch(console.error);
