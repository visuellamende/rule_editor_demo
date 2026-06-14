import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

export function useValidation() {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const refreshValidation = useCanvasStore((state) => state.refreshValidation);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      refreshValidation();
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges, refreshValidation]);
}
