const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function inspect109() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== ACTAS EN tope_acta_plataforma ===');
  const actas = await ssh.execCommand(
    `su - postgres -c "psql -d postgres -c \\"SELECT id_acta, id_proyecto, folio_acta, estado, id_file_pdf_entrega, id_file_pdf_final, numero_contrato FROM sch_leangsp.tope_acta_plataforma;\\""`
  );
  console.log(actas.stdout);

  console.log('=== PROYECTO 109 EN tpry_proyecto ===');
  const pry = await ssh.execCommand(
    `su - postgres -c "psql -d postgres -c \\"SELECT id_proyecto, codi_proyecto, id_empresa, nombre_proyecto, json_field->'contrato_arriendo' as ctr, json_field->'contratos_historicos' as ctr_hist, json_field->'crm_v1'->'contrato_arriendo' as crm_ctr FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = 109 OR codi_proyecto LIKE '%4851%';\\""`
  );
  console.log(pry.stdout);

  console.log('=== TFMG_FILE RECIENTES DE CONTRATO Y ACTA ===');
  const files = await ssh.execCommand(
    `su - postgres -c "psql -d postgres -c \\"SELECT id_doc, tipo_doc, name_doc_orig, name_doc_interno, path_doc, created_at FROM sch_leangsp.tfmg_file WHERE tipo_doc IN ('CONTRATO', 'ACTA_ENTREGA', 'ACTA_FINAL', 'ACTA_RETIRO') OR name_doc_orig LIKE '%4851%' OR name_doc_interno LIKE '%4851%' ORDER BY id_doc DESC LIMIT 10;\\""`
  );
  console.log(files.stdout);

  ssh.dispose();
}

inspect109().catch(console.error);
