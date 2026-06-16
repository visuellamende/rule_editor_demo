import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getMapList, readMap, writeMap, createNewMap, deleteMap } from '../../services/browserStorage';
import type { RulemapFile } from '../../types/rulemap';
import './MapList.css';

interface MapEntry {
  id: string;
  name: string;
}

export function MapList() {
  const { t } = useI18n();
  const { loadFromFile, filePath: currentMapId } = useCanvasStore();
  const mapName = useCanvasStore((state) => state.mapMeta.name);
  const [maps, setMaps] = useState<MapEntry[]>([]);

  // States für Inline-Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as RulemapFile;

      // Grundlegende Validierung
      if (!data.meta || !data.nodes || !data.edges) {
        alert(t('import.invalidFormat'));
        return;
      }

      // Als neue Map im localStorage speichern
      const id = data.meta.id || crypto.randomUUID().slice(0, 8);
      writeMap(id, data);
      refreshList();
      loadFromFile(data, id);
      localStorage.setItem('ruleeditor_lastMapId', id);
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('import.error'));
    }

    // Input zurücksetzen damit dieselbe Datei erneut importiert werden kann
    e.target.value = '';
  };

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
  }, [currentMapId, mapName]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleOpen = (id: string) => {
    // Wenn wir gerade editieren, blockieren wir das Öffnen, damit der blur-Event gehandelt wird
    if (editingId) return;
    const data = readMap(id);
    if (data) {
      loadFromFile(data, id);
      localStorage.setItem('ruleeditor_lastMapId', id);
    }
  };

  const handleCreate = () => {
    const { id, data } = createNewMap();
    refreshList();
    loadFromFile(data, id);
    localStorage.setItem('ruleeditor_lastMapId', id);
    // Sofort in den Edit-Modus
    setEditingId(id);
    setEditValue(data.meta.name);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(t('sidebar.deleteConfirm').replace('{name}', name))) return;
    deleteMap(id);
    if (id === currentMapId) {
      useCanvasStore.getState().resetCanvas();
    }
    refreshList();
  };

  const handleDoubleClick = (entry: MapEntry) => {
    setEditValue(entry.name);
    setEditingId(entry.id);
  };

  const handleRenameConfirm = (entry: MapEntry) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    if (entry.id === currentMapId) {
      // Store aktualisieren (für Header und Panel)
      useCanvasStore.getState().updateMapMeta({ name: trimmed });
      
      // Sofort in localStorage schreiben (nicht auf Autosave warten)
      const data = useCanvasStore.getState().toFileData();
      writeMap(entry.id, data);
    } else {
      const data = readMap(entry.id);
      if (data) {
        data.meta.name = trimmed;
        writeMap(entry.id, data);
      }
    }

    setEditingId(null);
    refreshList();
  };

  const handleRenameKeyDown = (entry: MapEntry, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameConfirm(entry);
    }
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="map-list">
      <div className="map-list__header">
        <h3 className="map-list__title">Rule Editor</h3>
        <div className="map-list__actions">
          <button
            className="map-list__action-button"
            onClick={handleImport}
            title={t('import.button')}
            aria-label={t('import.button')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button
            className="map-list__action-button"
            onClick={handleCreate}
            title={t('sidebar.newMap')}
            aria-label={t('sidebar.newMap')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
        {/* Versteckter File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
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
            
            {editingId === entry.id ? (
              <input
                ref={editInputRef}
                className="map-list__edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameConfirm(entry)}
                onKeyDown={(e) => handleRenameKeyDown(entry, e)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="map-list__name"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(entry);
                }}
              >
                {entry.name}
              </span>
            )}
            
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
