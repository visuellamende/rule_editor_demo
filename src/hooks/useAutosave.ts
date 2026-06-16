import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { writeMap, readMap } from '../services/browserStorage';

const AUTOSAVE_DELAY = 2000;

export function useAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapId = useCanvasStore((state) => state.filePath);
  const isDirty = useCanvasStore((state) => state.isDirty);
  const toFileData = useCanvasStore((state) => state.toFileData);
  const markClean = useCanvasStore((state) => state.markClean);

  useEffect(() => {
    if (!isDirty || !mapId) return;

    // Guard: nicht speichern wenn nodes leer aber Map existiert
    const currentNodes = useCanvasStore.getState().nodes;
    if (currentNodes.length === 0) {
      const existingMap = readMap(mapId);
      if (existingMap && existingMap.nodes.length > 0) {
        // Map hat gespeicherte Knoten, aber der State ist leer
        // Das ist ein Lade-Problem, nicht speichern!
        console.warn('Autosave blocked: empty state would overwrite existing map');
        return;
      }
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const data = toFileData();
      writeMap(mapId, data);
      markClean();
    }, AUTOSAVE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, mapId, toFileData, markClean]);
}
