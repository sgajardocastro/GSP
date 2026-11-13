const { NodeSSH } = require('../node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect() {
  await ssh.connect({ host: '138.255.103.18', port: 1295, username: 'root', password: 'lgbl2025.' });
  const sql = `
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'sch_leangsp' AND table_name = 'tedp_reporte_avance'
    ORDER BY ordinal_position;
  `;
  const res = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sql.replace(/\n/g, ' ')}\\""`);
  console.log(res.stdout);

  const ejec = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, json_field->'ejecucion_v1' FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 76;\\""`);
  console.log('Project 76 ejecucion_v1:\n', ejec.stdout);

  const castCheck = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, json_field::jsonb ? 'control_vivo_overrides' as has_ovr FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 76;\\""`);
  console.log('Project 76 castCheck:\n', castCheck.stdout);

  const anyOvrProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, json_field->'control_vivo_overrides' FROM sch_leangsp_prod.tpry_proyecto WHERE json_field ? 'control_vivo_overrides';\\""`);
  console.log('Projects with overrides in PROD:\n', anyOvrProd.stdout);

  ssh.dispose();
}

inspect().catch(console.error);
