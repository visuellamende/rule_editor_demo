import { useState } from 'react';
import { useI18n } from '../../i18n';
import type { KnowledgeSource } from '../../types/nodes';
import './KnowledgeSourceEditor.css';

interface KnowledgeSourceEditorProps {
  sources: KnowledgeSource[];
  onChange: (sources: KnowledgeSource[]) => void;
}

export function KnowledgeSourceEditor({ sources, onChange }: KnowledgeSourceEditorProps) {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newSource: KnowledgeSource = {
      id: crypto.randomUUID().slice(0, 8),
      art: 'interne_richtlinie',
      verbindlichkeit: 'empfohlen',
      referenz: '',
      eigner: null,
      beschreibung: null,
    };
    onChange([...sources, newSource]);
    setEditingId(newSource.id);
  };

  const handleUpdate = (id: string, partial: Partial<KnowledgeSource>) => {
    onChange(sources.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const handleRemove = (id: string) => {
    onChange(sources.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="ks-editor">
      {sources.map((source) => (
        <div key={source.id} className="ks-editor__item">
          {editingId === source.id ? (
            /* --- Edit-Modus --- */
            <div className="ks-editor__form">
              {/* Art */}
              <div className="ks-editor__field">
                <label className="ks-editor__label">{t('ks.art')}</label>
                <select
                  className="ks-editor__select"
                  value={source.art}
                  onChange={(e) => handleUpdate(source.id, { art: e.target.value as any })}
                >
                  <option value="gesetz">{t('ks.art.gesetz')}</option>
                  <option value="norm_standard">{t('ks.art.norm_standard')}</option>
                  <option value="interne_richtlinie">{t('ks.art.interne_richtlinie')}</option>
                  <option value="vertrag">{t('ks.art.vertrag')}</option>
                  <option value="fachwissen">{t('ks.art.fachwissen')}</option>
                </select>
              </div>

              {/* Verbindlichkeit */}
              <div className="ks-editor__field">
                <label className="ks-editor__label">{t('ks.verbindlichkeit')}</label>
                <select
                  className="ks-editor__select"
                  value={source.verbindlichkeit}
                  onChange={(e) => handleUpdate(source.id, { verbindlichkeit: e.target.value as any })}
                >
                  <option value="verbindlich">{t('ks.verbindlichkeit.verbindlich')}</option>
                  <option value="empfohlen">{t('ks.verbindlichkeit.empfohlen')}</option>
                  <option value="optional">{t('ks.verbindlichkeit.optional')}</option>
                </select>
              </div>

              {/* Referenz */}
              <div className="ks-editor__field">
                <label className="ks-editor__label">{t('ks.referenz')}</label>
                <input
                  className="ks-editor__input"
                  type="text"
                  value={source.referenz}
                  onChange={(e) => handleUpdate(source.id, { referenz: e.target.value })}
                  placeholder={t('ks.referenz.placeholder')}
                  autoFocus
                />
              </div>

              {/* Eigner */}
              <div className="ks-editor__field">
                <label className="ks-editor__label">{t('ks.eigner')}</label>
                <input
                  className="ks-editor__input"
                  type="text"
                  value={source.eigner ?? ''}
                  onChange={(e) => handleUpdate(source.id, { eigner: e.target.value || null })}
                  placeholder={t('ks.eigner.placeholder')}
                />
              </div>

              {/* Beschreibung */}
              <div className="ks-editor__field">
                <label className="ks-editor__label">{t('ks.beschreibung')}</label>
                <input
                  className="ks-editor__input"
                  type="text"
                  value={source.beschreibung ?? ''}
                  onChange={(e) => handleUpdate(source.id, { beschreibung: e.target.value || null })}
                  placeholder={t('ks.beschreibung.placeholder')}
                />
              </div>

              {/* Aktionen */}
              <div className="ks-editor__actions">
                <button
                  className="ks-editor__done"
                  onClick={() => setEditingId(null)}
                >
                  {t('ks.done')}
                </button>
                <button
                  className="ks-editor__remove"
                  onClick={() => handleRemove(source.id)}
                >
                  {t('ks.remove')}
                </button>
              </div>
            </div>
          ) : (
            /* --- Kompakt-Ansicht --- */
            <div
              className="ks-editor__compact"
              onClick={() => setEditingId(source.id)}
            >
              <div className="ks-editor__compact-header">
                <span className={`ks-editor__art-badge ks-editor__art-badge--${source.art}`}>
                  {t(`ks.art.${source.art}.short`)}
                </span>
                <span className={`ks-editor__verbindlichkeit-badge ks-editor__verbindlichkeit-badge--${source.verbindlichkeit}`}>
                  {t(`ks.verbindlichkeit.${source.verbindlichkeit}.short`)}
                </span>
              </div>
              <span className="ks-editor__compact-ref">
                {source.referenz || t('ks.referenz.empty')}
              </span>
              {source.eigner && (
                <span className="ks-editor__compact-eigner">{source.eigner}</span>
              )}
            </div>
          )}
        </div>
      ))}

      <button className="ks-editor__add" onClick={handleAdd}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {t('ks.add')}
      </button>
    </div>
  );
}
