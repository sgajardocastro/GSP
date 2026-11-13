const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function alignProdColumns() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const sql = `
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS prioridad smallint DEFAULT 3;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS equipo_detenido boolean DEFAULT false;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS fecha_hora_detencion timestamp with time zone;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS fecha_hora_liberacion timestamp with time zone;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS sistema_falla character varying(50);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS modo_falla character varying(25);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS causa_falla character varying(25);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS codigo_pauta character varying(10);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS id_aviso_origen bigint;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS id_hallazgo_origen bigint;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS motivo_anulacion text;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS id_user_creador bigint;
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS alcance_mantenimiento character varying(30) DEFAULT 'SUPERESTRUCTURA_GRUA';
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_grua_inicio numeric(12,1);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_grua_cierre numeric(12,1);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_chasis_inicio numeric(12,1);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS horometro_chasis_cierre numeric(12,1);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS odometro_inicio numeric(12,1);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS odometro_cierre numeric(12,1);
ALTER TABLE sch_leangsp_prod.tmnt_ot ADD COLUMN IF NOT EXISTS fotos_recepcion_360 jsonb DEFAULT '{}'::jsonb;
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/align_prod.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/align_prod.sql"');
  console.log('Resultado alineación columnas prod:\n', res.stdout);
  if (res.stderr) console.error('Stderr:', res.stderr);

  await ssh.execCommand('rm -f /tmp/align_prod.sql');
  ssh.dispose();
}

alignProdColumns().catch(console.error);
