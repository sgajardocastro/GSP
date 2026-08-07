export function getStorageUrl(idDoc) {
  if (!idDoc) return '#';
  const rawBase = import.meta.env.VITE_API_BASE_URL_CORE || import.meta.env.VITE_API_BASE_URL || '/api';
  const cleanBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  return `${cleanBase}/v1/storage/view/${idDoc}`;
}
