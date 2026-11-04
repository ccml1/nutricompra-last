/**
 * Texto listo para buscar: sin tildes, en minúsculas y con un solo espacio
 * entre palabras ("Atún  ENLATADO" → "atun enlatado"). Es la misma regla que
 * usa la búsqueda del catálogo en el frontend (SP-19), así que la ñ queda
 * como n a propósito.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Las palabras de una búsqueda, ya normalizadas; todas deben aparecer en el nombre. */
export function searchWords(query: string): string[] {
  return normalizeSearchText(query).split(' ').filter(Boolean);
}
