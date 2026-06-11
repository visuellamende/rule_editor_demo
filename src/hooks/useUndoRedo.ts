import { useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

export function useUndoRedo() {
  // @ts-ignore - temporal is added by zundo middleware
  const { undo, redo } = useCanvasStore.temporal.getState();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      if (isMod && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
}
