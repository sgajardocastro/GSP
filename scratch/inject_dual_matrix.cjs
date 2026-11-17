const fs = require('fs');

const commentsMap = JSON.parse(fs.readFileSync('scratch/comments_map.json', 'utf8'));
const htmlPath = 'C:\\Users\\sgaja\\.gemini\\antigravity\\brain\\898c9102-cf11-4924-9817-7fc5b04e6408\\matriz_reglas_negocio_cliente_gsp.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Modificar renderMatrix para incluir la columna 12 de Comentario Original
const oldTableHeader = `<th style='min-width:180px'>5. Regla en Carátula EDP</th>
    </tr></thead><tbody>`;

const newTableHeader = `<th style='min-width:160px'>5. Regla en Carátula EDP</th>
    <th style='min-width:210px;background:#1e293b;color:#fbbf24'>Comentarios Validación (Jorge & Alfonso)</th>
    </tr></thead><tbody>`;

html = html.replace(oldTableHeader, newTableHeader);

const oldRowEnd = `+ "<td>" + c.edp + "</td>"
      + "</tr>";`;

const newRowEnd = `+ "<td>" + c.edp + "</td>"
      + "<td class='no-strike' style='vertical-align:middle'>" + renderCommentCell(c) + "</td>"
      + "</tr>";`;

html = html.replace(oldRowEnd, newRowEnd);

// Inyectar la función renderCommentCell antes de renderMatrix
const commentCellFunc = `
function renderCommentCell(c){
  var isMod = c.status === "MODIFICADO";
  var isDiscard = c.status === "INNECESARIO";
  var comm = c.comentarioOriginal || "";
  if (!comm) {
    return "<span style='color:#94a3b8;font-size:11px'>— Validado Conforme (Sin reparos) —</span>";
  }
  if (isMod) {
    return "<div style='color:#991b1b;font-weight:600;font-size:11.5px;background:#fef2f2;border:1px solid #fecaca;padding:6px 8px;border-radius:6px;line-height:1.35'>"
      + "<strong style='color:#7f1d1d;display:block;margin-bottom:2px'>Comentario de Validación:</strong>"
      + comm + "</div>";
  } else if (isDiscard) {
    return "<div style='color:#0369a1;font-weight:600;font-size:11.5px;background:#f0f9ff;border:1px solid #bae6fd;padding:6px 8px;border-radius:6px;line-height:1.35'>"
      + "<strong style='color:#075985;display:block;margin-bottom:2px'>Comentario Descarte:</strong>"
      + comm + "</div>";
  } else {
    return "<div style='color:#166534;font-weight:600;font-size:11.5px;background:#f0fdf4;border:1px solid #bbf7d0;padding:6px 8px;border-radius:6px;line-height:1.35'>"
      + comm + "</div>";
  }
}
`;

if (!html.includes('function renderCommentCell(')) {
  html = html.replace('function renderMatrix(){', commentCellFunc + '\nfunction renderMatrix(){');
}

// Inyectar comentarioOriginal en cada objeto de CASES_31
const casesObjRegex = /\{[\s\S]*?id:\s*"([^"]+)"[\s\S]*?\}/g;
html = html.replace(casesObjRegex, (match, id) => {
  const comm = commentsMap[id] !== undefined ? commentsMap[id] : (commentsMap[id.replace('.M', '')] || '');
  if (!match.includes('comentarioOriginal:')) {
    return match.replace(/cambioAplicado:\s*"([^"]*)"/, `cambioAplicado: "$1",\n    comentarioOriginal: ${JSON.stringify(comm)}`);
  }
  return match;
});

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('HTML enriquecido con comentarios y reglas interiores simultáneas.');
