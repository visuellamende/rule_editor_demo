import { useState } from 'react';
import { useI18n } from '../../i18n';
import type { GoldenExample } from '../../types/nodes';
import './ExampleEditor.css';

interface ExampleEditorProps {
  examples: GoldenExample[];
  onChange: (examples: GoldenExample[]) => void;
  availableInputKeys: string[];    // technicalKeys aus verbundenen Input-Knoten und Conditions
}

export function ExampleEditor({ examples, onChange, availableInputKeys }: ExampleEditorProps) {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newExample: GoldenExample = {
      id: crypto.randomUUID().slice(0, 8),
      name: '',
      inputs: {},
      expectedResult: '',
    };
    onChange([...examples, newExample]);
    setEditingId(newExample.id);
  };

  const handleUpdate = (id: string, partial: Partial<GoldenExample>) => {
    onChange(examples.map((ex) => (ex.id === id ? { ...ex, ...partial } : ex)));
  };

  const handleUpdateInput = (exampleId: string, key: string, value: string) => {
    const example = examples.find((ex) => ex.id === exampleId);
    if (!example) return;
    const updatedInputs = { ...example.inputs, [key]: value };
    handleUpdate(exampleId, { inputs: updatedInputs });
  };

  const handleRemoveInput = (exampleId: string, key: string) => {
    const example = examples.find((ex) => ex.id === exampleId);
    if (!example) return;
    const updatedInputs = { ...example.inputs };
    delete updatedInputs[key];
    handleUpdate(exampleId, { inputs: updatedInputs });
  };

  const handleAddInput = (exampleId: string) => {
    handleUpdateInput(exampleId, '', '');
  };

  const handleRemove = (id: string) => {
    onChange(examples.filter((ex) => ex.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="example-editor">
      {examples.map((example) => (
        <div key={example.id} className="example-editor__item">
          {editingId === example.id ? (
            /* --- Edit-Modus --- */
            <div className="example-editor__form">
              {/* Name */}
              <div className="example-editor__field">
                <label className="example-editor__label">{t('example.name')}</label>
                <input
                  className="example-editor__input"
                  type="text"
                  value={example.name}
                  onChange={(e) => handleUpdate(example.id, { name: e.target.value })}
                  placeholder={t('example.name.placeholder')}
                  autoFocus
                />
              </div>

              {/* Eingabewerte */}
              <div className="example-editor__field">
                <label className="example-editor__label">{t('example.inputs')}</label>
                <div className="example-editor__inputs">
                  {Object.entries(example.inputs).map(([key, value], idx) => (
                    <div key={idx} className="example-editor__input-row">
                      <input
                        className="example-editor__input example-editor__input--key"
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newInputs = { ...example.inputs };
                          delete newInputs[key];
                          newInputs[e.target.value] = value;
                          handleUpdate(example.id, { inputs: newInputs });
                        }}
                        placeholder={t('example.key.placeholder')}
                        list={`keys-${example.id}`}
                      />
                      <span className="example-editor__separator">=</span>
                      <input
                        className="example-editor__input example-editor__input--value"
                        type="text"
                        value={value}
                        onChange={(e) => handleUpdateInput(example.id, key, e.target.value)}
                        placeholder={t('example.value.placeholder')}
                      />
                      <button
                        className="example-editor__remove-input"
                        onClick={() => handleRemoveInput(example.id, key)}
                      >×</button>
                    </div>
                  ))}
                  {/* Datalist mit verfügbaren Keys */}
                  <datalist id={`keys-${example.id}`}>
                    {availableInputKeys.map((k) => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                  <button
                    className="example-editor__add-input"
                    onClick={() => handleAddInput(example.id)}
                  >
                    + {t('example.addInput')}
                  </button>
                </div>
              </div>

              {/* Erwartetes Ergebnis */}
              <div className="example-editor__field">
                <label className="example-editor__label">{t('example.expected')}</label>
                <input
                  className="example-editor__input"
                  type="text"
                  value={example.expectedResult}
                  onChange={(e) => handleUpdate(example.id, { expectedResult: e.target.value })}
                  placeholder={t('example.expected.placeholder')}
                />
              </div>

              {/* Notizen */}
              <div className="example-editor__field">
                <label className="example-editor__label">{t('example.notes')}</label>
                <input
                  className="example-editor__input"
                  type="text"
                  value={example.notes ?? ''}
                  onChange={(e) => handleUpdate(example.id, { notes: e.target.value || undefined })}
                  placeholder={t('example.notes.placeholder')}
                />
              </div>

              {/* Aktionen */}
              <div className="example-editor__actions">
                <button className="example-editor__done" onClick={() => setEditingId(null)}>
                  {t('example.done')}
                </button>
                <button className="example-editor__remove" onClick={() => handleRemove(example.id)}>
                  {t('example.remove')}
                </button>
              </div>
            </div>
          ) : (
            /* --- Kompakt-Ansicht --- */
            <div
              className="example-editor__compact"
              onClick={() => setEditingId(example.id)}
            >
              <span className="example-editor__compact-name">
                {example.name || t('example.unnamed')}
              </span>
              <span className="example-editor__compact-inputs">
                {Object.entries(example.inputs).map(([k, v]) => `${k}=${v}`).join(', ') || t('example.noInputs')}
              </span>
              <span className="example-editor__compact-result">
                → {example.expectedResult || '?'}
              </span>
            </div>
          )}
        </div>
      ))}

      <button className="example-editor__add" onClick={handleAdd}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {t('example.add')}
      </button>
    </div>
  );
}
