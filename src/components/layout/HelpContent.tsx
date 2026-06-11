import { useI18n } from '../../i18n';
import './HelpContent.css';

interface HelpContentProps {
  onBack: () => void;
}

export function HelpContent({ onBack }: HelpContentProps) {
  const { t } = useI18n();

  return (
    <div className="help-content">
      <div className="help-content__header">
        <button className="help-content__back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="help-content__title">{t('settings.help')}</h2>
      </div>

      <div className="help-content__body">
        <section className="help-content__section">
          <h3>{t('help.whatIs')}</h3>
          <p>{t('help.whatIsText')}</p>
        </section>

        <section className="help-content__section">
          <h3>{t('help.howTo')}</h3>
          <p>{t('help.howToText')}</p>
        </section>

        <section className="help-content__section">
          <h3>{t('help.nodeTypes')}</h3>
          <p><strong>Decision</strong> — {t('help.nodeDecision')}</p>
          <p><strong>Condition</strong> — {t('help.nodeCondition')}</p>
          <p><strong>Action</strong> — {t('help.nodeAction')}</p>
          <p><strong>Consequence</strong> — {t('help.nodeConsequence')}</p>
        </section>

        <section className="help-content__section">
          <h3>{t('help.export')}</h3>
          <p>{t('help.exportText')}</p>
        </section>

        <section className="help-content__section">
          <h3>{t('help.shortcuts')}</h3>
          <p><strong>Cmd/Ctrl + Z</strong> — {t('help.undo')}</p>
          <p><strong>Cmd/Ctrl + Shift + Z</strong> — {t('help.redo')}</p>
          <p><strong>{t('help.doubleClick')}</strong> — {t('help.inlineEdit')}</p>
          <p><strong>Backspace / Delete</strong> — {t('help.delete')}</p>
        </section>
      </div>
    </div>
  );
}
