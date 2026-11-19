import { useI18n } from '../../i18n';
import type { AllowedValue } from '../../types/nodes';
import './AllowedValuesEditor.css';

interface AllowedValuesEditorProps {
  values: AllowedValue[];
  /** Werte, über die der Knoten tatsächlich verzweigt — für die Abdeckungsanzeige. */
  usedValues?: string[];
  onChange: (values: AllowedValue[]) => void;
}

export function AllowedValuesEditor({ values, usedValues = [], onChange }: AllowedValuesEditorProps) {
  const { t } = useI18n();
  const used = new Set(usedValues);

  const handleAdd = () => onChange([...values, { value: '', label: '' }]);

  const handleUpdate = (index: number, partial: Partial<AllowedValue>) =>
    onChange(values.map((v, i) => (i === index ? { ...v, ...partial } : v)));

  const handleRemove = (index: number) => onChange(values.filter((_, i) => i !== index));

  const duplicates = new Set(
    values.map((v) => v.value).filter((v, i, arr) => v && arr.indexOf(v) !== i)
  );

  return (
    <div className="av-editor">
      {values.map((av, i) => {
        const isCovered = !!av.value && used.has(av.value);
        const isDuplicate = !!av.value && duplicates.has(av.value);
        return (
          <div key={i} className="av-editor__row">
            <span
              className={
                'av-editor__status' +
                (isCovered ? ' av-editor__status--covered' : '') +
                (isDuplicate ? ' av-editor__status--problem' : '')
              }
              title={
                isDuplicate
                  ? t('allowedValues.duplicate')
                  : isCovered
                    ? t('allowedValues.covered')
                    : t('allowedValues.uncovered')
              }
            />
            <input
              className="av-editor__input av-editor__input--value"
              type="text"
              value={av.value}
              onChange={(e) => handleUpdate(i, { value: e.target.value })}
              placeholder={t('allowedValues.value.placeholder')}
            />
            <input
              className="av-editor__input"
              type="text"
              value={av.label ?? ''}
              onChange={(e) => handleUpdate(i, { label: e.target.value })}
              placeholder={t('allowedValues.label.placeholder')}
            />
            <button
              className="av-editor__remove"
              type="button"
              onClick={() => handleRemove(i)}
              title={t('allowedValues.remove')}
            >
              ×
            </button>
          </div>
        );
      })}

      <button className="av-editor__add" type="button" onClick={handleAdd}>
        {t('allowedValues.add')}
      </button>

      {values.length > 0 && (
        <p className="av-editor__hint">
          {values.filter((v) => v.value && used.has(v.value)).length} / {values.length}{' '}
          {t('allowedValues.coverage')}
        </p>
      )}
    </div>
  );
}
