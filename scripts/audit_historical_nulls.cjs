const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const script = `
    const { Pool } = require('pg');

    async function auditHistorical(schemaName, user, pass) {
      console.log('=== AUDITORIA HISTORICA ESQUEMA ' + schemaName + ' ===');
      const pool = new Pool({
        user: user,
        password: pass,
        host: 'localhost',
        database: 'postgres',
        port: 5432
      });

      // 1. tedp_reporte_avance con NULLs
      const repNulls = await pool.query(\`
        SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, id_user_rigger, fecha_reporte
        FROM \${schemaName}.tedp_reporte_avance
        WHERE id_user_operador IS NULL OR id_user_rigger IS NULL;
      \`);
      console.log('Reportes con operador o rigger NULL (' + repNulls.rows.length + '):', repNulls.rows);

      // 2. tequ_log_desplazamiento con NULLs
      const logNulls = await pool.query(\`
        SELECT id_log_desplazamiento, id_proyecto, id_equipo, patente, id_user_chofer, tipo_trayecto
        FROM \${schemaName}.tequ_log_desplazamiento
        WHERE id_user_chofer IS NULL OR patente IS NULL;
      \`);
      console.log('Logs desplazamiento con chofer o patente NULL (' + logNulls.rows.length + '):', logNulls.rows);

      // 3. Revisar si hay riggers en tpry_rel_persona mal categorizados
      const riggers = await pool.query(\`
        SELECT rp.id_rel_persona, rp.id_proyecto, rp.id_user, rp.rol_asignado, u.name_frst, u.apellido_pat
        FROM \${schemaName}.tpry_rel_persona rp
        JOIN \${schemaName}.tsec_users u ON rp.id_user = u.id_user
        WHERE LOWER(rp.rol_asignado) LIKE '%rigger%' OR rp.id_user = 13;
      \`);
      console.log('Riggers en tpry_rel_persona (' + riggers.rows.length + '):', riggers.rows);

      await pool.end();
    }

    async function main() {
      await auditHistorical('sch_leangsp_prod', 'usr_leangsp_prod', 'usr_gsp_prod_2026!');
      await auditHistorical('sch_leangsp', 'usr_leangsp', 'usr_gsp_123');
    }
    main().catch(console.error);
  `;

  const b64 = Buffer.from(script).toString('base64');
  const res = await ssh.execCommand(`NODE_PATH=/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);
  ssh.dispose();
}

run().catch(console.error);
