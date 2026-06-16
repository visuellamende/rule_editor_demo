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
  const { loadFromFile, filePath: currentMapId, selectedNodeId } = useCanvasStore();

  useEffect(() => {
    // Initialisierung beim ersten Start
    const mapList = getMapList();
    const exampleAlreadyLoaded = localStorage.getItem('ruleeditor_exampleLoaded');

    if (mapList.length === 0 && !exampleAlreadyLoaded) {
      // Allererster Besuch: Beispiel-Map erstellen
      const locale = localStorage.getItem('locale')
        || (navigator.language.startsWith('de') ? 'de' : 'en');
      const example = locale === 'de' ? exampleMap : exampleMapEn;

      writeMap(example.meta.id, example);
      localStorage.setItem('ruleeditor_exampleLoaded', 'true');
      loadFromFile(example, example.meta.id);
      localStorage.setItem('ruleeditor_lastMapId', example.meta.id);
    } else if (!currentMapId) {
      // Wiederkehrender Besuch: letzte aktive Map laden
      const lastMapId = localStorage.getItem('ruleeditor_lastMapId');
      if (lastMapId) {
        const data = readMap(lastMapId);
        if (data) {
          loadFromFile(data, lastMapId);
          return;
        }
      }

      // Fallback: erste Map aus der Liste
      if (mapList.length > 0) {
        const fallbackMapId = mapList[0];
        const data = readMap(fallbackMapId);
        if (data) {
          loadFromFile(data, fallbackMapId);
          localStorage.setItem('ruleeditor_lastMapId', fallbackMapId);
        }
      }
    }
  }, [loadFromFile, currentMapId]);

  return (
    <ReactFlowProvider>
      <AppShell
        sidebar={<MapList />}
        canvas={<RuleCanvas />}
        panel={<AttributePanel key={selectedNodeId ?? 'empty'} />}
      />
    </ReactFlowProvider>
  );
}

export default App;
