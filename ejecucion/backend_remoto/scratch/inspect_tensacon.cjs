const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspectProject() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const query = `
    SELECT id_proyecto, codi_proyecto, nombre_proyecto, id_proyecto_estado, json_field 
    FROM tpry_proyectos 
    WHERE codi_proyecto LIKE '%233-004%' OR nombre_proyecto ILIKE '%ferrero%' OR nombre_proyecto ILIKE '%tensacon%'
    LIMIT 2;
  `;

  // Ejecutamos psql en el contenedor o localmente en el servidor
  const res = await ssh.execCommand(`docker exec -i postgres_db psql -U postgres -d postgres -t -A -c "${query}" || sudo -u postgres psql -d postgres -t -A -c "${query}" || psql -U postgres -d postgres -t -A -c "${query}"`);
  console.log('OUTPUT RAW:\n', res.stdout);
  if (res.stderr) console.error('STDERR:', res.stderr);

  ssh.dispose();
}

inspectProject().catch(console.error);
