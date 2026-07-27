const path = require('path');

const LEAN_DOCS_BASE_DIR = process.env.LEAN_DOCS_BASE_DIR || '/u05/LeanDocs';
const TRANSMAC_DOCS_FOLDER = process.env.TRANSMAC_DOCS_FOLDER || 'transmac';
const TRANSMAC_DOCS_DIR = path.join(LEAN_DOCS_BASE_DIR, TRANSMAC_DOCS_FOLDER);

function normalizeDocsDir(input) {
  const value = String(input || '').trim();
  if (!value) return TRANSMAC_DOCS_DIR;

  const normalized = value.replace(/\\/g, '/').replace(/\/+$/, '');
  if (
    normalized === `${LEAN_DOCS_BASE_DIR}/terracon` ||
    normalized === `${LEAN_DOCS_BASE_DIR}/transmac` ||
    normalized === 'terracon' ||
    normalized === 'transmac'
  ) {
    return TRANSMAC_DOCS_DIR;
  }

  return value;
}

function resolvePublicDocsFolder(folder) {
  const value = String(folder || '').trim().toLowerCase();
  if (value === 'terracon' || value === 'transmac') return TRANSMAC_DOCS_FOLDER;
  return folder;
}

function normalizeDocsFilePath(input) {
  const value = String(input || '').trim();
  if (!value) return value;

  const normalized = value.replace(/\\/g, '/');
  const legacyPrefix = `${LEAN_DOCS_BASE_DIR}/terracon/`;
  const currentPrefix = `${LEAN_DOCS_BASE_DIR}/transmac/`;

  if (normalized.startsWith(legacyPrefix)) {
    return path.join(TRANSMAC_DOCS_DIR, normalized.slice(legacyPrefix.length));
  }

  if (normalized.startsWith(currentPrefix)) {
    return path.join(TRANSMAC_DOCS_DIR, normalized.slice(currentPrefix.length));
  }

  return value;
}

module.exports = {
  LEAN_DOCS_BASE_DIR,
  TRANSMAC_DOCS_FOLDER,
  TRANSMAC_DOCS_DIR,
  normalizeDocsDir,
  normalizeDocsFilePath,
  resolvePublicDocsFolder
};
