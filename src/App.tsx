import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useTheme } from './hooks/useTheme';
import { useAutosave } from './hooks/useAutosave';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useValidation } from './hooks/useValidation';
import { AppShell } from './components/layout/AppShell';
import { MapList } from './components/panels/MapList';
import { RuleCanvas } from './components/canvas/RuleCanvas';
import { AttributePanel } from './components/panels/AttributePanel';
import { useCanvasStore } from './store/useCanvasStore';
import { getMapList, readMap, writeMap } from './services/browserStorage';
import { exampleMap } from './data/exampleMap';
import { exampleMapEn } from './data/exampleMapEn';
import './tokens/global.css';

function App() {
  useTheme();
  useAutosave();
  useUndoRedo();
  useValidation();
  const { loadFromFile, filePath: currentMapId } = useCanvasStore();

  useEffect(() => {
    // Initialisierung beim ersten Start
    const mapList = getMapList();
    if (mapList.length === 0) {
      // Sprache erkennen
      const locale = localStorage.getItem('locale')
        || (navigator.language.startsWith('de') ? 'de' : 'en');
      const example = locale === 'de' ? exampleMap : exampleMapEn;

      // Beispiel-Map in localStorage schreiben
      writeMap(example.meta.id, example);
      loadFromFile(example, example.meta.id);
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
    <ReactFlowProvider>
      <AppShell
        sidebar={<MapList />}
        canvas={<RuleCanvas />}
        panel={<AttributePanel />}
      />
    </ReactFlowProvider>
  );
}

export default App;
