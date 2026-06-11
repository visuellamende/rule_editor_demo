import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getMapList, readMap, createNewMap, deleteMap } from '../../services/browserStorage';
import './MapList.css';

interface MapEntry {
  id: string;
  name: string;
}

export function MapList() {
  const { t } = useI18n();
  const { loadFromFile, filePath: currentMapId } = useCanvasStore();
  const [maps, setMaps] = useState<MapEntry[]>([]);

  const refreshList = () => {
    const ids = getMapList();
    const entries = ids
      .map((id) => {
        const data = readMap(id);
        return data ? { id, name: data.meta.name || t('canvas.untitled') } : null;
      })
      .filter(Boolean) as MapEntry[];
    setMaps(entries);
  };

  useEffect(() => {
    refreshList();
  }, [currentMapId]);

  const handleOpen = (id: string) => {
    const data = readMap(id);
    if (data) {
      loadFromFile(data, id);
    }
  };

  const handleCreate = () => {
    const { id, data } = createNewMap();
    refreshList();
    loadFromFile(data, id);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(t('sidebar.deleteConfirm').replace('{name}', name))) return;
    deleteMap(id);
    if (id === currentMapId) {
      // Canvas zurücksetzen
      useCanvasStore.getState().resetCanvas();
    }
    refreshList();
  };

  return (
    <div className="map-list">
      <div className="map-list__header">
        <h3 className="map-list__title">Rule Editor</h3>
        <button
          className="map-list__new-button"
          onClick={handleCreate}
          title={t('sidebar.newMap')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <div className="map-list__items">
        {maps.map((entry) => (
          <div
            key={entry.id}
            className={`map-list__item ${entry.id === currentMapId ? 'map-list__item--active' : ''}`}
            onClick={() => handleOpen(entry.id)}
          >
            <svg className="map-list__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="map-list__name">{entry.name}</span>
            <button
              className="map-list__delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(entry.id, entry.name);
              }}
              style={{ background: 'none', border: 'none' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
