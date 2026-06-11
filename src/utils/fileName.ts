/**
 * Wandelt einen Map-Namen in einen sicheren Dateinamen um.
 * "Login Flow" → "login-flow.json"
 * "Prüfung: Berechtigung" → "pruefung-berechtigung.json"
 */
export function toFileName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')  // Alles was kein Buchstabe/Zahl ist → Bindestrich
    .replace(/^-+|-+$/g, '')       // Führende/abschließende Bindestriche entfernen
    || 'unbenannt';                 // Fallback bei leerem Ergebnis
}

export function toFilePath(dirPath: string, name: string): string {
  return `${dirPath}/${toFileName(name)}.json`;
}
