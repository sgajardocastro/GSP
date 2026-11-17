const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function fixAndVerify() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  // 1. Delete the REEMPLAZADO rows for project 97 in tpry_rel_equipo so only PROGRAMADO remains
  const cleanSql = `su - nodeadmin -c "node -e \\\"
    require('/home/nodeadmin/proyectos/lean-services-gsp-prod/node_modules/dotenv').config({ path: '/home/nodeadmin/proyectos/lean-services-gsp-prod/.env' });
    const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');
    (async () => {
      await pool.query(\\\\\\\"DELETE FROM sch_leangsp_prod.tpry_rel_equipo WHERE id_proyecto = 97 AND (estado_real = 'REEMPLAZADO' OR id_equipo = 52)\\\\\\\");
      const res = await pool.query(\\\\\\\"SELECT id_rel_equipo, id_equipo, rol_equipo, estado_real FROM sch_leangsp_prod.tpry_rel_equipo WHERE id_proyecto = 97\\\\\\\");
      console.log('CLEANED tpry_rel_equipo:', res.rows);
      process.exit(0);
    })().catch(e => { console.error(e); process.exit(1); });
  \\\""`;
  const cleanRes = await ssh.execCommand(cleanSql);
  console.log('CLEAN RES:\n', cleanRes.stdout, cleanRes.stderr);

  // 2. Read current asignacionRecursosController.js
  const controllerPath = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/asignacionRecursosController.js';
  const getCode = await ssh.execCommand(`cat ${controllerPath}`);
  let code = getCode.stdout;

  // Check if it has the query
  const target = `WHERE 
                re.id_proyecto = $1
            ORDER BY 
                re.fecha_plan_ini ASC`;
  
  const replacement = `WHERE 
                re.id_proyecto = $1
                AND re.estado_real != 'REEMPLAZADO'
            ORDER BY 
                re.fecha_plan_ini ASC, re.id_rel_equipo ASC`;

  if (code.includes('re.id_proyecto = $1')) {
    code = code.replace(
      /WHERE\s+re\.id_proyecto = \$1(\s+ORDER BY)/g,
      "WHERE re.id_proyecto = $1 AND (re.estado_real IS NULL OR re.estado_real != 'REEMPLAZADO')$1"
    );
    await ssh.execCommand(`cp ${controllerPath} ${controllerPath}.bak`);
    await ssh.execCommand(`cat << 'EOF' > ${controllerPath}\n` + code + `\nEOF`);
    console.log('Controller patched successfully.');
  } else {
    console.log('Could not find target query in controller!');
  }

  // 3. Restart PM2
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 RESTART:\n', pm2Res.stdout);

  // 4. Test curl
  const curlRes = await ssh.execCommand('curl -s http://localhost:3013/api/proyectos/97/asignaciones/equipos');
  console.log('CURL ASIGNACIONES EQUIPOS:\n', curlRes.stdout);

  ssh.dispose();
}

fixAndVerify().catch(console.error);
