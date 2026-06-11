import type { RulemapFile } from '../types/rulemap';

const STORAGE_PREFIX = 'ruleeditor_';
const MAP_LIST_KEY = `${STORAGE_PREFIX}maps`;

// --- Map-Liste verwalten ---

export function getMapList(): string[] {
  const raw = localStorage.getItem(MAP_LIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveMapList(list: string[]): void {
  localStorage.setItem(MAP_LIST_KEY, JSON.stringify(list));
}

// --- Einzelne Map lesen/schreiben ---

export function readMap(id: string): RulemapFile | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}map_${id}`);
  return raw ? JSON.parse(raw) : null;
}

export function writeMap(id: string, data: RulemapFile): void {
  localStorage.setItem(`${STORAGE_PREFIX}map_${id}`, JSON.stringify(data));

  // Zur Map-Liste hinzufügen wenn noch nicht vorhanden
  const list = getMapList();
  if (!list.includes(id)) {
    list.push(id);
    saveMapList(list);
  }
}

export function deleteMap(id: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}map_${id}`);
  const list = getMapList().filter((mapId) => mapId !== id);
  saveMapList(list);
}

// --- Neue Map erstellen ---

export function createNewMap(name?: string): { id: string; data: RulemapFile } {
  const id = crypto.randomUUID().slice(0, 8);
  const mapName = name ?? 'Neue Rulemap';

  const data: RulemapFile = {
    version: '1.0.0',
    meta: {
      id,
      name: mapName,
      description: '',
      category: null,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
    nodes: [],
    edges: [],
  };

  writeMap(id, data);
  return { id, data };
}

// --- Export als Download ---

export function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
