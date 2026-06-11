import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { writeMap } from '../services/browserStorage';

const AUTOSAVE_DELAY = 2000;

export function useAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapId = useCanvasStore((state) => state.filePath);
  const isDirty = useCanvasStore((state) => state.isDirty);
  const toFileData = useCanvasStore((state) => state.toFileData);
  const markClean = useCanvasStore((state) => state.markClean);

  useEffect(() => {
    if (!isDirty || !mapId) return;

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
