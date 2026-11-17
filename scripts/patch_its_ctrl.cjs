const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function patchItsController() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const filePath = '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/itsController.js';
  const getFile = await ssh.execCommand(`cat ${filePath}`);
  let code = getFile.stdout;

  // Filter out REEMPLAZADO from tpry_rel_equipo in itsController
  const target = `FROM tpry_rel_equipo re\n        JOIN tequ_equipo e ON re.id_equipo = e.id_equipo\n        WHERE re.id_proyecto = $1;`;
  const replacement = `FROM tpry_rel_equipo re\n        JOIN tequ_equipo e ON re.id_equipo = e.id_equipo\n        WHERE re.id_proyecto = $1 AND (re.estado_real IS NULL OR re.estado_real != 'REEMPLAZADO');`;

  if (code.includes('WHERE re.id_proyecto = $1;')) {
    code = code.replace(
      'WHERE re.id_proyecto = $1;',
      "WHERE re.id_proyecto = $1 AND (re.estado_real IS NULL OR re.estado_real != 'REEMPLAZADO');"
    );
    await ssh.execCommand(`cp ${filePath} ${filePath}.bak_spec136`);
    await ssh.execCommand(`cat << 'EOF' > ${filePath}\n` + code + `\nEOF`);
    console.log('itsController patched successfully.');
  } else {
    console.warn('Could not find target query in itsController');
  }

  // Restart PM2 app 13
  const restart = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('PM2 RESTART:\n', restart.stdout);

  ssh.dispose();
}

patchItsController().catch(console.error);
