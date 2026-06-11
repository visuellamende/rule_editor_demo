import { useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAutosave } from './hooks/useAutosave';
import { useUndoRedo } from './hooks/useUndoRedo';
import { AppShell } from './components/layout/AppShell';
import { MapList } from './components/panels/MapList';
import { RuleCanvas } from './components/canvas/RuleCanvas';
import { AttributePanel } from './components/panels/AttributePanel';
import { useCanvasStore } from './store/useCanvasStore';
import { getMapList, readMap, writeMap } from './services/browserStorage';
import { exampleMap } from './data/exampleMap';
import './tokens/global.css';

function App() {
  useTheme();
  useAutosave();
  useUndoRedo();
  const { loadFromFile, filePath: currentMapId } = useCanvasStore();

  useEffect(() => {
    // Initialisierung beim ersten Start
    const mapList = getMapList();
    if (mapList.length === 0) {
      // Beispiel-Map in localStorage schreiben
      writeMap(exampleMap.meta.id, exampleMap);
      loadFromFile(exampleMap, exampleMap.meta.id);
    } else if (!currentMapId) {
      // Letzte/erste Map laden falls nichts aktiv
      const lastMapId = mapList[0];
      const data = readMap(lastMapId);
      if (data) {
        loadFromFile(data, lastMapId);
      }
    }
  }, [loadFromFile, currentMapId]);

  return (
    <AppShell
      sidebar={<MapList />}
      canvas={<RuleCanvas />}
      panel={<AttributePanel />}
    />
  );
}

export default App;
