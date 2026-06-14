import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { validateRulemap } from '../utils/validateRulemap';

export function useValidation() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stabile Referenzen — NICHT den gesamten State subscriben
  const nodesRef = useRef(useCanvasStore.getState().nodes);
  const edgesRef = useRef(useCanvasStore.getState().edges);

  useEffect(() => {
    // Store-Subscription statt useEffect-Dependency
    const unsubscribe = useCanvasStore.subscribe((state) => {
      // Nur reagieren wenn sich nodes oder edges tatsächlich geändert haben
      if (state.nodes === nodesRef.current && state.edges === edgesRef.current) {
        return;
      }

      nodesRef.current = state.nodes;
      edgesRef.current = state.edges;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const warnings = validateRulemap(state.nodes, state.edges);
        // Direkt setzen, ohne über eine Action zu gehen die den ganzen State updated
        useCanvasStore.setState({ validationWarnings: warnings });
      }, 500);
    });

    // Initiale Validierung
    const initialState = useCanvasStore.getState();
    const initialWarnings = validateRulemap(initialState.nodes, initialState.edges);
    useCanvasStore.setState({ validationWarnings: initialWarnings });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // Leeres Dependency-Array — nur einmal mounten
}

